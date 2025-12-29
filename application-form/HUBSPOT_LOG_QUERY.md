# HubSpotログ検索クエリ（GCP Console）

## 基本的な検索クエリ

### 1. すべてのHubSpot関連ログ（推奨）
```
textPayload=~"HubSpot" OR jsonPayload.message=~"HubSpot" OR textPayload=~"=== HubSpot連携開始 ==="
```

### 2. エラーログのみ
```
severity="ERROR" AND (textPayload=~"HubSpot" OR jsonPayload.message=~"HubSpot")
```

### 3. すべてのログレベル（INFO, WARNING, ERROR）
```
(textPayload=~"HubSpot" OR jsonPayload.message=~"HubSpot" OR textPayload=~"=== HubSpot連携開始 ===" OR textPayload=~"\[HubSpot\]")
```

### 4. 特定のユーザーIDで検索
```
textPayload=~"HubSpot" AND textPayload=~"YOUR_USER_ID"
```

## 時間範囲の設定

- **過去1時間**: より広い範囲で検索
- **過去24時間**: さらに広い範囲で検索
- **カスタム範囲**: 特定の日時を指定

## リソースフィルター

- **リソースタイプ**: `cloud_run_revision`
- **サービス名**: `justjoin`

## 完全な検索クエリ例

```
resource.type="cloud_run_revision"
resource.labels.service_name="justjoin"
(textPayload=~"HubSpot" OR jsonPayload.message=~"HubSpot" OR textPayload=~"=== HubSpot連携開始 ===" OR textPayload=~"\[HubSpot\]")
```

## 確認すべきログメッセージ

以下のログが順番に表示されるはずです：

1. `=== HubSpot連携開始 ===` - 連携処理が開始された
2. `[HubSpot] 非同期関数内で処理開始` - 非同期関数内で処理が開始された
3. `[HubSpot] メールアドレス取得開始` - メールアドレス取得開始
4. `[HubSpot] メールアドレス取得結果` - メールアドレス取得結果
5. `[HubSpot] APIキー確認` - APIキーの確認
6. `[HubSpot] APIキー確認完了` - APIキーが設定されている
7. `[HubSpot] 連絡先の作成/更新開始` - HubSpot API呼び出し開始
8. `[HubSpot] 連携成功` - 連携が成功した

## ログが表示されない場合の確認事項

1. **デプロイが完了しているか確認**
   - 最新のコードがデプロイされているか確認

2. **「データベースに保存」ボタンを押したか確認**
   - HubSpot連携は`/api/documents`エンドポイントで実行される

3. **時間範囲を広げる**
   - 過去1時間または過去24時間に設定

4. **すべてのログレベルで検索**
   - ERRORだけでなく、INFOやWARNINGも含めて検索

5. **リソースフィルターを確認**
   - `cloud_run_revision`と`justjoin`が正しく設定されているか確認

6. **環境変数が設定されているか確認**
   - `HUBSPOT_API_KEY`がGCP Cloud Runの環境変数に設定されているか確認

## トラブルシューティング

### ログが全く表示されない場合
- サーバーが正常に動作しているか確認
- デプロイが完了しているか確認
- 時間範囲を広げて再検索

### エラーログのみ表示される場合
- エラーメッセージの詳細を確認
- APIキーが正しく設定されているか確認
- HubSpot APIの権限を確認

### 一部のログのみ表示される場合
- 時間範囲を広げる
- すべてのログレベルで検索
- リソースフィルターを確認

