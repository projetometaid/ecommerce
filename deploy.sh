#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY - AWS (TERRAFORM)
# ========================================

set -e

echo "🚀 Deploy AWS - E-commerce Certificado Digital"
echo "=============================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI não instalado. Execute: brew install awscli"
fi

# Verificar Terraform
if ! command -v terraform &> /dev/null; then
    log_error "Terraform não instalado. Execute: brew install terraform"
fi

# Verificar credenciais AWS
echo "🔑 Verificando credenciais AWS..."
aws sts get-caller-identity > /dev/null 2>&1 || log_error "Credenciais AWS não configuradas"
log_info "Credenciais AWS válidas"

# Mostrar Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Account ID: $ACCOUNT_ID"

# FASE 1: Build Lambda
echo ""
echo "📦 FASE 1: Construindo Lambda..."
cd lambda
./build.sh
cd ..
log_info "Lambda buildada com sucesso"

# FASE 2: Terraform Init
echo ""
echo "🔧 FASE 2: Inicializando Terraform..."
cd terraform
terraform init
log_info "Terraform inicializado"

# FASE 3: Terraform Plan
echo ""
echo "📋 FASE 3: Planejando deploy (terraform plan)..."
terraform plan -out=tfplan
log_info "Plan gerado com sucesso"

# Perguntar confirmação
echo ""
read -p "🤔 Deseja aplicar o deploy? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_warn "Deploy cancelado pelo usuário"
    exit 0
fi

# FASE 4: Terraform Apply
echo ""
echo "🚀 FASE 4: Aplicando infraestrutura (terraform apply)..."
terraform apply tfplan
log_info "Infraestrutura criada com sucesso!"

# FASE 5: Upload Frontend para S3
echo ""
echo "📤 FASE 5: Fazendo upload do frontend para S3..."

BUCKET_NAME=$(terraform output -raw s3_bucket_name)

aws s3 sync ../index.html s3://$BUCKET_NAME/ --exclude ".git/*" --exclude "node_modules/*"
aws s3 sync ../src s3://$BUCKET_NAME/src/ --exclude ".git/*"
aws s3 sync ../assets s3://$BUCKET_NAME/assets/

log_info "Frontend enviado para S3: $BUCKET_NAME"

# FASE 6: Invalidar cache CloudFront
echo ""
echo "🔄 FASE 6: Invalidando cache do CloudFront..."

DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" > /dev/null

log_info "Cache do CloudFront invalidado"

# Mostrar URLs
echo ""
echo "=============================================="
log_info "DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=============================================="
echo ""
echo "📍 URLs de acesso:"
echo "   Frontend: $(terraform output -raw cloudfront_url)"
echo "   API:      $(terraform output -raw api_gateway_url)"
echo ""
echo "🔐 Secrets Manager:"
echo "   Safe2Pay: $(terraform output -raw safe2pay_secret_name)"
echo "   Safeweb:  $(terraform output -raw safeweb_secret_name)"
echo ""
echo "=============================================="
