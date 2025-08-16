#!/bin/bash

echo "🚀 サーバーサイドAPIサーバーを起動します..."

# 環境変数を設定
export DATABASE_URL="postgresql://postgres:fvjp1234@34.85.124.86:5432/postgres?sslmode=require"
export GMAIL_PASSWORD="sdrg vtxr zneu mskb"
export SSL_CA="$(cat ssl/server-ca.pem)"
export SSL_KEY="$(cat ssl/client-key.pem)"
export SSL_CERT="$(cat ssl/client-cert.pem)"

# TypeScriptをコンパイル
echo "📦 TypeScriptをコンパイル中..."
npx tsc --project tsconfig.server.json

# コンパイルされたサーバーを起動
echo "🚀 サーバーを起動中..."
node dist-server/server/index.cjs 