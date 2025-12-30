#!/bin/bash

# Google OAuth設定のテストスクリプト

echo "🧪 Google OAuth設定のテストを開始します..."
echo ""

# .envファイルの確認
if [ ! -f .env ]; then
    echo "❌ .envファイルが見つかりません"
    echo "   env.development.exampleから作成してください:"
    echo "   cp env.development.example .env"
    exit 1
fi

# Google OAuth設定の確認
echo "📋 現在のGoogle OAuth設定:"
echo ""

if grep -q "^GOOGLE_CLIENT_ID=" .env; then
    GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$GOOGLE_CLIENT_ID" ] || [ "$GOOGLE_CLIENT_ID" = "your-google-client-id.apps.googleusercontent.com" ]; then
        echo "❌ GOOGLE_CLIENT_IDが設定されていません"
        echo "   setup-google-oauth.shを実行して設定してください"
        exit 1
    else
        echo "✅ GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
    fi
else
    echo "❌ GOOGLE_CLIENT_IDが.envファイルに設定されていません"
    exit 1
fi

if grep -q "^GOOGLE_CLIENT_SECRET=" .env; then
    GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$GOOGLE_CLIENT_SECRET" ] || [ "$GOOGLE_CLIENT_SECRET" = "your-google-client-secret" ]; then
        echo "❌ GOOGLE_CLIENT_SECRETが設定されていません"
        echo "   setup-google-oauth.shを実行して設定してください"
        exit 1
    else
        echo "✅ GOOGLE_CLIENT_SECRET: [設定済み]"
    fi
else
    echo "❌ GOOGLE_CLIENT_SECRETが.envファイルに設定されていません"
    exit 1
fi

if grep -q "^GOOGLE_REDIRECT_URI=" .env; then
    GOOGLE_REDIRECT_URI=$(grep "^GOOGLE_REDIRECT_URI=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    echo "✅ GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI"
    if [ "$GOOGLE_REDIRECT_URI" != "http://localhost:3001/api/auth/google/callback" ]; then
        echo "⚠️  リダイレクトURIが期待される値と異なります"
        echo "   期待値: http://localhost:3001/api/auth/google/callback"
    fi
else
    echo "⚠️  GOOGLE_REDIRECT_URIが設定されていません（デフォルト値が使用されます）"
fi

echo ""
echo "🔍 APIエンドポイントのテスト..."

# サーバーが起動しているか確認
if curl -s http://localhost:3001/api/auth/google > /dev/null 2>&1; then
    echo "✅ サーバーは起動しています"
    
    # APIエンドポイントのテスト
    RESPONSE=$(curl -s http://localhost:3001/api/auth/google)
    if echo "$RESPONSE" | grep -q "authUrl"; then
        echo "✅ Google OAuth APIエンドポイントは正常に動作しています"
    else
        echo "⚠️  APIレスポンスに問題がある可能性があります"
        echo "   レスポンス: $RESPONSE"
    fi
else
    echo "⚠️  サーバーが起動していないか、ポート3001でアクセスできません"
    echo "   サーバーを起動してください: npm run server:dev"
fi

echo ""
echo "📝 テスト手順:"
echo "1. サーバーを起動: npm run server:dev"
echo "2. フロントエンドを起動（別ターミナル）: npm run dev"
echo "3. ブラウザで http://localhost:5173/jobseeker にアクセス"
echo "4. 「Googleでログイン」ボタンをクリック"
echo "5. Googleアカウントで認証"
echo "6. 認証後、求職者マイページにリダイレクトされることを確認"
echo ""

