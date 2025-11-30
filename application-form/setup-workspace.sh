#!/bin/bash

# Google Workspace設定スクリプト
# 使用方法: ./setup-workspace.sh

echo "🏢 Google Workspace設定を開始します..."

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
echo "🔧 Google Workspace設定手順:"
echo ""
echo "1. Google Workspace管理者に依頼:"
echo "   - 新しいアカウントの作成（例: admin@justjoin.jp）"
echo "   - アプリパスワードの有効化"
echo "   - 2段階認証の設定"
echo ""
echo "2. 新しいアカウントでログイン:"
echo "   - https://myaccount.google.com/"
echo "   - セキュリティ > 2段階認証 > アプリパスワード"
echo ""
echo "3. アプリパスワードを生成:"
echo "   - アプリを選択: その他（カスタム名）"
echo "   - 名前: JustJoin Platform"
echo "   - 生成ボタンをクリック"
echo ""

# Workspace設定の入力
echo "📧 Google Workspace設定を入力してください:"
read -p "Workspaceメールアドレス (例: admin@justjoin.jp): " WORKSPACE_EMAIL
if [ -z "$WORKSPACE_EMAIL" ]; then
    echo "❌ Workspaceメールアドレスは必須です"
    exit 1
fi

read -p "アプリパスワード: " APP_PASSWORD
if [ -z "$APP_PASSWORD" ]; then
    echo "❌ アプリパスワードは必須です"
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

# メール送信サービス設定（Google Workspace）
EMAIL_SERVICE=gmail
GMAIL_USER=$WORKSPACE_EMAIL
GMAIL_PASSWORD=$APP_PASSWORD

# Google OAuth 2.0設定
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
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
echo "  Workspaceメール: $WORKSPACE_EMAIL"
echo ""
echo "⚠️  注意事項:"
echo "1. google-credentials.jsonファイルが必要です"
echo "2. Google Workspace管理者の設定確認が必要です"
echo "3. アプリパスワードの有効化が必要です"
echo ""
echo "🚀 次のステップ:"
echo "1. Google Workspace管理者に設定を依頼"
echo "2. 新しいアカウントでアプリパスワードを生成"
echo "3. google-credentials.jsonファイルを配置"
echo "4. ./full-migration.shを実行" 