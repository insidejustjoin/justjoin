#!/bin/bash

# 完全な環境変数ファイル作成スクリプト
# 使用方法: ./setup-complete.sh

echo "🔧 完全な環境変数ファイルを作成します..."

# プロジェクト設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
STORAGE_BUCKET="justjoin-platform-match-job-documents"
DB_INSTANCE="justjoin-platform"

# データベース情報
DB_NAME="justjoin_platform"
DB_USER="postgres"
DB_PASSWORD="}g<^EXzLv|xkRpd6"

# Gmail設定
GMAIL_USER="inside.justjoin@gmail.com"
GMAIL_PASSWORD="adlk qlfm chqh bgsg"

echo "📋 設定情報:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  データベース名: $DB_NAME"
echo "  ストレージバケット: $STORAGE_BUCKET"
echo "  Gmailアドレス: $GMAIL_USER"

# 管理者メールアドレスの入力
echo ""
echo "📧 管理者設定を入力してください:"
read -p "管理者メールアドレス (デフォルト: admin@justjoin.jp): " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@justjoin.jp}

# セキュリティ設定の入力
echo ""
echo "🔐 セキュリティ設定を入力してください:"
read -p "JWTシークレット (デフォルト: justjoin-jwt-secret-2024): " JWT_SECRET
JWT_SECRET=${JWT_SECRET:-justjoin-jwt-secret-2024}

read -p "セッションシークレット (デフォルト: justjoin-session-secret-2024): " SESSION_SECRET
SESSION_SECRET=${SESSION_SECRET:-justjoin-session-secret-2024}

# ドメイン設定の入力
echo ""
echo "🌐 ドメイン設定を入力してください:"
read -p "ドメイン名 (デフォルト: justjoin.jp): " DOMAIN
DOMAIN=${DOMAIN:-justjoin.jp}

# 環境変数ファイルの作成
echo ""
echo "📝 完全な環境変数ファイルを作成中..."
cat > .env.gcp << EOF
# GCP Cloud SQL設定
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE"

# GCP Cloud Storage設定
GOOGLE_CLOUD_PROJECT_ID="$PROJECT_ID"
GOOGLE_CLOUD_STORAGE_BUCKET="$STORAGE_BUCKET"
GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"

# メール送信サービス設定（Gmail）
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

echo "✅ 完全な環境変数ファイル (.env.gcp) が作成されました！"
echo ""
echo "📋 設定内容:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  データベース: $DB_NAME"
echo "  ストレージバケット: $STORAGE_BUCKET"
echo "  ドメイン: $DOMAIN"
echo "  Gmail: $GMAIL_USER"
echo "  管理者メール: $ADMIN_EMAIL"
echo ""
echo "⚠️  注意事項:"
echo "1. google-credentials.jsonファイルが必要です"
echo "2. Google OAuth設定は手動で更新してください"
echo "3. パスワードは安全に管理してください"
echo ""
echo "🚀 次のステップ:"
echo "1. google-credentials.jsonファイルを配置"
echo "2. ./check-setup.shを実行して設定を確認"
echo "3. ./full-migration.shを実行して移行を開始" 