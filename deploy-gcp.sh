#!/bin/bash

# GCPデプロイスクリプト - justjoin.jp用
# 使用方法: ./deploy-gcp.sh

set -e  # エラー時に停止

echo "🚀 GCPデプロイを開始します..."
echo "🌐 ターゲットドメイン: justjoin.jp"

# 環境変数の確認
if [ ! -f .env.gcp ]; then
    echo "❌ .env.gcpファイルが見つかりません"
    echo "env.gcp.exampleをコピーして.env.gcpを作成し、実際の値を設定してください"
    exit 1
fi

# プロジェクトIDの確認
PROJECT_ID=$(gcloud config get-value project)
echo "📋 プロジェクトID: $PROJECT_ID"

# 1. ビルド
echo "📦 プロジェクトをビルド中..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi

echo "✅ ビルド完了"

# 2. Dockerイメージのビルド
echo "🐳 Dockerイメージをビルド中..."
docker buildx build --platform linux/amd64 -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/justjoin:latest . --push
if [ $? -ne 0 ]; then
    echo "❌ Dockerビルドに失敗しました"
    exit 1
fi

echo "✅ Dockerビルド完了"

# 3. GCP Container Registryにプッシュ
echo "📤 GCP Container Registryにプッシュ中..."
docker push gcr.io/$PROJECT_ID/justjoin:latest
if [ $? -ne 0 ]; then
    echo "❌ イメージのプッシュに失敗しました"
    exit 1
fi

echo "✅ イメージプッシュ完了"

# 4. Cloud Runにデプロイ
echo "🚀 Cloud Runにデプロイ中..."
gcloud run deploy justjoin \
    --image gcr.io/$PROJECT_ID/justjoin:latest \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --env-vars-file env.gcp.yaml \
    --add-cloudsql-instances $PROJECT_ID:asia-northeast1:justjoin \
    --timeout 300 \
    --concurrency 80

if [ $? -ne 0 ]; then
    echo "❌ Cloud Runデプロイに失敗しました"
    exit 1
fi

echo "✅ Cloud Runデプロイ完了"

# 5. カスタムドメインの設定
echo "🌐 カスタムドメインを設定中..."
gcloud beta run domain-mappings create \
    --service justjoin \
    --domain justjoin.jp \
    --region asia-northeast1

if [ $? -ne 0 ]; then
    echo "⚠️  カスタムドメインの設定に失敗しました（手動で設定が必要）"
    echo "🔧 手動設定手順:"
    echo "   1. GCP ConsoleでCloud Run > justjoin > ドメイン > ドメインのマッピング"
    echo "   2. カスタムドメイン: justjoin.jp"
    echo "   3. SSL証明書の設定"
fi

echo "✅ カスタムドメイン設定完了"

# 6. Cloud Storageバケットの作成（存在しない場合）
echo "📦 Cloud Storageバケットを確認中..."
BUCKET_NAME="$PROJECT_ID-justjoin-documents"
if ! gsutil ls -b gs://$BUCKET_NAME >/dev/null 2>&1; then
    echo "📦 Cloud Storageバケットを作成中..."
    gsutil mb -l asia-northeast1 gs://$BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    echo "✅ Cloud Storageバケット作成完了: $BUCKET_NAME"
else
    echo "✅ Cloud Storageバケットは既に存在します: $BUCKET_NAME"
fi

# 7. デプロイ確認
echo "🔍 デプロイ確認中..."
sleep 15

# Cloud Run URLの取得
SERVICE_URL=$(gcloud run services describe justjoin --region asia-northeast1 --format="value(status.url)")

echo "🌐 Cloud Run URL: $SERVICE_URL"

# ヘルスチェックテスト
echo "🔍 ヘルスチェックテスト..."
if curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" | grep -q "200"; then
    echo "✅ ヘルスチェック成功！サービスが正常に応答しています"
else
    echo "⚠️  ヘルスチェックに失敗しました"
    echo "🔍 手動で確認してください: $SERVICE_URL/api/health"
fi

# 8. SSL証明書の確認
echo "🔒 SSL証明書の確認中..."
if curl -s -I "https://justjoin.jp" | grep -q "HTTP/2 200"; then
    echo "✅ SSL証明書が正常に設定されています"
else
    echo "⚠️  SSL証明書の設定を確認してください"
fi

echo ""
echo "🎉 GCPデプロイ完了！" 
echo ""
echo "📋 デプロイ情報:"
echo "  🌐 本番URL: https://justjoin.jp"
echo "  🚀 Cloud Run URL: $SERVICE_URL"
echo "  📦 ストレージバケット: $BUCKET_NAME"
echo "  🗄️  データベース: $PROJECT_ID:asia-northeast1:justjoin"
echo ""
echo "🧪 テスト方法:"
echo "  curl -X GET $SERVICE_URL/api/health"
echo "  curl -X POST $SERVICE_URL/api/register-jobseeker \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"test@example.com\",\"fullName\":\"テスト太郎\"}'"
echo ""
echo "📊 監視:"
echo "  GCP Console > Cloud Run > justjoin > ログ"
echo "  GCP Console > Cloud Run > justjoin > メトリクス" 