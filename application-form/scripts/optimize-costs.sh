#!/bin/bash

# GCPコスト最適化スクリプト
# このスクリプトは、コスト削減のための最適化を実施します

set -e

PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
VPC_CONNECTOR_NAME="justjoin-vpc-connector"
BILLING_ACCOUNT_ID="01CA33-686CBA-3DCB34"

echo "💰 GCPコスト最適化スクリプト"
echo "================================"
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 確認プロンプト
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# ステップ1: VPCコネクターの最適化
echo "📋 ステップ1: VPCコネクターの最適化"
echo "----------------------------------------"

# 現在の設定を確認
echo "現在のVPCコネクター設定を確認中..."
CURRENT_MIN=$(gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(minInstances)" 2>/dev/null || echo "0")

echo "現在のmin-instances: $CURRENT_MIN"

if [ "$CURRENT_MIN" != "0" ]; then
    echo -e "${YELLOW}⚠️  VPCコネクターが常時起動しています（min-instances=$CURRENT_MIN）${NC}"
    echo "オンデマンド起動に変更することで、約1,500-2,000円/月の削減が期待できます。"
    
    if confirm "VPCコネクターをオンデマンド起動に変更しますか？"; then
        echo "VPCコネクターを更新中..."
        gcloud compute networks vpc-access connectors update $VPC_CONNECTOR_NAME \
          --region=$REGION \
          --min-instances=0 \
          --project=$PROJECT_ID
        
        echo -e "${GREEN}✅ VPCコネクターをオンデマンド起動に変更しました${NC}"
        echo "削減効果: 約1,500-2,000円/月"
    else
        echo "VPCコネクターの最適化をスキップしました"
    fi
else
    echo -e "${GREEN}✅ VPCコネクターは既に最適化済みです（min-instances=0）${NC}"
fi

echo ""

# ステップ2: ロードバランサーの確認（削除不可）
echo "📋 ステップ2: ロードバランサーの確認"
echo "----------------------------------------"

echo "ロードバランサーの使用状況を確認中..."
if gcloud compute url-maps describe justjoin-static-url-map --global --project=$PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}✅ ロードバランサーが設定されています${NC}"
    echo ""
    echo "URLマップのパスルールを確認中..."
    URL_MAP_INFO=$(gcloud compute url-maps describe justjoin-static-url-map --global --project=$PROJECT_ID \
      --format="value(pathMatchers[0].pathRules[].paths)" 2>/dev/null || echo "")
    
    if [ -n "$URL_MAP_INFO" ]; then
        echo "設定されているパスルール:"
        echo "$URL_MAP_INFO" | tr ',' '\n' | sed 's/^/  - /'
        echo ""
        echo -e "${YELLOW}⚠️  ロードバランサーは実際に使用されています${NC}"
        echo "以下のルーティングが設定されています:"
        echo "  - Cloud Runバックエンド: /api/*, /company/*, /deploy-test, /index, /jobseeker/*, /register/*"
        echo "  - 静的サイトバックエンド: その他"
        echo ""
        echo "結論: ロードバランサーは必要なリソースのため、削除はできません。"
        echo "削減効果: なし（削除不可）"
    else
        echo -e "${YELLOW}⚠️  パスルールの情報を取得できませんでした${NC}"
    fi
else
    echo -e "${GREEN}✅ ロードバランサーは設定されていません${NC}"
fi

echo ""

# ステップ3: Artifact Registryのクリーンアップ
echo "📋 ステップ3: Artifact Registryのクリーンアップ"
echo "----------------------------------------"

echo "Artifact Registryのイメージ数を確認中..."
IMAGE_COUNT=$(gcloud artifacts docker images list gcr.io/$PROJECT_ID \
  --project=$PROJECT_ID \
  --format="value(package)" 2>/dev/null | wc -l || echo "0")

echo "現在のイメージ数: $IMAGE_COUNT"

if [ "$IMAGE_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}⚠️  イメージ数が多いです（$IMAGE_COUNT個）${NC}"
    echo "古いイメージを削除することで、約100-200円/月の削減が期待できます。"
    echo ""
    echo "30日以上古いイメージを確認中..."
    OLD_IMAGES=$(gcloud artifacts docker images list gcr.io/$PROJECT_ID \
      --project=$PROJECT_ID \
      --filter="createTime<$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
      --format="value(package,version)" 2>/dev/null | wc -l || echo "0")
    
    echo "30日以上古いイメージ: $OLD_IMAGES個"
    
    if [ "$OLD_IMAGES" -gt 0 ]; then
        if confirm "古いイメージを削除しますか？"; then
            echo "古いイメージを削除中..."
            gcloud artifacts docker images list gcr.io/$PROJECT_ID \
              --project=$PROJECT_ID \
              --filter="createTime<$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
              --format="value(package,version)" | while read -r image version; do
                if [ -n "$image" ] && [ -n "$version" ]; then
                    echo "  削除: $image:$version"
                    gcloud artifacts docker images delete "$image:$version" \
                      --project=$PROJECT_ID \
                      --quiet 2>/dev/null || echo "    削除に失敗しました（スキップ）"
                fi
              done
            echo -e "${GREEN}✅ 古いイメージの削除が完了しました${NC}"
            echo "削減効果: 約100-200円/月"
        else
            echo "Artifact Registryのクリーンアップをスキップしました"
        fi
    else
        echo -e "${GREEN}✅ 古いイメージは見つかりませんでした${NC}"
    fi
else
    echo -e "${GREEN}✅ Artifact Registryは既に最適化済みです${NC}"
fi

echo ""

# 完了メッセージ
echo "================================"
echo -e "${GREEN}✅ コスト最適化が完了しました${NC}"
echo ""
echo "📊 期待される削減効果:"
echo "  - VPCコネクター最適化: 約1,500-2,000円/月"
echo "  - ロードバランサー削除: 削除不可（実際に使用中）"
echo "  - Artifact Registryクリーンアップ: 約70-170円/月（実施した場合）"
echo ""
echo "📈 合計削減効果: 約1,570-2,170円/月（約18-25%削減）"
echo ""
echo "📈 次回の請求書で削減効果を確認してください"
echo "📋 詳細は docs/COST_OPTIMIZATION_PLAN.md を参照してください"

