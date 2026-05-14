#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${RUN_DIR:-${REPO_ROOT}/.run}"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
NODE_VERSION="${NODE_VERSION:-24}"
PID_FILE="${WEB_PID_FILE:-${RUN_DIR}/web.pid}"
LOG_FILE="${WEB_LOG_FILE:-${RUN_DIR}/web.log}"

mkdir -p "${RUN_DIR}"
cd "${REPO_ROOT}"

if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "${HOME}/.nvm/nvm.sh"
  nvm use --silent "${NODE_VERSION}" >/dev/null
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

WEB_STATIC_PORT="${WEB_STATIC_PORT:-${DEPLOY_WEB_PORT:-3000}}"

if [[ ! -f "apps/web/out/index.html" ]]; then
  echo "Static web output does not exist. Run npm run build:web:static first." >&2
  exit 1
fi

if [[ -f "${PID_FILE}" ]]; then
  old_pid="$(cat "${PID_FILE}")"
  if [[ -n "${old_pid}" ]] && kill -0 "${old_pid}" 2>/dev/null; then
    kill "${old_pid}" 2>/dev/null || true
    for _ in {1..20}; do
      if ! kill -0 "${old_pid}" 2>/dev/null; then
        break
      fi
      sleep 0.5
    done
    if kill -0 "${old_pid}" 2>/dev/null; then
      kill -9 "${old_pid}" 2>/dev/null || true
    fi
  fi
fi

nohup npx --yes serve@latest apps/web/out -l "tcp://0.0.0.0:${WEB_STATIC_PORT}" > "${LOG_FILE}" 2>&1 &
echo "$!" > "${PID_FILE}"
echo "Static web restarted on port ${WEB_STATIC_PORT} with PID $(cat "${PID_FILE}")"
