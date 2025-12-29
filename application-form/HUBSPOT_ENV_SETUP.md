# HubSpot APIキーの環境変数設定手順

## 方法1: env.gcp.yamlに追加（推奨・次回デプロイ時に自動適用）

`application-form/env.gcp.yaml`ファイルを開き、以下の行を追加してください：

```yaml
HUBSPOT_API_KEY: "your-hubspot-api-key-here"
```

**注意**: 
- `env.gcp.yaml`は`.gitignore`に含まれていないため、APIキーがリポジトリにコミットされます
- セキュリティのため、GitHubのSecret Scanningで検出される可能性があります
- 次回`./deploy-gcp.sh`を実行すると、自動的に環境変数が設定されます

## 方法2: GCP Consoleから直接設定（即座に反映）

1. [GCP Console](https://console.cloud.google.com/)にログイン
2. プロジェクトを`justjoin-platform`に切り替え
3. **Cloud Run** > **justjoin** サービスを選択
4. **「編集と新しいリビジョンをデプロイ」**をクリック
5. **「変数とシークレット」**タブを開く
6. **「変数を追加」**をクリック
7. 以下を入力：
   - **名前**: `HUBSPOT_API_KEY`
   - **値**: `your-hubspot-api-key-here`（実際のAPIキーを入力してください）
8. **「デプロイ」**をクリック

**この方法が最も簡単で即座に反映されます！**

## 方法3: gcloudコマンドで設定（即座に反映）

適切な権限がある場合、以下のコマンドで設定できます：

```bash
gcloud run services update justjoin \
  --set-env-vars HUBSPOT_API_KEY=your-hubspot-api-key-here \
  --region=asia-northeast1 \
  --project=justjoin-platform
```

**権限エラーが発生する場合は、方法2（GCP Console）を使用してください。**

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

