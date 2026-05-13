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
env_deploy_auto_update_web_host="${DEPLOY_AUTO_UPDATE_WEB_HOST:-}"
env_deploy_web_base_url="${DEPLOY_WEB_BASE_URL:-}"
env_deploy_web_port="${DEPLOY_WEB_PORT:-}"
env_deploy_web_scheme="${DEPLOY_WEB_SCHEME:-}"
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
if [[ -n "${env_deploy_auto_update_web_host}" ]]; then
  DEPLOY_AUTO_UPDATE_WEB_HOST="${env_deploy_auto_update_web_host}"
fi
if [[ -n "${env_deploy_web_base_url}" ]]; then
  DEPLOY_WEB_BASE_URL="${env_deploy_web_base_url}"
fi
if [[ -n "${env_deploy_web_port}" ]]; then
  DEPLOY_WEB_PORT="${env_deploy_web_port}"
fi
if [[ -n "${env_deploy_web_scheme}" ]]; then
  DEPLOY_WEB_SCHEME="${env_deploy_web_scheme}"
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

normalize_bool() {
  printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'
}

is_truthy() {
  case "$(normalize_bool "$1")" in
    1 | true | yes | on) return 0 ;;
    *) return 1 ;;
  esac
}

is_falsey() {
  case "$(normalize_bool "$1")" in
    0 | false | no | off) return 0 ;;
    *) return 1 ;;
  esac
}

build_origin() {
  local scheme="$1"
  local host="$2"
  local port="$3"
  local port_part=""

  if [[ -n "${port}" ]] &&
    [[ ! ( "${scheme}" == "http" && "${port}" == "80" ) ]] &&
    [[ ! ( "${scheme}" == "https" && "${port}" == "443" ) ]]; then
    port_part=":${port}"
  fi

  printf '%s://%s%s' "${scheme}" "${host}" "${port_part}"
}

append_origin() {
  local origin="$1"

  origin="${origin#"${origin%%[![:space:]]*}"}"
  origin="${origin%"${origin##*[![:space:]]}"}"
  origin="${origin%/}"
  if [[ -z "${origin}" ]]; then
    return
  fi

  case ",${web_origin}," in
    *,"${origin}",*) return ;;
  esac

  if [[ -z "${web_origin}" ]]; then
    web_origin="${origin}"
  else
    web_origin="${web_origin},${origin}"
  fi
}

api_base_url="${DEPLOY_API_BASE_URL:-}"
auto_update_web_host="${DEPLOY_AUTO_UPDATE_WEB_HOST:-}"
if [[ -z "${auto_update_web_host}" ]]; then
  auto_update_web_host="false"
  if [[ -n "${S3_WEB_ENDPOINT:-}" ]] && is_falsey "${AUTH_COOKIE_SECURE:-}"; then
    auto_update_web_host="true"
  fi
fi

public_host="${DEPLOY_PUBLIC_HOST:-}"
if [[ -z "${api_base_url}" || -n "${DEPLOY_WEB_BASE_URL:-}" ]] ||
  is_truthy "${auto_update_web_host}"; then
  public_host="${public_host:-$(get_ec2_public_ipv4)}"
fi

if [[ -z "${api_base_url}" ]]; then
  if [[ -z "${public_host}" ]]; then
    echo "Could not resolve EC2 public host. Set DEPLOY_PUBLIC_HOST or DEPLOY_API_BASE_URL." >&2
    exit 1
  fi

  api_scheme="${DEPLOY_API_SCHEME:-http}"
  api_port="${DEPLOY_API_PORT:-${PORT:-8080}}"
  api_base_url="$(build_origin "${api_scheme}" "${public_host}" "${api_port}")"
fi

set_env_value "API_PUBLIC_BASE_URL" "${api_base_url}"
set_env_value "NEXT_PUBLIC_API_BASE_URL" "${api_base_url}"

canonical_web_origin="${NEXT_PUBLIC_CANONICAL_WEB_ORIGIN:-}"
if [[ -n "${DEPLOY_WEB_BASE_URL:-}" ]]; then
  canonical_web_origin="${DEPLOY_WEB_BASE_URL%/}"
elif is_truthy "${auto_update_web_host}"; then
  if [[ -z "${public_host}" ]]; then
    echo "Could not resolve EC2 public host. Set DEPLOY_PUBLIC_HOST or DEPLOY_WEB_BASE_URL." >&2
    exit 1
  fi
  web_scheme="${DEPLOY_WEB_SCHEME:-${DEPLOY_API_SCHEME:-http}}"
  web_port="${DEPLOY_WEB_PORT:-3000}"
  canonical_web_origin="$(build_origin "${web_scheme}" "${public_host}" "${web_port}")"
fi

if [[ -n "${canonical_web_origin}" ]]; then
  set_env_value "NEXT_PUBLIC_CANONICAL_WEB_ORIGIN" "${canonical_web_origin}"
fi

if [[ -n "${S3_WEB_ENDPOINT:-}" ]]; then
  web_origin=""
  append_origin "${S3_WEB_ENDPOINT}"
  append_origin "${canonical_web_origin}"
  if [[ -n "${DEPLOY_EXTRA_WEB_ORIGINS:-}" ]]; then
    IFS=',' read -ra extra_web_origins <<< "${DEPLOY_EXTRA_WEB_ORIGINS}"
    for extra_web_origin in "${extra_web_origins[@]}"; do
      append_origin "${extra_web_origin}"
    done
  fi
  set_env_value "WEB_ORIGIN" "${web_origin}"
fi

echo "Updated API_PUBLIC_BASE_URL and NEXT_PUBLIC_API_BASE_URL to ${api_base_url}"
if [[ -n "${canonical_web_origin}" ]]; then
  echo "Updated NEXT_PUBLIC_CANONICAL_WEB_ORIGIN to ${canonical_web_origin}"
fi
if [[ -n "${S3_WEB_ENDPOINT:-}" ]]; then
  echo "Updated WEB_ORIGIN to ${web_origin}"
fi
