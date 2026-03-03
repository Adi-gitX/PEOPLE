#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
CLIENT_BASE_URL="${CLIENT_BASE_URL:-}"

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

check_status() {
  local label="$1"
  local url="$2"
  local expected_csv="$3"
  local method="${4:-GET}"
  local body="${5:-}"
  local auth="${6:-false}"

  echo "==> ${label}"

  local status
  local -a curl_args
  curl_args=(-sS -o /dev/null -w "%{http_code}" -X "$method")

  if [[ "$auth" == "true" && -n "$AUTH_TOKEN" ]]; then
    curl_args+=(-H "Authorization: Bearer ${AUTH_TOKEN}")
  fi

  if [[ -n "$body" ]]; then
    curl_args+=(-H "Content-Type: application/json" -d "$body")
  fi

  status=$(curl "${curl_args[@]}" "${url}")

  IFS=',' read -r -a expected <<< "$expected_csv"
  for code in "${expected[@]}"; do
    if [[ "$status" == "$code" ]]; then
      echo "    ok (HTTP ${status})"
      return
    fi
  done

  echo "    failed (HTTP ${status}, expected: ${expected_csv})"
  exit 1
}

echo "Running smoke checks against ${BASE_URL}"

check "API health" "${BASE_URL}/api/health"
check "Public missions" "${BASE_URL}/api/v1/missions"
check "Public contributors" "${BASE_URL}/api/v1/contributors/public"
check "Public user search" "${BASE_URL}/api/v1/search/users?role=contributor&limit=5"

if [[ -n "$CLIENT_BASE_URL" ]]; then
  CLIENT_BASE_URL="${CLIENT_BASE_URL%/}"
  check "Public FAQ page" "${CLIENT_BASE_URL}/faq"
else
  echo "==> Public FAQ page"
  echo "    skipped (set CLIENT_BASE_URL to verify client routes)"
fi

check_status \
  "Public support ticket create" \
  "${BASE_URL}/api/v1/support/tickets" \
  "200,202" \
  "POST" \
  '{"name":"Smoke Test","email":"smoke@example.com","subject":"Smoke check","message":"This is a smoke test message for support reliability.","source":"post_deploy_smoke"}'

check_status \
  "Admin support list requires auth" \
  "${BASE_URL}/api/v1/admin/support/tickets" \
  "401,403"

check_status \
  "Support alias contact endpoint" \
  "${BASE_URL}/api/v1/contact" \
  "200,202" \
  "POST" \
  '{"name":"Smoke Contact","email":"smoke-contact@example.com","subject":"Contact alias check","message":"This message validates the /api/v1/contact alias endpoint.","source":"post_deploy_smoke"}'

check "Current user profile" "${BASE_URL}/api/v1/users/me" true
check "Role capabilities" "${BASE_URL}/api/v1/users/me/role-capabilities" true
check_status \
  "Active role endpoint exists (auth required)" \
  "${BASE_URL}/api/v1/users/me/active-role" \
  "401,403" \
  "PATCH" \
  '{"role":"contributor"}'
check_status \
  "Admin scope summary endpoint reachable" \
  "${BASE_URL}/api/v1/admin/me/scopes" \
  "200,401,403" \
  "GET" \
  "" \
  "true"
check "My conversations" "${BASE_URL}/api/v1/conversations" true
check "Wallet summary" "${BASE_URL}/api/v1/wallet/summary" true

if [[ -n "$AUTH_TOKEN" ]]; then
  check_status \
    "Internal support outbox process endpoint reachable (admin auth required)" \
    "${BASE_URL}/api/v1/internal/support/outbox/process" \
    "200,403" \
    "POST" \
    '{"limit":1}' \
    "true"
fi

echo "Smoke checks completed."
