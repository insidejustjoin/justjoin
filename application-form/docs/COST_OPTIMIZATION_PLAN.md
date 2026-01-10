# GCPコスト最適化計画

## 📊 現状分析（2025年12月実績）

**現在の月額コスト: 8,818円（約$59 USD）**

### 問題点の特定

| サービス | 金額 | 割合 | 問題点 | 優先度 |
|---------|------|------|--------|--------|
| **Networking** | **2,913円** | **33%** | グローバルロードバランサーが不要の可能性 | 🔴 高 |
| **Compute Engine** | **2,667円** | **30%** | VPCコネクターが常時起動（min-instances=2） | 🔴 高 |
| **Cloud SQL** | **1,983円** | **23%** | 最小構成（最適化済み） | 🟢 低 |
| **税金** | **802円** | **9%** | 消費税（削減不可） | ⚪ - |
| **Artifact Registry** | **373円** | **4%** | 古いDockerイメージの蓄積 | 🟡 中 |
| **Cloud Storage** | **60円** | **1%** | 最適化済み | 🟢 低 |
| **Cloud Run** | **20円** | **0.2%** | 最適化済み | 🟢 低 |

## 🎯 コスト削減計画

### フェーズ1: 即座に実施可能な削減（優先度: 高）

#### 1.1 VPCコネクターの最適化 ⭐ 最大の削減効果

**問題点**: 
- VPCコネクターが`min-instances=2`で常時起動している
- e2-micro × 2インスタンス = 約$15-20 USD/月（約2,250-3,000円）

**解決策**:
- `min-instances`を0に設定（オンデマンド起動）
- Cloud SQLへの接続時に自動的に起動し、使用後は停止

**実施手順**:
```bash
# 1. VPCコネクターの設定を確認
gcloud compute networks vpc-access connectors describe justjoin-vpc-connector \
  --region=asia-northeast1 \
  --project=justjoin-platform

# 2. min-instancesを0に設定（オンデマンド起動）
gcloud compute networks vpc-access connectors update justjoin-vpc-connector \
  --region=asia-northeast1 \
  --min-instances=0 \
  --project=justjoin-platform

# 3. 変更を確認
gcloud compute networks vpc-access connectors describe justjoin-vpc-connector \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --format="value(minInstances)"
```

**削減効果**: 約1,500-2,000円/月（約17-23%削減）

**リスク**: 
- コールドスタート時（Cloud SQL接続時）に数秒の遅延が発生する可能性
- 影響: ほぼなし（接続は数秒で確立されるため）

---

#### 1.2 ロードバランサーの確認結果 ⚠️ 削除不可

**確認結果**: 
- ロードバランサーは実際に使用されています
- URLマップに以下のパスルールが設定されています：
  - `/api/*`, `/company/*`, `/deploy-test`, `/index`, `/jobseeker/*`, `/register/*` → Cloud Runバックエンド
  - その他 → 静的サイトバックエンドバケット
- 静的サイトとCloud Runの両方にルーティングしているため、削除は不可

**結論**: 
- ロードバランサーは必要なリソースのため、削除はできません
- コスト削減の優先度: **低**（削除不可）

**代替案**（将来の検討事項）:
- 将来的にCloud Runのみを使用する場合は、ロードバランサーを削除して直接ドメインマッピングに切り替え可能
- その場合の削減効果: 約2,700-3,000円/月

---

### フェーズ2: 中期的な最適化（優先度: 中）

#### 2.1 Artifact Registryのクリーンアップ

**問題点**: 
- 古いDockerイメージが蓄積されている
- ストレージコスト: 約$0.10/GB/月

**解決策**:
- 30日以上古いイメージを自動削除
- ライフサイクルポリシーの設定

**実施手順**:
```bash
# 1. 現在のイメージ数を確認
gcloud artifacts docker images list gcr.io/justjoin-platform \
  --project=justjoin-platform \
  --format="table(package,version,createTime,updateTime)"

# 2. 古いイメージを確認（30日以上前）
gcloud artifacts docker images list gcr.io/justjoin-platform \
  --project=justjoin-platform \
  --filter="createTime<$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --format="table(package,version,createTime)"

# 3. 自動削除スクリプトの作成（推奨）
# scripts/cleanup-old-images.sh を作成

# 4. 定期的な実行を設定（Cloud Schedulerまたはcron）
```

**削減効果**: 約100-200円/月（約1-2%削減）

---

### フェーズ3: 継続的なモニタリング

#### 3.1 コストアラートの設定

**目的**: コストの急増を早期に検知

**実施手順**:
```bash
# 1. 予算の作成（月額$50 USD、約7,500円）
gcloud billing budgets create \
  --billing-account=01CA33-686CBA-3DCB34 \
  --display-name="JustJoin Monthly Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100 \
  --notification-rules=pubsub-topic=projects/justjoin-platform/topics/billing-alerts \
  --project=justjoin-platform
```

**効果**: コストの急増を早期に検知し、適切な対応が可能

---

## 📋 実施チェックリスト

### 即座に実施（優先度: 高）

- [ ] **1. VPCコネクターの最適化**
  - [ ] 現在の設定を確認
  - [ ] `min-instances=0`に設定
  - [ ] 動作確認（Cloud SQL接続テスト）
  - [ ] コスト削減を確認（翌月の請求書で）

- [ ] **2. ロードバランサーの確認と削除（要確認）**
  - [ ] Cloud Runサービスのドメインマッピングを確認
  - [ ] ロードバランサーの使用状況を確認
  - [ ] 使用していないことを確認
  - [ ] 削除を実施（慎重に）
  - [ ] DNS設定を確認
  - [ ] サイトの動作確認

### 中期的に実施（優先度: 中）

- [ ] **3. Artifact Registryのクリーンアップ**
  - [ ] 現在のイメージ数を確認
  - [ ] 古いイメージのリストを作成
  - [ ] 自動削除スクリプトを作成
  - [ ] 定期実行を設定

- [ ] **4. コストアラートの設定**
  - [ ] 予算を作成
  - [ ] アラート通知を設定
  - [ ] テスト実行

---

## 📈 削減効果の見積もり

### 削減後のお見積もり（実行可能な範囲）

| 項目 | 現在 | 削減後 | 削減額 |
|------|------|--------|--------|
| Networking | 2,913円 | 2,913円 | 0円（削除不可） |
| Compute Engine | 2,667円 | 667-1,167円 | **1,500-2,000円** |
| Cloud SQL | 1,983円 | 1,983円 | 0円 |
| 税金 | 802円 | 700-750円 | 50-100円 |
| Artifact Registry | 373円 | 200-300円 | **70-170円** |
| Cloud Storage | 60円 | 60円 | 0円 |
| Cloud Run | 20円 | 20円 | 0円 |
| **合計** | **8,818円** | **6,543-7,193円** | **約1,625-2,275円削減** |

### 削減率（実行可能な範囲）

- **現在**: 8,818円/月（約$59 USD）
- **削減後**: 6,543-7,193円/月（約$44-48 USD）
- **削減率**: **約18-26%削減**
- **年間削減額**: 約19,500-27,300円（約$130-180 USD）

---

## 🚀 実施手順（優先順位順）

### ステップ1: VPCコネクターの最適化（即座に実施）

```bash
# VPCコネクターをオンデマンド起動に変更
gcloud compute networks vpc-access connectors update justjoin-vpc-connector \
  --region=asia-northeast1 \
  --min-instances=0 \
  --project=justjoin-platform

# 確認
gcloud compute networks vpc-access connectors describe justjoin-vpc-connector \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --format="yaml(minInstances,maxInstances,machineType)"
```

**期待される削減**: 約1,500-2,000円/月

---

### ステップ2: ロードバランサーの確認（慎重に実施）

```bash
# 1. Cloud Runサービスのドメインマッピングを確認
gcloud run domain-mappings list \
  --region=asia-northeast1 \
  --project=justjoin-platform

# 2. ロードバランサーの使用状況を確認
gcloud compute url-maps describe justjoin-static-url-map \
  --global \
  --project=justjoin-platform

# 3. 転送ルールのIPアドレスを確認
gcloud compute forwarding-rules list \
  --global \
  --project=justjoin-platform \
  --format="table(name,IPAddress,target)"
```

**確認事項**:
- [ ] Cloud Runに直接ドメインがマッピングされているか
- [ ] ロードバランサーのIPアドレスがDNSに設定されているか
- [ ] 静的サイト（Cloud Storage）が使用されているか

**使用していない場合のみ削除を実施**（削減効果: 約2,700-3,000円/月）

---

### ステップ3: Artifact Registryのクリーンアップ（中期的に実施）

```bash
# 古いイメージの確認スクリプトを作成
cat > scripts/cleanup-old-images.sh << 'EOF'
#!/bin/bash
PROJECT_ID="justjoin-platform"
DAYS_OLD=30

# 30日以上古いイメージをリストアップ
gcloud artifacts docker images list gcr.io/${PROJECT_ID} \
  --project=${PROJECT_ID} \
  --filter="createTime<$(date -u -d "${DAYS_OLD} days ago" +%Y-%m-%dT%H:%M:%SZ)" \
  --format="value(package,version)" | while read -r image version; do
    echo "削除対象: ${image}:${version}"
    # 実際に削除する場合は以下のコメントを外す
    # gcloud artifacts docker images delete ${image}:${version} \
    #   --project=${PROJECT_ID} \
    #   --quiet
  done
EOF

chmod +x scripts/cleanup-old-images.sh
```

**期待される削減**: 約100-200円/月

---

## ⚠️ 注意事項

### VPCコネクターの最適化
- コールドスタート時に数秒の遅延が発生する可能性がありますが、通常は問題ありません
- Cloud SQLへの接続は自動的に確立されるため、ユーザーへの影響は最小限です

### ロードバランサーの削除
- **削除前に必ず使用状況を確認してください**
- 静的サイトが使用されている場合は削除できません
- DNS設定が変更される可能性があるため、事前にバックアップを取ってください

### Artifact Registryのクリーンアップ
- 古いイメージを削除する前に、必要なイメージを確認してください
- 自動削除スクリプトを実行する前に、テスト実行で確認してください

---

## 📊 モニタリング

### コストの追跡

```bash
# 現在のコストを確認
gcloud billing accounts get-usage \
  --billing-account=01CA33-686CBA-3DCB34 \
  --project=justjoin-platform

# 月間のサービス別コストを確認
gcloud billing projects describe justjoin-platform \
  --format="value(projectId)"
```

### 次回請求書での確認事項

1. **Networking**: 削減されているか（ロードバランサー削除後）
2. **Compute Engine**: 削減されているか（VPCコネクター最適化後）
3. **Artifact Registry**: 削減されているか（クリーンアップ後）
4. **合計額**: 目標の2,963-4,063円/月に近づいているか

---

## 🎯 目標（実行可能な範囲）

**削減後の目標コスト: 6,543-7,193円/月（約$44-48 USD）**

- 現在: 8,818円/月
- 削減後: 6,543-7,193円/月
- **削減額: 約1,625-2,275円/月（約18-26%削減）**

この最適化により、**年間で約19,500-27,300円（約$130-180 USD）の削減**が期待できます。

### 将来の最適化の可能性

- **ロードバランサーの削除**（将来的にCloud Runのみに統合した場合）
  - 追加削減額: 約2,700-3,000円/月
  - その場合の合計削減額: 約4,325-5,275円/月（約49-60%削減）

