variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "ecommerce-certificado"
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "Região AWS"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domínio customizado (opcional)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN do certificado ACM (se usar domínio customizado)"
  type        = string
  default     = ""
}

variable "route53_hosted_zone_id" {
  description = "ID da Hosted Zone no Route 53 (se usar domínio customizado)"
  type        = string
  default     = ""
}

# Credenciais Safe2Pay (serão movidas para Secrets Manager)
variable "safe2pay_token" {
  description = "Token Safe2Pay"
  type        = string
  sensitive   = true
}

variable "safe2pay_secret_key" {
  description = "Secret Key Safe2Pay"
  type        = string
  sensitive   = true
}

# Credenciais Safeweb (serão movidas para Secrets Manager)
variable "safeweb_username" {
  description = "Username Safeweb"
  type        = string
  sensitive   = true
}

variable "safeweb_password" {
  description = "Password Safeweb"
  type        = string
  sensitive   = true
}

variable "safeweb_cnpj_ar" {
  description = "CNPJ AR Safeweb"
  type        = string
  sensitive   = true
}

variable "safeweb_codigo_parceiro" {
  description = "Código Parceiro Safeweb"
  type        = string
  sensitive   = true
}

variable "safeweb_produto_ecpf_a1" {
  description = "ID Produto e-CPF A1"
  type        = string
  default     = "37341"
}

variable "safeweb_produto_ecnpj_a1" {
  description = "ID Produto e-CNPJ A1"
  type        = string
  default     = "37342"
}
