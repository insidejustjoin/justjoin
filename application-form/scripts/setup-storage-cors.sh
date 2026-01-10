#!/bin/bash

# Cloud Storage CORS設定スクリプト
# Just Join Platform Cloud Storage CORS Configuration Script

set -e

echo "🌐 Cloud Storage CORS設定を開始..."

# 環境変数の設定
PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-justjoin-platform}"
BUCKET_NAME="${GOOGLE_CLOUD_STORAGE_BUCKET:-justjoin-platform-match-job-documents}"

echo "📋 設定内容:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  バケット名: $BUCKET_NAME"

# CORS設定ファイルを作成
CORS_CONFIG=$(cat <<EOF
[
  {
    "origin": ["https://justjoin.jp", "https://*.justjoin.jp", "http://localhost:3001"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Content-Range",
      "Content-Disposition",
      "Accept-Ranges",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age"
    ],
    "maxAgeSeconds": 3600
  }
]
EOF
)

# 一時ファイルにCORS設定を保存
CORS_FILE=$(mktemp)
echo "$CORS_CONFIG" > "$CORS_FILE"

echo "📝 CORS設定ファイルを作成しました:"
cat "$CORS_FILE"

# Cloud StorageバケットにCORS設定を適用
echo "⚙️  CORS設定を適用中..."
gsutil cors set "$CORS_FILE" "gs://$BUCKET_NAME"

# 現在のCORS設定を確認
echo ""
echo "✅ CORS設定を適用しました"
echo "📋 現在のCORS設定:"
gsutil cors get "gs://$BUCKET_NAME"

# 一時ファイルを削除
rm -f "$CORS_FILE"

echo ""
echo "✅ Cloud Storage CORS設定完了！"
echo "📝 注意: バケットの公開設定も確認してください"
echo "   gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME  # 公開設定（必要に応じて）"
echo "   gsutil iam ch -d allUsers:objectViewer gs://$BUCKET_NAME  # 公開設定を削除"


