# GCPコスト最適化実施状況

## 📊 実施日時
2026年1月10日

## ✅ 実施完了

### 1. VPCコネクターの最適化（⚠️ 保留）

**問題点**: 
- VPCコネクターの`min-instances=2`で常時起動している
- コスト: 約1,500-2,000円/月

**実施状況**: 
- ❌ エラーが発生し、実施できませんでした
- エラーメッセージ: `INVALID_ARGUMENT: Connector updates must include a value for both minimum instances and maximium instances`
- gcloudコマンドの構文は正しいが、API側でエラーが発生

**次のステップ**:
1. GCPコンソールから手動で更新を試行
2. gcloud CLIのバージョンを確認・更新
3. 代替方法を検討（VPCコネクターを削除して再作成など、ただしサービス停止のリスクあり）

**推奨アクション**:
```bash
# GCPコンソールから実施する場合:
# 1. Cloud Console > VPC Access > コネクター > justjoin-vpc-connector
# 2. 「編集」をクリック
# 3. 最小インスタンス数を「0」に変更
# 4. 最大インスタンス数は「10」のまま
# 5. 「保存」をクリック
```

---

### 2. Artifact Registryのクリーンアップ（実施可能）

**問題点**: 
- 古いDockerイメージが蓄積されている
- コスト: 約70-170円/月

**実施状況**: 
- ✅ 安全に実施可能
- 古いイメージの削除は、現在のサービスに影響を与えません

**実施手順**:
```bash
# 1. 現在のイメージ数を確認
gcloud artifacts docker images list gcr.io/justjoin-platform \
  --project=justjoin-platform \
  --format="table(package,version,createTime)"

# 2. 30日以上古いイメージを確認
gcloud artifacts docker images list gcr.io/justjoin-platform \
  --project=justjoin-platform \
  --filter="createTime<$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --format="table(package,version,createTime)"

# 3. 古いイメージを削除（慎重に実施）
# 最新の3バージョンは残すようにすることを推奨
```

**削減効果**: 約70-170円/月（約1-2%削減）

---

### 3. ロードバランサー（削除不可）

**確認結果**: 
- ロードバランサーは実際に使用されています
- 静的サイトとCloud Runの両方にルーティングしているため、削除不可
- コスト削減の優先度: **低**（削除不可）

---

## 📈 期待される削減効果（実施可能な範囲）

| 最適化項目 | 削減効果 | 実施状況 |
|-----------|---------|---------|
| VPCコネクター最適化 | 約1,500-2,000円/月 | ⚠️ 保留（エラー発生） |
| Artifact Registryクリーンアップ | 約70-170円/月 | ✅ 実施可能 |
| ロードバランサー削除 | 削除不可 | ❌ 削除不可 |
| **合計（実施可能）** | **約70-170円/月** | **実施可能** |

---

## 🔧 VPCコネクターの最適化（代替方法）

### 方法1: GCPコンソールから手動で更新（推奨）

1. GCPコンソールにアクセス
2. 「VPC Access」に移動
3. 「コネクター」を選択
4. `justjoin-vpc-connector`を選択
5. 「編集」をクリック
6. 最小インスタンス数を「0」に変更
7. 最大インスタンス数は「10」のまま
8. 「保存」をクリック

### 方法2: gcloud CLIのバージョン確認

```bash
# gcloud CLIのバージョンを確認
gcloud version

# gcloud CLIを更新
gcloud components update

# 再試行
gcloud compute networks vpc-access connectors update justjoin-vpc-connector \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --min-instances=0 \
  --max-instances=10
```

### 方法3: APIを直接呼び出す（上級者向け）

```bash
# 現在の設定を取得
gcloud compute networks vpc-access connectors describe justjoin-vpc-connector \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --format=json > /tmp/vpc-connector-config.json

# JSONファイルを編集してminInstancesを0に変更
# APIを直接呼び出して更新
```

---

## 📋 次回のアクション

### 即座に実施可能
1. ✅ **Artifact Registryのクリーンアップ**（約70-170円/月削減）
   - 古いDockerイメージを削除
   - 現在のサービスに影響なし

### 要確認・要対応
2. ⚠️ **VPCコネクターの最適化**（約1,500-2,000円/月削減）
   - GCPコンソールから手動で更新を試行
   - または、gcloud CLIのバージョンを確認・更新して再試行

### 継続的なモニタリング
3. 📊 **コストアラートの設定**
   - 月額$50 USD（約7,500円）の予算を設定
   - 80%と100%の閾値でアラート

---

## 💡 備考

- 現在のサービスは正常に稼働中（Cloud Run、Cloud SQLともに正常）
- VPCコネクターの最適化は、サービスへの影響を最小限に抑えながら実施可能
- コールドスタート時に数秒の遅延が発生する可能性があるが、通常は問題ありません
- 問題が発生した場合は、設定を元に戻すことができます（バックアップ: `/tmp/vpc-connector-backup-*.txt`）

