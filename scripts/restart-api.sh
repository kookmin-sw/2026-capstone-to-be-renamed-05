#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${RUN_DIR:-${REPO_ROOT}/.run}"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
NODE_VERSION="${NODE_VERSION:-24}"
PID_FILE="${API_PID_FILE:-${RUN_DIR}/api.pid}"
LOG_FILE="${API_LOG_FILE:-${RUN_DIR}/api.log}"

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

nohup npm run start:prod --workspace @cpa/api > "${LOG_FILE}" 2>&1 &
echo "$!" > "${PID_FILE}"
echo "API restarted with PID $(cat "${PID_FILE}")"
