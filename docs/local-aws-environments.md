# Local and AWS Environment Split

The app now has an explicit runtime switch:

```bash
APP_ENV=local # or aws
```

## Local

Use local PostgreSQL and local file uploads:

```bash
APP_ENV=local
NEXT_PUBLIC_APP_ENV=local
ASSET_STORAGE_DRIVER=local
RESUME_STORAGE_DRIVER=local
DATABASE_URL=postgresql://cpa:cpa@localhost:5432/cpa_jobs
LOCAL_DATABASE_SCHEMA=local
LOCAL_ASSET_DIR=apps/web/public/uploads
LOCAL_RESUME_DIR=var/uploads/resumes
LOCAL_ASSET_PUBLIC_BASE_URL=http://localhost:3000/uploads
API_PUBLIC_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

If `DATABASE_URL` or `LOCAL_DATABASE_URL` does not include `?schema=...`, the
API and Prisma commands append `LOCAL_DATABASE_SCHEMA`. Uploaded company logos
are written under `apps/web/public/uploads`, which is ignored by git and served
by the local Next.js dev server. Uploaded resumes are private and stored under
`LOCAL_RESUME_DIR`; they are downloaded only through authenticated API routes.

Typical local reset:

```bash
docker compose up -d
npm run prisma:migrate
npm run prisma:mock
npm run dev
```

## AWS

Use the production database and S3 uploads:

```bash
APP_ENV=aws
NEXT_PUBLIC_APP_ENV=aws
ASSET_STORAGE_DRIVER=s3
RESUME_STORAGE_DRIVER=s3
DATABASE_URL=postgresql://cpa:<password>@postgres:5432/cpa_jobs?schema=public
AWS_DATABASE_SCHEMA=public
AWS_REGION=ap-northeast-2
S3_ASSET_BUCKET=accountit-assets
S3_PUBLIC_BASE_URL=https://accountit-assets.s3.ap-northeast-2.amazonaws.com
S3_RESUME_BUCKET=accountit-resumes
S3_RESUME_KEY_PREFIX=resumes
NEXT_PUBLIC_API_BASE_URL=/api
```

When `APP_ENV=aws`, the API requires `DATABASE_URL` or `AWS_DATABASE_URL`, and
S3 asset and resume upload settings must be present.
