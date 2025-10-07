#!/usr/bin/env python3
"""
Servidor API para integração Safe2Pay
Versão 2.0 - Com validação, logs estruturados e monitoramento
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse
import re
from datetime import datetime, timedelta
from collections import defaultdict
import time
import requests
from dotenv import load_dotenv
import logging

# Carregar variáveis do .env
load_dotenv()

# Configurações
API_PORT = 8082
STATIC_PORT = 8080

# CORS - Origens permitidas (SEGURANÇA)
ALLOWED_ORIGINS = [
    'http://localhost:8080',  # Desenvolvimento
    'http://127.0.0.1:8080',  # Desenvolvimento alternativo
    'http://127.0.0.1:5500',  # Live Server (VS Code)
    'http://localhost:5500',  # Live Server alternativo
    'http://127.0.0.1:56859',  # VSCode Live Server (porta dinâmica)
]

# Configurar logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate Limiter simples baseado em IP"""

    def __init__(self, max_requests=20, window_seconds=60):
        """
        Args:
            max_requests: Número máximo de requisições permitidas
            window_seconds: Janela de tempo em segundos
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # {ip: [timestamp1, timestamp2, ...]}

    def is_allowed(self, ip):
        """Verifica se o IP pode fazer requisição"""
        now = time.time()

        # Limpar requisições antigas (fora da janela)
        self.requests[ip] = [
            timestamp for timestamp in self.requests[ip]
            if now - timestamp < self.window_seconds
        ]

        # Verificar se excedeu o limite
        if len(self.requests[ip]) >= self.max_requests:
            logger.warning(f"🚫 Rate limit excedido para IP: {ip}")
            return False

        # Registrar nova requisição
        self.requests[ip].append(now)
        return True

    def get_retry_after(self, ip):
        """Retorna quantos segundos até poder tentar novamente"""
        if not self.requests[ip]:
            return 0

        oldest_request = min(self.requests[ip])
        retry_after = self.window_seconds - (time.time() - oldest_request)
        return max(0, int(retry_after))


class Validator:
    """Classe para validação de dados de entrada"""

    @staticmethod
    def validate_cpf(cpf):
        """Valida formato de CPF (11 dígitos)"""
        if not cpf:
            return False, "CPF é obrigatório"

        # Remove caracteres não numéricos
        cpf_limpo = re.sub(r'\D', '', cpf)

        if len(cpf_limpo) != 11:
            return False, "CPF deve ter 11 dígitos"

        # Verifica se todos os dígitos são iguais (CPF inválido)
        if cpf_limpo == cpf_limpo[0] * 11:
            return False, "CPF inválido"

        return True, cpf_limpo

    @staticmethod
    def validate_cnpj(cnpj):
        """Valida formato de CNPJ (14 dígitos)"""
        if not cnpj:
            return False, "CNPJ é obrigatório"

        # Remove caracteres não numéricos
        cnpj_limpo = re.sub(r'\D', '', cnpj)

        if len(cnpj_limpo) != 14:
            return False, "CNPJ deve ter 14 dígitos"

        # Verifica se todos os dígitos são iguais (CNPJ inválido)
        if cnpj_limpo == cnpj_limpo[0] * 14:
            return False, "CNPJ inválido"

        return True, cnpj_limpo

    @staticmethod
    def validate_cpf_or_cnpj(documento):
        """Valida CPF (11 dígitos) OU CNPJ (14 dígitos)"""
        if not documento:
            return False, "CPF ou CNPJ é obrigatório"

        # Remove caracteres não numéricos
        doc_limpo = re.sub(r'\D', '', documento)

        # Verifica se é CPF (11 dígitos)
        if len(doc_limpo) == 11:
            if doc_limpo == doc_limpo[0] * 11:
                return False, "CPF inválido"
            return True, doc_limpo

        # Verifica se é CNPJ (14 dígitos)
        elif len(doc_limpo) == 14:
            if doc_limpo == doc_limpo[0] * 14:
                return False, "CNPJ inválido"
            return True, doc_limpo

        else:
            return False, "Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)"

    @staticmethod
    def validate_email(email):
        """Valida formato de email"""
        if not email:
            return False, "Email é obrigatório"

        # Regex básico para email
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Email inválido"

        return True, email

    @staticmethod
    def validate_telefone(telefone):
        """Valida formato de telefone"""
        if not telefone:
            return False, "Telefone é obrigatório"

        # Remove caracteres não numéricos
        tel_limpo = re.sub(r'\D', '', telefone)

        if len(tel_limpo) < 10 or len(tel_limpo) > 11:
            return False, "Telefone deve ter 10 ou 11 dígitos"

        return True, tel_limpo

    @staticmethod
    def validate_nome(nome):
        """Valida nome completo"""
        if not nome:
            return False, "Nome é obrigatório"

        nome = nome.strip()

        if len(nome) < 3:
            return False, "Nome muito curto"

        if len(nome) > 100:
            return False, "Nome muito longo"

        # Deve ter pelo menos 2 palavras
        if len(nome.split()) < 2:
            return False, "Informe nome completo"

        return True, nome

    @staticmethod
    def validate_checkout_data(dados):
        """Valida todos os dados do checkout"""
        erros = []

        # Validar CPF ou CNPJ (aceita ambos)
        is_valid, result = Validator.validate_cpf_or_cnpj(dados.get('cpf'))
        if not is_valid:
            erros.append(result)

        # Validar nome (pode ser nome completo ou razão social)
        nome = dados.get('nome_completo', '').strip()
        if not nome or len(nome) < 3:
            erros.append('Nome ou Razão Social é obrigatório (mínimo 3 caracteres)')
        elif len(nome) > 100:
            erros.append('Nome ou Razão Social muito longo (máximo 100 caracteres)')

        # Validar email
        is_valid, result = Validator.validate_email(dados.get('email'))
        if not is_valid:
            erros.append(result)

        # Validar telefone
        is_valid, result = Validator.validate_telefone(dados.get('telefone'))
        if not is_valid:
            erros.append(result)

        if erros:
            return False, erros

        return True, None


class Safe2PayAPI:
    def __init__(self):
        self.token = os.getenv('SAFE2PAY_TOKEN')
        self.api_secret = os.getenv('SAFE2PAY_API_SECRET_KEY')
        self.api_url = os.getenv('SAFE2PAY_BASE_URL', 'https://payment.safe2pay.com.br/v2')
        self.pix_expiration = int(os.getenv('PIX_EXPIRATION_MINUTES', 30))
        self.callback_url = os.getenv('PIX_CALLBACK_URL', 'https://seu-dominio.com.br/webhook/safe2pay')

        if self.token:
            logger.info(f"🔑 Safe2Pay Token configurado: {self.token[:10]}...")
        else:
            logger.error("❌ Token Safe2Pay não encontrado no .env")

        logger.info(f"🌐 API URL: {self.api_url}")

    def is_configured(self):
        """Verifica se API está configurada"""
        return bool(self.token and self.api_url)

    def create_pix_payment(self, dados_checkout):
        """Criar pagamento PIX Estático via Safe2Pay"""

        # Validar dados de entrada
        is_valid, erros = Validator.validate_checkout_data(dados_checkout)
        if not is_valid:
            logger.error(f"❌ Validação falhou: {erros}")
            return {
                'sucesso': False,
                'erro': 'Dados inválidos',
                'detalhes': erros
            }

        try:
            # Dados do pagamento PIX Estático
            payment_data = {
                "Amount": 5.00,
                "Description": "Certificado Digital e-CPF",
                "Reference": f"ECPF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "CallbackUrl": self.callback_url
            }

            headers = {
                'Content-Type': 'application/json',
                'X-API-KEY': self.token
            }

            full_url = f"{self.api_url}/staticPix"

            logger.info(f"🌐 Criando PIX na Safe2Pay")
            logger.info(f"📦 Reference: {payment_data['Reference']}")
            logger.info(f"💰 Valor: R$ {payment_data['Amount']}")

            # Fazer requisição para Safe2Pay com retry
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        full_url,
                        json=payment_data,
                        headers=headers,
                        timeout=30
                    )
                    break
                except requests.exceptions.Timeout:
                    if attempt < max_retries - 1:
                        logger.warning(f"⚠️ Timeout na tentativa {attempt + 1}, tentando novamente...")
                        continue
                    else:
                        raise

            logger.info(f"📥 Response Status: {response.status_code}")

            if response.status_code == 200 or response.status_code == 201:
                result = response.json()

                # Verificar se há erro na resposta
                if result.get('HasError'):
                    error_code = result.get('ErrorCode', 'UNKNOWN')
                    error_msg = result.get('Error', 'Erro desconhecido')
                    logger.error(f"❌ Erro Safe2Pay: [{error_code}] {error_msg}")
                    return {
                        'sucesso': False,
                        'erro': f"Erro Safe2Pay: {error_msg}",
                        'codigo_erro': error_code
                    }

                response_detail = result.get('ResponseDetail', {})
                transaction_id = response_detail.get('Id')

                logger.info(f"✅ PIX criado com sucesso!")
                logger.info(f"   Transaction ID: {transaction_id}")
                logger.info(f"   Cliente: {dados_checkout.get('nome_completo')}")

                return {
                    'sucesso': True,
                    'dados': {
                        'transactionId': str(transaction_id),
                        'qrCode': response_detail.get('Key'),
                        'qrCodeImage': response_detail.get('QrCode'),
                        'pixCopiaECola': response_detail.get('Key'),
                        'valor': 5.00,
                        'status': 'pending',
                        'reference': payment_data['Reference'],
                        'identifier': response_detail.get('Identifier'),
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
                error_msg = f'HTTP {response.status_code}'
                try:
                    error_detail = response.json()
                    error_msg = f"{error_msg}: {error_detail}"
                except:
                    error_msg = f"{error_msg}: {response.text[:200]}"

                logger.error(f"❌ Erro Safe2Pay: {error_msg}")
                return {
                    'sucesso': False,
                    'erro': f'Erro ao criar pagamento',
                    'detalhes': error_msg
                }

        except requests.exceptions.Timeout:
            logger.error("❌ Timeout ao conectar com Safe2Pay")
            return {
                'sucesso': False,
                'erro': 'Timeout ao conectar com Safe2Pay. Tente novamente.'
            }

        except requests.exceptions.ConnectionError:
            logger.error("❌ Erro de conexão com Safe2Pay")
            return {
                'sucesso': False,
                'erro': 'Erro de conexão. Verifique sua internet.'
            }

        except Exception as e:
            logger.error(f"❌ Erro inesperado: {str(e)}", exc_info=True)
            return {
                'sucesso': False,
                'erro': 'Erro interno no servidor',
                'detalhes': str(e) if os.getenv('DEBUG') else None
            }

    def check_payment_status(self, transaction_id):
        """Verificar status do pagamento"""

        # Validar transaction_id
        if not transaction_id or not str(transaction_id).isdigit():
            logger.error(f"❌ Transaction ID inválido: {transaction_id}")
            return {
                'sucesso': False,
                'erro': 'Transaction ID inválido'
            }

        try:
            headers = {
                'X-API-KEY': self.token
            }

            logger.info(f"🔍 Verificando status da transação: {transaction_id}")

            response = requests.get(
                f"{self.api_url}/Payment/{transaction_id}",
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                status = result.get('PaymentStatus', 'unknown')
                logger.info(f"✅ Status: {status}")
                return {
                    'sucesso': True,
                    'status': status,
                    'dados': result
                }
            else:
                logger.error(f"❌ Erro ao verificar status: HTTP {response.status_code}")
                return {
                    'sucesso': False,
                    'erro': f'Erro ao verificar status: {response.status_code}'
                }

        except Exception as e:
            logger.error(f"❌ Erro na verificação: {str(e)}")
            return {
                'sucesso': False,
                'erro': f'Erro na verificação: {str(e)}'
            }

    def test_connection(self):
        """Testa conexão com Safe2Pay"""
        try:
            headers = {'X-API-KEY': self.token}
            response = requests.get(
                f"{self.api_url}/MerchantInfo",
                headers=headers,
                timeout=10
            )
            return response.status_code == 200
        except:
            return False


class SafewebAPI:
    """Cliente para integração com API Safeweb"""

    def __init__(self):
        self.username = os.getenv('SAFEWEB_USERNAME')
        self.password = os.getenv('SAFEWEB_PASSWORD')
        self.base_url = os.getenv('SAFEWEB_BASE_URL', 'https://pss.safewebpss.com.br')
        self.auth_url = os.getenv('SAFEWEB_AUTH_URL')
        self.cnpj_ar = os.getenv('SAFEWEB_CNPJ_AR')
        self.codigo_parceiro = os.getenv('SAFEWEB_CODIGO_PARCEIRO')
        self.produto_ecpf_a1 = os.getenv('SAFEWEB_PRODUTO_ECPF_A1')

        # Cache de token JWT
        self.token = None
        self.token_expiry = None

        if self.username and self.password:
            logger.info(f"🔑 Safeweb configurado: {self.username[:20]}...")
        else:
            logger.error("❌ Credenciais Safeweb não encontradas no .env")

    def _mask_cpf(self, cpf):
        """Mascara CPF para logs (protege privacidade)"""
        if not cpf or len(cpf) != 11:
            return cpf
        return f"{cpf[:3]}.***.*{cpf[-2:]}"

    def authenticate(self):
        """Autentica na API Safeweb e obtém token JWT"""
        try:
            import base64
            logger.info('🔐 Safeweb: Autenticando...')

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

            logger.info('✅ Safeweb: Autenticação bem-sucedida')
            return self.token

        except Exception as e:
            logger.error(f'❌ Safeweb: Erro na autenticação: {str(e)}')
            raise

    def ensure_valid_token(self):
        """Garante que temos um token válido"""
        import time

        # Se não tem token, autentica
        if not self.token or not self.token_expiry:
            return self.authenticate()

        # Verifica se token ainda é válido (com margem de 2 minutos)
        agora = int(time.time())
        if agora >= self.token_expiry - 120:
            return self.authenticate()

        return self.token

    def verificar_biometria(self, cpf):
        """Verifica se CPF possui biometria cadastrada"""
        try:
            cpf_limpo = re.sub(r'\D', '', cpf)

            if len(cpf_limpo) != 11:
                return {
                    'sucesso': False,
                    'erro': 'CPF deve ter 11 dígitos'
                }

            logger.info(f'🔍 Safeweb: Verificando biometria para CPF: {self._mask_cpf(cpf_limpo)}')

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

            logger.info(f'{"✅" if tem_biometria else "⚠️"} Safeweb: CPF {self._mask_cpf(cpf_limpo)} {"possui" if tem_biometria else "não possui"} biometria')

            return {
                'sucesso': True,
                'temBiometria': tem_biometria,
                'mensagem': 'CPF possui biometria facial' if tem_biometria else 'CPF não possui biometria. Será necessário videoconferência.'
            }

        except Exception as e:
            logger.error(f'❌ Safeweb: Erro ao verificar biometria: {str(e)}')
            return {
                'sucesso': False,
                'erro': str(e)
            }

    def consultar_cpf(self, cpf, data_nascimento):
        """Consulta CPF na Receita Federal"""
        try:
            cpf_limpo = re.sub(r'\D', '', cpf)

            logger.info(f'🔍 Safeweb: Consultando CPF na RFB: {self._mask_cpf(cpf_limpo)}')

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

            logger.info(f'📋 Safeweb: Código: {codigo}, Mensagem: {mensagem}')

            resultado = {
                'sucesso': codigo == 0,
                'valido': codigo == 0,
                'cpf': cpf_limpo,
                'codigo': codigo,
                'nome': '',
                'mensagem': ''
            }

            # Códigos conforme documentação Safeweb
            if codigo == 0:
                resultado['nome'] = mensagem.strip().upper()
                resultado['mensagem'] = 'CPF validado com sucesso'
                logger.info(f'✅ Safeweb: CPF válido - {resultado["nome"]}')
            elif codigo == 1:
                resultado['mensagem'] = 'CPF informado inválido'
            elif codigo == 2:
                resultado['mensagem'] = 'CPF inexistente nas bases da RFB'
            elif codigo == 3:
                resultado['mensagem'] = 'CPF cancelado nas bases da RFB'
            elif codigo == 4:
                resultado['mensagem'] = 'Data de nascimento divergente'
            elif codigo == 5:
                resultado['mensagem'] = 'CPF nulo nas bases da RFB'
            elif codigo == 700:
                resultado['mensagem'] = 'Nome será validado posteriormente'
            elif codigo == 999:
                resultado['mensagem'] = 'Erro ao executar ação'
            else:
                resultado['mensagem'] = mensagem or f'Código desconhecido: {codigo}'

            return resultado

        except Exception as e:
            logger.error(f'❌ Safeweb: Erro ao consultar CPF: {str(e)}')
            return {
                'sucesso': False,
                'erro': str(e)
            }

    def gerar_protocolo(self, dados_completos):
        """Gera protocolo de solicitação de certificado e-CPF A1"""
        try:
            logger.info('📝 Safeweb: Gerando protocolo...')

            token = self.ensure_valid_token()

            # Processar telefone (extrair DDD e número)
            telefone_limpo = re.sub(r'\D', '', dados_completos.get('telefone', ''))
            ddd = telefone_limpo[:2]
            numero = telefone_limpo[2:]

            # Montar payload conforme documentação oficial (Linha 109-147 do doc)
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

            logger.info(f'📤 Safeweb: Enviando protocolo para CPF: {self._mask_cpf(payload["CPF"])}')

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
                error_text = response.text[:200]
                logger.error(f'❌ Safeweb: Erro HTTP {response.status_code}: {error_text}')
                raise Exception(f'Erro ao gerar protocolo: {response.status_code}')

            protocolo = response.json()

            logger.info(f'✅ Safeweb: Protocolo gerado com sucesso: {protocolo}')

            return {
                'sucesso': True,
                'protocolo': protocolo,
                'mensagem': 'Protocolo gerado com sucesso'
            }

        except Exception as e:
            logger.error(f'❌ Safeweb: Erro ao gerar protocolo: {str(e)}')
            return {
                'sucesso': False,
                'erro': str(e)
            }


# Instância global do Rate Limiter (20 req/min)
rate_limiter = RateLimiter(max_requests=20, window_seconds=60)


class APIRequestHandler(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.safe2pay = Safe2PayAPI()
        self.safeweb = SafewebAPI()
        super().__init__(*args, **kwargs)

    def check_rate_limit(self):
        """Verifica rate limit antes de processar requisição"""
        client_ip = self.client_address[0]

        if not rate_limiter.is_allowed(client_ip):
            retry_after = rate_limiter.get_retry_after(client_ip)
            self.send_response(429)  # Too Many Requests
            self.send_header('Content-Type', 'application/json')
            self.send_header('Retry-After', str(retry_after))
            self.send_header('X-RateLimit-Limit', str(rate_limiter.max_requests))
            self.send_header('X-RateLimit-Window', str(rate_limiter.window_seconds))
            self.end_headers()
            self.wfile.write(json.dumps({
                'sucesso': False,
                'erro': 'Muitas requisições. Tente novamente em alguns segundos.',
                'retry_after': retry_after
            }).encode('utf-8'))
            return False

        return True

    def log_message(self, format, *args):
        """Override para logging estruturado"""
        logger.info(f"{self.address_string()} - {format % args}")

    def do_OPTIONS(self):
        self.send_cors_headers()

    def do_POST(self):
        # Verificar rate limit antes de processar
        if not self.check_rate_limit():
            return

        if self.path == '/api/pix/create':
            self.handle_create_pix()
        elif self.path.startswith('/api/pix/status/'):
            transaction_id = self.path.split('/')[-1]
            self.handle_check_status(transaction_id)
        elif self.path == '/api/safeweb/verificar-biometria':
            self.handle_safeweb_biometria()
        elif self.path == '/api/safeweb/consultar-cpf':
            self.handle_safeweb_consultar_cpf()
        elif self.path == '/api/safeweb/gerar-protocolo':
            self.handle_safeweb_gerar_protocolo()
        else:
            self.send_json_response(404, {
                'sucesso': False,
                'erro': 'Endpoint não encontrado'
            })

    def do_GET(self):
        # Verificar rate limit antes de processar
        if not self.check_rate_limit():
            return

        if self.path == '/api/health':
            self.handle_health_check()
        elif self.path.startswith('/api/proxy-image'):
            self.handle_proxy_image()
        elif self.path.startswith('/api/pix/status/'):
            transaction_id = self.path.split('/')[-1]
            self.handle_check_status(transaction_id)
        else:
            self.send_json_response(404, {
                'sucesso': False,
                'erro': 'Endpoint não encontrado'
            })

    def handle_create_pix(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'Corpo da requisição vazio'
                })
                return

            post_data = self.rfile.read(content_length)

            try:
                dados_checkout = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'JSON inválido'
                })
                return

            # Criar pagamento
            resultado = self.safe2pay.create_pix_payment(dados_checkout)

            # Determinar código de status HTTP
            status_code = 200 if resultado.get('sucesso') else 400
            self.send_json_response(status_code, resultado)

        except Exception as e:
            logger.error(f"❌ Erro em handle_create_pix: {str(e)}", exc_info=True)
            self.send_json_response(500, {
                'sucesso': False,
                'erro': 'Erro interno no servidor'
            })

    def handle_check_status(self, transaction_id):
        try:
            resultado = self.safe2pay.check_payment_status(transaction_id)
            status_code = 200 if resultado.get('sucesso') else 400
            self.send_json_response(status_code, resultado)

        except Exception as e:
            logger.error(f"❌ Erro em handle_check_status: {str(e)}", exc_info=True)
            self.send_json_response(500, {
                'sucesso': False,
                'erro': 'Erro ao verificar status'
            })

    def handle_health_check(self):
        """Endpoint de health check para monitoramento"""

        # Testar conexão com Safe2Pay
        safe2pay_ok = self.safe2pay.is_configured()

        health_data = {
            'status': 'healthy' if safe2pay_ok else 'degraded',
            'timestamp': datetime.now().isoformat(),
            'service': 'api-checkout-safe2pay',
            'version': '2.0',
            'checks': {
                'safe2pay_configured': safe2pay_ok,
                'token_present': bool(self.safe2pay.token),
                'api_url': self.safe2pay.api_url
            }
        }

        status_code = 200 if safe2pay_ok else 503
        self.send_json_response(status_code, health_data)

    def handle_proxy_image(self):
        """Proxy para download de imagens QR Code (resolve CORS)"""
        try:
            query_start = self.path.find('?url=')
            if query_start == -1:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'Parâmetro "url" não fornecido'
                })
                return

            image_url = urllib.parse.unquote(self.path[query_start + 5:])

            # Validar que é URL da Safe2Pay
            if 'safe2pay.com' not in image_url:
                self.send_json_response(403, {
                    'sucesso': False,
                    'erro': 'URL não autorizada'
                })
                return

            logger.info(f"🖼️ Proxy de imagem: {image_url}")

            response = requests.get(image_url, timeout=10)

            if response.status_code == 200:
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'public, max-age=3600')
                self.end_headers()
                self.wfile.write(response.content)
                logger.info(f"✅ Imagem proxy enviada: {len(response.content)} bytes")
            else:
                self.send_json_response(500, {
                    'sucesso': False,
                    'erro': f'Erro ao baixar imagem: {response.status_code}'
                })

        except Exception as e:
            logger.error(f"❌ Erro no proxy de imagem: {str(e)}")
            self.send_json_response(500, {
                'sucesso': False,
                'erro': 'Erro no proxy de imagem'
            })

    def handle_safeweb_biometria(self):
        """Handler para verificar biometria via Safeweb"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'Corpo da requisição vazio'
                })
                return

            post_data = self.rfile.read(content_length)
            dados = json.loads(post_data.decode('utf-8'))

            cpf = dados.get('cpf')
            if not cpf:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'CPF é obrigatório'
                })
                return

            resultado = self.safeweb.verificar_biometria(cpf)
            status_code = 200 if resultado.get('sucesso') else 400
            self.send_json_response(status_code, resultado)

        except Exception as e:
            logger.error(f"❌ Erro em handle_safeweb_biometria: {str(e)}", exc_info=True)
            self.send_json_response(500, {
                'sucesso': False,
                'erro': 'Erro interno no servidor'
            })

    def handle_safeweb_consultar_cpf(self):
        """Handler para consultar CPF na RFB via Safeweb"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'Corpo da requisição vazio'
                })
                return

            post_data = self.rfile.read(content_length)
            dados = json.loads(post_data.decode('utf-8'))

            cpf = dados.get('cpf')
            data_nascimento = dados.get('dataNascimento')

            if not cpf or not data_nascimento:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'CPF e data de nascimento são obrigatórios'
                })
                return

            resultado = self.safeweb.consultar_cpf(cpf, data_nascimento)
            # Sempre retornar 200 - o frontend decide baseado em 'sucesso' e 'valido'
            self.send_json_response(200, resultado)

        except Exception as e:
            logger.error(f"❌ Erro em handle_safeweb_consultar_cpf: {str(e)}", exc_info=True)
            self.send_json_response(500, {
                'sucesso': False,
                'erro': 'Erro interno no servidor'
            })

    def handle_safeweb_gerar_protocolo(self):
        """Handler para gerar protocolo via Safeweb"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_json_response(400, {
                    'sucesso': False,
                    'erro': 'Corpo da requisição vazio'
                })
                return

            post_data = self.rfile.read(content_length)
            dados = json.loads(post_data.decode('utf-8'))

            # Validar campos obrigatórios
            campos_obrigatorios = ['cpf', 'nome', 'nascimento', 'email', 'telefone',
                                 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado']

            for campo in campos_obrigatorios:
                if not dados.get(campo):
                    self.send_json_response(400, {
                        'sucesso': False,
                        'erro': f'Campo obrigatório ausente: {campo}'
                    })
                    return

            resultado = self.safeweb.gerar_protocolo(dados)
            status_code = 200 if resultado.get('sucesso') else 400
            self.send_json_response(status_code, resultado)

        except Exception as e:
            logger.error(f"❌ Erro em handle_safeweb_gerar_protocolo: {str(e)}", exc_info=True)
            self.send_json_response(500, {
                'sucesso': False,
                'erro': 'Erro interno no servidor'
            })

    def get_allowed_origin(self):
        """Retorna origem permitida baseado no header Origin (SEGURANÇA)"""
        origin = self.headers.get('Origin', '')

        # Verificar se a origem está na lista permitida
        if origin in ALLOWED_ORIGINS:
            return origin

        # Fallback para desenvolvimento (quando não há Origin header)
        # Isso acontece em requisições diretas (curl, postman, etc)
        if not origin:
            return ALLOWED_ORIGINS[0]

        # Origem não permitida - bloquear
        logger.warning(f"⚠️ Origem bloqueada: {origin}")
        return None

    def send_cors_headers(self):
        """Envia headers CORS para OPTIONS (RESTRITO)"""
        allowed_origin = self.get_allowed_origin()

        if not allowed_origin:
            self.send_response(403)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', allowed_origin)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.end_headers()

    def send_json_response(self, status_code, data):
        """Envia resposta JSON com CORS RESTRITO (SEGURANÇA)"""
        allowed_origin = self.get_allowed_origin()

        if not allowed_origin and self.headers.get('Origin'):
            # Bloquear requisições de origens não autorizadas
            self.send_response(403)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'sucesso': False,
                'erro': 'Origem não autorizada'
            }).encode('utf-8'))
            return

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', allowed_origin or ALLOWED_ORIGINS[0])
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))


def main():
    try:
        with socketserver.TCPServer(("", API_PORT), APIRequestHandler) as httpd:
            logger.info("=" * 60)
            logger.info(f"🚀 API Server v2.0 iniciado")
            logger.info(f"🌐 Endereço: http://localhost:{API_PORT}")
            logger.info("=" * 60)
            logger.info("📋 Endpoints disponíveis:")
            logger.info(f"   POST /api/pix/create       - Criar pagamento PIX")
            logger.info(f"   GET  /api/pix/status/<id>  - Verificar status")
            logger.info(f"   GET  /api/health           - Health check")
            logger.info(f"   GET  /api/proxy-image      - Proxy de imagens")
            logger.info("=" * 60)
            logger.info(f"🌐 Frontend: http://localhost:{STATIC_PORT}")
            logger.info(f"⏹️  Pressione Ctrl+C para parar")
            logger.info("=" * 60)
            httpd.serve_forever()

    except KeyboardInterrupt:
        logger.info("\n🛑 API Server parado pelo usuário")
        sys.exit(0)

    except OSError as e:
        if e.errno == 48:  # Address already in use
            logger.error(f"❌ Porta {API_PORT} já está em uso")
            logger.info(f"💡 Execute: lsof -ti:{API_PORT} | xargs kill -9")
        else:
            logger.error(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)

    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
