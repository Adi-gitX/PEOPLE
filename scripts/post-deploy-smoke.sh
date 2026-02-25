#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: BASE_URL=https://api.example.com [AUTH_TOKEN=...] $0"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

check() {
  local label="$1"
  local url="$2"
  local auth="${3:-false}"

  echo "==> ${label}"
  if [[ "$auth" == "true" ]]; then
    if [[ -z "$AUTH_TOKEN" ]]; then
      echo "    skipped (AUTH_TOKEN not provided)"
      return
    fi
    curl -fsS -H "Authorization: Bearer ${AUTH_TOKEN}" "${url}" >/dev/null
  else
    curl -fsS "${url}" >/dev/null
  fi
  echo "    ok"
}

echo "Running smoke checks against ${BASE_URL}"

check "API health" "${BASE_URL}/api/health"
check "Public missions" "${BASE_URL}/api/v1/missions"
check "Public contributors" "${BASE_URL}/api/v1/contributors/public"
check "Public FAQ page (client route if same host)" "${BASE_URL}/faq"

check "Current user profile" "${BASE_URL}/api/v1/users/me" true
check "My conversations" "${BASE_URL}/api/v1/conversations" true
check "Wallet summary" "${BASE_URL}/api/v1/wallet/summary" true

echo "Smoke checks completed."
