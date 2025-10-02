#!/usr/bin/env python3
"""
AWS Lambda Handler - API Backend
Adaptação do api_server.py para Lambda + API Gateway
"""

import json
import os
import boto3
import requests
import re
from datetime import datetime, timedelta
from collections import defaultdict
import time

# Cliente AWS Secrets Manager
secrets_client = boto3.client('secretsmanager')

# Cache de secrets (evita múltiplas chamadas ao Secrets Manager)
_secrets_cache = {}

def get_secret(secret_arn):
    """Busca secret do AWS Secrets Manager com cache"""
    if secret_arn in _secrets_cache:
        return _secrets_cache[secret_arn]

    response = secrets_client.get_secret_value(SecretId=secret_arn)
    secret_data = json.loads(response['SecretString'])
    _secrets_cache[secret_arn] = secret_data
    return secret_data


class Validator:
    """Validação de dados (copiado do api_server.py)"""

    @staticmethod
    def validate_cpf_or_cnpj(documento):
        if not documento:
            return False, "CPF ou CNPJ é obrigatório"
        doc_limpo = re.sub(r'\D', '', documento)
        if len(doc_limpo) == 11:
            if doc_limpo == doc_limpo[0] * 11:
                return False, "CPF inválido"
            return True, doc_limpo
        elif len(doc_limpo) == 14:
            if doc_limpo == doc_limpo[0] * 14:
                return False, "CNPJ inválido"
            return True, doc_limpo
        else:
            return False, "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos"

    @staticmethod
    def validate_email(email):
        if not email:
            return False, "Email é obrigatório"
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Email inválido"
        return True, email

    @staticmethod
    def validate_telefone(telefone):
        if not telefone:
            return False, "Telefone é obrigatório"
        tel_limpo = re.sub(r'\D', '', telefone)
        if len(tel_limpo) < 10 or len(tel_limpo) > 11:
            return False, "Telefone deve ter 10 ou 11 dígitos"
        return True, tel_limpo

    @staticmethod
    def validate_checkout_data(dados):
        erros = []

        is_valid, result = Validator.validate_cpf_or_cnpj(dados.get('cpf'))
        if not is_valid:
            erros.append(result)

        nome = dados.get('nome_completo', '').strip()
        if not nome or len(nome) < 3:
            erros.append('Nome é obrigatório (mínimo 3 caracteres)')

        is_valid, result = Validator.validate_email(dados.get('email'))
        if not is_valid:
            erros.append(result)

        is_valid, result = Validator.validate_telefone(dados.get('telefone'))
        if not is_valid:
            erros.append(result)

        if erros:
            return False, erros
        return True, None


class Safe2PayAPI:
    """Cliente Safe2Pay para Lambda"""

    def __init__(self):
        secret_arn = os.environ.get('SAFE2PAY_SECRET_ARN')
        if not secret_arn:
            raise Exception("SAFE2PAY_SECRET_ARN não configurado")

        secret = get_secret(secret_arn)
        self.token = secret['token']
        self.api_url = secret['base_url']
        self.pix_expiration = 30

    def create_pix_payment(self, dados_checkout):
        is_valid, erros = Validator.validate_checkout_data(dados_checkout)
        if not is_valid:
            return {'sucesso': False, 'erro': 'Dados inválidos', 'detalhes': erros}

        try:
            payment_data = {
                "Amount": 180.00,
                "Description": "Certificado Digital e-CPF",
                "Reference": f"ECPF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "CallbackUrl": "https://seu-dominio.com/webhook/safe2pay"
            }

            headers = {
                'Content-Type': 'application/json',
                'X-API-KEY': self.token
            }

            response = requests.post(
                f"{self.api_url}/staticPix",
                json=payment_data,
                headers=headers,
                timeout=30
            )

            if response.status_code in [200, 201]:
                result = response.json()

                if result.get('HasError'):
                    return {
                        'sucesso': False,
                        'erro': f"Erro Safe2Pay: {result.get('Error', 'Desconhecido')}"
                    }

                response_detail = result.get('ResponseDetail', {})

                return {
                    'sucesso': True,
                    'dados': {
                        'transactionId': str(response_detail.get('Id')),
                        'qrCode': response_detail.get('Key'),
                        'qrCodeImage': response_detail.get('QrCode'),
                        'pixCopiaECola': response_detail.get('Key'),
                        'valor': 180.00,
                        'status': 'pending',
                        'reference': payment_data['Reference'],
                        'dadosCliente': {
                            'nome': dados_checkout.get('nome_completo'),
                            'cpf': dados_checkout.get('cpf'),
                            'email': dados_checkout.get('email'),
                            'telefone': dados_checkout.get('telefone')
                        },
                        'expiresAt': (datetime.now() + timedelta(minutes=self.pix_expiration)).isoformat()
                    }
                }
            else:
                return {
                    'sucesso': False,
                    'erro': f'Erro HTTP {response.status_code}'
                }

        except Exception as e:
            return {
                'sucesso': False,
                'erro': 'Erro interno',
                'detalhes': str(e)
            }

    def check_payment_status(self, transaction_id):
        try:
            headers = {'X-API-KEY': self.token}
            response = requests.get(
                f"{self.api_url}/Payment/{transaction_id}",
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    'sucesso': True,
                    'status': result.get('PaymentStatus', 'unknown'),
                    'dados': result
                }
            else:
                return {
                    'sucesso': False,
                    'erro': f'Erro HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'sucesso': False,
                'erro': str(e)
            }


class SafewebAPI:
    """Cliente Safeweb para Lambda"""

    def __init__(self):
        secret_arn = os.environ.get('SAFEWEB_SECRET_ARN')
        if not secret_arn:
            raise Exception("SAFEWEB_SECRET_ARN não configurado")

        secret = get_secret(secret_arn)
        self.username = secret['username']
        self.password = secret['password']
        self.base_url = secret['base_url']
        self.auth_url = secret['auth_url']
        self.cnpj_ar = secret['cnpj_ar']
        self.codigo_parceiro = secret['codigo_parceiro']
        self.produto_ecpf_a1 = secret['produto_ecpf_a1']

        self.token = None
        self.token_expiry = None

    def authenticate(self):
        import base64
        credenciais = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()

        response = requests.post(
            self.auth_url,
            headers={
                'Authorization': f'Basic {credenciais}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )

        if response.status_code != 200:
            raise Exception(f"Erro de autenticação: {response.status_code}")

        data = response.json()
        self.token = data.get('tokenAcesso')
        self.token_expiry = data.get('expiraEm')
        return self.token

    def ensure_valid_token(self):
        if not self.token or not self.token_expiry:
            return self.authenticate()

        if int(time.time()) >= self.token_expiry - 120:
            return self.authenticate()

        return self.token

    def verificar_biometria(self, cpf):
        try:
            cpf_limpo = re.sub(r'\D', '', cpf)
            if len(cpf_limpo) != 11:
                return {'sucesso': False, 'erro': 'CPF deve ter 11 dígitos'}

            token = self.ensure_valid_token()

            response = requests.get(
                f"{self.base_url}/Service/Microservice/Shared/Partner/api/ValidateBiometry/{cpf_limpo}",
                headers={
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f'Erro na consulta: {response.status_code}')

            data = response.json()
            tem_biometria = data is True or data == 'true' or (isinstance(data, dict) and data.get('temBiometria') is True)

            return {
                'sucesso': True,
                'temBiometria': tem_biometria,
                'mensagem': 'CPF possui biometria facial' if tem_biometria else 'CPF não possui biometria'
            }

        except Exception as e:
            return {
                'sucesso': False,
                'erro': str(e)
            }

    def consultar_cpf(self, cpf, data_nascimento):
        try:
            cpf_limpo = re.sub(r'\D', '', cpf)
            token = self.ensure_valid_token()

            payload = {
                "CPF": cpf_limpo,
                "DocumentoTipo": "1",
                "DtNascimento": data_nascimento
            }

            response = requests.post(
                f"{self.base_url}/Service/Microservice/Shared/ConsultaPrevia/api/RealizarConsultaPrevia",
                json=payload,
                headers={
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f'Erro na consulta: {response.status_code}')

            data = response.json()
            codigo = data.get('Codigo', data.get('codigo', 0))
            mensagem = data.get('Mensagem', data.get('mensagem', ''))

            resultado = {
                'sucesso': codigo == 0,
                'valido': codigo == 0,
                'cpf': cpf_limpo,
                'codigo': codigo,
                'nome': '',
                'mensagem': ''
            }

            if codigo == 0:
                resultado['nome'] = mensagem.strip().upper()
                resultado['mensagem'] = 'CPF validado com sucesso'
            else:
                resultado['mensagem'] = f'Código {codigo}: {mensagem}'

            return resultado

        except Exception as e:
            return {
                'sucesso': False,
                'erro': str(e)
            }

    def gerar_protocolo(self, dados_completos):
        try:
            token = self.ensure_valid_token()

            telefone_limpo = re.sub(r'\D', '', dados_completos.get('telefone', ''))
            ddd = telefone_limpo[:2]
            numero = telefone_limpo[2:]

            payload = {
                "CnpjAR": self.cnpj_ar,
                "CodigoParceiro": self.codigo_parceiro,
                "idProduto": self.produto_ecpf_a1,
                "Nome": dados_completos.get('nome'),
                "CPF": re.sub(r'\D', '', dados_completos.get('cpf', '')),
                "DataNascimento": dados_completos.get('nascimento'),
                "Contato": {
                    "DDD": ddd,
                    "Telefone": numero,
                    "Email": dados_completos.get('email')
                },
                "Endereco": {
                    "Logradouro": dados_completos.get('endereco'),
                    "Numero": dados_completos.get('numero'),
                    "Complemento": dados_completos.get('complemento', ''),
                    "Bairro": dados_completos.get('bairro'),
                    "UF": dados_completos.get('estado'),
                    "Cidade": dados_completos.get('cidade'),
                    "CEP": re.sub(r'\D', '', dados_completos.get('cep', ''))
                }
            }

            response = requests.post(
                f"{self.base_url}/Service/Microservice/Shared/Partner/api/Add/3",
                json=payload,
                headers={
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f'Erro ao gerar protocolo: {response.status_code}')

            protocolo = response.json()

            return {
                'sucesso': True,
                'protocolo': protocolo,
                'mensagem': 'Protocolo gerado com sucesso'
            }

        except Exception as e:
            return {
                'sucesso': False,
                'erro': str(e)
            }


def handler(event, context):
    """Lambda Handler principal"""

    print(f"Event: {json.dumps(event)}")

    # Extrair informações do evento API Gateway
    http_method = event.get('requestContext', {}).get('http', {}).get('method')
    path = event.get('requestContext', {}).get('http', {}).get('path')
    body = event.get('body', '{}')

    # Parse do body (pode vir como string)
    if isinstance(body, str):
        try:
            body = json.loads(body) if body else {}
        except:
            body = {}

    # Headers CORS
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }

    try:
        # Roteamento
        if path == '/api/health':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'timestamp': datetime.now().isoformat(),
                    'service': 'ecommerce-api-lambda'
                })
            }

        elif path == '/api/pix/create' and http_method == 'POST':
            safe2pay = Safe2PayAPI()
            resultado = safe2pay.create_pix_payment(body)
            status_code = 200 if resultado.get('sucesso') else 400

            return {
                'statusCode': status_code,
                'headers': cors_headers,
                'body': json.dumps(resultado, ensure_ascii=False)
            }

        elif path.startswith('/api/pix/status/'):
            transaction_id = path.split('/')[-1]
            safe2pay = Safe2PayAPI()
            resultado = safe2pay.check_payment_status(transaction_id)
            status_code = 200 if resultado.get('sucesso') else 400

            return {
                'statusCode': status_code,
                'headers': cors_headers,
                'body': json.dumps(resultado, ensure_ascii=False)
            }

        elif path == '/api/safeweb/verificar-biometria' and http_method == 'POST':
            safeweb = SafewebAPI()
            cpf = body.get('cpf')
            if not cpf:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'sucesso': False, 'erro': 'CPF é obrigatório'})
                }
            resultado = safeweb.verificar_biometria(cpf)
            status_code = 200 if resultado.get('sucesso') else 400

            return {
                'statusCode': status_code,
                'headers': cors_headers,
                'body': json.dumps(resultado, ensure_ascii=False)
            }

        elif path == '/api/safeweb/consultar-cpf' and http_method == 'POST':
            safeweb = SafewebAPI()
            cpf = body.get('cpf')
            data_nascimento = body.get('dataNascimento')
            if not cpf or not data_nascimento:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'sucesso': False, 'erro': 'CPF e data de nascimento são obrigatórios'})
                }
            resultado = safeweb.consultar_cpf(cpf, data_nascimento)

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps(resultado, ensure_ascii=False)
            }

        elif path == '/api/safeweb/gerar-protocolo' and http_method == 'POST':
            safeweb = SafewebAPI()
            resultado = safeweb.gerar_protocolo(body)
            status_code = 200 if resultado.get('sucesso') else 400

            return {
                'statusCode': status_code,
                'headers': cors_headers,
                'body': json.dumps(resultado, ensure_ascii=False)
            }

        else:
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({'sucesso': False, 'erro': 'Endpoint não encontrado'})
            }

    except Exception as e:
        print(f"Erro: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'sucesso': False,
                'erro': 'Erro interno no servidor',
                'detalhes': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else None
            }, ensure_ascii=False)
        }
