#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"

if [[ "${S3_DEPLOY_UPDATE_EC2_HOST:-0}" == "1" ||
  "${S3_DEPLOY_UPDATE_EC2_HOST:-false}" == "true" ]]; then
  ENV_FILE="${ENV_FILE}" bash "${REPO_ROOT}/scripts/update-ec2-host-env.sh"
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

: "${S3_WEB_BUCKET:?Set S3_WEB_BUCKET to the static website bucket name.}"
: "${AWS_REGION:?Set AWS_REGION to the bucket region.}"

npm run build:web:static

protected_prefix_args=()
# Keep non-web objects safe when one bucket is shared by static hosting,
# public company images, private resumes, and optional backups.
IFS=',' read -ra protected_prefixes <<< "${S3_WEB_PROTECTED_PREFIXES:-company-logos,company-backgrounds,resumes,postgres,backups,out}"
for protected_prefix in "${protected_prefixes[@]}"; do
  protected_prefix="${protected_prefix#"${protected_prefix%%[![:space:]]*}"}"
  protected_prefix="${protected_prefix%"${protected_prefix##*[![:space:]]}"}"
  protected_prefix="${protected_prefix#/}"
  protected_prefix="${protected_prefix%/}"
  if [[ -n "${protected_prefix}" ]]; then
    protected_prefix_args+=(--exclude "${protected_prefix}/*")
  fi
done

aws s3 sync apps/web/out/_next/static "s3://${S3_WEB_BUCKET}/_next/static" \
  --delete \
  --region "${AWS_REGION}" \
  --cache-control "public,max-age=31536000,immutable"

aws s3 sync apps/web/out "s3://${S3_WEB_BUCKET}" \
  --delete \
  --region "${AWS_REGION}" \
  --exclude "_next/static/*" \
  "${protected_prefix_args[@]}" \
  --cache-control "public,max-age=60"

for static_asset_prefix in company-logos company-backgrounds; do
  if [[ -d "apps/web/out/${static_asset_prefix}" ]]; then
    aws s3 sync "apps/web/out/${static_asset_prefix}" "s3://${S3_WEB_BUCKET}/${static_asset_prefix}" \
      --region "${AWS_REGION}" \
      --cache-control "public,max-age=31536000,immutable"
  fi
done
