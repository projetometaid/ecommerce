# =========================================
# AWS SECRETS MANAGER - CREDENCIAIS APIS
# =========================================

# Secret para Safe2Pay
resource "aws_secretsmanager_secret" "safe2pay" {
  name        = "${var.project_name}-safe2pay-${var.environment}"
  description = "Credenciais Safe2Pay para pagamentos PIX"

  tags = merge(local.common_tags, {
    Name = "Safe2Pay Credentials"
  })
}

resource "aws_secretsmanager_secret_version" "safe2pay" {
  secret_id = aws_secretsmanager_secret.safe2pay.id

  secret_string = jsonencode({
    token      = var.safe2pay_token
    secret_key = var.safe2pay_secret_key
    base_url   = "https://payment.safe2pay.com.br/v2"
  })
}

# Secret para Safeweb
resource "aws_secretsmanager_secret" "safeweb" {
  name        = "${var.project_name}-safeweb-${var.environment}"
  description = "Credenciais Safeweb para validação RFB e protocolos"

  tags = merge(local.common_tags, {
    Name = "Safeweb Credentials"
  })
}

resource "aws_secretsmanager_secret_version" "safeweb" {
  secret_id = aws_secretsmanager_secret.safeweb.id

  secret_string = jsonencode({
    username        = var.safeweb_username
    password        = var.safeweb_password
    base_url        = "https://pss.safewebpss.com.br"
    auth_url        = "https://pss.safewebpss.com.br/Service/Microservice/Shared/HubAutenticacao/Autenticacoes/api/autorizacao/token"
    cnpj_ar         = var.safeweb_cnpj_ar
    codigo_parceiro = var.safeweb_codigo_parceiro
    produto_ecpf_a1 = var.safeweb_produto_ecpf_a1
    produto_ecnpj_a1 = var.safeweb_produto_ecnpj_a1
  })
}

# Outputs para uso na Lambda
output "safe2pay_secret_arn" {
  value       = aws_secretsmanager_secret.safe2pay.arn
  description = "ARN do secret Safe2Pay"
}

output "safeweb_secret_arn" {
  value       = aws_secretsmanager_secret.safeweb.arn
  description = "ARN do secret Safeweb"
}
