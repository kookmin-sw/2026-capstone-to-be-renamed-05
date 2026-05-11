# AWS EC2 + S3 Deployment Runbook

This runbook deploys the static Next.js web app to S3, and runs the NestJS API,
Caddy, and PostgreSQL on one EC2 instance with Docker Compose.

## 1. AWS Resources

- EC2: Ubuntu or Amazon Linux instance with Docker, Docker Compose, AWS CLI, and
  an IAM instance profile.
- Security group: allow public inbound `80` and `443`; allow `22` only from your
  IP or use SSM; do not expose `3000`, `4000`, or `5432`.
- S3 web bucket: enable static website hosting and public read for the exported
  web files.
- S3 asset bucket: allow public `GetObject` only for `company-logos/*`.
- DNS: point the production domain to the EC2 Elastic IP.

Use `ap-northeast-2` unless there is a reason to keep all resources in another
region.

## 2. S3 Settings

Asset bucket CORS:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["https://accountit.example.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

Asset bucket public read policy for uploaded logos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadCompanyLogos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::accountit-assets/company-logos/*"
    }
  ]
}
```

If the policy is rejected, check bucket-level and account-level S3 Block Public
Access settings. For this MVP, public read is intentional only for logo objects.

## 3. EC2 Environment

Copy `deploy/production.env.example` to `.env.production` on EC2 and replace all
placeholder values.

Important production defaults:

```bash
APP_ENV=aws
NEXT_PUBLIC_APP_ENV=aws
ASSET_STORAGE_DRIVER=s3
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=/api
WEB_ORIGIN=https://accountit.example.com
ENABLE_SWAGGER=false
```

`DATABASE_URL` should point at the Compose Postgres hostname:

```bash
DATABASE_URL=postgresql://cpa:<password>@postgres:5432/cpa_jobs?schema=public
```

The EC2 IAM role should allow the API to presign and verify logo uploads:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:HeadObject"],
      "Resource": "arn:aws:s3:::accountit-assets/company-logos/*"
    }
  ]
}
```

## 4. Deploy

Build and upload the static web app:

```bash
set -a
source .env.production
set +a
npm run deploy:web:s3
```

Start or update EC2 services:

```bash
docker compose --env-file .env.production -f compose.prod.yml up -d --build
docker compose --env-file .env.production -f compose.prod.yml run --rm api npm run prisma:migrate:deploy
docker compose --env-file .env.production -f compose.prod.yml restart api
```

Check health:

```bash
curl -fsS https://accountit.example.com/api/healthz
docker compose --env-file .env.production -f compose.prod.yml ps
```

## 5. Backups

Because production PostgreSQL runs inside EC2 Docker, schedule at least one of
these before launch:

- Daily `npm run backup:postgres` via cron or systemd timer.
- Daily EBS volume snapshots.
- Optional S3 upload by setting `S3_BACKUP_BUCKET`.

Manual backup:

```bash
ENV_FILE=.env.production npm run backup:postgres
```

## 6. Smoke Test

- `https://accountit.example.com` loads the S3-hosted static web app.
- `https://accountit.example.com/api/healthz` returns `{ "ok": true }`.
- Login and logout set and clear the HTTP-only cookie over HTTPS.
- Job and company detail pages open as `/jobs/detail/?id=...` and
  `/companies/detail/?id=...`.
- Company logo upload completes: presign request, browser S3 `PUT`, complete
  request, and logo preview.
- `https://accountit.example.com/docs` is unavailable unless
  `ENABLE_SWAGGER=true`.
