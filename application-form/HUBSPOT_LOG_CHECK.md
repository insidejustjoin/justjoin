# HubSpot連携ログの確認方法

## GCP Consoleから確認する方法（推奨）

1. [GCP Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを`justjoin-platform`に切り替え
3. 左メニューから「ログエクスプローラー」を選択
4. 以下のクエリを入力：

```
resource.type="cloud_run_revision"
resource.labels.service_name="justjoin"
(textPayload=~"HubSpot" OR textPayload=~"\[HubSpot\]" OR jsonPayload.message=~"HubSpot")
```

5. 時間範囲を「過去1時間」または「過去24時間」に設定
6. 「実行」をクリック

## コマンドラインから確認する方法

### 基本的なログ確認
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=justjoin AND (textPayload=~\"HubSpot\" OR textPayload=~\"\[HubSpot\]\")" \
  --limit 100 \
  --project=justjoin-platform \
  --format="table(timestamp,textPayload)"
```

### より詳細なログ（JSON形式）
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=justjoin AND (textPayload=~\"HubSpot\" OR jsonPayload.message=~\"HubSpot\")" \
  --limit 100 \
  --project=justjoin-platform \
  --format=json
```

### エラーログのみ確認
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=justjoin AND severity>=ERROR AND (textPayload=~\"HubSpot\" OR jsonPayload.message=~\"HubSpot\")" \
  --limit 50 \
  --project=justjoin-platform \
  --format="table(timestamp,severity,textPayload,jsonPayload.error)"
```

## 確認すべきログ項目

以下のログが順番に出力されるはずです：

1. **HubSpot連携処理開始**
   - `[HubSpot連携処理開始]` または `hubspot_init`

2. **メールアドレス取得**
   - `[HubSpot: メールアドレス取得開始]` → `[HubSpot: メールアドレス取得成功]`

3. **APIキー確認**
   - `[HubSpot: APIキー確認完了]`

4. **プロパティマッピング**
   - `[HubSpot: プロパティマッピング開始]` → `[HubSpot連携開始]`（プロパティ数とサンプル）

5. **API呼び出し**
   - `[HubSpot: createOrUpdateContact呼び出し開始]`
   - `[HubSpot] 連絡先の作成/更新開始`
   - `[HubSpot] 既存連絡先を検索中`
   - `[HubSpot] 連絡先検索API呼び出し`
   - `[HubSpot] 検索APIレスポンス`
   - `[HubSpot] 連絡先更新API呼び出し` または `[HubSpot] 連絡先作成API呼び出し`
   - `[HubSpot] 更新APIレスポンス` または `[HubSpot] 作成APIレスポンス`

6. **結果**
   - `[HubSpot連携成功]` または `[HubSpot連携失敗]`

## トラブルシューティング

### ログが全く出ない場合
- 「データベースに保存」ボタンを押したか確認
- デプロイが完了しているか確認
- サーバーが正常に動作しているか確認

### メールアドレスが見つからない場合
- `[HubSpot連携スキップ: メールアドレスが見つかりません]` というログが出る
- `users`テーブルに該当ユーザーのメールアドレスが登録されているか確認

### APIキーが設定されていない場合
- `[HubSpot連携スキップ: HUBSPOT_API_KEYが設定されていません]` というログが出る
- GCP Cloud Runの環境変数を確認

### API呼び出しエラーの場合
- `[HubSpot] 作成APIエラー` または `[HubSpot] 更新APIエラー` というログが出る
- エラーメッセージの詳細を確認
- HubSpot APIキーの権限を確認

## アカウントとプロジェクトの確認

現在の設定を確認：
```bash
gcloud config get-value account
gcloud config get-value project
```

設定を変更する場合：
```bash
gcloud config set account inside.justjoin@gmail.com
gcloud config set project justjoin-platform
```

