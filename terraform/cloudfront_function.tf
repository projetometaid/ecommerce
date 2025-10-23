# =======================================
# CLOUDFRONT FUNCTION - URL Rewrite
# =======================================

resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${var.project_name}-url-rewrite-${var.environment}"
  runtime = "cloudfront-js-1.0"
  comment = "Adiciona /index.html para URLs de diretórios"
  publish = true
  code    = file("${path.module}/cloudfront_function_url_rewrite.js")
}
