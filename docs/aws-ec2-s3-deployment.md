# AWS EC2 + S3 Deployment Runbook

This runbook deploys the static Next.js web app to S3, and runs the NestJS API
and PostgreSQL from one EC2 instance. The `develop` branch can be deployed by
GitHub Actions calling the EC2 API once.

## 1. AWS Resources

- EC2: Ubuntu or Amazon Linux instance with Docker, Docker Compose, AWS CLI, and
  an IAM instance profile.
- Security group: allow public inbound `80` and `443`; allow `22` only from your
  IP or use SSM; do not expose `3000`, `4000`, or `5432`.
- S3 web bucket: enable static website hosting and public read for the exported
  web files. The same bucket may also be used for assets and resumes if object
  prefixes are kept separate.
- S3 asset prefix: allow public `GetObject` for `company-logos/*` and
  `company-backgrounds/*`.
- S3 resume prefix: keep `resumes/*` private; only the API role should read or
  delete these objects.
- DNS: point the API domain to the EC2 Elastic IP. The web entry point may be
  the S3 website endpoint directly for the MVP.

Use `ap-northeast-2` unless there is a reason to keep all resources in another
region.

## 2. S3 Settings

Bucket CORS:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://accountit-web.s3-website.ap-northeast-2.amazonaws.com"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

Single-bucket public read policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadExceptPrivateResumes",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "NotResource": "arn:aws:s3:::accountit-web/resumes/*"
    }
  ]
}
```

Replace `accountit-web` with the shared bucket name.

If the policy is rejected, check bucket-level and account-level S3 Block Public
Access settings. For this MVP, public read is intentional for the static web
export and company image objects, while `resumes/*` must remain private. If you
use separate buckets, replace the policy with a narrower `Resource` list for the
web and asset buckets.

## 3. EC2 Environment

Copy `deploy/production.env.example` to `.env.production` on EC2 and replace all
placeholder values.

Important production defaults:

```bash
APP_ENV=aws
NEXT_PUBLIC_APP_ENV=aws
ASSET_STORAGE_DRIVER=s3
RESUME_STORAGE_DRIVER=s3
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.accountit.example.com
WEB_ORIGIN=http://accountit-web.s3-website.ap-northeast-2.amazonaws.com
ENABLE_SWAGGER=false
DEPLOY_BRANCH=develop
DEPLOY_AUTO_UPDATE_EC2_HOST=true
```

`DATABASE_URL` should point at the Compose Postgres hostname:

```bash
DATABASE_URL=postgresql://cpa:<password>@postgres:5432/cpa_jobs?schema=public
```

The EC2 IAM role should allow the API to presign and verify company image
uploads, and to store private resumes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:HeadObject"],
      "Resource": [
        "arn:aws:s3:::accountit-assets/company-logos/*",
        "arn:aws:s3:::accountit-assets/company-backgrounds/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::accountit-resumes/resumes/*"
    }
  ]
}
```

When one bucket is shared by all S3 features, set `S3_WEB_BUCKET`,
`S3_ASSET_BUCKET`, and `S3_RESUME_BUCKET` to the same bucket name. The web deploy
script preserves `company-logos/`, `company-backgrounds/`, `resumes/`,
`postgres/`, `backups/`, and `out/` by default while using `--delete` for stale
web files. It then uploads the static mock company image folders without
`--delete`, so uploaded company images under the same prefixes are not removed.
Override `S3_WEB_PROTECTED_PREFIXES` only if your bucket layout changes.

## 4. GitHub Actions Deploy

`develop` pushes trigger `.github/workflows/deploy-develop.yml`. The workflow
does not need AWS credentials. It calls the EC2 API and EC2 uses its own IAM
role and local AWS CLI to sync S3.

Set these GitHub repository secrets:

```bash
DEPLOY_API_URL=https://api.accountit.example.com
DEPLOY_API_TOKEN=<same value as EC2 DEPLOY_API_TOKEN>
```

The API endpoint is:

```http
POST /ops/deploy
Authorization: Bearer $DEPLOY_API_TOKEN
Content-Type: application/json

{
  "ref": "refs/heads/develop",
  "sha": "<github.sha>",
  "actor": "<github.actor>",
  "runId": "<github.run_id>"
}
```

EC2 runs `scripts/deploy-ec2.sh`, which uses `.run/deploy.lock` and
`.run/deploy.log`, hard resets the deploy worktree to `origin/develop`, installs
dependencies, deploys Prisma migrations, builds the API, builds and syncs the
static web app to S3, then schedules the API restart. The existing EC2 `:3000`
static web serve process is not restarted because S3 is the operating web host.

The deploy worktree is treated as disposable. Do not keep uncommitted production
edits in that checkout.

Because this MVP uses the S3 website endpoint directly, the web origin is HTTP
and not CloudFront HTTPS. Login and cookie behavior can vary by browser privacy
settings when the API is on `https://api.<domain>` and the web app is on the S3
website host. Use CloudFront and a first-party web domain when stable cookie
auth is required.

When `DEPLOY_AUTO_UPDATE_EC2_HOST=true`, the EC2 deploy calls
`scripts/update-ec2-host-env.sh` during S3 deployment. It reads the current EC2
public IPv4 from instance metadata, then rewrites `API_PUBLIC_BASE_URL` and
`NEXT_PUBLIC_API_BASE_URL` before the static web build. Set `DEPLOY_API_PORT` if
the public API port differs from `PORT`, or set `DEPLOY_PUBLIC_HOST`/
`DEPLOY_API_BASE_URL` to override metadata detection. `DEPLOY_API_URL` remains a
GitHub secret and is not changed by EC2.

## 5. Manual Deploy

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

For the current EC2 `nohup` process style, the same API restart command used by
automation is available as:

```bash
ENV_FILE=.env NODE_VERSION=24 bash scripts/restart-api.sh
```

Check health:

```bash
curl -fsS https://api.accountit.example.com/healthz
docker compose --env-file .env.production -f compose.prod.yml ps
```

## 6. Backups

Because production PostgreSQL runs inside EC2 Docker, schedule at least one of
these before launch:

- Daily `npm run backup:postgres` via cron or systemd timer.
- Daily EBS volume snapshots.
- Optional S3 upload by setting `S3_BACKUP_BUCKET`.

Manual backup:

```bash
ENV_FILE=.env.production npm run backup:postgres
```

## 7. Smoke Test

- The S3 website endpoint loads the static web app.
- `https://api.accountit.example.com/healthz` returns `{ "ok": true }`.
- Login and logout reach the API over HTTPS; cookie persistence may vary while
  the web app is served from the HTTP S3 website endpoint.
- Job and company detail pages open as `/jobs/detail/?id=...` and
  `/companies/detail/?id=...`.
- Company logo upload completes: presign request, browser S3 `PUT`, complete
  request, and logo preview.
- `https://accountit.example.com/docs` is unavailable unless
  `ENABLE_SWAGGER=true`.
- Direct S3 access to `resumes/*` still returns `403`.
