#!/bin/bash

# Cloud Storageバケット作成スクリプト
# 使用方法: ./create-storage-bucket.sh

set -e  # エラー時に停止

echo "📦 Cloud Storageバケットを作成します..."

# プロジェクト設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
BUCKET_NAME="justjoin-platform-match-job-documents"

echo "📋 設定情報:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  リージョン: $REGION"
echo "  バケット名: $BUCKET_NAME"

# プロジェクトの設定
gcloud config set project $PROJECT_ID

# バケットの作成
echo "🏗️  Cloud Storageバケットを作成中..."
gsutil mb -l $REGION gs://$BUCKET_NAME

if [ $? -ne 0 ]; then
    echo "❌ バケットの作成に失敗しました"
    exit 1
fi

echo "✅ バケット作成完了"

# アクセス権限の設定
echo "🔐 アクセス権限を設定中..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# バケットの確認
echo "🔍 バケットの確認中..."
gsutil ls -L gs://$BUCKET_NAME

echo ""
echo "✅ Cloud Storageバケットの作成が完了しました！"
echo "📦 バケット名: $BUCKET_NAME"
echo "🌐 バケットURL: gs://$BUCKET_NAME"
echo ""
echo "🚀 次のステップ:"
echo "1. ./setup-env.gcp.shを実行して環境変数を設定"
echo "2. ./auto-migration.shを実行して移行を開始" 