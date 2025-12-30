# 環境変数設定ガイド

このガイドでは、Google OAuth（SSO）を含む環境変数の設定方法を説明します。

## 開発環境での設定

### 1. .envファイルの作成

`env.development.example`ファイルを参考に、`.env`ファイルを作成します：

```bash
cp env.development.example .env
```

### 2. Google OAuth設定の追加

`.env`ファイルを編集して、以下のGoogle OAuth設定を追加または更新します：

```bash
# Google OAuth 2.0設定（SSO用）
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
```

**重要**: 
- `GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`は、Google Cloud ConsoleでOAuth 2.0クライアントIDを作成して取得してください
- リダイレクトURIは `http://localhost:3001/api/auth/google/callback` に設定してください（バックエンドのエンドポイント）

### 3. 他の環境変数の設定

`.env`ファイルには、データベース接続情報など他の必要な設定も含まれています。
必要に応じて編集してください。

## 本番環境（GCP）での設定

### 1. env.gcp.yamlファイルの編集

`env.gcp.yaml`ファイルを編集して、Google OAuth設定を追加または更新します：

```yaml
GOOGLE_CLIENT_ID: "your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET: "your-google-client-secret"
GOOGLE_REDIRECT_URI: "https://justjoin.jp/api/auth/google/callback"
```

### 2. GCP Cloud Runでの環境変数設定

または、GCP Cloud Runのコンソールから直接環境変数を設定することもできます：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Cloud Runサービスを選択
3. 「編集と新しいリビジョンをデプロイ」をクリック
4. 「変数とシークレット」タブで環境変数を追加

## Google OAuth設定の取得方法

詳細は`GOOGLE_OAUTH_SETUP.md`を参照してください。

簡単な手順：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「APIとサービス」→「認証情報」に移動
3. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
4. アプリケーションの種類：「ウェブアプリケーション」
5. 承認済みのリダイレクトURIを追加：
   - 開発環境：`http://localhost:3001/api/auth/google/callback`
   - 本番環境：`https://justjoin.jp/api/auth/google/callback`
6. 作成されたクライアントIDとシークレットを環境変数に設定

## 環境変数の確認

サーバー起動時に、環境変数が正しく読み込まれているか確認できます：

```bash
# サーバーを起動
npm run server:dev

# ログに環境変数の値が表示されない場合は、.envファイルが正しく読み込まれているか確認
```

## トラブルシューティング

### 環境変数が読み込まれない

- `.env`ファイルがプロジェクトルートに存在するか確認
- `.env`ファイルの書式が正しいか確認（キー=値の形式）
- サーバーを再起動して環境変数を読み込み直す

### Google OAuthでエラーが発生する

- `GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しく設定されているか確認
- リダイレクトURIがGoogle Cloud Consoleの設定と一致しているか確認
- リダイレクトURIは `/api/auth/google/callback` である必要があります（フロントエンドのパスではない）

