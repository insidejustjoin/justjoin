# GCP月額コスト分析（2025年12月実績）

## 請求額サマリー

**合計: 8,818円（約$59 USD）**

## 内訳（2025年12月）

| サービス | 金額 | 割合 | 備考 |
|---------|------|------|------|
| **Networking（ネットワーク）** | **2,913円** | **33%** | ⚠️ 主なコスト要因 |
| **Compute Engine** | **2,667円** | **30%** | ⚠️ 主なコスト要因 |
| **Cloud SQL** | **1,983円** | **23%** | 固定費（予想通り） |
| **税金** | **802円** | **9%** | 消費税10% |
| **Artifact Registry** | **373円** | **4%** | Dockerイメージ保存 |
| **Cloud Storage** | **60円** | **1%** | ストレージ料金 |
| **Cloud Run** | **20円** | **0.2%** | ✅ 非常に低コスト |
| **Cloud Build** | **0円** | **0%** | 無料枠内 |

## 主なコスト要因の分析

### 1. Networking（ネットワーク）: 2,913円（33%）

**原因**: グローバルロードバランサー（Cloud Load Balancer）

#### 確認されたリソース:
- `justjoin-static-forwarding-rule` (HTTP)
- `justjoin-static-https-forwarding-rule` (HTTPS)
- `justjoin-static-url-map`
- `justjoin-static-http-proxy`
- `justjoin-static-https-proxy`

#### コスト内訳（推定）:
- **グローバルロードバランサー固定費**: 約$18-25 USD/月（約2,700-3,750円）
  - 転送ルール: 約$18/月/ルール
  - このケースでは、HTTP/HTTPSの2つの転送ルールがある可能性
- **データ転送料金**: トラフィック量に応じて
- **IPアドレス**: グローバルIPアドレスの予約料金

#### 対処法:
1. **ロードバランサーの必要性を再検討**
   - Cloud Runに直接ドメインをマッピングすれば、ロードバランサーは不要
   - 現在は静的サイト用に設定されているが、Cloud Runを使用しているなら削除可能

2. **不要な転送ルールを削除**
   - 使用していない転送ルールがあれば削除

### 2. Compute Engine: 2,667円（30%）

**原因**: VPCコネクターまたはその他のネットワークリソース

#### 可能性のあるリソース:
- **VPCコネクター** (`justjoin-vpc-connector`)
  - 最小インスタンス数: 2
  - マシンタイプ: e2-micro
  - コスト: 約$7-15 USD/月（約1,050-2,250円）
- **NATゲートウェイ**（使用している場合）
- **その他のネットワークリソース**

#### 対処法:
1. **VPCコネクターの最適化**
   - `min-instances`を0に設定（オンデマンド起動）
   - または、Cloud SQLへの接続が不要なら削除

2. **不要なネットワークリソースの確認**
   - 使用していないリソースを削除

### 3. Cloud SQL: 1,983円（23%）

**構成**: db-f1-micro, 10GB SSD
- **固定費**: $7.50/月（約1,125円）+ 消費税 = **約1,237円**
- **実際の請求額**: 1,983円
- **差分**: 約746円（バックアップやネットワーク料金の可能性）

#### 対処法:
- 現在は最小構成で最適化済み
- データ量が増加した場合のみ容量を追加

### 4. Artifact Registry: 373円（4%）

**原因**: Dockerイメージの保存
- ストレージ: 約5-10GB
- コスト: 約$0.10/GB/月 × 5-10GB = **約$0.50-1.00/月**

#### 対処法:
1. **古いイメージの削除**
   - 不要なDockerイメージを定期的に削除
   - ライフサイクルポリシーの設定

2. **イメージの圧縮**
   - マルチステージビルドでイメージサイズを削減

## コスト削減の推奨事項

### 即座に実施可能な削減策

#### 1. ロードバランサーの削除（最大の削減効果）
```bash
# 使用していない場合は削除
gcloud compute forwarding-rules delete justjoin-static-forwarding-rule --global
gcloud compute forwarding-rules delete justjoin-static-https-forwarding-rule --global
gcloud compute target-http-proxies delete justjoin-static-http-proxy --global
gcloud compute target-https-proxies delete justjoin-static-https-proxy --global
gcloud compute url-maps delete justjoin-static-url-map --global
```

**削減効果**: 約2,000-3,000円/月

#### 2. VPCコネクターの最適化
```bash
# min-instancesを0に設定（オンデマンド起動）
gcloud compute networks vpc-access connectors update justjoin-vpc-connector \
  --region=asia-northeast1 \
  --min-instances=0
```

**削減効果**: 約500-1,000円/月

#### 3. Artifact Registryのクリーンアップ
```bash
# 古いイメージを確認
gcloud artifacts docker images list gcr.io/justjoin-platform --format="table(package,version,createTime)"

# 30日以上古いイメージを削除
# （スクリプトを作成して自動化）
```

**削減効果**: 約100-200円/月

### 削減後の見積もり

| 項目 | 現在 | 削減後 | 削減額 |
|------|------|--------|--------|
| Networking | 2,913円 | 0-500円 | 2,400-2,900円 |
| Compute Engine | 2,667円 | 500-1,000円 | 1,700-2,200円 |
| Cloud SQL | 1,983円 | 1,983円 | 0円 |
| 税金 | 802円 | 200-300円 | 500-600円 |
| Artifact Registry | 373円 | 100-200円 | 170-270円 |
| Cloud Storage | 60円 | 60円 | 0円 |
| Cloud Run | 20円 | 20円 | 0円 |
| **合計** | **8,818円** | **2,863-4,063円** | **約4,800-6,000円削減** |

## まとめ

### 現在のコスト構造
- **ネットワーク関連が67%**（Networking + Compute Engine）
- **Cloud SQLが23%**（固定費、最適化済み）
- **その他が10%**（Artifact Registry、Cloud Storage等）

### 主な問題点
1. ⚠️ **グローバルロードバランサーが不要**（Cloud Runに直接ドメインをマッピング可能）
2. ⚠️ **VPCコネクターの最適化が必要**（min-instances=0に設定）
3. ⚠️ **Artifact Registryのクリーンアップが必要**（古いイメージを削除）

### 削減後の見積もり
- **現在**: 8,818円/月（約$59 USD）
- **削減後**: 2,863-4,063円/月（約$19-27 USD）
- **削減額**: 約4,800-6,000円/月（約54-68%削減）

### 推奨アクション
1. ✅ **ロードバランサーの削除**（最大の削減効果）
2. ✅ **VPCコネクターの最適化**（min-instances=0）
3. ✅ **Artifact Registryのクリーンアップ**（古いイメージの削除）
4. ✅ **定期的なコスト監視**（Cloud Monitoringでアラート設定）

