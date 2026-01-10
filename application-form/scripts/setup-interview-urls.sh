#!/bin/bash

# interview_urlsテーブル作成スクリプト

echo "=== interview_urlsテーブル作成 ==="

# 環境変数の確認
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URLが設定されていません"
    echo "env.gcp.yamlの設定を確認してください"
    exit 1
fi

echo "DATABASE_URL: $DATABASE_URL"

# interview_urlsテーブルを作成
echo "interview_urlsテーブルを作成中..."
psql "$DATABASE_URL" -f "$(dirname "$0")/create-interview-urls-table.sql"

if [ $? -eq 0 ]; then
    echo "✅ interview_urlsテーブルの作成が完了しました"
else
    echo "❌ interview_urlsテーブルの作成に失敗しました"
    exit 1
fi






