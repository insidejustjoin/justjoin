#!/bin/bash

# interview_urlsテーブルをリモートで作成するスクリプト
# Cloud SQL Proxyを使用しない方法

echo "=== interview_urlsテーブル作成（リモート実行） ==="

PROJECT_ID="justjoin-platform"
INSTANCE_NAME="justjoin-enterprise"
DATABASE_NAME="justjoin"
DB_USER="postgres"
DB_PASSWORD="justjoin2024"

# SQLファイルの内容を読み込む
SQL_CONTENT=$(cat "$(dirname "$0")/create-interview-urls-table.sql")

# gcloud sql execute-sql を使用してSQLを実行
echo "SQLを実行中..."
echo "$SQL_CONTENT" | gcloud sql execute-sql justjoin-enterprise \
    --database=justjoin \
    --project=justjoin-platform \
    --quiet

if [ $? -eq 0 ]; then
    echo "✅ interview_urlsテーブルの作成が完了しました"
else
    echo "❌ interview_urlsテーブルの作成に失敗しました"
    exit 1
fi



