#!/bin/bash

# OAuth 2.0認証設定スクリプト
# 使用方法: ./setup-oauth2.sh

echo "🔐 OAuth 2.0認証設定を開始します..."

# プロジェクト設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
STORAGE_BUCKET="justjoin-platform-match-job-documents"
DB_INSTANCE="justjoin-platform"

# データベース情報
DB_NAME="justjoin_platform"
DB_USER="postgres"
DB_PASSWORD="}g<^EXzLv|xkRpd6"

echo "📋 設定情報:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  データベース名: $DB_NAME"
echo "  ストレージバケット: $STORAGE_BUCKET"

echo ""
echo "🔧 OAuth 2.0認証の設定手順:"
echo ""
echo "1. Google Cloud Consoleにアクセス:"
echo "   https://console.cloud.google.com/"
echo ""
echo "2. プロジェクトを選択: $PROJECT_ID"
echo ""
echo "3. APIs & Services > Credentials に移動"
echo ""
echo "4. 'Create Credentials' > 'OAuth 2.0 Client IDs' をクリック"
echo ""
echo "5. アプリケーションの種類を選択:"
echo "   - Web application"
echo ""
echo "6. 承認済みのリダイレクトURIを追加:"
echo "   - https://justjoin.jp/auth/google/callback"
echo "   - http://localhost:3000/auth/google/callback (開発用)"
echo ""
echo "7. 作成後、Client ID と Client Secret をコピー"
echo ""

# OAuth設定の入力
echo "📧 OAuth 2.0設定を入力してください:"
read -p "Google Client ID: " GOOGLE_CLIENT_ID
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ Google Client IDは必須です"
    exit 1
fi

read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Google Client Secretは必須です"
    exit 1
fi

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
echo "📝 環境変数ファイルを作成中..."
cat > .env.gcp << EOF
# GCP Cloud SQL設定
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE"

# GCP Cloud Storage設定
GOOGLE_CLOUD_PROJECT_ID="$PROJECT_ID"
GOOGLE_CLOUD_STORAGE_BUCKET="$STORAGE_BUCKET"
GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"

# メール送信サービス設定（OAuth 2.0）
EMAIL_SERVICE=gmail
GMAIL_USER=inside.justjoin@gmail.com
GMAIL_REFRESH_TOKEN="your-refresh-token-here"

# Google OAuth 2.0設定
GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="https://$DOMAIN/auth/google/callback"

# 管理者メールアドレス
ADMIN_EMAIL=$ADMIN_EMAIL

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
echo "  データベース: $DB_NAME"
echo "  ストレージバケット: $STORAGE_BUCKET"
echo "  ドメイン: $DOMAIN"
echo "  OAuth Client ID: $GOOGLE_CLIENT_ID"
echo ""
echo "⚠️  注意事項:"
echo "1. google-credentials.jsonファイルが必要です"
echo "2. Gmailリフレッシュトークンの設定が必要です"
echo "3. OAuth 2.0認証のテストが必要です"
echo ""
echo "🚀 次のステップ:"
echo "1. google-credentials.jsonファイルを配置"
echo "2. Gmailリフレッシュトークンを取得"
echo "3. ./full-migration.shを実行" 