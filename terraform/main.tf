terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # Backend S3 para estado do Terraform (opcional, descomentar após criar bucket)
  # backend "s3" {
  #   bucket = "ecommerce-certificado-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Provider adicional para ACM (Certificate Manager) - deve ser us-east-1 para CloudFront
provider "aws" {
  alias  = "virginia"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data source para account ID
data "aws_caller_identity" "current" {}

# Locals
locals {
  bucket_name_frontend = "${var.project_name}-frontend-${var.environment}"
  lambda_name_api      = "${var.project_name}-api-${var.environment}"
  api_gateway_name     = "${var.project_name}-api-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
