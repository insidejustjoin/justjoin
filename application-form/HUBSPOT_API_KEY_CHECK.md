# HubSpot APIキー設定確認手順

## 現在の状況

ログに「APIキーが設定されていません」と表示されている場合、以下のいずれかの問題が考えられます：

1. `env.gcp.yaml`で`HUBSPOT_API_KEY`がコメントアウトされている
2. GCP Cloud Runの環境変数に設定されていない
3. デプロイ後に環境変数が上書きされた

## 確認方法

### 方法1: GCP Consoleで確認（推奨）

1. [GCP Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを`justjoin-platform`に切り替え
3. **Cloud Run** > **justjoin** サービスを選択
4. **「変数とシークレット」**タブを開く
5. `HUBSPOT_API_KEY`が表示されているか確認

### 方法2: コマンドラインで確認

```bash
gcloud run services describe justjoin \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --format="get(spec.template.spec.containers[0].env)" | grep HUBSPOT
```

## 設定方法

### 方法1: GCP Consoleから設定（即座に反映・推奨）

1. [GCP Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを`justjoin-platform`に切り替え
3. **Cloud Run** > **justjoin** サービスを選択
4. **「編集と新しいリビジョンをデプロイ」**をクリック
5. **「変数とシークレット」**タブを開く
6. **「変数を追加」**をクリック
7. 以下を入力：
   - **名前**: `HUBSPOT_API_KEY`
   - **値**: `your-hubspot-api-key-here`（実際のAPIキーを入力してください）
8. **「デプロイ」**をクリック

**この方法が最も確実で即座に反映されます！**

### 方法2: env.gcp.yamlに追加（次回デプロイ時に適用）

`application-form/env.gcp.yaml`ファイルを開き、3行目のコメントを外してAPIキーを設定：

```yaml
HUBSPOT_API_KEY: "your-hubspot-api-key-here"
```

**注意**: 
- このファイルは`.gitignore`に含まれていないため、APIキーがリポジトリにコミットされます
- セキュリティのため、GitHubのSecret Scanningで検出される可能性があります
- 次回`./deploy-gcp.sh`を実行すると、自動的に環境変数が設定されます

### 方法3: gcloudコマンドで設定（即座に反映）

```bash
gcloud run services update justjoin \
  --set-env-vars HUBSPOT_API_KEY=your-hubspot-api-key-here \
  --region=asia-northeast1 \
  --project=justjoin-platform
```

**権限エラーが発生する場合は、方法1（GCP Console）を使用してください。**

## 設定後の確認

環境変数が正しく設定されているか確認：

```bash
gcloud run services describe justjoin \
  --region=asia-northeast1 \
  --project=justjoin-platform \
  --format="value(spec.template.spec.containers[0].env)" | grep HUBSPOT
```

または、GCP ConsoleのCloud Runサービス詳細ページで確認できます。

## トラブルシューティング

### ログに「APIキーが設定されていません」と表示される場合

1. 上記の確認方法で環境変数が設定されているか確認
2. 設定されていない場合は、方法1（GCP Console）で設定
3. 設定後、再度「データベースに保存」ボタンを押して確認

### デプロイ後に環境変数が消える場合

- `env.gcp.yaml`に設定されている場合、デプロイ時に上書きされる可能性があります
- GCP Consoleから直接設定した場合は、デプロイ時にも保持されます
- 両方に設定されている場合、GCP Consoleの設定が優先されます

