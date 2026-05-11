#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${RUN_DIR:-${REPO_ROOT}/.run}"
LOG_FILE="${DEPLOY_LOG_FILE:-${RUN_DIR}/deploy.log}"
LOCK_FILE="${DEPLOY_LOCK_FILE:-${RUN_DIR}/deploy.lock}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-develop}"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
NODE_VERSION="${NODE_VERSION:-24}"
RESTART_DELAY_SECONDS="${DEPLOY_RESTART_DELAY_SECONDS:-2}"

mkdir -p "${RUN_DIR}" "$(dirname "${LOG_FILE}")" "$(dirname "${LOCK_FILE}")"

if [[ "${DEPLOY_SCRIPT_REEXECUTED:-0}" != "1" ]]; then
  active_script="${RUN_DIR}/deploy-ec2.active.sh"
  cp "${BASH_SOURCE[0]}" "${active_script}"
  chmod +x "${active_script}"
  DEPLOY_SCRIPT_REEXECUTED=1 exec bash "${active_script}"
fi

exec > >(tee -a "${LOG_FILE}") 2>&1

if ! mkdir "${LOCK_FILE}" 2>/dev/null; then
  echo "A deployment is already running: ${LOCK_FILE}"
  exit 75
fi

cleanup() {
  rm -rf "${LOCK_FILE}"
}
trap cleanup EXIT

echo "==> Deploy started at $(date -Is)"
echo "    branch: ${DEPLOY_BRANCH}"
echo "    sha: ${DEPLOY_TARGET_SHA:-unknown}"
echo "    actor: ${DEPLOY_GITHUB_ACTOR:-unknown}"
echo "    run: ${DEPLOY_GITHUB_RUN_ID:-unknown}"

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

echo "==> Updating working tree"
git fetch origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

echo "==> Installing dependencies"
npm ci

echo "==> Applying Prisma migrations"
npm run prisma:generate
npm run prisma:migrate:deploy

echo "==> Building API"
npm run build --workspace @cpa/api

echo "==> Building and syncing static web to S3"
S3_DEPLOY_UPDATE_EC2_HOST="${DEPLOY_AUTO_UPDATE_EC2_HOST:-true}" \
  ENV_FILE="${ENV_FILE}" \
  npm run deploy:web:s3

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ "${DEPLOY_DEFER_API_RESTART:-0}" == "1" ]]; then
  echo "==> Scheduling API restart in ${RESTART_DELAY_SECONDS}s"
  nohup bash -c '
    set -euo pipefail
    sleep "$1"
    cd "$2"
    ENV_FILE="$3" NODE_VERSION="$4" bash scripts/restart-api.sh
  ' restart-api \
    "${RESTART_DELAY_SECONDS}" \
    "${REPO_ROOT}" \
    "${ENV_FILE}" \
    "${NODE_VERSION}" >> "${RUN_DIR}/restart-api.log" 2>&1 &
else
  echo "==> Restarting API"
  ENV_FILE="${ENV_FILE}" \
    NODE_VERSION="${NODE_VERSION}" \
    bash scripts/restart-api.sh
fi

echo "==> Deploy finished at $(date -Is)"
