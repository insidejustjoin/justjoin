# DNS設定ガイド - justjoin.jp

## 🌐 ドメイン設定手順

### 1. ドメイン取得確認
- ドメイン: `justjoin.jp`
- 取得状況: 確認済み
- 管理画面: ドメイン管理会社の管理画面

### 2. Cloud Run URLの取得
デプロイ後に以下のコマンドでCloud Run URLを取得：
```bash
gcloud run services describe justjoin --region asia-northeast1 --format="value(status.url)"
```

例: `https://justjoin-xxxxx-an.a.run.app`

### 3. DNSレコードの設定

#### A. メインドメイン (justjoin.jp)
```
Type: CNAME
Name: @
Value: ghs.googlehosted.com.
TTL: 300
```

#### B. wwwサブドメイン (www.justjoin.jp)
```
Type: CNAME
Name: www
Value: ghs.googlehosted.com.
TTL: 300
```

#### C. メール設定 (MXレコード)
```
Type: MX
Name: @
Value: 1 aspmx.l.google.com.
TTL: 3600

Type: MX
Name: @
Value: 5 alt1.aspmx.l.google.com.
TTL: 3600

Type: MX
Name: @
Value: 5 alt2.aspmx.l.google.com.
TTL: 3600
```

#### D. SPFレコード (メール認証)
```
Type: TXT
Name: @
Value: "v=spf1 include:_spf.google.com ~all"
TTL: 3600
```

#### E. DMARCレコード (メール認証)
```
Type: TXT
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:admin@justjoin.jp"
TTL: 3600
```

### 4. Google Cloud Consoleでの設定

#### A. Cloud Run ドメインマッピング
1. GCP Console > Cloud Run > justjoin
2. 「ドメイン」タブをクリック
3. 「ドメインのマッピング」をクリック
4. カスタムドメイン: `justjoin.jp`
5. 「マッピング」をクリック

#### B. SSL証明書の確認
- Cloud Runで自動的にSSL証明書が発行されます
- 発行まで数分〜数十分かかる場合があります

### 5. 設定確認

#### A. DNS伝播確認
```bash
# DNS伝播確認
dig justjoin.jp
nslookup justjoin.jp

# CNAME確認
dig CNAME justjoin.jp
```

#### B. SSL証明書確認
```bash
# SSL証明書確認
openssl s_client -connect justjoin.jp:443 -servername justjoin.jp
```

#### C. サイトアクセス確認
```bash
# サイトアクセス確認
curl -I https://justjoin.jp
curl -I https://www.justjoin.jp
```

### 6. トラブルシューティング

#### A. DNS伝播が遅い場合
- DNS伝播には最大48時間かかる場合があります
- 通常は数分〜数時間で反映されます

#### B. SSL証明書エラー
- Cloud Runのドメインマッピングが完了しているか確認
- DNS設定が正しく反映されているか確認

#### C. サイトが表示されない
- Cloud Runサービスが正常に動作しているか確認
- ヘルスチェック: `https://justjoin.jp/api/health`

### 7. 監視設定

#### A. Uptime Robot
- URL: `https://justjoin.jp`
- 監視間隔: 5分
- 通知: メール、Slack

#### B. Google Analytics
- プロパティ作成: `justjoin.jp`
- トラッキングコードの実装

### 8. セキュリティ設定

#### A. Security Headers
Cloud Runで以下のヘッダーを設定：
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

#### B. CSP (Content Security Policy)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.justjoin.jp;
```

### 9. バックアップ設定

#### A. DNSバックアップ
- 現在のDNS設定をエクスポート
- 定期的にバックアップを取得

#### B. ドメイン更新
- ドメイン有効期限の管理
- 自動更新の設定

### 10. 運用チェックリスト

#### デプロイ後確認
- [ ] DNS設定の反映確認
- [ ] SSL証明書の発行確認
- [ ] サイトアクセス確認
- [ ] API動作確認
- [ ] メール送信確認
- [ ] ファイルアップロード確認

#### 定期確認
- [ ] サイト稼働状況確認
- [ ] SSL証明書有効期限確認
- [ ] DNS設定確認
- [ ] バックアップ確認

## 📞 サポート

問題が発生した場合：
1. GCP Console > Cloud Run > justjoin > ログ
2. DNS管理会社のサポート
3. Google Cloud サポート 