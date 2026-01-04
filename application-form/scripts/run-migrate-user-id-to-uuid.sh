#!/bin/bash

# interview_recordingsテーブルのuser_idカラムをUUID型に変更するマイグレーション実行スクリプト

set -e

echo "=== interview_recordingsテーブルのuser_idカラムをUUID型に変更 ==="

PROJECT_ID="justjoin-platform"
INSTANCE_NAME="justjoin-enterprise"
DATABASE_NAME="justjoin"
DB_USER="postgres"
DB_PASSWORD="justjoin2024"
CONNECTION_NAME="$PROJECT_ID:asia-northeast1:$INSTANCE_NAME"

# SQLファイルのパス
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SQL_FILE="$SCRIPT_DIR/interview-system/database/migrate_user_id_to_uuid.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQLファイルが見つかりません: $SQL_FILE"
    exit 1
fi

echo "📝 SQLファイル: $SQL_FILE"
echo "🔧 マイグレーションを実行します..."
echo ""

# Cloud SQL Proxyを使用して実行
if command -v cloud_sql_proxy >/dev/null 2>&1; then
    echo "🔌 Cloud SQL Proxyを使用して接続します..."
    
    # 既にCloud SQL Proxyが起動しているかチェック
    if ! pg_isready -h localhost -p 5432 -U "$DB_USER" -d "$DATABASE_NAME" 2>/dev/null; then
        echo "🚀 Cloud SQL Proxyを起動中..."
        cloud_sql_proxy -instances="$CONNECTION_NAME=tcp:5432" > /tmp/cloud-sql-proxy.log 2>&1 &
        PROXY_PID=$!
        sleep 5
        
        # プロキシが正常に起動したか確認
        if ! kill -0 $PROXY_PID 2>/dev/null; then
            echo "❌ Cloud SQL Proxyの起動に失敗しました"
            cat /tmp/cloud-sql-proxy.log
            exit 1
        fi
        
        echo "✅ Cloud SQL Proxyが起動しました (PID: $PROXY_PID)"
        CLEANUP_PROXY=true
    else
        echo "✅ Cloud SQL Proxyは既に起動しています"
        CLEANUP_PROXY=false
    fi
    
    # マイグレーションを実行
    echo "📋 マイグレーションSQLを実行中..."
    PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5432 -U "$DB_USER" -d "$DATABASE_NAME" -f "$SQL_FILE"
    EXIT_CODE=$?
    
    # Cloud SQL Proxyを停止（起動した場合のみ）
    if [ "$CLEANUP_PROXY" = true ]; then
        echo "🛑 Cloud SQL Proxyを停止中..."
        kill $PROXY_PID 2>/dev/null || true
        wait $PROXY_PID 2>/dev/null || true
    fi
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo "✅ マイグレーションが完了しました"
        exit 0
    else
        echo ""
        echo "❌ マイグレーションに失敗しました"
        exit 1
    fi
else
    echo "❌ Cloud SQL Proxyが見つかりません"
    echo ""
    echo "以下のコマンドで手動実行してください:"
    echo ""
    echo "1. Cloud SQL Proxyを起動:"
    echo "   cloud_sql_proxy -instances=$CONNECTION_NAME=tcp:5432"
    echo ""
    echo "2. 別のターミナルでマイグレーションを実行:"
    echo "   PGPASSWORD=$DB_PASSWORD psql -h localhost -p 5432 -U $DB_USER -d $DATABASE_NAME -f $SQL_FILE"
    echo ""
    echo "または、gcloud sql connectコマンドを使用:"
    echo "   gcloud sql connect $INSTANCE_NAME --database=$DATABASE_NAME --user=$DB_USER --project=$PROJECT_ID"
    echo "   その後、以下のSQLを実行:"
    cat "$SQL_FILE"
    exit 1
fi

