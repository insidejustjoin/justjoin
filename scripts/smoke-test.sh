#!/bin/bash

set -e

SERVICE_URL=${1:-$(gcloud run services describe justjoin --region asia-northeast1 --format="value(status.url)")}

if [ -z "$SERVICE_URL" ]; then
  echo "❌ Cloud Run のサービスURLを取得できませんでした"
  exit 1
fi

echo "🔍 Smoke test: $SERVICE_URL"

pass=0; fail=0

test_endpoint() {
  local method=$1
  local path=$2
  local expected=${3:-200}
  local url="$SERVICE_URL$path"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url") || true
  if [ "$code" = "$expected" ]; then
    echo "✅ $method $path -> $code"
    pass=$((pass+1))
  else
    echo "⚠️  $method $path -> $code (expected $expected)"
    fail=$((fail+1))
  fi
}

# Health
test_endpoint GET /api/health 200

# Public-like endpoints (存在すれば200)
test_endpoint GET /sitemap.xml 200 || true
test_endpoint GET /robots.txt 200 || true

echo "\n🎯 Result: pass=$pass, fail=$fail"
if [ $fail -gt 0 ]; then
  exit 1
fi

exit 0


