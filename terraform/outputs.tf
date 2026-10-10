output "role_arn" {
  description = "Set as the GitHub Actions secret role_arn."
  value       = aws_iam_role.github_deploy.arn
}

output "tf_bucket_name" {
  description = "Set as the GitHub Actions secret tf_bucket_name."
  value       = aws_s3_bucket.tfstate.bucket
}

output "site_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.site.domain_name}"
}
