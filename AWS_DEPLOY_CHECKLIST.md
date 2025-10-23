# ✅ Checklist de Deploy AWS - E-commerce Certificado Digital

## 📊 Status da Infraestrutura

### ✅ **EM PRODUÇÃO** - www.certificadodigital.br.com

---

## 🌐 **Informações de Produção**

### URLs
- **Domínio**: https://www.certificadodigital.br.com
- **CloudFront**: https://d2iucdo1dmk5az.cloudfront.net
- **API Gateway**: https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com

### Recursos AWS
- **Conta AWS**: 099670158004
- **Região**: us-east-1 (Norte da Virgínia)
- **S3 Bucket**: ecommerce-certificado-frontend-prod
- **CloudFront ID**: E27KZPZJ1WKMH8
- **Lambda Function**: ecommerce-certificado-api-prod
- **SSL Certificate**: ACM (arn:aws:acm:us-east-1:099670158004:certificate/0b7078c3-66fd-4531-a6d0-f9298273d421)

---

## ✅ **1. Pré-requisitos de Deploy**

### Ferramentas Instaladas
- [x] AWS CLI configurado
- [x] Terraform v1.0+
- [x] Python 3.12+
- [x] Git

### Verificação
```bash
aws sts get-caller-identity    # Validar credenciais
terraform --version              # Verificar Terraform
python3 --version                # Verificar Python
```

---

## ✅ **2. Arquivos do Projeto**

### Estrutura Atual
```
ecommerce/
├── public/                      ✅ Frontend (em produção)
│   ├── index.html              ✅ Landing + Checkout
│   ├── assets/                 ✅ CSS, imagens, favicons
│   └── src/                    ✅ Clean Architecture (41 arquivos JS)
│
├── lambda/                      ✅ Backend serverless
│   ├── lambda_handler.py       ✅ Função principal (CORRIGIDA v1.2.0)
│   ├── build.sh                ✅ Script de build
│   └── requirements.txt        ✅ Dependências Python
│
├── terraform/                   ✅ Infraestrutura como código
│   ├── main.tf                 ✅ Provider AWS
│   ├── s3.tf                   ✅ Bucket + CloudFront
│   ├── lambda.tf               ✅ Lambda + API Gateway
│   ├── api_gateway.tf          ✅ HTTP API
│   ├── secrets.tf              ✅ Secrets Manager
│   └── terraform.tfvars        ✅ Variáveis (NÃO commitado)
│
├── .env                         ✅ Credenciais locais (NÃO commitado)
├── deploy.sh                    ✅ Deploy automatizado
└── README.md                    ✅ Documentação atualizada
```

---

## ✅ **3. Secrets e Credenciais**

### AWS Secrets Manager (Produção)
- [x] `ecommerce-certificado-safe2pay-prod` - Token e Secret Key
- [x] `ecommerce-certificado-safeweb-prod` - Credenciais Safeweb

### Arquivo .env (Local/Dev)
- [x] SAFE2PAY_TOKEN
- [x] SAFE2PAY_API_SECRET_KEY
- [x] SAFEWEB_USERNAME
- [x] SAFEWEB_PASSWORD
- [x] SAFEWEB_CODIGO_PARCEIRO
- [x] PIX_CALLBACK_URL (https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/webhook/safe2pay)

**IMPORTANTE**: `.env` está no `.gitignore` e NUNCA é commitado.

---

## ✅ **4. Google Tag Manager**

- [x] Container ID: `GTM-WJR5MN66`
- [x] Tag instalada no `<head>`
- [x] Noscript tag instalada no `<body>`
- [x] Eventos configurados:
  - [x] begin_checkout
  - [x] select_schedule
  - [x] cpf_validated
  - [x] protocol_generated
  - [x] add_payment_info
  - [x] pix_copied
  - [x] **purchase** (conversão)

---

## ✅ **5. Correções Críticas Aplicadas (v1.2.0)**

### Fix: QR Code PIX não aparecia
**Problema**: Lambda buscava dados em `PaymentObject` que não existe
**Solução**: Corrigido para buscar em `ResponseDetail`

**Arquivos corrigidos:**
- [x] `lambda/lambda_handler.py:421-428` - Mapeamento correto dos dados do Safe2Pay
- [x] `public/src/infrastructure/repositories/Safe2PayRepository.js:72` - Fallback para pixCopiaECola
- [x] `public/src/shared/config/Config.js:27-37` - URLs corretas da API Gateway
- [x] `.env:33` - PIX_CALLBACK_URL apontando para API Gateway
- [x] `deploy.sh:94` - Upload do diretório `public/` correto

**Status**: ✅ Testado e funcionando em produção

---

## 🚀 **6. Processo de Deploy**

### Método 1: Script Automatizado (Recomendado)
```bash
cd /Applications/ecommerce/deploy_ecommerce/ecommerce
./deploy.sh
```

**O script executa:**
1. ✅ Verifica AWS CLI e Terraform
2. ✅ Build da Lambda (`lambda/build.sh`)
3. ✅ Terraform init
4. ✅ Terraform plan
5. ✅ Confirmação do usuário
6. ✅ Terraform apply
7. ✅ Upload do `public/` para S3
8. ✅ Invalidação do cache CloudFront

### Método 2: Deploy Manual
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
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
aws s3 sync public/ s3://$BUCKET_NAME/ --delete

# 4. Invalidar CloudFront
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

---

## ✅ **7. Checklist de Verificação Pós-Deploy**

### Frontend
- [ ] Site acessível via CloudFront URL
- [ ] Site acessível via domínio customizado
- [ ] Landing page carrega corretamente
- [ ] Checkout carrega sem erros (abrir Console F12)
- [ ] CSS e imagens carregam
- [ ] GTM disparando eventos (GTM Preview Mode)

### Backend (API Gateway + Lambda)
- [ ] Health check responde: `curl https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/api/health`
- [ ] Endpoint de biometria funciona
- [ ] Endpoint de PIX funciona
- [ ] Logs da Lambda sem erros (CloudWatch)

### Checkout End-to-End
- [ ] Step 1: Seleção de horário
- [ ] Step 2: Validação CPF + biometria
- [ ] Step 2: Consulta RFB funciona
- [ ] Step 2: Busca CEP funciona
- [ ] Step 2: Protocolo gerado com sucesso
- [ ] Step 3: Dados do pagador aceitos
- [ ] Step 4: Resumo correto
- [ ] Step 5: QR Code PIX exibido ✅
- [ ] Step 5: Código copia-e-cola disponível ✅
- [ ] Step 5: Monitoramento de pagamento funciona

---

## ✅ **8. Segurança**

### Checklist de Segurança
- [x] HTTPS obrigatório (CloudFront + ACM)
- [x] S3 bucket privado (acesso via CloudFront OAI)
- [x] Secrets no AWS Secrets Manager
- [x] `.env` no `.gitignore`
- [x] CORS configurado (whitelist)
- [x] Rate limiting ativo (200 req/min)
- [x] Validação de inputs (CPF, CNPJ, email)
- [x] Logs mascarados (LGPD/GDPR)
- [x] Lambda timeout configurado (30s)
- [x] CloudWatch logging ativo

---

## 📊 **9. Monitoramento**

### CloudWatch Logs
```bash
# Logs da Lambda
aws logs tail /aws/lambda/ecommerce-certificado-api-prod --follow

# Métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=ecommerce-certificado-api-prod \
  --start-time 2025-10-23T00:00:00Z \
  --end-time 2025-10-23T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### GTM Debug
- **Preview Mode**: https://tagmanager.google.com/
- Verificar eventos disparados durante checkout completo

---

## 🔄 **10. Rollback (Se Necessário)**

### Rollback do Frontend
```bash
# Restaurar versão anterior no S3
aws s3 sync s3://ecommerce-certificado-frontend-prod-backup/ s3://ecommerce-certificado-frontend-prod/

# Invalidar cache
aws cloudfront create-invalidation --distribution-id E27KZPZJ1WKMH8 --paths "/*"
```

### Rollback do Lambda
```bash
# Listar versões
aws lambda list-versions-by-function --function-name ecommerce-certificado-api-prod

# Reverter para versão anterior
aws lambda update-alias \
  --function-name ecommerce-certificado-api-prod \
  --name prod \
  --function-version <VERSAO_ANTERIOR>
```

---

## 📝 **11. Documentação de Referência**

- [README.md](README.md) - Documentação geral
- [SETUP.md](SETUP.md) - Setup local e deploy
- [.env.example](.env.example) - Template de configuração
- **GitHub**: https://github.com/projetometaid/ecommerce

---

## ✅ **12. Status Final**

### **DEPLOY CONCLUÍDO COM SUCESSO** 🚀

**Versão Atual**: v1.2.0 (23/10/2025)

**Recursos em Produção:**
- ✅ Frontend: www.certificadodigital.br.com
- ✅ Backend: Lambda + API Gateway
- ✅ Pagamentos: PIX via Safe2Pay ✅ FUNCIONANDO
- ✅ Validações: Safeweb (RFB, Biometria, Protocolos)
- ✅ Analytics: GTM (GTM-WJR5MN66)
- ✅ SSL: ACM Certificate (válido)
- ✅ CDN: CloudFront (cache otimizado)

**Problemas Conhecidos:**
- ✅ QR Code PIX - **RESOLVIDO** (v1.2.0)

**Próximos Passos:**
1. Monitorar logs Lambda por 24h
2. Verificar métricas CloudWatch
3. Analisar conversões no GTM
4. Configurar alarmes CloudWatch (opcional)

---

## 🆘 **Suporte**

**Em caso de problemas:**

1. **Verificar logs**:
   ```bash
   aws logs tail /aws/lambda/ecommerce-certificado-api-prod --follow
   ```

2. **Ver outputs do Terraform**:
   ```bash
   cd terraform && terraform output
   ```

3. **Testar API diretamente**:
   ```bash
   curl https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/api/health
   ```

4. **Abrir issue no GitHub**:
   https://github.com/projetometaid/ecommerce/issues

---

**Documento atualizado**: 23/10/2025
**Versão**: 2.0
**Mantido por**: Equipe de Desenvolvimento
