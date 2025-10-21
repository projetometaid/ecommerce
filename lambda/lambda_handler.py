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

# Cache de status de pagamentos (armazenados a partir dos webhooks)
_payment_status_cache = {}

# 🔒 Rate Limiter por CPF/CNPJ (previne enumeração e abuso)
_cpf_rate_limiter = {}  # {cpf: [timestamp1, timestamp2, ...]}

# Catálogo de produtos (source of truth para preços)
PRODUCT_CATALOG = {
    'ecpf-a1': {
        'code': '001',
        'description': 'Certificado Digital e-CPF A1 (1 ano)',
        'price': 5.00,
        'tipo': 'e-CPF',
        'validade': 1  # anos
    },
    'ecpf-a3': {
        'code': '002',
        'description': 'Certificado Digital e-CPF A3 (3 anos)',
        'price': 150.00,
        'tipo': 'e-CPF',
        'validade': 3
    },
    'ecnpj-a1': {
        'code': '003',
        'description': 'Certificado Digital e-CNPJ A1 (1 ano)',
        'price': 200.00,
        'tipo': 'e-CNPJ',
        'validade': 1
    }
}

# ==========================================
# 🔒 FUNÇÕES DE MASCARAMENTO DE DADOS (PII)
# ==========================================
# Protege dados sensíveis em logs (LGPD/GDPR compliance)
# ==========================================

def mask_cpf(cpf):
    """
    Mascara CPF para logs: 123.456.789-01 -> 123.***.***-01
    """
    if not cpf:
        return cpf
    cpf_clean = re.sub(r'\D', '', str(cpf))
    if len(cpf_clean) < 11:
        return "***.***.***-**"
    return f"{cpf_clean[:3]}.***.***-{cpf_clean[-2:]}"

def mask_email(email):
    """
    Mascara email para logs: usuario@dominio.com -> u******@dominio.com
    """
    if not email or '@' not in str(email):
        return email
    parts = str(email).split('@')
    if len(parts[0]) <= 1:
        return f"*@{parts[1]}"
    return f"{parts[0][0]}{'*' * (len(parts[0]) - 1)}@{parts[1]}"

def mask_phone(phone):
    """
    Mascara telefone para logs: (11) 98765-4321 -> (11) 9****-**21
    """
    if not phone:
        return phone
    phone_clean = re.sub(r'\D', '', str(phone))
    if len(phone_clean) < 10:
        return "(**) ****-****"
    return f"({phone_clean[:2]}) {phone_clean[2]}****-**{phone_clean[-2:]}"

def mask_name(name):
    """
    Mascara nome para logs: João da Silva -> João ***
    """
    if not name:
        return name
    parts = str(name).split()
    if len(parts) <= 1:
        return parts[0]
    return f"{parts[0]} ***"

def mask_address(address):
    """
    Mascara endereço para logs: Rua das Flores, 123 -> Rua das Flores, ***
    """
    if not address:
        return address
    return re.sub(r'\d+', '***', str(address))

def mask_sensitive_data(data):
    """
    Mascara todos os dados sensíveis em um dicionário (para logs)
    Retorna cópia com dados mascarados
    """
    if not isinstance(data, dict):
        return data

    masked = data.copy()

    # Campos que devem ser mascarados
    sensitive_fields = {
        'cpf': mask_cpf,
        'CPF': mask_cpf,
        'cnpj': mask_cpf,
        'CNPJ': mask_cpf,
        'email': mask_email,
        'Email': mask_email,
        'telefone': mask_phone,
        'Phone': mask_phone,
        'PhoneNumber': mask_phone,
        'nome': mask_name,
        'Name': mask_name,
        'nomeCompleto': mask_name,
        'nome_completo': mask_name,
        'endereco': mask_address,
        'Address': mask_address,
        'Street': mask_address,
        'logradouro': mask_address
    }

    for field, mask_func in sensitive_fields.items():
        if field in masked:
            masked[field] = mask_func(masked[field])

    # Mascarar recursivamente em objetos aninhados
    for key, value in masked.items():
        if isinstance(value, dict):
            masked[key] = mask_sensitive_data(value)
        elif isinstance(value, list):
            masked[key] = [mask_sensitive_data(item) if isinstance(item, dict) else item for item in value]

    return masked

# ==========================================
# 🛡️ RATE LIMITING POR CPF/CNPJ
# ==========================================
# Previne enumeração e abuso de consultas
# ==========================================

def check_cpf_rate_limit(cpf, max_attempts=5, window_seconds=300):
    """
    Verifica rate limit por CPF/CNPJ

    Args:
        cpf: CPF ou CNPJ a verificar
        max_attempts: Máximo de tentativas permitidas
        window_seconds: Janela de tempo em segundos (default: 5 minutos)

    Returns:
        (bool, int): (permitido, tentativas_restantes)
    """
    if not cpf:
        return (True, max_attempts)

    # Limpar CPF (apenas números)
    cpf_clean = re.sub(r'\D', '', str(cpf))

    now = time.time()

    # Inicializar lista de tentativas se não existir
    if cpf_clean not in _cpf_rate_limiter:
        _cpf_rate_limiter[cpf_clean] = []

    attempts = _cpf_rate_limiter[cpf_clean]

    # Remover tentativas antigas (fora da janela)
    attempts[:] = [t for t in attempts if now - t < window_seconds]

    # Verificar se excedeu o limite
    if len(attempts) >= max_attempts:
        retry_after = int(window_seconds - (now - attempts[0]))
        print(f"🚫 Rate limit excedido para CPF {mask_cpf(cpf_clean)}: {len(attempts)}/{max_attempts} tentativas")
        return (False, 0, retry_after)

    # Adicionar tentativa atual
    attempts.append(now)
    remaining = max_attempts - len(attempts)

    return (True, remaining, 0)

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
            # VALIDAÇÃO DE SEGURANÇA: Obter produto do catálogo (source of truth)
            product_id = dados_checkout.get('product_id', 'ecpf-a1')  # Default: e-CPF A1

            if product_id not in PRODUCT_CATALOG:
                print(f"❌ Produto inválido: {product_id}")
                return {
                    'sucesso': False,
                    'erro': 'Produto inválido',
                    'detalhes': f'Produto {product_id} não existe no catálogo'
                }

            product = PRODUCT_CATALOG[product_id]

            # VALIDAÇÃO CRÍTICA: Verificar se valor enviado corresponde ao catálogo
            valor_enviado = dados_checkout.get('valor')
            if valor_enviado is not None:
                valor_enviado = float(valor_enviado)
                if abs(valor_enviado - product['price']) > 0.01:  # Tolerância de 1 centavo
                    print(f"🚨 TENTATIVA DE FRAUDE DETECTADA!")
                    print(f"   - Valor enviado: R$ {valor_enviado}")
                    print(f"   - Valor correto: R$ {product['price']}")
                    print(f"   - CPF: {mask_cpf(dados_checkout.get('cpf'))}")  # ✅ MASCARADO
                    return {
                        'sucesso': False,
                        'erro': 'Valor inválido',
                        'detalhes': 'O valor enviado não corresponde ao produto selecionado'
                    }

            print(f"✅ Validação de preço OK: R$ {product['price']}")

            # Limpar CPF (remover formatação)
            cpf_limpo = re.sub(r'\D', '', dados_checkout.get('cpf', ''))
            telefone_limpo = re.sub(r'\D', '', dados_checkout.get('telefone', ''))
            cep_limpo = re.sub(r'\D', '', dados_checkout.get('cep', ''))

            # Obter número do protocolo Safeweb (usar como Reference)
            protocolo = dados_checkout.get('protocolo')
            if not protocolo:
                print("⚠️ Protocolo Safeweb não fornecido, gerando reference genérica")
                protocolo = f"ECPF-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            # Criar payload PIX Dinâmico (v2/Payment) - USAR VALORES DO CATÁLOGO
            payment_data = {
                "IsSandbox": False,
                "Application": "E-commerce Certificado Digital",
                "Vendor": "Certificado Campinas",
                "CallbackUrl": "https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/webhook/safe2pay",
                "PaymentMethod": "6",  # PIX
                "Reference": str(protocolo),  # Usar número do protocolo Safeweb
                "Customer": {
                    "Name": dados_checkout.get('nome_completo', ''),
                    "Identity": cpf_limpo,
                    "Phone": telefone_limpo,
                    "Email": dados_checkout.get('email', ''),
                    "Address": {
                        "ZipCode": cep_limpo,
                        "Street": dados_checkout.get('endereco', ''),
                        "Number": dados_checkout.get('numero', ''),
                        "Complement": dados_checkout.get('complemento', ''),
                        "District": dados_checkout.get('bairro', ''),
                        "CityName": dados_checkout.get('cidade', ''),
                        "StateInitials": dados_checkout.get('uf', ''),
                        "CountryName": "Brasil"
                    }
                },
                "PaymentObject": {
                    "Expiration": 600  # 10 minutos em segundos
                },
                "Products": [
                    {
                        "Code": product['code'],
                        "Description": product['description'],
                        "UnitPrice": product['price'],  # ✅ SEMPRE DO CATÁLOGO
                        "Quantity": 1
                    }
                ]
            }

            headers = {
                'Content-Type': 'application/json',
                'X-API-KEY': self.token
            }

            # 🔒 Mascara dados sensíveis para log
            masked_payment_data = mask_sensitive_data(payment_data)
            print(f"📤 Enviando PIX Dinâmico para Safe2Pay: {json.dumps(masked_payment_data, indent=2, ensure_ascii=False)}")

            response = requests.post(
                f"{self.api_url}/Payment",  # Mudado de /staticPix para /Payment
                json=payment_data,
                headers=headers,
                timeout=30
            )

            if response.status_code in [200, 201]:
                result = response.json()

                print(f"✅ Safe2Pay Payment (PIX Dinâmico) Response: {json.dumps(result, indent=2)}")

                if result.get('HasError'):
                    return {
                        'sucesso': False,
                        'erro': f"Erro Safe2Pay: {result.get('ErrorMessage', result.get('Error', 'Desconhecido'))}"
                    }

                response_detail = result.get('ResponseDetail', {})

                print(f"📋 ResponseDetail.IdTransaction extraído: {response_detail.get('IdTransaction')}")
                print(f"📋 ResponseDetail completo: {json.dumps(response_detail, indent=2)}")

                return {
                    'sucesso': True,
                    'dados': {
                        'transactionId': str(response_detail.get('IdTransaction')),
                        'qrCode': response_detail.get('Key'),
                        'qrCodeImage': response_detail.get('QrCode'),
                        'pixCopiaECola': response_detail.get('Key'),
                        'valor': 5.00,
                        'status': 'pending',
                        'reference': payment_data['Reference'],
                        'dadosCliente': {
                            'nome': dados_checkout.get('nome_completo'),
                            'cpf': cpf_limpo,
                            'email': dados_checkout.get('email'),
                            'telefone': telefone_limpo
                        },
                        'expiresAt': (datetime.now() + timedelta(minutes=10)).isoformat()
                    }
                }
            else:
                error_text = response.text
                print(f"❌ Erro HTTP {response.status_code}: {error_text}")
                return {
                    'sucesso': False,
                    'erro': f'Erro HTTP {response.status_code}',
                    'detalhes': error_text
                }

        except Exception as e:
            print(f"❌ Exception ao criar PIX: {str(e)}")
            return {
                'sucesso': False,
                'erro': 'Erro interno',
                'detalhes': str(e)
            }

    def check_payment_status(self, transaction_id):
        try:
            # Primeiro, verificar cache de webhooks (mais confiável)
            if transaction_id in _payment_status_cache:
                cached_data = _payment_status_cache[transaction_id]
                print(f"✅ Status obtido do cache (webhook): {cached_data.get('status')}")
                return {
                    'sucesso': True,
                    'status': cached_data.get('status'),
                    'dados': cached_data
                }

            # Se não estiver no cache, consultar API Safe2Pay
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

    def liberar_pagamento(self, protocol):
        """Libera pagamento na Safeweb - UpdateLiberacao"""
        try:
            # Autenticar e obter token
            if not self.token or not self.token_expiry:
                self.authenticate()

            # URL do endpoint UpdateLiberacao
            url = f"{self.base_url}/Service/Microservice/Shared/Partner/api/UpdateLiberacao"

            headers = {
                'Authorization': f'bearer {self.token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'Protocolo': protocol,
                'CNPJ': self.cnpj_ar
            }

            print(f"💳 Liberando pagamento na Safeweb para protocolo: {protocol}")
            response = requests.post(url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                result = response.json()
                if result == True or result == "true":
                    print(f"✅ Pagamento liberado com sucesso na Safeweb")
                    return {'sucesso': True}
                else:
                    print(f"❌ Safeweb retornou false para liberação de pagamento")
                    return {'sucesso': False, 'erro': 'Safeweb não aceitou a liberação'}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Erro ao liberar pagamento: {error_msg}")
                return {
                    'sucesso': False,
                    'erro': error_msg
                }

        except Exception as e:
            print(f"❌ Erro em liberar_pagamento: {str(e)}")
            return {
                'sucesso': False,
                'erro': str(e)
            }

    def criar_solicitacao_hope(self, protocol):
        """Cria solicitação Hope para upload de documentos"""
        try:
            # PRIMEIRO: Liberar pagamento na Safeweb
            print(f"📋 Passo 1/2: Liberando pagamento na Safeweb...")
            liberacao_result = self.liberar_pagamento(protocol)

            if not liberacao_result.get('sucesso'):
                print(f"⚠️ Aviso: Liberação de pagamento falhou, mas continuando...")
                # Não vamos bloquear se a liberação falhar, apenas registrar

            # SEGUNDO: Criar solicitação Hope
            print(f"📋 Passo 2/2: Criando solicitação Hope...")

            # Autenticar e obter token
            if not self.token or not self.token_expiry:
                self.authenticate()

            # Obter configurações
            hope_url = os.environ.get('SAFEWEB_HOPE_API_URL')
            attendance_place_id = int(os.environ.get('SAFEWEB_ATTENDANCE_PLACE_ID', '348'))

            if not hope_url:
                raise Exception("SAFEWEB_HOPE_API_URL não configurado")

            headers = {
                'Authorization': f'bearer {self.token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'protocol': protocol,
                'attendancePlaceId': attendance_place_id,
                'aciRemovalCandidate': False
            }

            print(f"🔄 Chamando Hope API: {hope_url}")
            response = requests.post(hope_url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                result = response.json()
                upload_url = result.get('url')
                print(f"✅ Solicitação Hope criada com sucesso")
                print(f"📎 URL de upload: {upload_url}")

                return {
                    'sucesso': True,
                    'uploadUrl': upload_url,
                    'emailEnviado': result.get('emailSend', False)
                }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Erro na API Hope: {error_msg}")
                return {
                    'sucesso': False,
                    'erro': error_msg
                }

        except Exception as e:
            print(f"❌ Erro em criar_solicitacao_hope: {str(e)}")
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

    # 🔒 CORS Seguro - Lista de domínios permitidos
    allowed_origins = [
        'https://www.certificadodigital.br.com',
        'https://certificadodigital.br.com',
        'https://d2iucdo1dmk5az.cloudfront.net',
        'http://localhost:8080',  # Desenvolvimento local
        'http://localhost:8081',
        'http://localhost:8082'
    ]

    # Obter origin do request
    request_origin = event.get('headers', {}).get('origin', '')
    if not request_origin:
        request_origin = event.get('headers', {}).get('Origin', '')

    # Validar origin contra whitelist
    if request_origin in allowed_origins:
        cors_origin = request_origin
    else:
        # Se origin não está na lista, usar o primeiro (produção)
        cors_origin = allowed_origins[0]
        if request_origin:
            print(f"⚠️ CORS: Origin não autorizado bloqueado: {request_origin}")

    # Headers CORS + Security Headers
    cors_headers = {
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        # 🛡️ Security Headers
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://d2iucdo1dmk5az.cloudfront.net https://payment.safe2pay.com.br https://pss.safewebpss.com.br; frame-ancestors 'none';",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
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
            cpf = body.get('cpf')
            if not cpf:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'sucesso': False, 'erro': 'CPF é obrigatório'})
                }

            # 🛡️ Verificar rate limit por CPF (5 tentativas a cada 5 minutos)
            allowed, remaining, retry_after = check_cpf_rate_limit(cpf, max_attempts=5, window_seconds=300)
            if not allowed:
                return {
                    'statusCode': 429,
                    'headers': {
                        **cors_headers,
                        'Retry-After': str(retry_after),
                        'X-RateLimit-Limit': '5',
                        'X-RateLimit-Remaining': '0'
                    },
                    'body': json.dumps({
                        'sucesso': False,
                        'erro': f'Muitas tentativas. Tente novamente em {retry_after} segundos.',
                        'retry_after': retry_after
                    })
                }

            safeweb = SafewebAPI()
            resultado = safeweb.verificar_biometria(cpf)
            status_code = 200 if resultado.get('sucesso') else 400

            return {
                'statusCode': status_code,
                'headers': {
                    **cors_headers,
                    'X-RateLimit-Limit': '5',
                    'X-RateLimit-Remaining': str(remaining)
                },
                'body': json.dumps(resultado, ensure_ascii=False)
            }

        elif path == '/api/safeweb/consultar-cpf' and http_method == 'POST':
            cpf = body.get('cpf')
            data_nascimento = body.get('dataNascimento')
            if not cpf or not data_nascimento:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'sucesso': False, 'erro': 'CPF e data de nascimento são obrigatórios'})
                }

            # 🛡️ Verificar rate limit por CPF (5 tentativas a cada 5 minutos)
            allowed, remaining, retry_after = check_cpf_rate_limit(cpf, max_attempts=5, window_seconds=300)
            if not allowed:
                return {
                    'statusCode': 429,
                    'headers': {
                        **cors_headers,
                        'Retry-After': str(retry_after),
                        'X-RateLimit-Limit': '5',
                        'X-RateLimit-Remaining': '0'
                    },
                    'body': json.dumps({
                        'sucesso': False,
                        'erro': f'Muitas tentativas. Tente novamente em {retry_after} segundos.',
                        'retry_after': retry_after
                    })
                }

            safeweb = SafewebAPI()
            resultado = safeweb.consultar_cpf(cpf, data_nascimento)

            return {
                'statusCode': 200,
                'headers': {
                    **cors_headers,
                    'X-RateLimit-Limit': '5',
                    'X-RateLimit-Remaining': str(remaining)
                },
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

        elif path == '/api/hope/create-solicitation' and http_method == 'POST':
            # Criar solicitação Hope após pagamento aprovado
            protocol = body.get('protocol')
            if not protocol:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'sucesso': False, 'erro': 'Protocolo é obrigatório'})
                }

            print(f"📋 Criando solicitação Hope para protocolo: {protocol}")

            try:
                safeweb = SafewebAPI()
                resultado = safeweb.criar_solicitacao_hope(protocol)
                status_code = 200 if resultado.get('sucesso') else 500

                return {
                    'statusCode': status_code,
                    'headers': cors_headers,
                    'body': json.dumps(resultado, ensure_ascii=False)
                }
            except Exception as e:
                print(f"❌ Erro ao criar solicitação Hope: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({'sucesso': False, 'erro': 'Erro interno no servidor'})
                }

        elif path == '/webhook/safe2pay' and http_method == 'POST':
            # Webhook Safe2Pay - Notificação de pagamento
            # 🔒 Mascara dados sensíveis para log
            masked_body = mask_sensitive_data(body)
            print(f"🔔 Webhook Safe2Pay recebido (RAW): {json.dumps(masked_body)}")

            try:
                # Verificar se está no formato wrapper ou direto
                notification_payload = body
                if 'NotificationWrapper' in body:
                    print("📦 Webhook formato WRAPPER detectado")
                    notification_payload = body['NotificationWrapper'].get('NotificationPayload', {})
                else:
                    print("📦 Webhook formato DIRETO detectado")

                # Extrair dados do webhook (formato Safe2Pay)
                id_transacao = notification_payload.get('IdTransaction')

                # TransactionStatus pode vir como objeto ou direto
                transaction_status = notification_payload.get('TransactionStatus', {})
                if isinstance(transaction_status, dict):
                    status_id = transaction_status.get('Id')
                    status_code = transaction_status.get('Code')
                    status_name = transaction_status.get('Name')
                else:
                    # Fallback para formato simples
                    status_id = body.get('Status') or body.get('PaymentStatus')
                    status_code = str(status_id)
                    status_name = 'Unknown'

                reference = notification_payload.get('Reference')
                payment_date = notification_payload.get('PaymentDate')
                amount = notification_payload.get('Amount')
                payment_method = notification_payload.get('PaymentMethod', {})

                print(f"📊 Webhook Safe2Pay:")
                print(f"   - IdTransaction: {id_transacao}")
                print(f"   - Status: {status_id} ({status_code}) - {status_name}")
                print(f"   - Reference: {reference}")
                print(f"   - Amount: {amount}")
                print(f"   - PaymentDate: {payment_date}")
                print(f"   - PaymentMethod: {payment_method.get('Name', 'N/A')}")

                # Validar dados mínimos
                if not id_transacao:
                    print("❌ IdTransaction não fornecido no webhook")
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({'sucesso': False, 'erro': 'IdTransaction não fornecido'})
                    }

                # Armazenar status no cache (para consultas via /api/pix/status)
                _payment_status_cache[str(id_transacao)] = {
                    'PaymentStatus': status_id,
                    'TransactionStatus': {'Id': status_id, 'Code': status_code, 'Name': status_name},
                    'Amount': amount,
                    'PaymentDate': payment_date,
                    'Reference': reference,
                    'status': status_id  # Para compatibilidade com check_payment_status
                }
                print(f"💾 Status armazenado no cache para transaction {id_transacao}")

                # Status 3 = Autorizado/Aprovado (segundo documentação Safe2Pay)
                if status_id == 3 or status_code == '3':
                    print(f"✅✅✅ PAGAMENTO APROVADO! Transaction: {id_transacao}, Reference: {reference}")
                    print(f"💰 Valor: R$ {amount}")
                    print(f"📅 Data: {payment_date}")

                    # TODO: Implementar ações pós-pagamento
                    # 1. Salvar no DynamoDB
                    # 2. Enviar email/SMS para cliente
                    # 3. Atualizar sistema interno
                    # 4. Notificar frontend via WebSocket (futuro)

                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'sucesso': True,
                            'mensagem': 'Webhook processado com sucesso - Pagamento aprovado',
                            'transactionId': id_transacao,
                            'status': status_name
                        })
                    }
                else:
                    print(f"📊 Webhook - Status {status_name} ({status_id}) recebido para transaction {id_transacao}")
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'sucesso': True,
                            'mensagem': f'Webhook recebido - Status {status_name}',
                            'transactionId': id_transacao,
                            'status': status_name
                        })
                    }

            except Exception as webhook_error:
                print(f"❌ Erro ao processar webhook: {str(webhook_error)}")
                print(f"❌ Traceback: {repr(webhook_error)}")
                return {
                    'statusCode': 200,  # Retornar 200 para Safe2Pay não reenviar indefinidamente
                    'headers': cors_headers,
                    'body': json.dumps({
                        'sucesso': False,
                        'erro': 'Erro ao processar webhook',
                        'detalhes': str(webhook_error)
                    })
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
