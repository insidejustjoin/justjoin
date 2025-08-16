# JustJoin.jp GCPデプロイガイド

## 🚀 概要

このガイドでは、JustJoin.jpをGoogle Cloud Platform (GCP) にデプロイし、`justjoin.jp`ドメインで公開する手順を説明します。

## 📋 前提条件

### 必要なツール
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/) (v18以上)
- [Git](https://git-scm.com/)

### GCPアカウント
- Google Cloud Platformアカウント
- プロジェクトの作成権限
- 課金の有効化

## 🔧 初期設定

### 1. Google Cloud CLIの設定

```bash
# Google Cloud CLIのインストール（未インストールの場合）
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# プロジェクトの初期化
gcloud init
```

### 2. プロジェクトの選択・作成

```bash
# 既存プロジェクトの選択
gcloud config set project YOUR_PROJECT_ID

# または新規プロジェクトの作成
gcloud projects create justjoin-platform --name="JustJoin Platform"
gcloud config set project justjoin-platform
```

## 🚀 デプロイ手順

### 方法1: 完全自動デプロイ（推奨）

```bash
# 完全デプロイスクリプトを実行
./deploy-complete.sh
```

このスクリプトは以下を自動実行します：
1. GCP初期設定（データベース、ストレージ、VPC等）
2. アプリケーションビルド
3. Cloud Runデプロイ
4. ドメインマッピング設定
5. 動作確認

### 方法2: 段階的デプロイ

#### Step 1: GCP初期設定

```bash
# GCPリソースの作成
./gcp-setup.sh
```

#### Step 2: 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp env.gcp.example .env.gcp

# 必要な値を編集
nano .env.gcp
```

**必須設定項目：**
- `GMAIL_PASSWORD`: Gmailアプリパスワード
- `JWT_SECRET`: ランダムな文字列（32文字以上推奨）
- `SESSION_SECRET`: ランダムな文字列（32文字以上推奨）
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0クライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0クライアントシークレット

#### Step 3: アプリケーションビルド

```bash
# 依存関係のインストール
npm install

# アプリケーションのビルド
npm run build
```

#### Step 4: GCPデプロイ

```bash
# Cloud Runにデプロイ
./deploy-gcp.sh
```

## 🌐 DNS設定

### 1. ドメイン管理会社での設定

ドメイン管理会社の管理画面で以下のDNSレコードを設定：

#### メインドメイン
```
Type: CNAME
Name: @
Value: ghs.googlehosted.com.
TTL: 300
```

#### wwwサブドメイン
```
Type: CNAME
Name: www
Value: ghs.googlehosted.com.
TTL: 300
```

#### メール設定（オプション）
```
Type: MX
Name: @
Value: 1 aspmx.l.google.com.
TTL: 3600
```

### 2. Cloud Run ドメインマッピング

```bash
# ドメインマッピングの設定
gcloud run domain-mappings create \
    --service justjoin \
    --domain justjoin.jp \
    --region asia-northeast1
```

## 📊 動作確認

### 1. ヘルスチェック

```bash
# Cloud Run URLの取得
SERVICE_URL=$(gcloud run services describe justjoin --region asia-northeast1 --format="value(status.url)")

# ヘルスチェック
curl -X GET $SERVICE_URL/api/health
```

### 2. サイトアクセス確認

```bash
# サイトアクセス確認
curl -I https://justjoin.jp
```

### 3. API動作確認

```bash
# 求職者登録APIテスト
curl -X POST $SERVICE_URL/api/register-jobseeker \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","fullName":"テスト太郎"}'
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

```bash
# Cloud SQL Proxyの使用
cloud_sql_proxy -instances=YOUR_PROJECT:asia-northeast1:justjoin-db=tcp:5432
```

#### 2. メモリ不足エラー

```bash
# Cloud Runのメモリ増加
gcloud run services update justjoin \
    --memory 2Gi \
    --region asia-northeast1
```

#### 3. DNS設定エラー

- DNS伝播の確認: `dig justjoin.jp`
- Cloud Run ドメインマッピングの確認
- SSL証明書の発行確認

#### 4. 環境変数エラー

```bash
# 環境変数の確認
gcloud run services describe justjoin --region asia-northeast1 --format="value(spec.template.spec.containers[0].env[].name)"
```

## 📈 監視・運用

### 1. ログの確認

```bash
# Cloud Runログの確認
gcloud logs read --service=justjoin --limit=50
```

### 2. メトリクスの確認

GCP Console > Cloud Run > justjoin > メトリクス

### 3. アラートの設定

GCP Console > Monitoring > アラートポリシー

## 💰 コスト管理

### 月間コスト見積もり

- **Cloud Run**: $5-15/月
- **Cloud SQL**: $7.50/月
- **Cloud Storage**: $1-5/月
- **合計**: $13.50-27.50/月

### コスト最適化

```bash
# 最小インスタンス数を0に設定（コスト削減）
gcloud run services update justjoin \
    --min-instances=0 \
    --region asia-northeast1
```

## 🔐 セキュリティ

### 1. 環境変数の管理

- 機密情報は環境変数で管理
- サービスアカウントキーの安全な管理
- 定期的なパスワード更新

### 2. アクセス制御

```bash
# 認証が必要な設定
gcloud run services update justjoin \
    --no-allow-unauthenticated \
    --region asia-northeast1
```

## 📞 サポート

### 問題が発生した場合

1. **GCP Console**: Cloud Run > justjoin > ログ
2. **Google Cloud サポート**: https://cloud.google.com/support
3. **ドキュメント**: https://cloud.google.com/run/docs

### リクエストID

現在のリクエストID: `44349df2-d1c0-4755-87c6-c13414992e79`

## 🎯 次のステップ

デプロイ完了後：

1. **監視の設定**: Cloud Monitoringの有効化
2. **バックアップ**: 自動バックアップの設定
3. **CI/CD**: GitHub Actionsでの自動デプロイ設定
4. **SSL証明書**: 自動更新の確認
5. **パフォーマンス**: キャッシュの設定

---

**注意**: 本番環境での運用前に、必ずテスト環境での動作確認を行ってください。 