# HubSpot APIキーの環境変数設定手順

## 方法1: env.gcp.yamlに追加（推奨）

`env.gcp.yaml`ファイルに以下の行を追加してください：

```yaml
HUBSPOT_API_KEY: "your-hubspot-api-key-here"
```

**注意**: `env.gcp.yaml`は`.gitignore`に含まれているため、APIキーがリポジトリにコミットされることはありません。

## 方法2: GCP Consoleから直接設定

1. [GCP Console](https://console.cloud.google.com/)にログイン
2. **Cloud Run** > **justjoin** サービスを選択
3. **「編集と新しいリビジョンをデプロイ」**をクリック
4. **「変数とシークレット」**タブを開く
5. **「変数を追加」**をクリック
6. 以下を入力：
   - **名前**: `HUBSPOT_API_KEY`
   - **値**: `your-hubspot-api-key-here`（実際のAPIキーを入力）
7. **「デプロイ」**をクリック

## 方法3: gcloudコマンドで設定

```bash
gcloud run services update justjoin \
  --set-env-vars HUBSPOT_API_KEY=your-hubspot-api-key-here \
  --region=asia-northeast1 \
  --project=justjoin-platform
```

## 確認方法

環境変数が正しく設定されているか確認：

```bash
gcloud run services describe justjoin \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --format="value(spec.template.spec.containers[0].env)"
```

または、GCP ConsoleのCloud Runサービス詳細ページで確認できます。

## トラブルシューティング

### 環境変数が反映されない場合

1. サービスを再デプロイしてください：
   ```bash
   cd application-form
   ./deploy-gcp.sh
   ```

2. ログで確認：
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=justjoin" \
     --limit 50 \
     --project=justjoin-platform \
     --format="table(timestamp,textPayload)"
   ```

### HubSpot連携が動作しない場合

- 環境変数 `HUBSPOT_API_KEY` が設定されているか確認
- HubSpotのAPIキーに必要なスコープが付与されているか確認
- サーバーログでHubSpot連携エラーを確認

