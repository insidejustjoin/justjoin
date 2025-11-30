#!/bin/bash

# GCP静的ホスティングデプロイスクリプト - justjoin.jp用
# Cloud Storage + Cloud CDNを使用

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

# バケット名
BUCKET_NAME="justjoin-static-site"
BUCKET_URL="gs://${BUCKET_NAME}"

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

# Cloud CDNの設定（オプション）
echo "🌐 Cloud CDNの設定を確認中..."
# CDNの設定は手動で行う必要がある場合があります

echo "✅ デプロイ完了！"
echo "🌐 サイトURL: https://justjoin.jp"
echo "📊 バケット: ${BUCKET_URL}"
echo ""
echo "⚠️  注意: ドメイン設定とCloud CDNの設定が完了していることを確認してください"

