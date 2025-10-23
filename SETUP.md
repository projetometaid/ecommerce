# Guia de Setup - E-Commerce Certificados Digitais

> Guia completo para configurar e executar o projeto localmente ou em produção.

---

## 📋 Visão Geral

Sistema de checkout para **Certificados Digitais e-CPF A1 e e-CNPJ A1** com Clean Architecture.

**Stack:**
- **Frontend**: HTML5, CSS3, JavaScript ES6 Modules
- **Backend**: Python 3.12 (API local) + AWS Lambda (produção)
- **Integrações**: Safeweb (validações RFB) + Safe2Pay (pagamentos PIX)
- **Analytics**: Google Tag Manager (GTM-WJR5MN66)

---

## 🏗️ Estrutura do Projeto

```
ecommerce/
├── public/                      # Frontend (em produção)
│   ├── index.html              # Landing page + Checkout
│   ├── assets/                 # CSS, imagens, favicons
│   └── src/                    # Código fonte (Clean Architecture)
│       ├── domain/             # Entidades e casos de uso
│       ├── application/        # Orquestração de fluxos
│       ├── infrastructure/     # Repositórios e HTTP clients
│       ├── presentation/       # Controllers e Views (Step1-5)
│       └── shared/             # Config e utilitários
│
├── lambda/                      # Backend serverless (AWS)
│   ├── lambda_handler.py       # Função principal
│   ├── build.sh                # Script de build
│   └── requirements.txt        # Dependências Python
│
├── terraform/                   # Infraestrutura como código
│   ├── main.tf                 # Provider AWS
│   ├── s3.tf                   # Bucket + CloudFront
│   ├── lambda.tf               # Função Lambda
│   ├── api_gateway.tf          # API Gateway
│   └── secrets.tf              # AWS Secrets Manager
│
├── api_server.py                # API local (desenvolvimento)
├── deploy.sh                    # Deploy automatizado
├── start_servers.sh             # Iniciar servidores locais
├── stop_servers.sh              # Parar servidores
├── .env.example                 # Template de configuração
└── README.md                    # Documentação principal
```

---

## 🚀 Setup Rápido (Desenvolvimento Local)

### Pré-requisitos
- Python 3.8+
- Git
- Credenciais Safeweb e Safe2Pay

### Instalação (Comando Único)

```bash
# 1. Clone o repositório
git clone https://github.com/projetometaid/ecommerce.git
cd ecommerce

# 2. Instale dependências
pip3 install python-dotenv requests flask-cors

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (veja seção abaixo)

# 4. Inicie os servidores
./start_servers.sh
```

**Pronto!** Acesse:
- **Frontend**: http://localhost:8080
- **API**: http://localhost:8082

---

## 🔐 Configuração do .env

Crie o arquivo `.env` na raiz do projeto:

```bash
# ===== SAFE2PAY (Pagamentos PIX) =====
SAFE2PAY_TOKEN=seu-token-aqui
SAFE2PAY_API_SECRET_KEY=sua-secret-key-aqui
SAFE2PAY_BASE_URL=https://payment.safe2pay.com.br/v2

# Configurações PIX
PIX_EXPIRATION_MINUTES=30
PIX_CALLBACK_URL=https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/webhook/safe2pay

# ===== SAFEWEB (Validações RFB) =====
SAFEWEB_USERNAME=seu-usuario-integracao
SAFEWEB_PASSWORD=sua-senha-hash
SAFEWEB_BASE_URL=https://pss.safewebpss.com.br
SAFEWEB_AUTH_URL=https://pss.safewebpss.com.br/Service/Microservice/Shared/HubAutenticacao/Autenticacoes/api/autorizacao/token

# Dados da Autoridade Certificadora
SAFEWEB_CNPJ_AR=seu-cnpj-ar
SAFEWEB_CODIGO_PARCEIRO=seu-uuid-parceiro

# Produtos Safeweb (IDs)
SAFEWEB_PRODUTO_ECPF_A1=37341
SAFEWEB_PRODUTO_ECNPJ_A1=37342
```

**IMPORTANTE:**
- NUNCA commite o arquivo `.env` no Git
- Use `.env.example` como template
- Em produção, use AWS Secrets Manager

---

## 📡 Endpoints da API

### Backend Local (porta 8082)

**Safeweb:**
- `POST /api/safeweb/verificar-biometria` - Verifica biometria cadastrada
- `POST /api/safeweb/consultar-cpf` - Consulta CPF na RFB
- `POST /api/safeweb/gerar-protocolo` - Gera protocolo de atendimento

**Safe2Pay:**
- `POST /api/pix/create` - Cria pagamento PIX
- `GET /api/pix/status/<id>` - Verifica status do pagamento

**Utilitários:**
- `GET /api/health` - Health check
- `GET /api/proxy-image` - Proxy de imagens (CORS)

### Backend Produção (API Gateway)

**Base URL**: `https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com`

Mesmos endpoints, mas com rate limiting e autenticação AWS.

---

## 🛒 Fluxo do Checkout

### Step 1: Seleção de Horário
- Escolha de data/hora para videoconferência
- Horários disponíveis via API Safeweb

### Step 2: Dados do Certificado
- **Validação**: CPF + Data de Nascimento
- **Biometria**: Verifica se CPF possui biometria cadastrada
- **Consulta RFB**: Valida CPF na Receita Federal
- **Endereço**: Busca automática via CEP (ViaCEP API)
- **Protocolo**: Geração de protocolo Safeweb

### Step 3: Dados do Pagador
- CPF/CNPJ (pode ser diferente do titular)
- Nome completo ou Razão Social
- E-mail e telefone

### Step 4: Resumo do Pedido
- Revisão de todos os dados
- Exibição do valor total

### Step 5: Pagamento PIX
- Geração de QR Code (via Safe2Pay)
- Código copia-e-cola
- Verificação automática de pagamento
- Expiração: 30 minutos

---

## 📦 Deploy para Produção

### Infraestrutura AWS (Atual)

**Frontend:**
- **S3 Bucket**: ecommerce-certificado-frontend-prod
- **CloudFront**: d2iucdo1dmk5az.cloudfront.net (ID: E27KZPZJ1WKMH8)
- **Domínio**: https://www.certificadodigital.br.com
- **Região**: us-east-1

**Backend:**
- **Lambda**: ecommerce-certificado-api-prod (Python 3.12)
- **API Gateway**: u4w4tf2o4f.execute-api.us-east-1.amazonaws.com
- **Secrets Manager**: safe2pay-prod, safeweb-prod

### Deploy Automatizado

```bash
./deploy.sh
```

O script executa:
1. ✅ Build da função Lambda (`lambda/build.sh`)
2. ✅ Terraform init/plan/apply
3. ✅ Upload do `public/` para S3
4. ✅ Invalidação do cache CloudFront

### Deploy Manual (Passo a Passo)

```bash
# 1. Build Lambda
cd lambda
./build.sh
cd ..

# 2. Terraform
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 3. Upload Frontend
aws s3 sync public/ s3://ecommerce-certificado-frontend-prod/ --delete

# 4. Invalidar CloudFront
aws cloudfront create-invalidation \
  --distribution-id E27KZPZJ1WKMH8 \
  --paths "/*"

# 5. Ver outputs
terraform output
```

---

## 🧪 Testes

### Teste Local da API

```bash
# Health check
curl http://localhost:8082/api/health

# Verificar biometria
curl -X POST http://localhost:8082/api/safeweb/verificar-biometria \
  -H "Content-Type: application/json" \
  -d '{"cpf":"38601836801","dataNascimento":"1989-01-28"}'
```

### Teste em Produção

```bash
# API Gateway
curl https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/api/health
```

### Dados de Teste (Safeweb Sandbox)

**CPF com biometria:**
- CPF: 386.018.368-01
- Data: 28/01/1989

---

## 🏛️ Arquitetura Clean (Frontend)

### Camadas

**1. Domain Layer** (`src/domain/`)
- **Entities**: Certificado, Cliente, Endereco, Horario, Pagamento, Protocolo
- **Repositories (Interfaces)**: ICEPRepository, ISafewebRepository, ISafe2PayRepository
- **Use Cases**: Verificar biometria, Consultar CPF/RFB, Buscar endereço, Gerar protocolo

**2. Application Layer** (`src/application/`)
- **Use Cases Complexos**: GerarPagamentoPIXUseCase (orquestra pagamento)

**3. Infrastructure Layer** (`src/infrastructure/`)
- **HTTP Client**: HttpClient.js (comunicação com APIs)
- **Repositories (Implementações)**:
  - SafewebRepository
  - Safe2PayRepository
  - CEPRepository (ViaCEP)
  - LocalStorageRepository

**4. Presentation Layer** (`src/presentation/`)
- **Controllers**: Step1Controller, Step2Controller, ..., Step5Controller
- **Views**: Step1View, Step2View, ..., Step5View
- **Validators**: CPF, email, telefone, nome
- **Components**: PagadorModal

**5. Shared Layer** (`src/shared/`)
- **Config**: Configurações globais (Config.js)
- **Utils**: GTMService, InputMasks, CryptoUtil, MobileUtils

---

## 📊 Google Tag Manager

**Container ID**: `GTM-WJR5MN66`

**Eventos rastreados:**
1. `begin_checkout` - Início do checkout
2. `select_schedule` - Horário selecionado
3. `cpf_validated` - CPF validado
4. `protocol_generated` - Protocolo gerado
5. `add_payment_info` - PIX gerado
6. `pix_copied` - Código PIX copiado
7. **`purchase`** - Compra finalizada (conversão principal)

**Preview Mode**: https://tagmanager.google.com/?hl=pt-BR#/container/accounts/6033717969/containers/194629062

---

## 🔒 Segurança

### Implementações
- ✅ HTTPS obrigatório (CloudFront + ACM)
- ✅ Secrets no AWS Secrets Manager (produção)
- ✅ CORS configurado (whitelist de origens)
- ✅ Rate limiting (200 requisições/minuto por IP)
- ✅ Validação de inputs (CPF, CNPJ, email)
- ✅ Logs mascarados para LGPD/GDPR
- ✅ S3 bucket privado (acesso via CloudFront OAI)

### Checklist de Segurança
- [x] `.env` no `.gitignore`
- [x] Credenciais no Secrets Manager
- [x] HTTPS em produção
- [x] Rate limiting ativo
- [x] Inputs validados
- [x] Logs mascarados

---

## 🐛 Troubleshooting

### Porta já em uso
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:8082 | xargs kill -9
./start_servers.sh
```

### Frontend não carrega
- Verifique se está acessando: `http://localhost:8080`
- Abra o Console (F12) e verifique erros JavaScript
- Verifique se a API está rodando: `curl http://localhost:8082/api/health`

### CORS Error
- Verifique se a origem está na whitelist do `api_server.py` (ALLOWED_ORIGINS)
- Em produção, verifique Lambda handler

### QR Code PIX não aparece
✅ **RESOLVIDO** (v1.2.0): Lambda corrigida para pegar dados do `ResponseDetail`

Se ainda ocorrer:
```bash
# Ver logs Lambda
aws logs tail /aws/lambda/ecommerce-certificado-api-prod --follow
```

### Deploy falha
```bash
# Validar credenciais
aws sts get-caller-identity

# Ver erro específico
cd terraform
terraform plan

# Destruir e recriar (CUIDADO)
terraform destroy
terraform apply
```

---

## 📈 Monitoramento

### CloudWatch Logs
```bash
# Logs da Lambda
aws logs tail /aws/lambda/ecommerce-certificado-api-prod --follow

# Logs do API Gateway
aws logs tail /aws/apigateway/ecommerce-certificado-api-prod --follow
```

### Métricas
- **CloudWatch**: Invocações Lambda, erros, latência
- **GTM**: Conversões, eventos, funis
- **CloudFront**: Requests, cache hit ratio

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento
./start_servers.sh          # Iniciar servidores locais
./stop_servers.sh           # Parar servidores
lsof -i :8080               # Ver processo na porta 8080
lsof -i :8082               # Ver processo na porta 8082

# Deploy
./deploy.sh                 # Deploy completo
cd lambda && ./build.sh     # Build Lambda apenas

# AWS
aws s3 ls s3://ecommerce-certificado-frontend-prod/  # Listar arquivos S3
aws lambda list-functions   # Listar funções Lambda
terraform output            # Ver outputs do Terraform

# Git
git status                  # Ver mudanças
git add .                   # Adicionar tudo
git commit -m "mensagem"    # Commit
git push                    # Push para GitHub
```

---

## 🔗 Links Úteis

- **Repositório**: https://github.com/projetometaid/ecommerce
- **Site Produção**: https://www.certificadodigital.br.com
- **API Produção**: https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com
- **GTM Container**: https://tagmanager.google.com/
- **AWS Console**: https://console.aws.amazon.com/

---

## 📞 Suporte

- **GitHub Issues**: https://github.com/projetometaid/ecommerce/issues
- **Documentação Safeweb**: Solicitar à equipe
- **Documentação Safe2Pay**: https://developers.safe2pay.com.br

---

**Última atualização**: 23/10/2025
