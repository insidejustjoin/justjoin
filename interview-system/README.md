# JustJoin AI面接システム

## 📋 プロジェクト概要

JustJoinプラットフォームに統合されたAI面接システムです。1次面接として自動化された面接を提供し、求職者のスクリーニングを効率化します。

**🎉 メインプラットフォーム統合完了！**
- 求職者マイページからワンクリックで面接開始
- 1回限りの受験制限システム
- トークンベース認証による安全な面接実施
- 既存求職者データとの完全連携

## ✨ 主要機能

### 🤖 AI面接機能
- **自然な対話**: 日本語・英語での丁寧な面接進行
- **リアルタイム評価**: 回答の感情分析・完成度評価
- **動的質問管理**: 10問の構造化された面接質問
- **進捗表示**: リアルタイムの面接進捗と残り時間

### 🔐 セキュリティ機能
- **1回制限**: 1次面接として1回のみ受験可能
- **トークンベース認証**: 30分有効な安全な認証システム
- **IPアドレス記録**: セキュリティ監査のための詳細ログ
- **同意取得**: GDPR準拠の明示的同意システム

### 📊 評価・分析機能
- **総合スコア**: 0-100点での自動評価
- **推奨レベル**: 5段階評価（strong_yes〜strong_no）
- **詳細分析**: 強み・改善点・キーインサイト
- **完成度メトリクス**: 回答率・平均回答時間・完了率

### 🌐 統合機能
- **メインプラットフォーム連携**: 既存求職者データの自動活用
- **マイページ統合**: [justjoin.jp/jobseeker/my-page](https://justjoin.jp/jobseeker/my-page) からの直接アクセス
- **結果連携**: 面接結果のメインプラットフォーム自動反映
- **履歴管理**: 面接ステータス・結果の統合表示

## 🏗️ システム構成

### アーキテクチャ
```
┌─────────────────────┐    ┌─────────────────────┐
│  メインプラットフォーム  │    │   AI面接システム      │
│  justjoin.jp       │    │  interview.justjoin.jp │
│                    │    │                    │
│  ┌─────────────┐   │    │  ┌─────────────┐   │
│  │ マイページ    │   │    │  │ 面接UI       │   │
│  │ (AI面接カード) │◄──┼────┼─►│ (React SPA)  │   │
│  └─────────────┘   │    │  └─────────────┘   │
│                    │    │                    │
│  ┌─────────────┐   │    │  ┌─────────────┐   │
│  │ 面接管理API   │◄──┼────┼─►│ 面接API      │   │
│  └─────────────┘   │    │  └─────────────┘   │
└─────────────────────┘    └─────────────────────┘
           │                          │
           └──────────┬─────────────────┘
                      │
            ┌─────────▼─────────┐
            │  共有PostgreSQL   │
            │                  │
            │  ┌─────────────┐ │
            │  │ users        │ │
            │  │ job_seekers  │ │
            │  │ interview_*  │ │
            │  └─────────────┘ │
            └───────────────────┘
```

### 技術スタック

#### フロントエンド
- **React 18** + **TypeScript**
- **Vite** (開発・ビルドツール)
- **Tailwind CSS** (スタイリング)
- **Lucide React** (アイコン)
- **@tailwindcss/forms** (フォームスタイル)

#### バックエンド
- **Node.js** + **Express**
- **TypeScript** (型安全性)
- **PostgreSQL** (データベース)
- **pg** (PostgreSQLクライアント)
- **cors**, **helmet** (セキュリティ)

#### 開発・運用
- **Docker** (コンテナ化)
- **Google Cloud Run** (デプロイ)
- **ESLint** + **Prettier** (コード品質)
- **Jest** (テスト)

## 📁 ディレクトリ構成

```
interview-system/
├── README.md                    # このファイル
├── package.json                 # 依存関係・スクリプト
├── tsconfig.json               # TypeScript設定
├── vite.config.ts              # Vite設定
├── tailwind.config.ts          # Tailwind CSS設定
├── Dockerfile                  # 本番用Dockerファイル
├── env.example                 # 環境変数テンプレート
├── .env.local                  # ローカル開発環境変数
│
├── src/                        # フロントエンド
│   ├── App.tsx                 # メインアプリケーション
│   ├── main.tsx                # エントリーポイント
│   ├── App.css                 # グローバルスタイル
│   │
│   ├── components/             # UIコンポーネント
│   │   ├── ConsentForm.tsx     # 同意確認フォーム
│   │   ├── InterviewScreen.tsx # 面接画面
│   │   └── CompletionScreen.tsx # 完了画面
│   │
│   └── types/                  # TypeScript型定義
│       └── interview.ts        # 面接関連型
│
├── server/                     # バックエンド
│   ├── index.ts                # サーバーエントリーポイント
│   │
│   ├── api/                    # APIエンドポイント
│   │   └── interviewRoutes.ts  # 面接API
│   │
│   ├── services/               # ビジネスロジック
│   │   ├── aiInterviewerService.ts  # AI面接官
│   │   ├── questionService.ts       # 質問管理
│   │   └── databaseService.ts       # データベース操作
│   │
│   └── models/                 # データモデル
│
├── database/                   # データベース
│   └── schema.sql              # 面接システム用スキーマ
│
├── deploy/                     # デプロイメント
│   └── deploy-interview.sh     # Cloud Runデプロイスクリプト
│
├── public/                     # 静的ファイル
│   ├── favicon.ico
│   └── robots.txt
│
└── logs/                       # ログファイル
```

## 💾 データベース設計

### 面接システム専用テーブル

```sql
-- 面接応募者（メインプラットフォームと連携）
CREATE TABLE interview_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  position VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 面接セッション
CREATE TABLE interview_sessions (
  id VARCHAR(255) PRIMARY KEY,
  applicant_id UUID REFERENCES interview_applicants(id),
  status VARCHAR(50) CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  language VARCHAR(10) DEFAULT 'ja',
  current_question_index INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_duration INTEGER, -- 秒
  consent_given BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 面接回答
CREATE TABLE interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) REFERENCES interview_sessions(id),
  applicant_id UUID REFERENCES interview_applicants(id),
  text TEXT NOT NULL,
  response_time INTEGER, -- 秒
  word_count INTEGER,
  sentiment_score DECIMAL(5,2),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 面接サマリー
CREATE TABLE interview_summaries (
  session_id VARCHAR(255) PRIMARY KEY REFERENCES interview_sessions(id),
  applicant_id UUID REFERENCES interview_applicants(id),
  total_questions INTEGER NOT NULL,
  answered_questions INTEGER NOT NULL,
  total_duration INTEGER NOT NULL, -- 秒
  average_response_time DECIMAL(10,2),
  completion_rate DECIMAL(5,2),
  key_insights JSONB,
  overall_score DECIMAL(5,2),
  strengths JSONB,
  areas_for_improvement JSONB,
  recommendation VARCHAR(50) CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### メインプラットフォーム連携テーブル

```sql
-- メインプラットフォームから参照
users (id, email, user_type, status, ...)
job_seekers (user_id, full_name, desired_job_title, experience_years, skills, ...)
```

## 🚀 セットアップ・開発

### システム要件

- **Node.js**: 18.0.0 以上
- **PostgreSQL**: 14.0 以上
- **npm**: 8.0.0 以上

### ローカル開発環境

#### 1. リポジトリクローン & 依存関係インストール

```bash
# メインプロジェクトから面接システムに移動
cd interview-system

# 依存関係インストール
npm install
```

#### 2. 環境変数設定

```bash
# 環境変数ファイルを作成
cp env.example .env.local

# .env.localを編集
DATABASE_URL="postgresql://postgres:justjoin2024@localhost:5432/justjoin"
NODE_ENV="development"
PORT="3002"
```

#### 3. データベースセットアップ

```bash
# PostgreSQLが起動していることを確認
brew services start postgresql@14

# データベース接続テスト
psql -U postgres -d justjoin -c "SELECT 1;"

# 面接システム用テーブル作成
psql -U postgres -d justjoin -f database/schema.sql
```

#### 4. 開発サーバー起動

```bash
# フロントエンド + バックエンド 同時起動
npm run dev

# または個別起動
npm run dev:client    # フロントエンド (http://localhost:3001)
npm run dev:server    # バックエンド (http://localhost:3002)
```

#### 5. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3002/api/interview/health

# フロントエンド確認
open http://localhost:3001
```

### 本番環境デプロイ

#### 1. Google Cloud設定

```bash
# GCPプロジェクト設定
export PROJECT_ID="justjoin-platform"
export REGION="asia-northeast1"

# サービスアカウント作成（未作成の場合）
gcloud iam service-accounts create justjoin-interview \
  --display-name="JustJoin Interview System"

# Cloud SQL接続権限付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:justjoin-interview@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

#### 2. デプロイ実行

```bash
# 自動デプロイスクリプト実行
./deploy/deploy-interview.sh

# または手動デプロイ
npm run build
docker build -t gcr.io/$PROJECT_ID/justjoin-interview .
docker push gcr.io/$PROJECT_ID/justjoin-interview

gcloud run deploy justjoin-interview \
  --image=gcr.io/$PROJECT_ID/justjoin-interview \
  --platform=managed \
  --region=$REGION \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:justjoin-enterprise
```

#### 3. カスタムドメイン設定（任意）

```bash
# ドメインマッピング作成
gcloud run domain-mappings create \
  --service=justjoin-interview \
  --domain=interview.justjoin.jp \
  --region=$REGION
```

## 🔧 開発コマンド

### 基本コマンド

```bash
# 開発サーバー起動
npm run dev              # フロントエンド + バックエンド
npm run dev:client       # フロントエンドのみ (port 3001)
npm run dev:server       # バックエンドのみ (port 3002)

# ビルド
npm run build           # フル ビルド
npm run build:client    # フロントエンドビルド
npm run build:server    # サーバーサイドビルド

# 開発ツール
npm run type-check      # TypeScript型チェック
npm run lint           # ESLint実行
npm run lint:fix       # ESLint自動修正
npm run preview        # ビルド結果プレビュー
```

### テスト・品質管理

```bash
# テスト実行
npm run test           # 全テスト実行
npm run test:watch     # ウォッチモード
npm run test:coverage  # カバレッジ測定

# コード品質
npm run lint           # リンティング
npm run lint:fix       # 自動修正
npm run type-check     # 型チェック
```

### デプロイ・運用

```bash
# 本番デプロイ
npm run deploy         # Cloud Runデプロイ

# データベース管理
npm run db:migrate     # マイグレーション実行
npm run db:seed        # サンプルデータ投入
npm run db:reset       # データベースリセット
```

## 📊 API仕様

### エンドポイント一覧

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|------|
| `POST` | `/api/interview/start` | 面接開始 | トークン |
| `POST` | `/api/interview/answer` | 回答送信 | - |
| `GET` | `/api/interview/session/:id` | セッション取得 | - |
| `POST` | `/api/interview/end` | 面接終了 | - |
| `GET` | `/api/interview/questions` | 質問一覧 | - |
| `GET` | `/api/interview/health` | ヘルスチェック | - |

### 面接開始 API

```typescript
POST /api/interview/start

// リクエスト
{
  "email": "user@justjoin.jp",
  "name": "山田太郎",
  "language": "ja",
  "consentGiven": true
}

// レスポンス
{
  "success": true,
  "sessionId": "interview_1234567890_abc123",
  "applicantId": "uuid-here",
  "message": "面接を開始します。よろしくお願いします。",
  "nextQuestion": {
    "id": "intro",
    "text": "簡単に自己紹介をしてください。",
    "order": 1,
    "estimatedTime": 60
  },
  "progress": {
    "current": 0,
    "total": 10,
    "percentage": 0
  },
  "jobSeekerInfo": {
    "name": "山田太郎",
    "position": "フロントエンドエンジニア",
    "experienceYears": 3,
    "skills": ["React", "TypeScript"]
  }
}
```

### 回答送信 API

```typescript
POST /api/interview/answer

// リクエスト
{
  "sessionId": "interview_1234567890_abc123",
  "questionId": "intro",
  "text": "はじめまして、山田太郎と申します。3年間フロントエンド開発に従事しており...",
  "responseTime": 45
}

// レスポンス（進行中）
{
  "success": true,
  "message": "ありがとうございます。それでは次の質問です。",
  "nextQuestion": {
    "id": "current_job",
    "text": "現在の職務内容について教えてください。",
    "order": 2,
    "estimatedTime": 90
  },
  "isComplete": false,
  "progress": {
    "current": 1,
    "total": 10,
    "percentage": 10
  }
}

// レスポンス（完了）
{
  "success": true,
  "message": "面接が完了しました。お疲れ様でした。",
  "isComplete": true,
  "sessionId": "interview_1234567890_abc123",
  "summary": {
    "totalDuration": 854,
    "questionsAnswered": 10,
    "completionRate": 100
  }
}
```

### ヘルスチェック API

```typescript
GET /api/interview/health

// レスポンス
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected",
    "aiInterviewer": "active",
    "questionService": "active"
  },
  "version": "1.0.0",
  "timestamp": "2025-01-27T09:00:00.000Z"
}
```

## 🔐 セキュリティ

### 認証・認可

- **トークンベース認証**: Base64エンコードされた30分有効トークン
- **1回制限**: 求職者1人につき1次面接は1回のみ
- **同意取得**: GDPR準拠の明示的同意システム
- **IPアドレス記録**: セキュリティ監査用

### データ保護

- **HTTPS通信**: すべてのAPI通信をHTTPS化
- **CORS設定**: 許可されたオリジンのみアクセス許可
- **ヘルメット**: セキュリティヘッダー自動設定
- **レート制限**: API呼び出し回数制限

### プライバシー

```typescript
// 同意取得例
{
  "consentRecording": true,     // 面接録音・記録への同意
  "consentDataProcessing": true, // データ処理への同意  
  "consentTerms": true          // 利用規約への同意
}
```

## 📈 監視・分析

### ログ設定

```javascript
// ログレベル設定
LOG_LEVEL=info  // error, warn, info, debug

// ログ出力先
logs/
├── access.log    # アクセスログ
├── error.log     # エラーログ
└── app.log       # アプリケーションログ
```

### メトリクス

- **面接完了率**: 開始〜完了の比率
- **平均面接時間**: セッション時間の統計
- **回答品質**: 文字数・応答時間分析
- **推奨分布**: 評価レベルの分布

### Cloud Monitoring

```bash
# Cloud Runメトリクス確認
gcloud monitoring metrics list --filter="resource.type=cloud_run_revision"

# ログ確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=justjoin-interview"
```

## 🧪 テスト

### テスト構成

```bash
# ユニットテスト
src/
├── components/__tests__/    # コンポーネントテスト
├── services/__tests__/      # サービステスト
└── utils/__tests__/         # ユーティリティテスト

# 統合テスト
tests/
├── api/           # API統合テスト
├── database/      # DB統合テスト
└── e2e/           # E2Eテスト
```

### テスト実行

```bash
# 全テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ測定
npm run test:coverage

# E2Eテスト
npm run test:e2e
```

### テストデータ

```bash
# テストユーザー作成
npm run db:seed:test

# テストセッション作成
curl -X POST http://localhost:3002/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"テストユーザー","consentGiven":true}'
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

```bash
# 問題: Error: connect ECONNREFUSED 127.0.0.1:5432
# 解決:
brew services start postgresql@14
psql -U postgres -d justjoin -c "SELECT 1;"
```

#### 2. TypeScriptエラー

```bash
# 問題: Module not found
# 解決:
npm run type-check
npm install --save-dev @types/missing-package
```

#### 3. ビルドエラー

```bash
# 問題: Build failed
# 解決:
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 4. 面接開始エラー

```bash
# 問題: Interview start failed
# 解決:
curl http://localhost:3002/api/interview/health
psql -U postgres -d justjoin -c "\dt interview_*"
```

### デバッグ

```bash
# 開発サーバーをデバッグモードで起動
DEBUG=* npm run dev:server

# ログレベルを上げる
LOG_LEVEL=debug npm run dev:server

# データベース接続確認
psql -U postgres -d justjoin -c "SELECT COUNT(*) FROM interview_sessions;"
```

### パフォーマンス最適化

#### フロントエンド

```typescript
// コード分割
const InterviewScreen = lazy(() => import('./components/InterviewScreen'));

// 画像最適化
<img 
  src="/images/avatar.webp" 
  loading="lazy"
  width="64" 
  height="64"
/>
```

#### バックエンド

```javascript
// データベース接続プール
const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// レスポンス圧縮
app.use(compression());
```

#### Cloud Run

```yaml
# 最適化設定
resources:
  limits:
    cpu: "2"
    memory: "2Gi"
spec:
  containerConcurrency: 100
  minScale: 1
  maxScale: 10
```

## 🚀 ロードマップ

### Phase 1: 基本機能（完了 ✅）
- [x] AI面接システム構築
- [x] メインプラットフォーム統合
- [x] 1回制限システム
- [x] トークンベース認証

### Phase 2: 機能拡張
- [ ] 音声面接対応
- [ ] 動画面接機能
- [ ] リアルタイム感情分析
- [ ] 多言語拡張（中国語、韓国語）

### Phase 3: 分析・最適化
- [ ] AI評価精度向上
- [ ] 面接結果分析ダッシュボード
- [ ] A/Bテスト機能
- [ ] パフォーマンス最適化

### Phase 4: 高度な機能
- [ ] カスタム質問作成
- [ ] 業界別面接テンプレート
- [ ] 機械学習による個人化
- [ ] 予測分析機能

## 📞 サポート

### 開発者向けサポート

- **技術的な質問**: GitHub Issues
- **バグレポート**: GitHub Issues + 詳細ログ
- **機能リクエスト**: GitHub Discussions

### ユーザー向けサポート

- **面接に関する質問**: `admin@justjoin.jp`
- **技術的な問題**: `support@justjoin.jp`
- **システム障害**: [status.justjoin.jp](https://status.justjoin.jp)

### ドキュメント

- **メインプラットフォーム**: [../README.md](../README.md)
- **API仕様**: [./docs/api.md](./docs/api.md)
- **デプロイガイド**: [./deploy/README.md](./deploy/README.md)

## 📄 ライセンス

JustJoin 専用システム - All Rights Reserved

### データ利用について

- 面接データは採用選考目的でのみ使用
- 個人情報はGDPR・個人情報保護法に準拠
- データ保持期間は面接完了から2年間
- データ削除要求に対応（個人情報保護法第30条）

---

**JustJoin AI面接システム v1.0.0**  
© 2025 JustJoin Platform. メインプラットフォームとの完全統合により、効率的な1次面接自動化を実現。 