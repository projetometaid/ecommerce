# ========================================
# API GATEWAY (HTTP API) - REST BACKEND
# ========================================

# HTTP API (mais barato e simples que REST API)
resource "aws_apigatewayv2_api" "api" {
  name          = local.api_gateway_name
  protocol_type = "HTTP"
  description   = "API Backend para ${var.project_name}"

  cors_configuration {
    allow_origins = ["*"] # Ajustar para domínio específico em produção
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Requested-With"]
    max_age       = 300
  }

  tags = local.common_tags
}

# Integração Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"

  integration_uri        = aws_lambda_function.api.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Rota: POST /api/pix/create
resource "aws_apigatewayv2_route" "pix_create" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/pix/create"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Rota: GET /api/pix/status/{id}
resource "aws_apigatewayv2_route" "pix_status" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/pix/status/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Rota: POST /api/safeweb/verificar-biometria
resource "aws_apigatewayv2_route" "safeweb_biometria" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/safeweb/verificar-biometria"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Rota: POST /api/safeweb/consultar-cpf
resource "aws_apigatewayv2_route" "safeweb_cpf" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/safeweb/consultar-cpf"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Rota: POST /api/safeweb/gerar-protocolo
resource "aws_apigatewayv2_route" "safeweb_protocolo" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/safeweb/gerar-protocolo"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Rota: GET /api/health
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Stage de produção
resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100  # Rate limiting
    throttling_rate_limit  = 50   # 50 req/s
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = local.common_tags
}

# CloudWatch Log Group para API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.api_gateway_name}"
  retention_in_days = 7

  tags = local.common_tags
}
