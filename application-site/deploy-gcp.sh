#!/bin/bash

# GCP静的ホスティングデプロイスクリプト - justjoin.jp用
# Cloud Storage + Cloud Load Balancer + Cloud CDNを使用

set -e

echo "🚀 GCP静的ホスティングデプロイを開始します..."
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

# ビルド
echo "📦 ビルド中..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ distフォルダが見つかりません"
  exit 1
fi

# バケット名とLoad Balancer設定
BUCKET_NAME="justjoin-static-site"
BUCKET_URL="gs://${BUCKET_NAME}"
BACKEND_BUCKET_NAME="justjoin-static-backend"
URL_MAP_NAME="justjoin-static-url-map"

# バケットの存在確認と作成
echo "🪣 バケット確認中..."
if ! gsutil ls -b "${BUCKET_URL}" &>/dev/null; then
  echo "📦 バケットを作成中..."
  gsutil mb -p "${PROJECT_ID}" -c STANDARD -l asia-northeast1 "${BUCKET_URL}"
  
  # バケットを公開設定
  echo "🔓 バケットを公開設定中..."
  gsutil iam ch allUsers:objectViewer "${BUCKET_URL}"
  gsutil web set -m index.html -e index.html "${BUCKET_URL}"
else
  echo "✅ バケットは既に存在します"
fi

# ファイルをアップロード
echo "📤 ファイルをアップロード中..."
# faviconを確実にコピー
cp public/favicon.svg dist/ 2>/dev/null || true
gsutil -m rsync -r -d dist/ "${BUCKET_URL}/"

# Cloud Load Balancerのバックエンドバケット設定
echo "🌐 Cloud Load Balancerの設定を確認中..."
if gcloud compute backend-buckets describe "${BACKEND_BUCKET_NAME}" --global &>/dev/null; then
  echo "✅ バックエンドバケットは既に存在します"
else
  echo "📦 バックエンドバケットを作成中..."
  gcloud compute backend-buckets create "${BACKEND_BUCKET_NAME}" \
    --gcs-bucket-name="${BUCKET_NAME}" 2>/dev/null || echo "⚠️  バックエンドバケットの作成に失敗しました（既に存在する可能性があります）"
  echo "✅ バックエンドバケットの設定を完了しました"
fi

# URLマップの確認と更新
if gcloud compute url-maps describe "${URL_MAP_NAME}" --global &>/dev/null; then
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

# CDNキャッシュの無効化
echo "🔄 CDNキャッシュを無効化中..."
gcloud compute url-maps invalidate-cdn-cache "${URL_MAP_NAME}" \
  --path="/*" \
  --global 2>/dev/null || echo "ℹ️  キャッシュ無効化はスキップされました（初回デプロイ時は正常）"

echo "✅ デプロイ完了！"
echo "🌐 サイトURL: https://justjoin.jp"
echo "📊 バケット: ${BUCKET_URL}"
echo "📊 バックエンドバケット: ${BACKEND_BUCKET_NAME}"
echo ""
echo "⚠️  注意: DNS設定で 'justjoin.jp' が正しく設定されていることを確認してください"

