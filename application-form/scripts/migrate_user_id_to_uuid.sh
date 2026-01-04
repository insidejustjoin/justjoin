#!/bin/bash

# interview_recordingsテーブルのuser_idカラムをUUID型に変更するマイグレーションスクリプト

echo "=== interview_recordingsテーブルのuser_idカラムをUUID型に変更 ==="

PROJECT_ID="justjoin-platform"
INSTANCE_NAME="justjoin-enterprise"
DATABASE_NAME="justjoin"
DB_USER="postgres"

# SQLファイルのパス
SQL_FILE="$(dirname "$0")/../interview-system/database/migrate_user_id_to_uuid.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQLファイルが見つかりません: $SQL_FILE"
    exit 1
fi

echo "📝 SQLファイルを読み込み中: $SQL_FILE"
SQL_CONTENT=$(cat "$SQL_FILE")

echo "🔧 Cloud SQLに接続してマイグレーションを実行中..."
echo "⚠️  注意: この操作は既存のINTEGER型のuser_id値をNULLに変更します"

# Cloud SQL Proxyを使用して接続（推奨）
# または、gcloud sql connectコマンドを使用

# 一時的なSQLファイルを作成
TEMP_SQL=$(mktemp)
echo "$SQL_CONTENT" > "$TEMP_SQL"

echo "📋 実行するSQL:"
echo "----------------------------------------"
cat "$TEMP_SQL"
echo "----------------------------------------"

echo ""
echo "⚠️  このマイグレーションを実行しますか？ (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ マイグレーションがキャンセルされました"
    rm -f "$TEMP_SQL"
    exit 1
fi

# Cloud SQL Proxyを使用して実行（Cloud SQL Proxyが起動している場合）
if pg_isready -h /cloudsql/justjoin-platform:asia-northeast1:justjoin-enterprise -p 5432 2>/dev/null; then
    echo "🔌 Cloud SQL Proxy経由で接続中..."
    PGPASSWORD=justjoin2024 psql -h /cloudsql/justjoin-platform:asia-northeast1:justjoin-enterprise -U "$DB_USER" -d "$DATABASE_NAME" -f "$TEMP_SQL"
elif command -v cloud_sql_proxy >/dev/null 2>&1; then
    echo "🔌 Cloud SQL Proxyを起動中..."
    CONNECTION_NAME="$PROJECT_ID:asia-northeast1:$INSTANCE_NAME"
    cloud_sql_proxy -instances="$CONNECTION_NAME=tcp:5432" &
    PROXY_PID=$!
    sleep 5
    
    PGPASSWORD=justjoin2024 psql -h localhost -p 5432 -U "$DB_USER" -d "$DATABASE_NAME" -f "$TEMP_SQL"
    
    kill $PROXY_PID
else
    echo "❌ Cloud SQL Proxyが見つかりません"
    echo "以下のコマンドで手動実行してください:"
    echo "  gcloud sql connect $INSTANCE_NAME --database=$DATABASE_NAME --user=$DB_USER"
    echo "  その後、以下のSQLを実行:"
    cat "$TEMP_SQL"
    rm -f "$TEMP_SQL"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "✅ マイグレーションが完了しました"
else
    echo "❌ マイグレーションに失敗しました"
    rm -f "$TEMP_SQL"
    exit 1
fi

rm -f "$TEMP_SQL"

