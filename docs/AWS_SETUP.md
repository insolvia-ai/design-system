# AWS & GitHub bootstrap

One-time setup so CI can deploy Insolvia to AWS with **no long-lived keys**.
Insolvia runs in its **own dedicated AWS account** (`521762924626`). Resources
are namespaced by the `insolvia` project + environment.

> **Status (2026-07-23): bootstrap is complete and deploys are live.**
> `insolvia.ai` is registered, Gandi delegates to Route53 hosted zone
> `Z01038711J6IZ68FD6ZDW`, the state bucket exists, `infra/envs/shared` is
> applied, and the `*.insolvia.ai` ACM certificate is `ISSUED`. What follows is
> the runbook for standing this up again in a fresh account. Work steps 1 → 6
> in order; **step 3 (importing the hosted zone, #13) is not optional** —
> skipping it breaks certificate validation in a way that is hard to diagnose.

## 0. Prerequisites
- AWS CLI configured with credentials that can create S3/IAM/Route53/ACM in the Insolvia account.
- `terraform` `>= 1.10` (native S3 state locking — `use_lockfile`), `tflint`.
- Admin access to the `insolvia-ai/insolvia` GitHub repo (to add secrets + branch protection).

### Running Terraform locally — export credentials first

**A working `aws` CLI is not enough for Terraform**, and the failure looks like
having no credentials at all:

```
Error: No valid credential sources found
Error: failed to refresh cached credentials, no EC2 IMDS role found, …
```

`aws sts get-caller-identity` succeeding while `terraform plan` says this is the
signature. The cause is that `~/.aws/config` authenticates with the newer
`login_session` (`aws login`) format, which is an **AWS CLI mechanism** —
Terraform's Go SDK does not implement it, finds nothing in the standard chain,
falls through to EC2 instance metadata, and times out.

Resolve the session into the env vars every SDK understands, in the same shell:

```bash
eval "$(aws configure export-credentials --format env)"
```

Use `eval` rather than running it bare: the output *is* the secret. The
credentials are short-lived, so re-run it when a session expires. This is the
same step `scripts/dev-aws-common.sh`'s `export_temporary_aws_credentials` does
for the per-developer AWS layer, hoisted here because manual applies (below)
need it too.

### The ci-trust anchor

`infra/envs/ci-trust` owns the GitHub OIDC provider, the
`insolvia-github-actions` deploy role, and that role's permissions policy. It is
**applied only by a human admin — never by CI — and that is the point.**

The deploy role's policy carries an explicit `Deny`
(`DenySelfPrivilegeEscalation`) on `iam:PutRolePolicy` targeting the role's own
ARN, and an explicit deny beats every allow. So a `terraform apply` of this root
run *as* the deploy role (i.e. from CI) cannot change the role's permissions —
it fails with `AccessDenied`. A privilege change to the pipeline therefore
*cannot* take effect from merged code alone; a human who already holds admin has
to apply it with their own credentials. That removes the "any PR that edits the
policy can grant CI admin, applied by CI" escalation path — code review would be
the only control otherwise.

Because CI never applies `ci-trust`, there is deliberately **no
`ci-trust-*.yml` workflow**. Everything else (`shared`, `staging`, `prod`) is
CI-applied as normal.

**To change the deploy role's permissions** — e.g. adding an IAM action the
pipeline needs — edit `infra/envs/ci-trust/main.tf`, merge, then apply locally:

```bash
scripts/apply-ci-trust.sh
```

That script does the credential dance (below), shows the plan, and applies after
you confirm. It should report a change to `aws_iam_role_policy.github_permissions`
and nothing else. (The bare commands, if you prefer: `eval "$(aws configure
export-credentials --format env)"` then `terraform -chdir=infra/envs/ci-trust
init -input=false && … plan && … apply`.)

Symptom that tells you a change needs this: a merged PR that edited the policy,
followed by a staging/prod deploy failing with `AccessDenied` on the new action.
That's not broken CI — it's the gate. Apply `ci-trust`, then re-run the deploy.

#### One-time migration from `shared` (extraction adoption)

The trust anchor was extracted from `infra/envs/shared` **in config only** — the
three live resources (OIDC provider, deploy role, its policy) still needed to be
moved between Terraform states, with AWS left untouched. That migration is
code-driven so it can't be forgotten (forgetting it is what turned
`Infra · Terraform apply · Shared` red — CI tried to destroy the still-in-state
resources and hit the deploy role's own self-deny):

- `infra/envs/shared/main.tf` has `removed { ... destroy = false }` blocks that
  make a CI apply of `shared` **forget** the three from its state (a state-only
  op needing no delete permission), rather than destroy them.
- `infra/envs/ci-trust/main.tf` has matching `import` blocks that **adopt** the
  live resources into ci-trust's state on the first apply, instead of trying to
  create them (they already exist).

To complete the migration once, in either order:

```bash
scripts/apply-ci-trust.sh          # imports the 3 resources, applies the policy
```

and let the next push to `main` run `Infra · Terraform apply · Shared` (or apply
it manually) to process the `removed` blocks. After both have run, the `removed`
and `import` blocks are inert no-ops — delete them in a follow-up PR.

## 1. Terraform state bucket — the first action in the entire plan
Every `backend.tf` in the repo points at this bucket, so `terraform init` cannot
run anywhere until it exists. Verified absent 2026-07-21.
```bash
aws s3api create-bucket --bucket insolvia-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket insolvia-terraform-state \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket insolvia-terraform-state \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-public-access-block --bucket insolvia-terraform-state \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```
State keys: `insolvia/{shared,staging,prod}/terraform.tfstate`.

## 2. GitHub OIDC provider (created by `ci-trust`)
The Insolvia account has no GitHub OIDC provider yet — so `infra/envs/ci-trust`
**creates** it (step 4). There is exactly one such provider per account.
Confirm it is absent before first apply (empty list is expected):
```bash
aws iam list-open-id-connect-providers
```
If you later consolidate into an account that already has the provider, switch
the `aws_iam_openid_connect_provider.github` resource back to a `data` source.

## 3. ⚠️ Import the existing hosted zone — BEFORE any apply on `shared`
The hosted zone for `insolvia.ai` (`Z01038711J6IZ68FD6ZDW`) already exists, holds
only its NS + SOA records, and is the zone Gandi delegates to — but it was
created outside Terraform, and with no state bucket there was never a state file.

`infra/envs/shared/main.tf` declares `resource "aws_route53_zone" "main"`. Applied
against empty state, that creates a **second** hosted zone for `insolvia.ai`.
Route53 permits duplicate zones and gives the new one different nameservers, so:

1. Gandi still delegates to the *original* zone — the Terraform-managed zone is
   authoritative for nothing.
2. ACM DNS-validation records land in the new, unreferenced zone, so validation
   never completes.
3. `aws_acm_certificate_validation` hangs until timeout and surfaces as a
   certificate error that points nowhere near the real cause.
4. You pay for both zones.

Import instead of recreating — this keeps Gandi's delegation valid, with no
registrar change:
```bash
cd infra/envs/shared
terraform init
terraform import aws_route53_zone.main Z01038711J6IZ68FD6ZDW
terraform plan   # MUST NOT propose creating a hosted zone
```
**Do not skip the plan check.** A plan that proposes creating an
`aws_route53_zone` means the import did not take — stop and fix it before
applying.

## 4. Apply the trust anchor, then shared infra

The OIDC provider + deploy role live in `infra/envs/ci-trust` (human-applied
only — see [§ The ci-trust anchor](#the-ci-trust-anchor)); the
zone + cert + SES live in `infra/envs/shared`. Apply ci-trust first, because
`shared` (and everything after) is applied *as* the deploy role ci-trust
creates.

```bash
terraform -chdir=infra/envs/ci-trust apply   # OIDC provider + insolvia-github-actions role
terraform -chdir=infra/envs/ci-trust output github_actions_role_arn
```

```bash
terraform -chdir=infra/envs/shared apply      # adopts the imported zone, creates the *.insolvia.ai cert + SES
```
Because delegation is already in place, DNS validation should resolve and the
certificate should reach `ISSUED` without any registrar work.

## 5. Wire the GitHub repo
```bash
# Deploy role ARN from step 4:
gh secret set AWS_ROLE_ARN --repo insolvia-ai/insolvia --body "arn:aws:iam::521762924626:role/insolvia-github-actions"
```
Repo lockdown (private, branch protection, environments) is documented in the
plan §2e and applied once `@insolvia-dev` has admin on the repo.

## 6. Confirm delegation and the certificate
`insolvia.ai` is registered and Gandi already points at the imported zone. Verify
the registrar's nameservers still match the zone Terraform now manages:
```bash
terraform -chdir=infra/envs/shared output route53_name_servers
dig +short NS insolvia.ai
```
Once those agree and the ACM cert reports `ISSUED`, the env pipelines work:
`staging` deploys automatically on merge to `main`; `prod` is dispatched
manually. (Before the cert issues, every env-level `terraform plan` fails —
each env looks the cert up with `statuses = ["ISSUED"]` — so there is nothing
to switch on; the ordering itself is the gate.)

## Order of operations
1 (state bucket) → 2 (confirm no OIDC provider) → **3 (import the hosted zone)**
→ 4 (apply `shared`) → 5 (secrets) → 6 (verify delegation + cert) →
apply `staging` / `prod` envs.
