#!/bin/bash

# Cloud Storage権限確認スクリプト
# Just Join Platform Cloud Storage Permissions Check Script

set -e

echo "🔍 Cloud Storage権限を確認中..."

# 環境変数の設定
PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-justjoin-platform}"
BUCKET_NAME="${GOOGLE_CLOUD_STORAGE_BUCKET:-justjoin-platform-match-job-documents}"

echo "📋 設定内容:"
echo "  プロジェクトID: $PROJECT_ID"
echo "  バケット名: $BUCKET_NAME"

# Cloud Runサービスアカウントの確認
echo ""
echo "🔍 Cloud Runサービスアカウントを確認中..."
SERVICE_ACCOUNT=$(gcloud run services describe justjoin --region=asia-northeast1 --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo "")
if [ -z "$SERVICE_ACCOUNT" ]; then
  SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
  echo "  ⚠️  サービスアカウントが設定されていません。デフォルトを使用: $SERVICE_ACCOUNT"
else
  echo "  ✅ サービスアカウント: $SERVICE_ACCOUNT"
fi

# Cloud StorageバケットのIAM権限を確認
echo ""
echo "🔍 Cloud StorageバケットのIAM権限を確認中..."
gsutil iam get "gs://$BUCKET_NAME" 2>&1 | grep -E "(roles/|members:|serviceAccount:)" | head -20

# サービスアカウントの権限を確認
echo ""
echo "🔍 サービスアカウント ($SERVICE_ACCOUNT) の権限を確認中..."
if gsutil iam ch -d "$SERVICE_ACCOUNT:objectViewer" "gs://$BUCKET_NAME" 2>&1 | grep -q "does not have"; then
  echo "  ⚠️  objectViewer権限がありません"
else
  echo "  ✅ objectViewer権限があります"
fi

# 署名付きURL生成に必要な権限を確認
echo ""
echo "🔍 署名付きURL生成に必要な権限を確認中..."
echo "  必要な権限:"
echo "    - storage.objects.get (objectViewerロール)"
echo "    - serviceAccountTokenCreatorロール（プロジェクトレベル）"
echo ""

# サービスアカウントトークン作成者ロールの確認
echo "🔍 サービスアカウントトークン作成者ロールを確認中..."
if gcloud projects get-iam-policy "$PROJECT_ID" --flatten="bindings[].members" --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" --format="table(bindings.role)" 2>&1 | grep -q "serviceAccountTokenCreator"; then
  echo "  ✅ serviceAccountTokenCreatorロールがあります"
else
  echo "  ⚠️  serviceAccountTokenCreatorロールがありません"
  echo ""
  echo "  🔧 以下のコマンドで権限を付与してください:"
  echo "     gcloud projects add-iam-policy-binding $PROJECT_ID \\"
  echo "       --member='serviceAccount:${SERVICE_ACCOUNT}' \\"
  echo "       --role='roles/iam.serviceAccountTokenCreator'"
fi

echo ""
echo "✅ 権限確認完了"


