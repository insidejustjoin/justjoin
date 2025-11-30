#!/bin/bash

# 面接システムデプロイスクリプト
# Just Join Interview System Deployment Script

set -e

echo "🚀 面接システムデプロイ開始..."

# 環境変数の設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
SERVICE_NAME="justjoin-interview"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# 現在のディレクトリを確認
if [ ! -f "package.json" ]; then
    echo "❌ エラー: 面接システムディレクトリで実行してください"
    exit 1
fi

echo "📦 依存関係をインストール中..."
npm install

echo "🔨 フロントエンドをビルド中..."
npm run build:client

echo "🔨 サーバーサイドをビルド中..."
npm run build:server

echo "🐳 Dockerイメージをビルド中..."
# Dockerが利用可能かチェック
if docker ps >/dev/null 2>&1; then
    echo "🐳 ローカルDockerを使用してビルド中..."
docker build --platform linux/amd64 -t $IMAGE_NAME .
echo "📤 Dockerイメージをプッシュ中..."
docker push $IMAGE_NAME
else
    echo "⚠️  Dockerデーモンが起動していません。Cloud Buildを使用します..."
    REV=$(date +%Y%m%d%H%M%S)
    IMAGE_TAG="$IMAGE_NAME:$REV"
    gcloud builds submit --tag $IMAGE_TAG --timeout=1800 . || {
        echo "❌ Cloud Buildに失敗しました"
        exit 1
    }
    IMAGE_NAME=$IMAGE_TAG
fi

echo "☁️ Cloud Runにデプロイ中..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 3002 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 3600 \
    --env-vars-file deploy/env.yaml \
    --add-cloudsql-instances "justjoin-platform:asia-northeast1:justjoin-enterprise"

echo "✅ 面接システムデプロイ完了！"
echo "🌐 サービスURL: https://$SERVICE_NAME-$(gcloud config get-value project).$REGION.run.app"
echo "📊 監視: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"

# カスタムドメインの設定（オプション）
echo ""
echo "🔗 カスタムドメイン設定（オプション）:"
echo "1. Cloud Runコンソールでカスタムドメインを設定"
echo "2. DNSレコードを追加: interview.justjoin.jp"
echo "3. SSL証明書は自動で管理されます" 