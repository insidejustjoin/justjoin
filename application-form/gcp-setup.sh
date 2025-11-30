#!/bin/bash

# GCP初期設定スクリプト - justjoin.jp用
# 使用方法: ./gcp-setup.sh

set -e  # エラー時に停止

echo "🚀 GCP初期設定を開始します..."
echo "🌐 ターゲットドメイン: justjoin.jp"

# プロジェクトIDの確認
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ GCPプロジェクトが設定されていません"
    echo "gcloud init を実行してプロジェクトを設定してください"
    exit 1
fi

echo "📋 プロジェクトID: $PROJECT_ID"

# 1. 必要なAPIの有効化
echo "🔧 必要なAPIを有効化中..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable vpcaccess.googleapis.com

echo "✅ API有効化完了"

# 2. Cloud SQLインスタンスの作成
echo "🗄️  Cloud SQLインスタンスを作成中..."
INSTANCE_NAME="justjoin-db"

# インスタンスが存在するかチェック
if ! gcloud sql instances describe $INSTANCE_NAME --quiet 2>/dev/null; then
    echo "📦 PostgreSQLインスタンスを作成中..."
    gcloud sql instances create $INSTANCE_NAME \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
        --region=asia-northeast1 \
        --root-password=JustJoin2024! \
    --storage-type=SSD \
    --storage-size=10GB \
        --backup-start-time=02:00 \
    --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --availability-type=zonal
else
    echo "✅ Cloud SQLインスタンスは既に存在します: $INSTANCE_NAME"
fi

# 3. データベースの作成
echo "📊 データベースを作成中..."
DB_NAME="justjoin_db"
if ! gcloud sql databases describe $DB_NAME --instance=$INSTANCE_NAME --quiet 2>/dev/null; then
    gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME
    echo "✅ データベース作成完了: $DB_NAME"
else
    echo "✅ データベースは既に存在します: $DB_NAME"
fi

# 4. データベースユーザーの作成
echo "👤 データベースユーザーを作成中..."
DB_USER="justjoin_user"
DB_PASSWORD="JustJoinUser2024!"

# ユーザーが存在するかチェック
if ! gcloud sql users describe $DB_USER --instance=$INSTANCE_NAME --quiet 2>/dev/null; then
    gcloud sql users create $DB_USER \
        --instance=$INSTANCE_NAME \
        --password=$DB_PASSWORD
    echo "✅ データベースユーザー作成完了: $DB_USER"
else
    echo "✅ データベースユーザーは既に存在します: $DB_USER"
fi

# 5. Cloud Storageバケットの作成
echo "📦 Cloud Storageバケットを作成中..."
BUCKET_NAME="$PROJECT_ID-justjoin-documents"

if ! gsutil ls -b gs://$BUCKET_NAME >/dev/null 2>&1; then
    gsutil mb -l asia-northeast1 gs://$BUCKET_NAME
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    echo "✅ Cloud Storageバケット作成完了: $BUCKET_NAME"
else
    echo "✅ Cloud Storageバケットは既に存在します: $BUCKET_NAME"
fi

# 6. VPCコネクターの作成
echo "🔗 VPCコネクターを作成中..."
VPC_CONNECTOR_NAME="justjoin-vpc-connector"
VPC_NETWORK="default"

if ! gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME --region=asia-northeast1 --quiet 2>/dev/null; then
    gcloud compute networks vpc-access connectors create $VPC_CONNECTOR_NAME \
        --network=$VPC_NETWORK \
        --region=asia-northeast1 \
        --range=10.8.0.0/28 \
        --min-instances=2 \
        --max-instances=10 \
        --machine-type=e2-micro
    echo "✅ VPCコネクター作成完了: $VPC_CONNECTOR_NAME"
else
    echo "✅ VPCコネクターは既に存在します: $VPC_CONNECTOR_NAME"
fi

# 7. サービスアカウントの作成
echo "🔐 サービスアカウントを作成中..."
SERVICE_ACCOUNT_NAME="justjoin-service-account"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --quiet 2>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="JustJoin Service Account"

    # 必要な権限を付与
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/cloudsql.client"
    
gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin"

    echo "✅ サービスアカウント作成完了: $SERVICE_ACCOUNT_EMAIL"
else
    echo "✅ サービスアカウントは既に存在します: $SERVICE_ACCOUNT_EMAIL"
fi

# 8. 環境変数ファイルの作成
echo "📝 環境変数ファイルを作成中..."
if [ ! -f .env.gcp ]; then
    cp env.gcp.example .env.gcp
    
    # 実際の値で置換
    sed -i.bak "s/PROJECT_ID/$PROJECT_ID/g" .env.gcp
    sed -i.bak "s/your-project-id/$PROJECT_ID/g" .env.gcp
    sed -i.bak "s/your-database-password/$DB_PASSWORD/g" .env.gcp
    
    echo "✅ 環境変数ファイル作成完了: .env.gcp"
    echo "⚠️  以下の値を手動で設定してください:"
    echo "   - GMAIL_PASSWORD: Gmailアプリパスワード"
    echo "   - JWT_SECRET: ランダムな文字列"
    echo "   - SESSION_SECRET: ランダムな文字列"
    echo "   - GOOGLE_CLIENT_ID: Google OAuth 2.0クライアントID"
    echo "   - GOOGLE_CLIENT_SECRET: Google OAuth 2.0クライアントシークレット"
else
    echo "✅ 環境変数ファイルは既に存在します: .env.gcp"
fi

# 9. データベーススキーマの適用
echo "🗄️  データベーススキーマを適用中..."
CONNECTION_NAME="$PROJECT_ID:asia-northeast1:$INSTANCE_NAME"

# Cloud SQL Proxyを使用してスキーマを適用
if [ -f "supabase/migrations/20250101000000_create_user_documents.sql" ]; then
    echo "📊 データベーススキーマを適用中..."
    # 一時的にCloud SQL Proxyを起動
    cloud_sql_proxy -instances=$CONNECTION_NAME=tcp:5432 &
    PROXY_PID=$!
    sleep 5
    
    # スキーマを適用
    PGPASSWORD=$DB_PASSWORD psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f supabase/migrations/20250101000000_create_user_documents.sql
    
    # Cloud SQL Proxyを停止
    kill $PROXY_PID
    echo "✅ データベーススキーマ適用完了"
else
    echo "⚠️  データベーススキーマファイルが見つかりません"
fi

echo ""
echo "🎉 GCP初期設定完了！"
echo ""
echo "📋 作成されたリソース:"
echo "  🗄️  Cloud SQL: $INSTANCE_NAME"
echo "  📊 データベース: $DB_NAME"
echo "  👤 データベースユーザー: $DB_USER"
echo "  📦 Cloud Storage: $BUCKET_NAME"
echo "  🔗 VPCコネクター: $VPC_CONNECTOR_NAME"
echo "  🔐 サービスアカウント: $SERVICE_ACCOUNT_EMAIL"
echo ""
echo "🚀 次のステップ:"
echo "  1. .env.gcpファイルの値を設定"
echo "  2. ./deploy-gcp.sh を実行してデプロイ"
echo "  3. DNS設定でjustjoin.jpをCloud Runに指向"
echo ""
echo "📊 接続情報:"
echo "  DATABASE_URL: postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
echo "  STORAGE_BUCKET: $BUCKET_NAME" 