variable "aws_region" {
  description = "AWS region used for the S3 buckets. CloudFront is global."
  type        = string
  default     = "us-east-1"
}

variable "name_prefix" {
  description = "Prefijo de las CloudFront Functions."
  type        = string
  default     = "hack-saltillo-ui"
}

variable "api_origin_domain" {
  description = "DNS del ALB de hack-saltillo-api (output api_url sin http://). CloudFront le manda /api/*."
  type        = string
  default     = "hack-saltillo-api-850670948.us-east-1.elb.amazonaws.com"
}

variable "github_repository" {
  description = "GitHub owner/repository allowed to assume the deployment role."
  type        = string
  default     = "AgustinReyesC/hack-saltillo-ui"
}
