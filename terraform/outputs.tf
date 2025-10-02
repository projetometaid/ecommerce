# ====================================
# OUTPUTS - URLs E INFORMAÇÕES
# ====================================

output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "URL do CloudFront (Frontend)"
}

output "api_gateway_url" {
  value       = aws_apigatewayv2_api.api.api_endpoint
  description = "URL da API Gateway (Backend)"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "Nome do bucket S3 (Frontend)"
}

output "lambda_function_name" {
  value       = aws_lambda_function.api.function_name
  description = "Nome da função Lambda (Backend)"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "ID da distribuição CloudFront"
}

output "safe2pay_secret_name" {
  value       = aws_secretsmanager_secret.safe2pay.name
  description = "Nome do secret Safe2Pay no Secrets Manager"
}

output "safeweb_secret_name" {
  value       = aws_secretsmanager_secret.safeweb.name
  description = "Nome do secret Safeweb no Secrets Manager"
}

# Comando para fazer upload do frontend
output "upload_frontend_command" {
  value       = "aws s3 sync ../frontend s3://${aws_s3_bucket.frontend.id}/ --delete"
  description = "Comando para fazer upload do frontend para S3"
}

# Comando para invalidar cache do CloudFront
output "invalidate_cache_command" {
  value       = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend.id} --paths '/*'"
  description = "Comando para invalidar cache do CloudFront"
}
