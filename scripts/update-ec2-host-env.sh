#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file does not exist: ${ENV_FILE}" >&2
  exit 1
fi

env_deploy_api_base_url="${DEPLOY_API_BASE_URL:-}"
env_deploy_api_port="${DEPLOY_API_PORT:-}"
env_deploy_api_scheme="${DEPLOY_API_SCHEME:-}"
env_deploy_extra_web_origins="${DEPLOY_EXTRA_WEB_ORIGINS:-}"
env_deploy_public_host="${DEPLOY_PUBLIC_HOST:-}"
env_s3_web_endpoint="${S3_WEB_ENDPOINT:-}"
env_port="${PORT:-}"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -n "${env_deploy_api_base_url}" ]]; then
  DEPLOY_API_BASE_URL="${env_deploy_api_base_url}"
fi
if [[ -n "${env_deploy_api_port}" ]]; then
  DEPLOY_API_PORT="${env_deploy_api_port}"
fi
if [[ -n "${env_deploy_api_scheme}" ]]; then
  DEPLOY_API_SCHEME="${env_deploy_api_scheme}"
fi
if [[ -n "${env_deploy_extra_web_origins}" ]]; then
  DEPLOY_EXTRA_WEB_ORIGINS="${env_deploy_extra_web_origins}"
fi
if [[ -n "${env_deploy_public_host}" ]]; then
  DEPLOY_PUBLIC_HOST="${env_deploy_public_host}"
fi
if [[ -n "${env_s3_web_endpoint}" ]]; then
  S3_WEB_ENDPOINT="${env_s3_web_endpoint}"
fi
if [[ -n "${env_port}" ]]; then
  PORT="${env_port}"
fi

get_ec2_public_ipv4() {
  local token
  token="$(
    curl --fail --silent --show-error --max-time 2 \
      --request PUT \
      --header "X-aws-ec2-metadata-token-ttl-seconds: 60" \
      "http://169.254.169.254/latest/api/token" 2>/dev/null || true
  )"

  if [[ -n "${token}" ]]; then
    curl --fail --silent --show-error --max-time 2 \
      --header "X-aws-ec2-metadata-token: ${token}" \
      "http://169.254.169.254/latest/meta-data/public-ipv4" 2>/dev/null || true
    return
  fi

  curl --fail --silent --show-error --max-time 2 \
    "http://169.254.169.254/latest/meta-data/public-ipv4" 2>/dev/null || true
}

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file
  tmp_file="$(mktemp)"

  awk -v key="${key}" -v value="${value}" '
    BEGIN { found = 0 }
    $0 ~ "^[[:space:]]*" key "=" {
      print key "=" value
      found = 1
      next
    }
    { print }
    END {
      if (!found) {
        print key "=" value
      }
    }
  ' "${ENV_FILE}" > "${tmp_file}"
  mv "${tmp_file}" "${ENV_FILE}"
}

api_base_url="${DEPLOY_API_BASE_URL:-}"
if [[ -z "${api_base_url}" ]]; then
  public_host="${DEPLOY_PUBLIC_HOST:-$(get_ec2_public_ipv4)}"
  if [[ -z "${public_host}" ]]; then
    echo "Could not resolve EC2 public host. Set DEPLOY_PUBLIC_HOST or DEPLOY_API_BASE_URL." >&2
    exit 1
  fi

  api_scheme="${DEPLOY_API_SCHEME:-http}"
  api_port="${DEPLOY_API_PORT:-${PORT:-8080}}"
  port_part=""
  if [[ -n "${api_port}" ]] &&
    [[ ! ( "${api_scheme}" == "http" && "${api_port}" == "80" ) ]] &&
    [[ ! ( "${api_scheme}" == "https" && "${api_port}" == "443" ) ]]; then
    port_part=":${api_port}"
  fi
  api_base_url="${api_scheme}://${public_host}${port_part}"
fi

set_env_value "API_PUBLIC_BASE_URL" "${api_base_url}"
set_env_value "NEXT_PUBLIC_API_BASE_URL" "${api_base_url}"

if [[ -n "${S3_WEB_ENDPOINT:-}" ]]; then
  web_origin="${S3_WEB_ENDPOINT}"
  if [[ -n "${DEPLOY_EXTRA_WEB_ORIGINS:-}" ]]; then
    web_origin="${web_origin},${DEPLOY_EXTRA_WEB_ORIGINS}"
  fi
  set_env_value "WEB_ORIGIN" "${web_origin}"
fi

echo "Updated API_PUBLIC_BASE_URL and NEXT_PUBLIC_API_BASE_URL to ${api_base_url}"
if [[ -n "${S3_WEB_ENDPOINT:-}" ]]; then
  echo "Updated WEB_ORIGIN to ${web_origin}"
fi
