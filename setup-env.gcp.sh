#!/bin/bash

# 環境変数設定スクリプト
# 使用方法: ./setup-env.gcp.sh

echo "🔧 GCP環境変数設定を開始します..."

# プロジェクト情報の設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"

echo "📋 GCPプロジェクト情報:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  リージョン: $REGION"

# データベース情報の入力
echo ""
echo "🗄️  データベース情報を入力してください:"
read -p "Cloud SQLインスタンス名: " DB_INSTANCE
read -p "データベース名: " DB_NAME
read -p "データベースユーザー名: " DB_USER
read -p "データベースパスワード: " DB_PASSWORD

# ストレージ情報の設定
STORAGE_BUCKET="justjoin-platform-match-job-documents"

echo ""
echo "📦 ストレージ情報:"
echo "  バケット名: $STORAGE_BUCKET"

# メール設定の入力
echo ""
echo "📧 メール設定を入力してください:"
read -p "Gmailアドレス: " GMAIL_USER
read -p "Gmailアプリパスワード: " GMAIL_PASSWORD
read -p "管理者メールアドレス: " ADMIN_EMAIL

# セキュリティ設定の入力
echo ""
echo "🔐 セキュリティ設定を入力してください:"
read -p "JWTシークレット: " JWT_SECRET
read -p "セッションシークレット: " SESSION_SECRET

# ドメイン設定の入力
echo ""
echo "🌐 ドメイン設定を入力してください:"
read -p "ドメイン名 (例: justjoin.jp): " DOMAIN

# 環境変数ファイルの作成
echo ""
echo "📝 環境変数ファイルを作成中..."
cat > .env.gcp << EOF
# GCP Cloud SQL設定
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE"

# GCP Cloud Storage設定
GOOGLE_CLOUD_PROJECT_ID="$PROJECT_ID"
GOOGLE_CLOUD_STORAGE_BUCKET="$STORAGE_BUCKET"
GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"

# メール送信サービス設定
EMAIL_SERVICE=gmail
GMAIL_USER=$GMAIL_USER
GMAIL_PASSWORD=$GMAIL_PASSWORD

# 管理者メールアドレス
ADMIN_EMAIL=$ADMIN_EMAIL

# Google OAuth 2.0設定
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://$DOMAIN/auth/google/callback"

# Server Configuration
PORT=8080
NODE_ENV="production"

# Security
JWT_SECRET="$JWT_SECRET"
SESSION_SECRET="$SESSION_SECRET"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"

# ドメイン設定
DOMAIN="$DOMAIN"
BASE_URL="https://$DOMAIN"
EOF

echo "✅ 環境変数ファイル (.env.gcp) が作成されました！"
echo ""
echo "📋 設定内容:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  リージョン: $REGION"
echo "  データベース: $DB_INSTANCE"
echo "  ストレージバケット: $STORAGE_BUCKET"
echo "  ドメイン: $DOMAIN"
echo ""
echo "⚠️  注意事項:"
echo "1. google-credentials.jsonファイルが必要です"
echo "2. Google OAuth設定は手動で更新してください"
echo "3. パスワードは安全に管理してください"
echo ""
echo "🚀 次のステップ:"
echo "1. google-credentials.jsonファイルを配置"
echo "2. ./auto-migration.shを実行" 