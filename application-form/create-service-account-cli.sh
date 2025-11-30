#!/bin/bash

# gcloudコマンドでサービスアカウントキー作成
# 使用方法: ./create-service-account-cli.sh

echo "🔑 gcloudコマンドでサービスアカウントキーを作成します..."

# プロジェクト設定
PROJECT_ID="justjoin-platform"
SERVICE_ACCOUNT_NAME="match-job-sa"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "📋 設定情報:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  サービスアカウント名: $SERVICE_ACCOUNT_NAME"
echo "  サービスアカウントメール: $SERVICE_ACCOUNT_EMAIL"

# プロジェクトの設定
echo ""
echo "🔧 プロジェクトを設定中..."
gcloud config set project $PROJECT_ID

# サービスアカウントの作成
echo ""
echo "👤 サービスアカウントを作成中..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="Match Job Service Account" \
    --description="Service account for Match Job application"

if [ $? -ne 0 ]; then
    echo "⚠️  サービスアカウントが既に存在する可能性があります"
    echo "既存のサービスアカウントを使用します"
fi

# 必要な権限を付与
echo ""
echo "🔐 権限を付与中..."

# Cloud SQL Client権限
echo "  - Cloud SQL Client権限を付与中..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudsql.client"

# Storage Object Admin権限
echo "  - Storage Object Admin権限を付与中..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin"

# Cloud Run Invoker権限
echo "  - Cloud Run Invoker権限を付与中..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.invoker"

# サービスアカウントキーの作成
echo ""
echo "🔑 サービスアカウントキーを作成中..."
gcloud iam service-accounts keys create google-credentials.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

if [ $? -eq 0 ]; then
    echo "✅ サービスアカウントキーが作成されました！"
    echo "📁 ファイル: google-credentials.json"
    echo "📏 ファイルサイズ: $(ls -lh google-credentials.json | awk '{print $5}')"
else
    echo "❌ サービスアカウントキーの作成に失敗しました"
    exit 1
fi

# 設定の確認
echo ""
echo "🔍 作成されたサービスアカウントの確認:"
gcloud iam service-accounts list --filter="email:$SERVICE_ACCOUNT_EMAIL"

echo ""
echo "✅ サービスアカウントキー作成完了！"
echo ""
echo "📋 作成されたファイル:"
echo "  - google-credentials.json"
echo ""
echo "⚠️  注意事項:"
echo "1. このファイルは機密情報を含んでいます"
echo "2. Gitにコミットしないでください"
echo "3. .gitignoreに追加することをお勧めします"
echo ""
echo "🚀 次のステップ:"
echo "1. ./check-setup.shを実行して設定を確認"
echo "2. ./setup-complete.shを実行して環境変数ファイルを作成" 