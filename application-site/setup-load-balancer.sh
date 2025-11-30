#!/bin/bash

# GCP Cloud Load Balancer + Cloud CDN セットアップスクリプト
# justjoin.jp用の静的サイトホスティング

set -e

echo "🚀 Cloud Load Balancer + Cloud CDN セットアップを開始します..."
echo "🌐 ターゲットドメイン: justjoin.jp"

# プロジェクトIDの確認
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
  echo "❌ プロジェクトIDが設定されていません"
  echo "🔧 以下のコマンドで設定してください:"
  echo "   gcloud config set project justjoin-platform"
  exit 1
fi

echo "📋 プロジェクトID: $PROJECT_ID"

# バケット名
BUCKET_NAME="justjoin-static-site"
BUCKET_URL="gs://${BUCKET_NAME}"
BACKEND_BUCKET_NAME="justjoin-static-backend"
LOAD_BALANCER_NAME="justjoin-static-lb"
URL_MAP_NAME="justjoin-static-url-map"
TARGET_HTTP_PROXY_NAME="justjoin-static-http-proxy"
FORWARDING_RULE_NAME="justjoin-static-forwarding-rule"

# リージョン
REGION="asia-northeast1"

echo ""
echo "📦 ステップ1: バックエンドバケットの作成..."
if gcloud compute backend-buckets describe "${BACKEND_BUCKET_NAME}" --global &>/dev/null; then
  echo "✅ バックエンドバケットは既に存在します"
else
  echo "📦 バックエンドバケットを作成中..."
  gcloud compute backend-buckets create "${BACKEND_BUCKET_NAME}" \
    --gcs-bucket-name="${BUCKET_NAME}" \
    --global
  echo "✅ バックエンドバケットを作成しました"
fi

echo ""
echo "🌐 ステップ2: URLマップの作成..."
if gcloud compute url-maps describe "${URL_MAP_NAME}" --global &>/dev/null; then
  echo "✅ URLマップは既に存在します"
  echo "🔄 URLマップを更新中..."
  gcloud compute url-maps set-default-service "${URL_MAP_NAME}" \
    --default-backend-bucket="${BACKEND_BUCKET_NAME}" \
    --global
else
  echo "📦 URLマップを作成中..."
  gcloud compute url-maps create "${URL_MAP_NAME}" \
    --default-backend-bucket="${BACKEND_BUCKET_NAME}" \
    --global
  echo "✅ URLマップを作成しました"
fi

echo ""
echo "🔒 ステップ3: HTTPプロキシの作成..."
if gcloud compute target-http-proxies describe "${TARGET_HTTP_PROXY_NAME}" --global &>/dev/null; then
  echo "✅ HTTPプロキシは既に存在します"
else
  echo "📦 HTTPプロキシを作成中..."
  gcloud compute target-http-proxies create "${TARGET_HTTP_PROXY_NAME}" \
    --url-map="${URL_MAP_NAME}" \
    --global
  echo "✅ HTTPプロキシを作成しました"
fi

echo ""
echo "🌍 ステップ4: グローバル転送ルールの作成..."
if gcloud compute forwarding-rules describe "${FORWARDING_RULE_NAME}" --global &>/dev/null; then
  echo "✅ 転送ルールは既に存在します"
  EXISTING_IP=$(gcloud compute forwarding-rules describe "${FORWARDING_RULE_NAME}" --global --format="value(IPAddress)")
  echo "📊 現在のIPアドレス: ${EXISTING_IP}"
else
  echo "📦 転送ルールを作成中..."
  gcloud compute forwarding-rules create "${FORWARDING_RULE_NAME}" \
    --target-http-proxy="${TARGET_HTTP_PROXY_NAME}" \
    --ports=80 \
    --global
  echo "✅ 転送ルールを作成しました"
  
  echo "⏳ IPアドレスが割り当てられるまで待機中..."
  sleep 10
  
  EXISTING_IP=$(gcloud compute forwarding-rules describe "${FORWARDING_RULE_NAME}" --global --format="value(IPAddress)")
  echo "📊 割り当てられたIPアドレス: ${EXISTING_IP}"
fi

echo ""
echo "⚡ ステップ5: Cloud CDNの有効化..."
gcloud compute url-maps add-path-matcher "${URL_MAP_NAME}" \
  --default-backend-bucket="${BACKEND_BUCKET_NAME}" \
  --path-matcher-name="cdn-matcher" \
  --global 2>/dev/null || echo "ℹ️  パスマッチャーは既に設定済みです"

# CDNキャッシュの無効化（必要に応じて）
echo ""
echo "🔄 ステップ6: CDNキャッシュの無効化（初回デプロイ時）..."
read -p "CDNキャッシュを無効化しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  gcloud compute url-maps invalidate-cdn-cache "${URL_MAP_NAME}" \
    --path="/*" \
    --global || echo "⚠️  キャッシュ無効化に失敗しました（手動で実行してください）"
fi

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo "1. DNS設定で 'justjoin.jp' のAレコードを以下のIPアドレスに設定してください:"
EXISTING_IP=$(gcloud compute forwarding-rules describe "${FORWARDING_RULE_NAME}" --global --format="value(IPAddress)" 2>/dev/null || echo "IPアドレスを取得中...")
echo "   IPアドレス: ${EXISTING_IP}"
echo ""
echo "2. HTTPS対応が必要な場合は、SSL証明書を設定してください:"
echo "   gcloud compute ssl-certificates create justjoin-ssl-cert \\"
echo "     --domains=justjoin.jp,www.justjoin.jp \\"
echo "     --global"
echo ""
echo "3. HTTPS転送ルールを作成してください:"
echo "   gcloud compute target-https-proxies create justjoin-static-https-proxy \\"
echo "     --url-map=${URL_MAP_NAME} \\"
echo "     --ssl-certificates=justjoin-ssl-cert \\"
echo "     --global"
echo ""
echo "🌐 サイトURL: http://justjoin.jp (DNS設定後)"
echo "📊 バケット: ${BUCKET_URL}"
echo "📊 バックエンドバケット: ${BACKEND_BUCKET_NAME}"

