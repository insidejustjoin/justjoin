#!/bin/bash

# VOICEVOXエンジンをCloud Runにデプロイするスクリプト
# VOICEVOX Engine Deployment Script for Cloud Run

set -e

echo "🚀 VOICEVOXエンジンデプロイ開始..."

# 環境変数の設定
PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
SERVICE_NAME="voicevox-engine"

echo "📋 注意: VOICEVOXエンジンは大きなモデルファイルが必要です"
echo "📋 推奨: 事前にVOICEVOXエンジンをDockerイメージとしてビルドしてください"
echo ""
echo "💡 代替案: VOICEVOXエンジンを別のサーバー（Compute Engine等）で起動し、"
echo "   そのURLを環境変数VOICEVOX_URLに設定することも可能です"
echo ""

# VOICEVOXエンジンのDockerfileを作成（簡易版）
cat > Dockerfile.voicevox << 'EOF'
FROM python:3.11-slim

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    tar \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# VOICEVOXエンジンのダウンロードとインストール
# Linux CPU版をダウンロード（最新版0.25.0）
RUN wget -q https://github.com/VOICEVOX/voicevox_engine/releases/download/0.25.0/voicevox_engine_linux-cpu-0.25.0.tar.gz && \
    tar -xzf voicevox_engine_linux-cpu-0.25.0.tar.gz && \
    rm voicevox_engine_linux-cpu-0.25.0.tar.gz && \
    chmod +x run

# ポート50021を公開
EXPOSE 50021

# ヘルスチェック用のエンドポイント
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:50021/speakers || exit 1

# VOICEVOXエンジンを起動
CMD ["./run", "--host", "0.0.0.0", "--port", "50021"]
EOF

echo "🐳 Dockerイメージをビルド中..."
REV=$(date +%Y%m%d%H%M%S)
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:$REV"

# Cloud Buildでビルド（タイムアウトを長めに設定）
echo "⏳ ビルドには時間がかかります（5-10分程度）..."
gcloud builds submit --tag $IMAGE_TAG --timeout=1800 -f Dockerfile.voicevox . || {
    echo "❌ Cloud Buildに失敗しました"
    echo "💡 ヒント: VOICEVOXエンジンは大きなファイルサイズのため、"
    echo "   Compute Engineで直接起動することを検討してください"
    rm -f Dockerfile.voicevox
    exit 1
}

echo "☁️ Cloud Runにデプロイ中..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 50021 \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 3 \
    --timeout 3600 \
    --concurrency 5

# サービスURLを取得
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo ""
echo "✅ VOICEVOXエンジンデプロイ完了！"
echo "🌐 サービスURL: $SERVICE_URL"
echo ""
echo "📋 次のステップ:"
echo "1. 面接システムの環境変数に以下を設定:"
echo "   VOICEVOX_URL=$SERVICE_URL"
echo ""
echo "2. 環境変数を更新:"
echo "   gcloud run services update justjoin-interview \\"
echo "     --region=$REGION \\"
echo "     --update-env-vars=\"VOICEVOX_URL=$SERVICE_URL\" \\"
echo "     --project=$PROJECT_ID"
echo ""
echo "💰 課金見積もり:"
echo "   - 最小インスタンス: 1（常時起動）"
echo "   - メモリ: 2Gi"
echo "   - CPU: 2"
echo "   - 月額: 約 $50-80 USD（リージョンと使用量により変動）"

# 一時ファイルを削除
rm -f Dockerfile.voicevox
