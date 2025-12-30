# Google OAuth セットアップ完了までの手順

テスト環境でGoogleサインインを動作させるための完全な手順です。

## ✅ 完了した作業

1. ✅ バックエンドにGoogle OAuthエンドポイントを追加
2. ✅ フロントエンドにGoogle Sign-Inボタンを追加
3. ✅ 環境変数設定ファイル（`.env`）にプレースホルダーを追加
4. ✅ セットアップスクリプトを作成
5. ✅ テストスクリプトを作成
6. ✅ クイックスタートガイドを作成

## 📋 次に必要な作業

### ステップ1: Google Cloud ConsoleでOAuth 2.0クライアントIDを作成

**重要**: このステップは必須です。これがないとGoogleサインインは動作しません。

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト`justjoin-platform`を選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類：「ウェブアプリケーション」を選択
6. **承認済みのリダイレクト URI**に以下を追加：
   ```
   http://localhost:3001/api/auth/google/callback
   ```
7. 「作成」をクリック
8. **クライアントID**と**クライアントシークレット**をコピー

詳細は `QUICK_START_GOOGLE_OAUTH.md` を参照してください。

### ステップ2: 環境変数の設定

#### 方法A: セットアップスクリプトを使用（推奨）

```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
./setup-google-oauth.sh
```

#### 方法B: 手動で.envファイルを編集

```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
nano .env  # またはお好みのエディタ
```

以下の行を探して、実際の値を設定：

```bash
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"  # ← 実際のクライアントIDに置き換え
GOOGLE_CLIENT_SECRET="your-google-client-secret"  # ← 実際のシークレットに置き換え
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"  # ← このままでOK
```

### ステップ3: 設定の確認

```bash
./test-google-oauth.sh
```

このスクリプトで、設定が正しく行われているか確認できます。

### ステップ4: サーバーとフロントエンドの起動

**ターミナル1（サーバー）**:
```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
npm run server:dev
```

**ターミナル2（フロントエンド）**:
```bash
cd /Users/sonobekenta/Desktop/justjoin/application-form
npm run dev
```

### ステップ5: 動作確認

1. ブラウザで `http://localhost:5173/jobseeker` にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントで認証
4. 求職者マイページにリダイレクトされることを確認

## 🎯 現在の状態

- ✅ コード実装は完了
- ✅ 環境変数のプレースホルダーは追加済み
- ⏳ Google Cloud ConsoleでのOAuth 2.0クライアントID作成が必要
- ⏳ .envファイルに実際の値を設定する必要がある

## 📚 参考ドキュメント

- `QUICK_START_GOOGLE_OAUTH.md` - 詳細なセットアップ手順
- `GOOGLE_OAUTH_SETUP.md` - 技術的な詳細
- `SETUP_ENV.md` - 環境変数設定の詳細

## 🔍 トラブルシューティング

### 「Google OAuthが設定されていません」エラー

- `.env`ファイルに`GOOGLE_CLIENT_ID`が設定されているか確認
- サーバーを再起動

### リダイレクトURI不一致エラー

- Google Cloud ConsoleのリダイレクトURI設定を確認
- `http://localhost:3001/api/auth/google/callback` が正確に設定されているか確認

詳しくは `QUICK_START_GOOGLE_OAUTH.md` のトラブルシューティングセクションを参照してください。

