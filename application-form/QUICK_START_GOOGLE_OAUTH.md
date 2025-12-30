# Google OAuth クイックスタートガイド

このガイドに従って、テスト環境でGoogleサインインを動作させることができます。

## ステップ1: Google Cloud ConsoleでOAuth 2.0クライアントIDを作成

### 1.1 Google Cloud Consoleにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（`justjoin-platform`）

### 1.2 OAuth同意画面の設定（初回のみ）

1. 「APIとサービス」→「OAuth同意画面」に移動
2. ユーザータイプを選択：「外部」を選択して「作成」
3. アプリ情報を入力：
   - アプリ名：`justjoin`（任意）
   - ユーザーサポートメール：あなたのメールアドレス
   - デベロッパーの連絡先情報：あなたのメールアドレス
4. 「保存して次へ」をクリック
5. スコープはそのまま「保存して次へ」
6. テストユーザーはそのまま「保存して次へ」
7. サマリーを確認して「ダッシュボードに戻る」

### 1.3 OAuth 2.0 クライアントIDの作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. アプリケーションの種類：「ウェブアプリケーション」を選択
4. 名前：`justjoin OAuth Client`（任意）
5. **承認済みのリダイレクト URI**に以下を追加：
   ```
   http://localhost:3001/api/auth/google/callback
   ```
6. 「作成」をクリック
7. **クライアントID**と**クライアントシークレット**をコピー（後で使います）

## ステップ2: 環境変数の設定

### 方法1: セットアップスクリプトを使用（推奨）

```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
./setup-google-oauth.sh
```

スクリプトが以下の情報を尋ねます：
- Google Client ID（ステップ1.3で取得）
- Google Client Secret（ステップ1.3で取得）

### 方法2: 手動で.envファイルを編集

```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
```

`.env`ファイルを開いて、以下を追加または更新：

```bash
# Google OAuth 2.0設定（SSO用）
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
```

**重要**: `your-google-client-id`と`your-google-client-secret`を、ステップ1.3で取得した実際の値に置き換えてください。

## ステップ3: 設定の確認

設定が正しく行われているか確認します：

```bash
./test-google-oauth.sh
```

このスクリプトは以下を確認します：
- `.env`ファイルにGoogle OAuth設定が存在するか
- 設定値がプレースホルダーでないか
- サーバーが起動している場合、APIエンドポイントが動作するか

## ステップ4: サーバーとフロントエンドの起動

### 4.1 サーバーの起動（ターミナル1）

```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
npm run server:dev
```

サーバーが`http://localhost:3001`で起動することを確認してください。

### 4.2 フロントエンドの起動（ターミナル2）

```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
npm run dev
```

フロントエンドが`http://localhost:5173`で起動することを確認してください。

## ステップ5: 動作確認

1. ブラウザで `http://localhost:5173/jobseeker` にアクセス
2. 「Googleでログイン」ボタンが表示されていることを確認
3. 「Googleでログイン」ボタンをクリック
4. Googleアカウント選択画面が表示されることを確認
5. Googleアカウントで認証
6. 認証後、求職者マイページにリダイレクトされることを確認

## トラブルシューティング

### 「Googleでログイン」ボタンが表示されない

- ブラウザのコンソールを確認してエラーがないか確認
- サーバーが正しく起動しているか確認（`http://localhost:3001/api/auth/google`にアクセスして確認）

### リダイレクトURI不一致エラー

エラーメッセージ: `redirect_uri_mismatch`

**解決方法**:
1. Google Cloud Consoleの「認証情報」ページに戻る
2. 作成したOAuth 2.0クライアントIDをクリック
3. 「承認済みのリダイレクト URI」に以下が正確に追加されているか確認：
   ```
   http://localhost:3001/api/auth/google/callback
   ```
4. 一致していない場合は追加して保存
5. サーバーを再起動

### 「Google OAuthが設定されていません」エラー

**解決方法**:
1. `.env`ファイルに`GOOGLE_CLIENT_ID`が設定されているか確認
2. 設定されている場合は、サーバーを再起動して環境変数を読み込み直す

### 認証後にエラーページにリダイレクトされる

**解決方法**:
1. サーバーのログを確認してエラー内容を確認
2. データベース接続が正常か確認
3. `.env`ファイルの`DATABASE_URL`が正しく設定されているか確認

## 次のステップ

Google OAuthでのログインが成功したら：
- 新規ユーザーとして登録されることを確認
- 既存ユーザーでログインできることを確認
- データベースの`users`テーブルで`password_hash`が`NULL`になっていることを確認

