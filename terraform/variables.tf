variable "aws_region" {
  description = "AWS region used for the S3 buckets. CloudFront is global."
  type        = string
  default     = "us-east-1"
}

variable "github_repository" {
  description = "GitHub owner/repository allowed to assume the deployment role."
  type        = string
  default     = "AgustinReyesC/hack-saltillo-ui"
}
