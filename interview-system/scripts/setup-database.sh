#!/bin/bash

# 面接システムデータベースセットアップスクリプト
# Just Join Interview System Database Setup Script

set -e

echo "🗄️  面接システムデータベースセットアップ開始..."

# 環境変数の設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
INSTANCE_NAME="justjoin-enterprise"
DATABASE_NAME="justjoin"

# Cloud SQL Proxyを使用するか、直接接続するか確認
if [ -z "$1" ]; then
    echo "使用方法:"
    echo "  ローカル開発環境: ./scripts/setup-database.sh local"
    echo "  Cloud SQL（Proxy経由）: ./scripts/setup-database.sh proxy"
    echo "  Cloud SQL（直接接続）: ./scripts/setup-database.sh direct"
    exit 1
fi

CONNECTION_MODE=$1
SCHEMA_FILE="database/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ エラー: $SCHEMA_FILE が見つかりません"
    exit 1
fi

if [ "$CONNECTION_MODE" = "local" ]; then
    # ローカルPostgreSQL接続
    echo "📦 ローカルPostgreSQLに接続中..."
    psql -U postgres -d "$DATABASE_NAME" -f "$SCHEMA_FILE"
    echo "✅ ローカルデータベースセットアップ完了"
    
elif [ "$CONNECTION_MODE" = "proxy" ]; then
    # Cloud SQL Proxy経由で接続
    echo "☁️  Cloud SQL Proxy経由で接続中..."
    
    # Cloud SQL Proxyが起動しているか確認
    if ! pgrep -f "cloud_sql_proxy" > /dev/null; then
        echo "⚠️  Cloud SQL Proxyが起動していません"
        echo "以下を別ターミナルで実行してください:"
        echo "cloud_sql_proxy -instances=$PROJECT_ID:$REGION:$INSTANCE_NAME=tcp:5432"
        exit 1
    fi
    
    export PGPASSWORD="justjoin2024"
    psql -h 127.0.0.1 -p 5432 -U postgres -d "$DATABASE_NAME" -f "$SCHEMA_FILE"
    unset PGPASSWORD
    echo "✅ Cloud SQL Proxy経由でセットアップ完了"
    
elif [ "$CONNECTION_MODE" = "direct" ]; then
    # gcloud経由で直接接続
    echo "☁️  Cloud SQLに直接接続中..."
    gcloud sql connect "$INSTANCE_NAME" \
        --database="$DATABASE_NAME" \
        --user=postgres \
        --project="$PROJECT_ID" \
        --quiet \
        <<EOF
$(cat "$SCHEMA_FILE")
EOF
    echo "✅ Cloud SQL直接接続でセットアップ完了"
    
else
    echo "❌ 無効な接続モード: $CONNECTION_MODE"
    echo "使用可能なモード: local, proxy, direct"
    exit 1
fi

echo ""
echo "✅ データベースセットアップ完了！"
echo "📊 テーブル一覧を確認:"
if [ "$CONNECTION_MODE" = "local" ]; then
    psql -U postgres -d "$DATABASE_NAME" -c "\dt interview_*"
elif [ "$CONNECTION_MODE" = "proxy" ]; then
    export PGPASSWORD="justjoin2024"
    psql -h 127.0.0.1 -p 5432 -U postgres -d "$DATABASE_NAME" -c "\dt interview_*"
    unset PGPASSWORD
fi


