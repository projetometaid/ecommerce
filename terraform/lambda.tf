# ===================================
# AWS LAMBDA - BACKEND API (PYTHON)
# ===================================

# IAM Role para Lambda
resource "aws_iam_role" "lambda_api" {
  name = "${local.lambda_name_api}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Policy para logs do CloudWatch
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy customizada para Secrets Manager
resource "aws_iam_policy" "lambda_secrets" {
  name        = "${local.lambda_name_api}-secrets-policy"
  description = "Permite Lambda acessar Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.safe2pay.arn,
          aws_secretsmanager_secret.safeweb.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = aws_iam_policy.lambda_secrets.arn
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_api" {
  name              = "/aws/lambda/${local.lambda_name_api}"
  retention_in_days = 7 # Reduzir custos

  tags = local.common_tags
}

# Lambda Layer para dependências Python
resource "aws_lambda_layer_version" "python_dependencies" {
  filename            = "../lambda/layers/python-deps.zip"
  layer_name          = "${var.project_name}-python-deps"
  compatible_runtimes = ["python3.12"]
  description         = "Dependências: requests, python-dotenv"

  # Este layer será criado pelo script build.sh
}

# Lambda Function
resource "aws_lambda_function" "api" {
  filename         = "../lambda/function.zip"
  function_name    = local.lambda_name_api
  role            = aws_iam_role.lambda_api.arn
  handler         = "lambda_handler.handler"
  source_code_hash = filebase64sha256("../lambda/function.zip")
  runtime         = "python3.12"
  timeout         = 30
  memory_size     = 512

  layers = [
    aws_lambda_layer_version.python_dependencies.arn
  ]

  environment {
    variables = {
      SAFE2PAY_SECRET_ARN         = aws_secretsmanager_secret.safe2pay.arn
      SAFEWEB_SECRET_ARN          = aws_secretsmanager_secret.safeweb.arn
      SAFEWEB_HOPE_API_URL        = "https://pss.safewebpss.com.br/Service/Microservice/Hope/Shared/api/integration/solicitation"
      SAFEWEB_ATTENDANCE_PLACE_ID = "348"
      ENVIRONMENT                 = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name = "API Backend Lambda"
  })

  # Dependências
  depends_on = [
    aws_cloudwatch_log_group.lambda_api,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_secrets
  ]
}

# Lambda Permission para API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
