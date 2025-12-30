# Google OAuth 2.0 セットアップガイド

このガイドでは、Googleシングルサインオン（SSO）をテスト環境で設定する方法を説明します。

## 1. Google Cloud Consoleでの設定

### 1.1 OAuth 2.0 クライアントIDの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. 同意画面を設定（まだの場合）
   - ユーザータイプ：外部
   - アプリ名：justjoin（または任意の名前）
   - サポートメール：your-email@example.com
6. OAuth 2.0 クライアントIDの作成
   - アプリケーションの種類：ウェブアプリケーション
   - 名前：justjoin OAuth Client（任意）
   - 承認済みのリダイレクト URI：
     - 開発環境：`http://localhost:3001/api/auth/google/callback`
     - 本番環境：`https://justjoin.jp/api/auth/google/callback`

### 1.2 クライアントIDとシークレットの取得

作成後、以下の情報をコピーします：
- クライアントID
- クライアントシークレット

## 2. 環境変数の設定

### 2.1 開発環境

1. `env.development.example`ファイルを参考に、`.env`ファイルを作成します：

```bash
cp env.development.example .env
```

2. `.env`ファイルを編集して、Google OAuth設定を追加します：

```bash
# Google OAuth 2.0設定（SSO用）
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
```

**注意**: `.env`ファイルは`.gitignore`されているため、リポジトリにはコミットされません。

### 2.2 本番環境（GCP）

`env.gcp.yaml`ファイルまたはGCP Cloud Runの環境変数に以下を設定：

```yaml
GOOGLE_CLIENT_ID: "your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET: "your-google-client-secret"
GOOGLE_REDIRECT_URI: "https://justjoin.jp/api/auth/google/callback"
```

または、GCP Cloud Runコンソールから環境変数を設定することもできます。

## 3. 動作確認

### 3.1 開発環境でのテスト

1. 環境変数を設定
2. サーバーを起動：
   ```bash
   npm run server:dev
   ```
3. フロントエンドを起動：
   ```bash
   npm run dev
   ```
4. ブラウザで `http://localhost:5173/jobseeker` にアクセス
5. 「Googleでログイン」ボタンをクリック
6. Googleアカウントで認証
7. 認証後、求職者マイページにリダイレクトされることを確認

### 3.2 テスト時の注意点

- 最初のログイン時は新規ユーザーとして登録されます
- メール認証は不要です（Googleで認証済みのため）
- 既存のメールアドレスでログインした場合、既存のユーザーとしてログインします
- パスワードは不要です（Google OAuthのみでログイン）

## 4. データベースの確認

Google OAuthで登録されたユーザーは、`users`テーブルで以下の特徴があります：
- `password_hash`が`NULL`
- `user_type`が`job_seeker`
- `status`が`active`

## 5. トラブルシューティング

### 5.1 リダイレクトURI不一致エラー

```
redirect_uri_mismatch
```

- Google Cloud Consoleで設定したリダイレクトURIと環境変数の`GOOGLE_REDIRECT_URI`が一致しているか確認

### 5.2 クライアントID/シークレットエラー

- 環境変数が正しく設定されているか確認
- サーバーを再起動して環境変数を読み込む

### 5.3 認証後のリダイレクトエラー

- フロントエンドのURLが正しいか確認
- `/auth/google/success`ルートが正しく設定されているか確認

## 6. セキュリティに関する注意

- 本番環境では、`GOOGLE_CLIENT_SECRET`を環境変数で管理し、コードに直接書かないでください
- リダイレクトURIは正確に設定してください
- トークンは適切に管理してください（現在はlocalStorageに保存していますが、本番環境ではHTTP-onlyクッキーの使用を推奨）

