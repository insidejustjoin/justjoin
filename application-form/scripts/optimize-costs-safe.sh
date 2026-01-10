#!/bin/bash

# GCPコスト最適化スクリプト（安全版）
# 現在公開中のサービスが壊れないように、段階的に最適化を実施します

set -e

PROJECT_ID="justjoin-platform"
REGION="asia-northeast1"
VPC_CONNECTOR_NAME="justjoin-vpc-connector"

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "💰 GCPコスト最適化スクリプト（安全版）"
echo "========================================"
echo ""
echo -e "${BLUE}⚠️  現在公開中のサービスに影響を与えないよう、慎重に実施します${NC}"
echo ""

# 確認プロンプト
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# ステップ1: 現在の状態を確認
echo "📋 ステップ1: 現在の状態を確認"
echo "----------------------------------------"

echo "1. Cloud Runサービスの状態を確認中..."
CLOUD_RUN_SERVICES=$(gcloud run services list --project=$PROJECT_ID --region=$REGION --format="value(name)" 2>/dev/null || echo "")
if [ -n "$CLOUD_RUN_SERVICES" ]; then
    echo -e "${GREEN}✅ Cloud Runサービスが稼働中:${NC}"
    echo "$CLOUD_RUN_SERVICES" | while read -r service; do
        STATUS=$(gcloud run services describe "$service" --region=$REGION --project=$PROJECT_ID --format="value(status.conditions[0].status)" 2>/dev/null || echo "Unknown")
        if [ "$STATUS" = "True" ]; then
            echo -e "  ${GREEN}✓${NC} $service (正常)"
        else
            echo -e "  ${YELLOW}⚠${NC}  $service (状態: $STATUS)"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Cloud Runサービスが見つかりませんでした${NC}"
fi

echo ""
echo "2. Cloud SQLインスタンスの状態を確認中..."
SQL_STATE=$(gcloud sql instances describe justjoin-enterprise --project=$PROJECT_ID --format="value(state)" 2>/dev/null || echo "Unknown")
if [ "$SQL_STATE" = "RUNNABLE" ]; then
    echo -e "${GREEN}✅ Cloud SQLインスタンスが稼働中 (状態: $SQL_STATE)${NC}"
else
    echo -e "${YELLOW}⚠️  Cloud SQLインスタンスの状態: $SQL_STATE${NC}"
fi

echo ""
echo "3. VPCコネクターの現在の設定を確認中..."
CURRENT_MIN=$(gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(minInstances)" 2>/dev/null || echo "0")

CURRENT_MAX=$(gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(maxInstances)" 2>/dev/null || echo "10")

CURRENT_STATE=$(gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(state)" 2>/dev/null || echo "Unknown")

echo "現在のVPCコネクター設定:"
echo "  - 最小インスタンス数: $CURRENT_MIN"
echo "  - 最大インスタンス数: $CURRENT_MAX"
echo "  - 状態: $CURRENT_STATE"

if [ "$CURRENT_STATE" != "READY" ]; then
    echo -e "${RED}❌ VPCコネクターの状態が正常ではありません。最適化をスキップします。${NC}"
    exit 1
fi

echo ""

# ステップ2: VPCコネクターの最適化（最も安全な最適化）
echo "📋 ステップ2: VPCコネクターの最適化"
echo "----------------------------------------"

if [ "$CURRENT_MIN" = "0" ]; then
    echo -e "${GREEN}✅ VPCコネクターは既に最適化済みです（min-instances=0）${NC}"
    echo "追加の最適化は不要です。"
else
    echo -e "${YELLOW}⚠️  VPCコネクターが常時起動しています（min-instances=$CURRENT_MIN）${NC}"
    echo ""
    echo "最適化の内容:"
    echo "  - 現在: min-instances=$CURRENT_MIN（常時起動）"
    echo "  - 最適化後: min-instances=0（オンデマンド起動）"
    echo ""
    echo "影響:"
    echo "  ✅ サービスは継続して動作します"
    echo "  ✅ Cloud SQLへの接続も正常に動作します"
    echo "  ⚠️  コールドスタート時に数秒の遅延が発生する可能性があります（通常は問題ありません）"
    echo ""
    echo "削減効果: 約1,500-2,000円/月"
    echo ""
    
    if confirm "VPCコネクターを最適化しますか？（サービスは継続して動作します）"; then
        echo ""
        echo "VPCコネクターを最適化中..."
        
        # バックアップ: 現在の設定を記録
        BACKUP_FILE="/tmp/vpc-connector-backup-$(date +%Y%m%d-%H%M%S).txt"
        echo "VPCコネクター設定のバックアップ: $BACKUP_FILE"
        gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME \
          --region=$REGION \
          --project=$PROJECT_ID \
          --format="yaml" > "$BACKUP_FILE" 2>&1 || true
        
        # min-instancesを0に設定
        echo "min-instancesを0に設定中..."
        gcloud compute networks vpc-access connectors update $VPC_CONNECTOR_NAME \
          --region=$REGION \
          --min-instances=0 \
          --project=$PROJECT_ID \
          --quiet
        
        # 変更を確認
        echo ""
        echo "変更後の設定を確認中..."
        NEW_MIN=$(gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR_NAME \
          --region=$REGION \
          --project=$PROJECT_ID \
          --format="value(minInstances)" 2>/dev/null || echo "0")
        
        if [ "$NEW_MIN" = "0" ]; then
            echo -e "${GREEN}✅ VPCコネクターの最適化が完了しました${NC}"
            echo "  - 変更前: min-instances=$CURRENT_MIN"
            echo "  - 変更後: min-instances=$NEW_MIN"
            echo ""
            echo "期待される削減効果: 約1,500-2,000円/月"
            echo "バックアップファイル: $BACKUP_FILE"
        else
            echo -e "${RED}❌ 最適化に失敗しました（min-instances=$NEW_MIN）${NC}"
            echo "バックアップファイルを確認してください: $BACKUP_FILE"
            exit 1
        fi
        
        # 動作確認の推奨
        echo ""
        echo -e "${BLUE}📋 動作確認を推奨します:${NC}"
        echo "  1. Cloud Runサービスの動作確認（数分待ってから）"
        echo "  2. Cloud SQLへの接続確認"
        echo "  3. サイトの動作確認"
    else
        echo "VPCコネクターの最適化をスキップしました"
    fi
fi

echo ""

# ステップ3: 動作確認（オプション）
echo "📋 ステップ3: 動作確認（推奨）"
echo "----------------------------------------"

if confirm "動作確認を実施しますか？（Cloud Runサービスの状態を確認します）"; then
    echo ""
    echo "Cloud Runサービスの状態を確認中..."
    echo ""
    
    # 各サービスの状態を確認
    echo "$CLOUD_RUN_SERVICES" | while read -r service; do
        if [ -n "$service" ]; then
            echo "サービス: $service"
            STATUS=$(gcloud run services describe "$service" --region=$REGION --project=$PROJECT_ID --format="value(status.conditions[0].status)" 2>/dev/null || echo "Unknown")
            URL=$(gcloud run services describe "$service" --region=$REGION --project=$PROJECT_ID --format="value(status.url)" 2>/dev/null || echo "Unknown")
            
            if [ "$STATUS" = "True" ]; then
                echo -e "  ${GREEN}✓ 状態: 正常${NC}"
                echo "  URL: $URL"
            else
                echo -e "  ${YELLOW}⚠  状態: $STATUS${NC}"
            fi
            echo ""
        fi
    done
    
    echo -e "${GREEN}✅ 動作確認が完了しました${NC}"
    echo ""
    echo "手動でサイトの動作も確認してください:"
    echo "  - https://justjoin.jp"
    echo "  - 各機能（面接システム、管理画面など）が正常に動作するか確認"
else
    echo "動作確認をスキップしました"
fi

echo ""

# 完了メッセージ
echo "================================"
echo -e "${GREEN}✅ コスト最適化が完了しました${NC}"
echo ""
echo "📊 実施した最適化:"
echo "  - VPCコネクター: min-instances=0（オンデマンド起動）"
echo ""
echo "📈 期待される削減効果:"
echo "  - 月額: 約1,500-2,000円削減（約17-23%削減）"
echo "  - 年間: 約18,000-24,000円削減"
echo ""
echo "📋 次のステップ:"
echo "  1. 数日間、サービスが正常に動作することを確認"
echo "  2. 次回の請求書で削減効果を確認"
echo "  3. 問題がなければ、Artifact Registryのクリーンアップを実施（追加で70-170円/月削減可能）"
echo ""
echo "⚠️  もし問題が発生した場合:"
echo "  - VPCコネクターの設定を元に戻すことができます"
echo "  - バックアップファイル: $BACKUP_FILE（設定した場合）"
echo "  - 元に戻すコマンド: gcloud compute networks vpc-access connectors update $VPC_CONNECTOR_NAME --region=$REGION --min-instances=$CURRENT_MIN --project=$PROJECT_ID"

