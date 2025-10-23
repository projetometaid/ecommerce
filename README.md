# E-Commerce Certificados Digitais

Sistema de checkout para venda de **Certificados Digitais e-CPF A1 e e-CNPJ A1** com arquitetura limpa (Clean Architecture + SOLID).

---

## 🌐 Produção

### URLs
- **Domínio Principal**: [www.certificadodigital.br.com](https://www.certificadodigital.br.com)
- **CloudFront URL**: https://d2iucdo1dmk5az.cloudfront.net
- **API Gateway**: https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com

### Infraestrutura AWS
- **S3 Bucket**: ecommerce-certificado-frontend-prod
- **CloudFront Distribution**: E27KZPZJ1WKMH8
- **Lambda Function**: ecommerce-certificado-api-prod
- **Região**: us-east-1 (Norte da Virgínia)
- **Conta AWS**: 099670158004

### Certificado SSL
- **Status**: ✅ ISSUED
- **Domínio**: www.certificadodigital.br.com
- **ARN**: arn:aws:acm:us-east-1:099670158004:certificate/0b7078c3-66fd-4531-a6d0-f9298273d421

---

## 📋 Sobre o Projeto

Sistema completo de e-commerce para venda de certificados digitais com:
- **Frontend**: Landing page + Checkout em 5 etapas
- **Backend**: AWS Lambda (Python 3.12) + API Gateway
- **Pagamento**: PIX via Safe2Pay
- **Validação**: Safeweb (RFB, Biometria, Protocolos)
- **Analytics**: Google Tag Manager (GTM-WJR5MN66)

---

## 🏗️ Arquitetura

### Stack Tecnológico
```
Frontend:
├── HTML5 + CSS3
├── JavaScript ES6 Modules (Clean Architecture)
├── Google Tag Manager
└── Hospedagem: S3 + CloudFront

Backend:
├── AWS Lambda (Python 3.12)
├── API Gateway HTTP API
├── AWS Secrets Manager
└── CloudWatch Logs

Infraestrutura:
├── Terraform (IaC)
├── GitHub (controle de versão)
└── Deploy automatizado
```

### Estrutura do Projeto
```
ecommerce/
├── public/                    # Frontend (em produção)
│   ├── index.html            # Landing page + Checkout
│   ├── assets/               # CSS, imagens, favicons
│   └── src/                  # Código fonte (Clean Architecture)
│       ├── domain/           # Entidades e regras de negócio
│       ├── application/      # Casos de uso
│       ├── infrastructure/   # Repositórios e APIs
│       ├── presentation/     # Controllers e Views
│       └── shared/           # Utilitários e config
│
├── lambda/                   # Backend serverless
│   ├── lambda_handler.py    # Função principal
│   ├── build.sh             # Script de build
│   └── requirements.txt     # Dependências Python
│
├── terraform/                # Infraestrutura como código
│   ├── main.tf              # Provider AWS
│   ├── s3.tf                # Bucket frontend
│   ├── cloudfront.tf        # CDN
│   ├── lambda.tf            # Função Lambda
│   ├── api_gateway.tf       # API Gateway
│   └── secrets.tf           # Secrets Manager
│
├── api_server.py             # API local (desenvolvimento)
├── deploy.sh                 # Deploy automatizado
├── start_servers.sh          # Servidores locais
├── stop_servers.sh           # Parar servidores
├── .env.example              # Template de configuração
├── README.md                 # Este arquivo
├── SETUP.md                  # Guia de setup
└── AWS_DEPLOY_CHECKLIST.md   # Checklist de deploy
```

---

## 🚀 Quick Start (Desenvolvimento Local)

### Pré-requisitos
- Python 3.8+
- Git
- Credenciais Safeweb e Safe2Pay

### Setup
```bash
# 1. Clone o repositório
git clone https://github.com/projetometaid/ecommerce.git
cd ecommerce

# 2. Instale dependências
pip3 install python-dotenv requests flask-cors

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Inicie os servidores
./start_servers.sh
```

**Pronto!** Acesse:
- Frontend: http://localhost:8080
- API: http://localhost:8082

---

## 📦 Deploy para Produção

### Método 1: Script Automatizado (Recomendado)
```bash
./deploy.sh
```

O script executa:
1. Build da função Lambda
2. Terraform init/plan/apply
3. Upload do frontend para S3
4. Invalidação do cache CloudFront

### Método 2: Manual
```bash
# 1. Build Lambda
cd lambda && ./build.sh && cd ..

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
```

---

## 🎯 Funcionalidades

### Fluxo de Checkout (5 Etapas)

**Step 1 - Seleção de Horário**
- Escolha de data/hora para videoconferência
- Horários disponíveis via API Safeweb

**Step 2 - Dados do Certificado**
- Validação CPF + Data de Nascimento
- Verificação de biometria cadastrada
- Consulta prévia RFB (Receita Federal)
- Busca automática de endereço (ViaCEP)
- Geração de protocolo Safeweb

**Step 3 - Dados do Pagador**
- CPF/CNPJ (pode ser diferente do titular)
- Nome completo ou Razão Social
- E-mail e telefone

**Step 4 - Resumo do Pedido**
- Revisão de todos os dados
- Valor total do certificado

**Step 5 - Pagamento PIX**
- QR Code gerado via Safe2Pay
- Código copia-e-cola
- Verificação automática de pagamento
- Expiração: 30 minutos

### Produtos Disponíveis
- **e-CPF A1**: R$ 8,00 (validade 1 ano)
- **e-CPF A3**: R$ 150,00 (validade 3 anos)
- **e-CNPJ A1**: R$ 200,00 (validade 1 ano)

---

## 🔐 Segurança

### Implementações
- ✅ HTTPS obrigatório (CloudFront + ACM)
- ✅ Secrets no AWS Secrets Manager
- ✅ CORS configurado
- ✅ Rate limiting (200 req/min por IP)
- ✅ Validação de inputs (CPF, CNPJ, email)
- ✅ Logs mascarados (LGPD/GDPR)
- ✅ S3 bucket privado (acesso via CloudFront OAI)

### Boas Práticas
- `.env` nunca commitado (veja `.gitignore`)
- Credenciais rotacionadas regularmente
- Monitoramento via CloudWatch
- Backups automáticos do Terraform state

---

## 📊 Monitoramento

### Google Tag Manager
- **Container ID**: GTM-WJR5MN66
- **Eventos rastreados**: 10+ eventos (conversões, interações)
- **Preview Mode**: https://tagmanager.google.com/

### CloudWatch Logs
```bash
# Ver logs da Lambda
aws logs tail /aws/lambda/ecommerce-certificado-api-prod --follow

# Ver logs de deploy
terraform output
```

---

## 🧪 Testes

### Ambiente Local
```bash
# Health check API
curl http://localhost:8082/api/health

# Testar verificação de biometria
curl -X POST http://localhost:8082/api/safeweb/verificar-biometria \
  -H "Content-Type: application/json" \
  -d '{"cpf":"38601836801","dataNascimento":"1989-01-28"}'
```

### Ambiente de Produção
```bash
# Testar API Gateway
curl https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/api/health
```

---

## 📚 Documentação Adicional

- **[SETUP.md](SETUP.md)** - Guia completo de configuração e desenvolvimento
- **[AWS_DEPLOY_CHECKLIST.md](AWS_DEPLOY_CHECKLIST.md)** - Checklist de deploy AWS
- **[.env.example](.env.example)** - Template de variáveis de ambiente

---

## 🐛 Troubleshooting

### Problema: QR Code PIX não aparece
- ✅ **Resolvido**: Lambda corrigida para pegar dados do `ResponseDetail` (não `PaymentObject`)
- Verificar logs: `aws logs tail /aws/lambda/ecommerce-certificado-api-prod`

### Problema: CORS error no frontend
- Verificar se a origem está na whitelist do Lambda
- Testar com `curl -v` para ver headers

### Problema: Deploy falha no Terraform
- Validar credenciais AWS: `aws sts get-caller-identity`
- Verificar se `.tfvars` está configurado
- Destruir e recriar: `terraform destroy && terraform apply`

---

## 🔄 Changelog

### v1.2.0 - 2025-10-23 (Atual)
- ✅ Fix: Corrigido mapeamento de QR Code PIX (ResponseDetail vs PaymentObject)
- ✅ Fix: Atualizado Config.js para usar API Gateway correto
- ✅ Melhoria: Removido diretório `checkout/` duplicado
- ✅ Melhoria: Atualizado `.gitignore` para excluir arquivos temporários
- ✅ Deploy: Automatizado script de deploy (`deploy.sh`)

### v1.1.0 - 2025-10-14
- ✅ Clean Architecture implementada no frontend
- ✅ Lambda + API Gateway em produção
- ✅ GTM instalado (GTM-WJR5MN66)
- ✅ Integração Safeweb completa
- ✅ Integração Safe2Pay (PIX)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📞 Suporte

- **GitHub**: https://github.com/projetometaid/ecommerce
- **Issues**: https://github.com/projetometaid/ecommerce/issues

---

## 📄 Licença

Proprietary - Todos os direitos reservados

---

**Última atualização**: 23/10/2025
