# Guia de Setup - E-Commerce Certificados Digitais

> Guia completo para IAs e desenvolvedores configurarem e executarem o projeto em um único comando.

---

## Visão Geral do Projeto

Sistema de checkout para **Certificados Digitais e-CPF A1** com arquitetura limpa (Clean Architecture + SOLID + Design Patterns).

**Stack:**
- Frontend: HTML5, CSS3, JavaScript ES6 Modules
- Backend: Python 3 (Flask-like API server)
- Integrações: Safeweb (validações) + Safe2Pay (pagamentos PIX)

---

## Estrutura do Projeto

```
ecommerce/
├── checkout/                    # Frontend do checkout (Clean Architecture)
│   ├── index.html              # Página principal com GTM instalado
│   ├── assets/                 # CSS e recursos estáticos
│   └── src/                    # Código fonte modular
│       ├── domain/             # Entidades e regras de negócio
│       ├── application/        # Casos de uso
│       ├── infrastructure/     # Repositórios e APIs
│       ├── presentation/       # Controllers e Views
│       └── shared/             # Utilitários compartilhados
├── api_server.py               # API Backend Python
├── .env                        # Credenciais (NÃO commitar - use .env.example)
├── start_servers.sh            # Script para iniciar servidores
├── stop_servers.sh             # Script para parar servidores
├── deploy.sh                   # Script de deploy para AWS S3
├── lambda/                     # Funções AWS Lambda
└── terraform/                  # Infraestrutura como código
```

---

## Setup Rápido (Comando Único)

### Pré-requisitos
- Python 3.8+
- Git
- Credenciais Safeweb e Safe2Pay

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/projetometaid/ecommerce.git
cd ecommerce

# 2. Instale dependências Python
pip3 install python-dotenv requests flask-cors

# 3. Configure o arquivo .env (veja seção abaixo)
cp .env.example .env
# Edite o .env com suas credenciais reais

# 4. Inicie os servidores
./start_servers.sh
```

**Pronto!** Acesse:
- Frontend: http://localhost:8080/checkout/index.html
- API: http://localhost:8082

---

## Configuração do Arquivo .env

**IMPORTANTE:** O arquivo `.env` contém credenciais sensíveis e NÃO deve ser commitado no Git.

Crie o arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```bash
# ===== API SAFEWEB =====
# Validação de biometria, consulta prévia RFB e geração de protocolos
SAFEWEB_USERNAME=seu-usuario-aqui
SAFEWEB_PASSWORD=sua-senha-hash-aqui
SAFEWEB_BASE_URL=https://pss.safewebpss.com.br
SAFEWEB_AUTH_URL=https://pss.safewebpss.com.br/Service/Microservice/Shared/HubAutenticacao/Autenticacoes/api/autorizacao/token

# ===== DADOS DA AUTORIDADE CERTIFICADORA =====
SAFEWEB_CNPJ_AR=seu-cnpj-aqui
SAFEWEB_CODIGO_PARCEIRO=seu-codigo-parceiro-uuid-aqui

# ===== PRODUTOS SAFEWEB =====
# IDs dos produtos para geração de protocolos (videoconferência)
SAFEWEB_PRODUTO_ECPF_A1=37341
SAFEWEB_PRODUTO_ECNPJ_A1=37342

# ===== INTEGRAÇÃO SAFE2PAY =====
# Para geração de boletos e pagamentos PIX
SAFE2PAY_TOKEN=seu-token-aqui
SAFE2PAY_API_SECRET_KEY=sua-secret-key-aqui
SAFE2PAY_BASE_URL=https://payment.safe2pay.com.br/v2

# Configurações de PIX
PIX_EXPIRATION_MINUTES=30
PIX_CALLBACK_URL=http://localhost:8082/webhook/safe2pay
```

**Valores que você DEVE substituir:**
- `SAFEWEB_USERNAME` - Usuário de integração fornecido pela Safeweb
- `SAFEWEB_PASSWORD` - Senha hash fornecida pela Safeweb
- `SAFEWEB_CNPJ_AR` - CNPJ da Autoridade Certificadora
- `SAFEWEB_CODIGO_PARCEIRO` - UUID do parceiro (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- `SAFE2PAY_TOKEN` - Token de API do Safe2Pay
- `SAFE2PAY_API_SECRET_KEY` - Secret key do Safe2Pay

---

## Endpoints da API

### API Backend (porta 8082)

**Safeweb (Validações):**
- `POST /api/safeweb/verificar-biometria` - Verifica se CPF possui biometria cadastrada
- `POST /api/safeweb/consultar-cpf` - Consulta CPF na Receita Federal
- `POST /api/safeweb/gerar-protocolo` - Gera protocolo de atendimento
- `GET /api/safeweb/buscar-horarios` - Busca horários disponíveis

**Safe2Pay (Pagamentos):**
- `POST /api/pix/create` - Cria pagamento PIX
- `GET /api/pix/status/<id>` - Verifica status do pagamento

**Utilitários:**
- `GET /api/health` - Health check
- `GET /api/proxy-image` - Proxy de imagens (CORS)

---

## Fluxo do Checkout (5 Steps)

### Step 1: Escolha de Horário
- Usuário seleciona data e horário para videoconferência
- Horários disponíveis são carregados via API Safeweb

### Step 2: Dados do Certificado
- **Consulta Prévia:** CPF + Data de Nascimento
- **Verificação de Biometria:** Valida se CPF possui biometria cadastrada
- **Consulta RFB:** Valida CPF na Receita Federal e retorna nome completo
- **Endereço:** Busca automática via CEP (API ViaCEP)
- **Geração de Protocolo:** Cria protocolo de atendimento na Safeweb

### Step 3: Dados do Pagador
- CPF/CNPJ do pagador (pode ser diferente do titular)
- Nome completo
- E-mail e telefone

### Step 4: Resumo do Pedido
- Revisão de todos os dados preenchidos
- Valor total: R$ 197,00

### Step 5: Pagamento PIX
- Geração de QR Code PIX
- Código PIX copia e cola
- Verificação automática de pagamento
- Expiração: 30 minutos

### Step 6: Confirmação
- Exibição do número do protocolo
- Instruções para próximos passos

---

## Google Tag Manager

**GTM ID:** `GTM-WJR5MN66`

O Google Tag Manager está instalado no arquivo `checkout/index.html`:
- Script no `<head>` (tracking principal)
- Noscript no `<body>` (fallback)

**Eventos disparados:**
- Pageviews automáticas
- Eventos customizados via `GTMService.js`

---

## Deploy para Produção

### Infraestrutura AWS

**Frontend:**
- S3 Bucket: `ecommerce-certificado-frontend-prod`
- CloudFront: `d2nmq07g3fjio1.cloudfront.net` (ID: E1S5ICGQCKGAIM)
- Domínio: https://www.certificadodigital.br.com
- Região: `us-east-1`

**Backend:**
- AWS Lambda (funções serverless)
- API Gateway (endpoints públicos)

### Deploy do Frontend

```bash
# Sincronizar código local com S3
./deploy.sh

# Ou manualmente:
aws s3 sync . s3://ecommerce-certificado-frontend-prod/ \
  --exclude ".git/*" \
  --exclude "terraform/*" \
  --exclude "node_modules/*" \
  --exclude ".DS_Store" \
  --exclude ".env"

# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1S5ICGQCKGAIM \
  --paths "/*"
```

### Deploy do Backend (Lambda)

```bash
cd lambda
# Seguir instruções específicas do Lambda (terraform ou AWS CLI)
```

---

## Troubleshooting

### Erro: "Token Safe2Pay não encontrado no .env"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Certifique-se que `SAFE2PAY_TOKEN` está configurado
- Reinicie o servidor: `./stop_servers.sh && ./start_servers.sh`

### Erro: "Credenciais Safeweb não encontradas no .env"
- Verifique se todas as variáveis `SAFEWEB_*` estão configuradas
- Certifique-se que não há espaços extras nas credenciais

### Erro: "O código do parceiro informado não é válido"
- O `SAFEWEB_CODIGO_PARCEIRO` deve ser um UUID válido
- Exemplo: `f868b6c5-d238-4112-8800-a2e8397b653e`
- Solicite o código correto à equipe Safeweb

### Erro: "Porta já está em uso"
```bash
# Liberar portas 8080 e 8082
lsof -ti:8080 | xargs kill -9
lsof -ti:8082 | xargs kill -9

# Reiniciar
./start_servers.sh
```

### Frontend não carrega
- Verifique se o servidor está rodando: `http://localhost:8080`
- Acesse a URL correta: `http://localhost:8080/checkout/index.html`
- Verifique console do navegador (F12) para erros JavaScript

---

## Testes

### Dados de Teste (Safeweb Sandbox)

**CPF com biometria:**
- CPF: 326.xxx.x30
- Data: 15/03/1985

**CPF sem biometria:**
- CPF: 352.xxx.x32
- Data: 20/07/1990

### Verificar APIs manualmente

```bash
# Health check
curl http://localhost:8082/api/health

# Verificar biometria
curl -X POST http://localhost:8082/api/safeweb/verificar-biometria \
  -H "Content-Type: application/json" \
  -d '{"cpf":"32600000030","dataNascimento":"15/03/1985"}'
```

---

## Arquitetura Clean (Frontend)

### Camadas

**Domain Layer** (`src/domain/`)
- Entidades puras (Certificado, Cliente, Endereco, Horario, Pagador, Pagamento, Protocolo)
- Interfaces de repositórios (ICEPRepository, ISafewebRepository, ISafe2PayRepository)
- Casos de uso de domínio

**Application Layer** (`src/application/`)
- Casos de uso de aplicação (GerarPagamentoPIXUseCase)
- Orquestração de fluxos complexos

**Infrastructure Layer** (`src/infrastructure/`)
- Implementações de repositórios
- HttpClient para comunicação com APIs
- LocalStorageRepository para persistência

**Presentation Layer** (`src/presentation/`)
- Controllers (Step1Controller até Step5Controller)
- Views (Step1View até Step5View)
- Validators e Components

**Shared Layer** (`src/shared/`)
- Config (configurações globais)
- Utils (CryptoUtil, GTMService, InputMasks)

---

## Princípios SOLID Aplicados

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Substituição de interfaces
- **I**nterface Segregation: Interfaces específicas
- **D**ependency Inversion: Depende de abstrações, não implementações

---

## Segurança

### CORS
- Apenas origens permitidas podem acessar a API
- Lista em `api_server.py`: `ALLOWED_ORIGINS`

### Rate Limiting
- 20 requisições por minuto por IP
- Configurado em `RateLimiter` class

### Validações
- CPF validado no backend
- Inputs sanitizados
- HTTPS obrigatório em produção

### Credenciais
- NUNCA commitar `.env` no Git
- Usar AWS Secrets Manager em produção
- Rotacionar tokens regularmente

---

## Comandos Úteis

```bash
# Iniciar servidores
./start_servers.sh

# Parar servidores
./stop_servers.sh

# Ver logs do servidor
tail -f nohup.out  # se rodando em background

# Verificar processos rodando
lsof -i :8080
lsof -i :8082

# Deploy para AWS
./deploy.sh

# Limpar cache local
rm -rf __pycache__
```

---

## Próximos Passos

1. Testar fluxo completo de checkout localmente
2. Configurar credenciais reais (produção)
3. Testar integrações com APIs reais
4. Deploy para staging/produção
5. Configurar monitoramento (CloudWatch, Sentry)
6. Configurar CI/CD (GitHub Actions)

---

## Suporte

- **GitHub:** https://github.com/projetometaid/ecommerce
- **Documentação Safeweb:** (solicitar à equipe)
- **Documentação Safe2Pay:** https://developers.safe2pay.com.br

---

## Changelog

### v7.0 - Atual
- Clean Architecture implementada
- GTM instalado (GTM-WJR5MN66)
- Integração Safeweb completa
- Integração Safe2Pay (PIX)
- 5 steps de checkout funcionais
- Deploy automatizado para AWS

---

**Última atualização:** 14/10/2025
