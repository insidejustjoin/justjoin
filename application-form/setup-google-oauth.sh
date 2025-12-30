#!/bin/bash

# Google OAuth設定スクリプト
# このスクリプトは、.envファイルにGoogle OAuth設定を追加/更新します

echo "🔐 Google OAuth設定を開始します..."
echo ""

# .envファイルの存在確認
if [ ! -f .env ]; then
    echo "⚠️  .envファイルが見つかりません。env.development.exampleから作成します..."
    cp env.development.example .env
    echo "✅ .envファイルを作成しました"
    echo ""
fi

# 現在の設定を確認
if grep -q "GOOGLE_CLIENT_ID" .env; then
    echo "📋 現在のGoogle OAuth設定:"
    grep "GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET\|GOOGLE_REDIRECT_URI" .env | grep -v "^#"
    echo ""
    read -p "既存の設定を上書きしますか？ (y/n): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "❌ 設定をキャンセルしました"
        exit 0
    fi
fi

echo ""
echo "📝 Google OAuth設定を入力してください:"
echo ""
echo "1. Google Cloud Console (https://console.cloud.google.com/) にアクセス"
echo "2. プロジェクトを選択（justjoin-platform）"
echo "3. 「APIとサービス」→「認証情報」に移動"
echo "4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択"
echo "5. アプリケーションの種類：「ウェブアプリケーション」を選択"
echo "6. 承認済みのリダイレクトURIに以下を追加:"
echo "   http://localhost:3001/api/auth/google/callback"
echo "7. 作成されたクライアントIDとシークレットを以下に入力"
echo ""

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

GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

echo ""
echo "📝 .envファイルを更新中..."

# 既存の設定を削除
sed -i.bak '/^GOOGLE_CLIENT_ID=/d' .env
sed -i.bak '/^GOOGLE_CLIENT_SECRET=/d' .env
sed -i.bak '/^GOOGLE_REDIRECT_URI=/d' .env

# コメント行も削除（Google OAuth関連）
sed -i.bak '/^# Google OAuth 2.0設定/d' .env
sed -i.bak '/^# Google Cloud ConsoleでOAuth/d' .env
sed -i.bak '/^# .*OAuth.*Client.*ID/d' .env

# 新しい設定を追加（ファイルの適切な場所に）
# 既存のGOOGLE_CLOUD_PROJECT_IDの後に追加
if grep -q "^GOOGLE_CLOUD_PROJECT_ID" .env; then
    # GOOGLE_CLOUD_PROJECT_IDの後に追加
    sed -i.bak "/^GOOGLE_CLOUD_PROJECT_ID=/a\\
\\
# Google OAuth 2.0設定（SSO用）\\
GOOGLE_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"\\
GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"\\
GOOGLE_REDIRECT_URI=\"$GOOGLE_REDIRECT_URI\"
" .env
else
    # ファイルの最後に追加
    echo "" >> .env
    echo "# Google OAuth 2.0設定（SSO用）" >> .env
    echo "GOOGLE_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"" >> .env
    echo "GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"" >> .env
    echo "GOOGLE_REDIRECT_URI=\"$GOOGLE_REDIRECT_URI\"" >> .env
fi

# バックアップファイルを削除（macOSの場合）
if [ -f .env.bak ]; then
    rm .env.bak
fi

echo "✅ .envファイルを更新しました"
echo ""
echo "📋 設定内容:"
echo "  GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "  GOOGLE_CLIENT_SECRET: [設定済み]"
echo "  GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI"
echo ""
echo "🚀 次のステップ:"
echo "1. サーバーを再起動してください: npm run server:dev"
echo "2. ブラウザで http://localhost:5173/jobseeker にアクセス"
echo "3. 「Googleでログイン」ボタンをクリックしてテスト"
echo ""

