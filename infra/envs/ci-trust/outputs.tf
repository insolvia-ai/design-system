output "github_actions_role_arn" {
  description = "Set this as the AWS_ROLE_ARN GitHub secret. (Unchanged by the extraction from `shared` — the role keeps its name and ARN.)"
  value       = aws_iam_role.github_actions.arn
}

output "github_oidc_provider_arn" {
  description = "ARN of the account's GitHub OIDC provider."
  value       = aws_iam_openid_connect_provider.github.arn
}
