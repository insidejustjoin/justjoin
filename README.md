# JustJoin - 求人プラットフォーム

## 📋 プロジェクト概要
求人プラットフォームのフルスタックアプリケーション。React + TypeScript + Node.js + PostgreSQLで構築。

**🆕 AI面接システム統合完了！**
- 1次面接として自動AI面接システムを実装
- 求職者マイページから直接受験可能
- 1回限りの受験制限システム
- トークンベース認証で安全な面接実施
- **実際の面接機能**: 10個の質問に音声で回答
- **面接完了後自動無効化**: 面接完了後に面接URLが自動的に無効化
- **管理者による再有効化**: 管理者画面から面接を再度有効化可能

## 🏗️ アーキテクチャ

### フロントエンド
- **React + TypeScript + Vite**
- **UI Framework**: shadcn/ui + Tailwind CSS
- **状態管理**: React Context (AuthContext, LanguageContext)
- **ルーティング**: React Router

### バックエンド
- **Node.js + TypeScript**
- **データベース**: PostgreSQL (Cloud SQL)
- **認証**: JWT
- **ファイルストレージ**: Google Cloud Storage
- **デプロイ**: Google Cloud Run

### 🤖 AI面接システム
- **独立システム**: `interview-system/` フォルダで完全分離
- **フロントエンド**: React + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Node.js + Express + TypeScript
- **音声認識**: ブラウザのWeb Speech APIを使用した音声入力
- **面接質問**: 10個の標準的な面接質問（自己紹介〜逆質問）
- **面接管理**: 面接開始・完了時の自動通知システム
- **データベース**: メインプラットフォームと共有（PostgreSQL）
- **デプロイ**: `https://justjoin-interview-788053304941.asia-northeast1.run.app`

## 📁 ファイル構成

### ルートディレクトリ
```
justjoin/
├── README.md                    # このファイル
├── package.json                 # 依存関係管理
├── vite.config.ts              # Vite設定
├── tailwind.config.ts          # Tailwind CSS設定
├── tsconfig.json               # TypeScript設定
├── Dockerfile.gcp              # GCP用Dockerfile
├── env.gcp.yaml               # GCP環境変数設定
├── google-credentials.json     # GCPサービスアカウントキー
└── interview-system/           # 🆕 AI面接システム（独立）
    ├── README.md               # 面接システム専用README
    ├── package.json            # 面接システム依存関係
    ├── vite.config.ts          # 面接システムVite設定
    ├── Dockerfile              # 面接システム用Docker
    ├── deploy/                 # デプロイスクリプト
    ├── src/                    # 面接システムフロントエンド
    ├── server/                 # 面接システムバックエンド
    └── database/               # 面接システムDB設定
```

### メインプラットフォーム ソースコード
```
src/
├── main.tsx                    # アプリケーションエントリーポイント
├── App.tsx                     # メインアプリケーションコンポーネント
├── components/                 # Reactコンポーネント
│   ├── ui/                    # shadcn/uiコンポーネント
│   ├── Header.tsx             # ヘッダーコンポーネント
│   ├── LoginForm.tsx          # ログインフォーム
│   ├── RegisterForm.tsx       # 登録フォーム
│   └── ...
├── pages/                     # ページコンポーネント
│   ├── Home.tsx              # ホームページ
│   ├── JobSeekerRegister.tsx # 求職者登録ページ
│   ├── CompanyRegistration.tsx # 企業登録ページ
│   ├── JobSeekerMyPage.tsx   # 🆕 求職者マイページ（AI面接統合）
│   └── ...
├── contexts/                  # React Context
│   ├── AuthContext.tsx        # 認証状態管理
│   └── LanguageContext.tsx    # 言語切り替え
├── integrations/              # 外部サービス統合
│   ├── postgres/             # PostgreSQL接続
│   │   ├── client.ts         # データベースクライアント
│   │   ├── auth.ts           # 認証関連DB操作
│   │   ├── jobSeekers.ts     # 求職者DB操作
│   │   └── companies.ts      # 企業DB操作
│   ├── gcp/                  # Google Cloud Platform
│   │   └── storage.ts        # Cloud Storage操作
│   └── supabase/             # Supabase（現在未使用）
├── services/                  # ビジネスロジック
│   ├── emailService.ts        # メール送信サービス
│   └── spreadsheetService.ts  # スプレッドシート処理
├── api/                       # APIエンドポイント
│   ├── register.ts           # ユーザー登録API
│   └── excel.ts              # Excel処理API
└── utils/                     # ユーティリティ
    ├── auth.ts               # 認証ヘルパー
    └── storage.ts            # ストレージヘルパー
```

### サーバーサイド
```
server/
├── index.ts                   # サーバーエントリーポイント
├── authenticate.ts           # 🆕 JWT認証ミドルウェア
└── api/                       # サーバーAPI
    ├── documents.ts           # 🆕 書類処理API（面接統合含む）
    └── spreadsheet.ts         # スプレッドシートAPI
```

### AI面接システム（独立）
```
interview-system/
├── README.md                  # 面接システム専用ドキュメント
├── package.json              # 独立した依存関係
├── src/                       # フロントエンド
│   ├── components/           # 面接UI コンポーネント
│   │   ├── ConsentForm.tsx   # 同意フォーム
│   │   ├── InterviewScreen.tsx # 面接画面
│   │   └── CompletionScreen.tsx # 完了画面
│   ├── types/               # TypeScript型定義
│   │   └── interview.ts     # 面接関連型
│   └── App.tsx              # 面接アプリルート
├── server/                   # バックエンド
│   ├── api/                 # 面接API
│   │   └── interviewRoutes.ts # 面接エンドポイント
│   ├── services/            # ビジネスロジック
│   │   ├── aiInterviewerService.ts # AI面接官
│   │   ├── questionService.ts # 質問管理
│   │   └── databaseService.ts # データベース操作
│   └── index.ts             # サーバーエントリーポイント
├── database/                # データベース設定
│   └── schema.sql           # 面接システム用スキーマ
├── deploy/                  # デプロイメント
│   └── deploy-interview.sh  # Cloud Run デプロイスクリプト
└── Dockerfile               # 面接システム用コンテナ
```

### ビルド出力
```
dist/                          # フロントエンドビルド出力
dist-server/                   # サーバーサイドビルド出力
```

### スクリプト
```
scripts/                       # 開発・運用スクリプト
├── create-admin.cjs          # 管理者ユーザー作成
├── create-sample-data.ts     # サンプルデータ作成
├── test-db-connection.ts     # DB接続テスト
└── ...
```

### デプロイ・設定スクリプト
```
deploy-gcp.sh                 # GCPデプロイスクリプト
setup-complete.sh             # 完全環境設定
setup-workspace.sh            # ワークスペース設定
gcp-setup.sh                  # GCP初期設定
```

### サンプルファイル
```
sample/
├── file/                      # サンプルExcelファイル
│   ├── 履歴書_example.xlsx
│   ├── スキルシート_example.xlsx
│   └── ...
└── output/                    # 生成されたサンプルファイル
```

## 🗄️ データベース設計

### Cloud SQL設定
- **インスタンス名**: `justjoin-enterprise`
- **データベース名**: `justjoin`
- **ユーザー名**: `postgres`
- **パスワード**: `justjoin2024`
- **リージョン**: `asia-northeast1`

### 📝 ブログシステム テーブル構成
```sql
-- ブログ記事テーブル
blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ja TEXT NOT NULL,                    -- 日本語タイトル
  title_en TEXT NOT NULL,                    -- 英語タイトル
  content_ja TEXT NOT NULL,                  -- 日本語本文
  content_en TEXT NOT NULL,                  -- 英語本文
  excerpt_ja TEXT,                           -- 日本語抜粋
  excerpt_en TEXT,                           -- 英語抜粋
  slug_ja TEXT UNIQUE NOT NULL,              -- 日本語スラグ
  slug_en TEXT UNIQUE NOT NULL,              -- 英語スラグ
  author_id UUID REFERENCES users(id),       -- 著者ID
  category TEXT CHECK (category IN ('jobseeker', 'company')), -- カテゴリ
  status TEXT CHECK (status IN ('draft', 'published', 'archived')), -- ステータス
  featured_image_url TEXT,                   -- アイキャッチ画像URL
  meta_title_ja TEXT,                        -- 日本語メタタイトル
  meta_title_en TEXT,                        -- 英語メタタイトル
  meta_description_ja TEXT,                  -- 日本語メタ説明
  meta_description_en TEXT,                  -- 英語メタ説明
  meta_keywords_ja TEXT[],                   -- 日本語メタキーワード
  meta_keywords_en TEXT[],                   -- 英語メタキーワード
  view_count INTEGER DEFAULT 0,              -- 閲覧数
  published_at TIMESTAMP WITH TIME ZONE,     -- 公開日時
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- ブログカテゴリテーブル
blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ja TEXT NOT NULL,                     -- 日本語カテゴリ名
  name_en TEXT NOT NULL,                     -- 英語カテゴリ名
  slug_ja TEXT UNIQUE NOT NULL,              -- 日本語スラグ
  slug_en TEXT UNIQUE NOT NULL,              -- 英語スラグ
  description_ja TEXT,                       -- 日本語説明
  description_en TEXT,                       -- 英語説明
  parent_id UUID REFERENCES blog_categories(id), -- 親カテゴリID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- ブログタグテーブル
blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ja TEXT NOT NULL,                     -- 日本語タグ名
  name_en TEXT NOT NULL,                     -- 英語タグ名
  slug_ja TEXT UNIQUE NOT NULL,              -- 日本語スラグ
  slug_en TEXT UNIQUE NOT NULL,              -- 英語スラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- ブログ記事とタグの関連テーブル
blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
)
```

### メインプラットフォーム テーブル構成
```sql
-- ユーザー基本情報
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- 求職者詳細情報
job_seekers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_photo VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- 企業情報
companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- ユーザードキュメント
user_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  document_type VARCHAR(50),
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
)

-- 通知システム
notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 🤖 AI面接システム テーブル構成
```sql
-- 面接応募者（メインプラットフォームと連携）
interview_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  position VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- 面接セッション
interview_sessions (
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
)

-- 面接回答
interview_answers (
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
)

-- 面接サマリー
interview_summaries (
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
)
```

## ☁️ GCP設定

### プロジェクト情報
- **プロジェクトID**: `justjoin-platform`
- **リージョン**: `asia-northeast1`
- **メインサービス名**: `justjoin`
- **面接サービス名**: `justjoin-interview`（予定）

### サービス構成
1. **メインプラットフォーム（Cloud Run）**
   - URL: `https://justjoin-788053304941.asia-northeast1.run.app`
   - カスタムドメイン: `justjoin.jp`

2. **AI面接システム（Cloud Run）** 🆕
   - URL: `https://justjoin-interview-xxxxx.asia-northeast1.run.app`（予定）
   - カスタムドメイン: `interview.justjoin.jp`（予定）

3. **Cloud SQL**: PostgreSQLデータベース（共有）
   - インスタンス: `justjoin-enterprise`
   - 接続名: `justjoin-platform:asia-northeast1:justjoin-enterprise`

4. **Cloud Storage**: ファイルストレージ
   - バケット名: `justjoin-platform-match-job-documents`

### 環境変数設定
```yaml
# メインプラットフォーム env.gcp.yaml
DATABASE_URL: "postgresql://postgres:justjoin2024@/justjoin?host=/cloudsql/justjoin-platform:asia-northeast1:justjoin-enterprise"
GOOGLE_CLOUD_PROJECT_ID: "justjoin-platform"
GOOGLE_CLOUD_STORAGE_BUCKET: "justjoin-platform-match-job-documents"
NODE_ENV: "production"

# 面接システム env.example
DATABASE_URL: "postgresql://postgres:justjoin2024@localhost:5432/justjoin"
NODE_ENV: "development"
PORT: "3002"
```

## 🔧 開発・運用コマンド

### メインプラットフォーム
```bash
# 依存関係インストール
npm install

# 開発サーバー起動（フロントエンドのみ）
npm run dev

# ビルド
npm run build

# サーバーサイドビルド
npm run server:build
```

### 🤖 AI面接システム
```bash
# 面接システムディレクトリに移動
cd interview-system

# 依存関係インストール
npm install

# 開発環境設定
cp env.example .env.local

# データベース初期化
psql -U postgres -d justjoin -f database/schema.sql

# 開発サーバー起動
npm run dev              # フロントエンド + バックエンド
npm run dev:client       # フロントエンドのみ (port 3001)
npm run dev:server       # バックエンドのみ (port 3002)

# ビルド
npm run build           # フロントエンド + サーバーサイド
npm run build:client    # フロントエンドのみ
npm run build:server    # サーバーサイドのみ

# 本番環境デプロイ
npm run deploy          # Cloud Run デプロイ

# テスト
npm run test           # 全テスト実行
npm run type-check     # TypeScript型チェック
npm run lint           # ESLint実行
```

### データベース操作
```bash
# Cloud SQL Proxy起動
./cloud-sql-proxy justjoin-platform:asia-northeast1:justjoin-enterprise

# データベース接続テスト
psql "postgresql://postgres:justjoin2024@localhost:5432/justjoin"

# 管理者ユーザー作成
node scripts/create-admin.cjs

# 面接システムテーブル作成
cd interview-system
psql -U postgres -d justjoin -f database/schema.sql
```

### デプロイ
```bash
# メインプラットフォームデプロイ
./deploy-gcp.sh

# 面接システムデプロイ
cd interview-system
./deploy/deploy-interview.sh

# 環境設定
./setup-complete.sh
```

## 🤖 AI面接システム機能

### 主要機能
- **AI面接官**: 自然な日本語での自動面接進行
- **1次面接**: 求職者の基礎スクリーニング（1回限り）
- **面接準備フロー**: 4ステップの確認項目（基本情報・同意事項・環境確認・最終確認）
- **質問管理**: 10個の定型質問（自己紹介〜最終質問）
- **リアルタイム評価**: 回答の感情分析・完成度評価
- **多言語対応**: 日本語・英語対応
- **セキュア認証**: トークンベース30分有効認証
- **面接結果分析**: 詳細な評価・推奨レベル・改善点
- **結果ダッシュボード**: 管理者による面接結果の分析・管理
- **テスト環境**: 完全動作確認済み（開発・テスト環境）

### 面接フロー
```
1. 求職者がマイページから「AI面接を開始」
   ↓
2. トークンベース認証で新しいタブが開く
   ↓
3. 面接準備画面（求職者情報確認・面接の流れ説明）
   ↓
4. 実際の面接開始（10個の質問に音声で回答）
   - 質問1: 簡単に自己紹介をしてください
   - 質問2: 現在の職務内容について教えてください
   - 質問3: これまでに最も達成感を感じたプロジェクトについて教えてください
   - 質問4: チームでの役割についてどのように考えていますか？
   - 質問5: 当社（Just Join）に応募した理由は何ですか？
   - 質問6: ご自身の強み・弱みを教えてください
   - 質問7: 技術的に得意な分野と今後学びたい技術は何ですか？
   - 質問8: 困難な問題に直面した時、どのように解決しますか？
   - 質問9: 将来的なキャリアビジョンについて教えてください
   - 質問10: 最後に何か質問はありますか？
   ↓
5. 面接完了・結果表示
   ↓
6. 面接URL自動無効化（1回限り受験制限）
   ↓
7. 管理者画面で面接状態確認・再有効化可能
```

### 面接機能詳細

#### 音声認識機能
- **Web Speech API**: ブラウザの標準音声認識APIを使用
- **日本語・英語対応**: 言語設定に応じて自動切り替え
- **リアルタイム転写**: 音声をリアルタイムでテキストに変換
- **録音制御**: 録音開始・停止・やり直し機能

#### 面接質問（10個）
1. **自己紹介**: 簡単に自己紹介をしてください
2. **職務内容**: 現在の職務内容について教えてください  
3. **プロジェクト経験**: これまでに最も達成感を感じたプロジェクトについて教えてください
4. **チームワーク**: チームでの役割についてどのように考えていますか？
5. **志望動機**: 当社（Just Join）に応募した理由は何ですか？
6. **自己分析**: ご自身の強み・弱みを教えてください
7. **技術スキル**: 技術的に得意な分野と今後学びたい技術は何ですか？
8. **問題解決**: 困難な問題に直面した時、どのように解決しますか？
9. **キャリアビジョン**: 将来的なキャリアビジョンについて教えてください
10. **逆質問**: 最後に何か質問はありますか？

#### 面接管理システム
- **面接開始通知**: 面接開始時にメインプラットフォームに通知
- **面接完了通知**: 面接完了時に回答データをメインプラットフォームに送信
- **自動無効化**: 面接完了後に面接URLが自動的に無効化
- **受験回数管理**: 面接受験回数をデータベースに記録
- **管理者再有効化**: 管理者画面から面接を再度有効化可能

### 評価システム
- **総合スコア**: 0-100点での自動評価
- **推奨レベル**: strong_yes / yes / maybe / no / strong_no
- **詳細分析**: 強み・改善点・キーインサイト
- **完成度**: 回答率・平均回答時間・完了率

### 統合機能
- **ワンクリック開始**: メインプラットフォームから直接開始
- **面接準備画面**: 求職者情報確認と面接の流れ説明
- **実際の面接**: 10個の質問に音声で回答
- **1回制限**: 1次面接として1回のみ受験可能
- **自動無効化**: 面接完了後に面接URLが自動的に無効化
- **データ連携**: 既存求職者プロフィールを自動活用
- **結果表示**: マイページで面接結果・ステータス確認
- **管理者分析**: 面接結果の統計・分析・エクスポート
- **管理者再有効化**: 管理者画面から面接を再度有効化可能
- **結果ダッシュボード**: `/admin/interview-analytics` 専用分析ページ
- **面接履歴管理**: 面接受験回数と履歴の管理
- **テスト環境**: 開発・テスト環境での完全動作確認済み

## 📧 メール設定
- **サービス**: Gmail SMTP
- **アカウント**: `inside.justjoin@gmail.com`
- **管理者メール**: `admin@justjoin.jp`
- **多言語対応**: すべてのメールが日本語・英語両方で送信されます

## 🔐 認証設定
- **JWT Secret**: `justjoin-jwt-secret-2024`
- **Session Secret**: `justjoin-session-secret-2024`

## 📊 現在の状況
✅ **フロントエンド**: React + TypeScript + shadcn/ui  
✅ **バックエンド**: Node.js + Express + TypeScript  
✅ **データベース**: PostgreSQL (Cloud SQL)  
✅ **認証**: JWT  
✅ **ファイルストレージ**: Google Cloud Storage  
✅ **デプロイ**: Google Cloud Run  
✅ **カスタムドメイン**: justjoin.jp  
✅ **ログイン機能**: 正常動作確認済み  
✅ **ユーザー登録**: 正常動作確認済み  
✅ **API接続**: データベース接続正常  
✅ **通知システム**: 完全実装済み  
🆕 **AI面接システム**: 完全統合済み  
🆕 **面接マイページ**: 実装完了  
🆕 **1回制限システム**: 実装完了  
🆕 **トークン認証**: 実装完了  
🆕 **面接準備フロー**: 実装完了（確認項目・環境チェック）  
🆕 **面接システムテスト環境**: 開発・テスト完了  
🆕 **ブログシステム**: 完全実装済み  
🆕 **SEO対応**: メタデータ・OGP対応済み  
🆕 **多言語対応**: 日本語・英語自動翻訳済み  
🆕 **求職者向けブログサブドメイン**: 実装完了  
🆕 **管理者ブログ管理**: 統合完了  
🆕 **一括書類生成機能**: 完全実装完了  
🆕 **ログインページUX改善**: ステップバイステップガイダンス実装完了  
🆕 **仮登録システム**: 完全実装完了（2025-08-29）  

## 🔧 最近の修正・改善

### ログインページUX改善 (2025-01-27)
**新機能**: 求職者ログインページのユーザーエクスペリエンスを大幅改善

**主要機能**:
1. **ステップバイステップガイダンス**: 初回訪問時に直感的なガイダンスを表示
   - ステップ1: ログインタブを囲んで「登録済みの方はこちら」を表示
   - ステップ2: 「次へ」ボタンで求職者登録タブを囲んで「初回登録の方はこちら」を表示
   - ステップ3: 「入力に進む」ボタンでガイダンス終了・フォーム入力可能

2. **タブハイライト表示**: 現在のステップに応じてタブを視覚的にハイライト
   - アクティブなタブは完全表示
   - 非アクティブなタブは半透明表示
   - 直感的なナビゲーション

3. **β版表記の適切な配置**: フォームの下にβ版表記を移動
   - より適切な位置での表示
   - ユーザビリティ向上

4. **ガイダンス内言語切り替え機能**: ガイダンス表示中に言語を切り替え可能
   - 左上にグローブアイコン付きの言語切り替えボタン
   - リアルタイムでガイダンス内容が翻訳される
   - 言語切り替えヒントで操作方法を案内

**技術実装**:
- **LoginGuidance.tsx**: ステップ管理機能付きガイダンスコンポーネント
- **BetaNotice.tsx**: β版表記専用コンポーネント
- **多言語対応**: 日本語・英語両方でガイダンス表示
- **自動消去**: 10秒後に自動的にガイダンス消去
- **手動操作**: 各ステップでボタンクリックで次に進む
- **リアルタイム翻訳**: 言語切り替えと同時にガイダンス内容が翻訳

**ユーザーフロー**:
1. 初回訪問時に1秒後にガイダンス表示
2. ログインタブがハイライトされ「登録済みの方はこちら」を表示
3. 「次へ」ボタンで求職者登録タブに移動
4. 求職者登録タブがハイライトされ「初回登録の方はこちら」を表示
5. 「入力に進む」ボタンでガイダンス終了
6. フォーム入力可能
7. ガイダンス表示中は左上のボタンで言語切り替え可能

**翻訳キー**:
```typescript
// 日本語
'loginGuidance.loginTitle': '登録済みの方はこちら'
'loginGuidance.loginDescription': '既にアカウントをお持ちの方は、ログインフォームからお進みください。'
'loginGuidance.registerTitle': '初回登録の方はこちら'
'loginGuidance.registerDescription': '初めてご利用の方は、求職者登録フォームからアカウントを作成してください。'
'loginGuidance.nextButton': '次へ'
'loginGuidance.proceedButton': '入力に進む'
'loginGuidance.switchToEnglish': 'Switch to English'
'loginGuidance.switchToJapanese': '日本語に切り替え'
'loginGuidance.languageHint': '言語を切り替えるには左上のボタンをクリックしてください'
'betaNotice.message': 'このサービスは現在β版です。仕様や機能は予告なく変更される場合があります。'

// 英語
'loginGuidance.loginTitle': 'For registered users'
'loginGuidance.loginDescription': 'If you already have an account, please proceed from the login form.'
'loginGuidance.registerTitle': 'For first-time users'
'loginGuidance.registerDescription': 'If this is your first time, please create an account from the job seeker registration form.'
'loginGuidance.nextButton': 'Next'
'loginGuidance.proceedButton': 'Proceed to input'
'loginGuidance.switchToEnglish': 'Switch to English'
'loginGuidance.switchToJapanese': 'Switch to Japanese'
'loginGuidance.languageHint': 'Click the button in the top-left to switch language'
'betaNotice.message': 'This service is currently in beta. Specifications and features may change without notice.'
```

**結果**:
- 初回ユーザーのログイン・登録理解度向上
- 直感的なナビゲーション体験
- 適切なβ版表記の配置
- 完全な多言語対応による国際的なユーザビリティ
- ガイダンス内でのリアルタイム言語切り替え機能

### 一括書類生成機能の完全実装 (2025-01-27)
**新機能**: 管理者画面での求職者書類一括生成機能を完全実装

**主要機能**:
1. **一括書類生成**: 選択された求職者に対して履歴書・職務経歴書・スキルシートを一括生成
2. **ZIPファイルでの一括ダウンロード**: 生成された書類をZIPファイルにまとめてダウンロード
3. **進捗表示**: 書類生成の進捗バーとエラーハンドリング
4. **個別・全選択機能**: 求職者の個別選択と全選択機能
5. **ファイル名の自動生成**: `{姓名}_履歴書_職務経歴書_スキルシート.xlsx`形式での自動ファイル名生成

**技術実装**:
- **BulkDocumentGenerator.tsx**: `DocumentGenerator.tsx`を完全に踏襲した一括生成コンポーネント
- **ExcelJS統合**: 既存のExcel生成ロジックを一括処理に対応
- **JSZip統合**: 複数のExcelファイルをZIP形式でまとめる機能
- **求職者データ取得**: `/api/documents/{求職者ID}`から正確なデータを取得
- **エラーハンドリング**: 404エラー時のフォールバック処理と詳細ログ出力

**使用方法**:
1. 管理者画面（`/admin/jobseekers`）で求職者を選択
2. 「一括書類生成」ボタンをクリック
3. 選択された求職者分の書類を自動生成
4. ZIPファイルとして一括ダウンロード

**解決した問題**:
- 求職者IDとuser_idの不一致による検索失敗
- ファイル名が`求職者_{id}`形式になってしまう問題
- 一括生成時のデータ取得エラー（404エラー）
- ZIPファイルの内容が空になる問題

**結果**:
- 管理者の業務効率が大幅向上
- 求職者データに基づく正確な書類生成
- 適切なファイル名での一括ダウンロード
- 完全に動作する一括書類生成システム

### 求職者向けブログサブドメイン対応と管理者ブログ管理改善 (2025-08-02)
**新機能**:
1. **求職者向けブログサブドメイン**: `blog.jobseeker.justjoin.jp` 対応
2. **管理者ブログ管理統合**: 管理者ダッシュボードにブログ管理タブを追加
3. **求職者向けブログ最適化**: `/jobseeker/blog` ルートで求職者向けコンテンツ専用表示
4. **サブドメインデプロイ準備**: 独立したブログサービスのデプロイスクリプト作成

**技術実装**:
1. **ルーティング拡張**: `/jobseeker/blog` と `/jobseeker/blog/:slug` ルート追加
2. **ブログリスト最適化**: 求職者向けページでのカテゴリ固定表示
3. **ブログ記事詳細最適化**: 求職者向けページでの戻り先URL自動調整
4. **管理者ナビゲーション統合**: ブログ管理タブの追加と統合

**サブドメイン設定**:
- **デプロイスクリプト**: `deploy-blog-subdomain.sh` 作成
- **DNS設定手順**: `dns-setup-blog.md` 作成
- **Cloud Runサービス**: `justjoin-blog` サービス用設定
- **SSL証明書**: Cloud Run自動管理

**アクセスURL**:
- **メインサイト**: [https://justjoin.jp](https://justjoin.jp)
- **管理者画面**: [https://justjoin.jp/admin/jobseekers](https://justjoin.jp/admin/jobseekers)
- **ブログ一覧**: [https://justjoin.jp/blog](https://justjoin.jp/blog)
- **求職者向けブログ**: [https://justjoin.jp/jobseeker/blog](https://justjoin.jp/jobseeker/blog)
- **管理者ブログ管理**: [https://justjoin.jp/admin/blog](https://justjoin.jp/admin/blog)
- **サブドメイン（予定）**: [https://blog.jobseeker.justjoin.jp](https://blog.jobseeker.justjoin.jp)

**管理者ブログ管理機能**:
- 記事作成・編集・削除
- カテゴリ管理（求職者向け・企業向け）
- 公開・下書き・アーカイブ状態管理
- SEO設定（メタタイトル・メタ説明・キーワード）
- 多言語対応（日本語・英語自動翻訳）

### メール送信システム統一 (2025-01-27)
**変更内容**:
1. **多言語メール統一**: すべてのメールが日本語・英語両方を含む形式に統一
2. **言語パラメータ削除**: メール送信関数から言語パラメータを削除
3. **メールテンプレート更新**: 各メールテンプレートを日本語・英語併記形式に変更

**技術的詳細**:
- メール件名: 日本語 / 英語 の形式
- メール本文: 日本語の後に英語を併記
- HTML形式: 日本語と英語を改行で区切って表示
- 統一された形式でユーザビリティ向上

**対象メール**:
- 求職者登録完了メール
- 企業登録申請受付メール
- 企業承認・却下メール
- パスワード再発行メール
- パスワード変更通知メール
- 管理者関連メール
- エラー通知メール

### AI面接システム統合 (2025-01-27)
**新機能**: 
1. 独立したAI面接システムの構築（`interview-system/`）
2. メインプラットフォームとの完全統合
3. 求職者マイページにAI面接カードを追加
4. 1回限りの受験制限システム実装

**技術実装**:
1. **面接履歴管理API**: `/api/documents/interview-history/:userId`
2. **面接開始トークン生成**: `/api/documents/interview-token/:userId`
3. **トークンベース認証**: 30分有効・自動期限切れ
4. **データベース統合**: メインDBと面接DBの連携
5. **UI/UX統合**: マイページからワンクリック面接開始

**セキュリティ**:
- トークンベース認証（Base64エンコード）
- 1次面接1回制限の厳格実装
- IPアドレス・UserAgent記録
- 同意取得の必須化

**結果**:
- 求職者は[justjoin.jp/jobseeker/my-page](https://justjoin.jp/jobseeker/my-page)から直接AI面接受験可能
- 面接ステータス・結果の詳細表示
- 採用担当者による面接結果確認システム
- 完全自動化された1次面接プロセス

### ログイン問題の解決 (2025-07-13)
**問題**: AuthContext.tsxでログインAPIが500エラーを返していた

**原因**: 
1. Cloud SQLインスタンスに認証されたネットワークが設定されていなかった
2. 登録時に生成されたランダムパスワードがメールで送信されていたが、実際のパスワードが分からなかった

**解決策**:
1. Cloud SQLインスタンスに`0.0.0.0/0`の認証されたネットワークを追加
2. Cloud RunのサービスアカウントにCloud SQL接続権限を追加
3. テストユーザーのパスワードハッシュを正しい値に更新

**結果**:
- APIが正常に動作している
- データベース接続が確立されている
- ログイン機能が正常に動作している
- ユーザー登録機能が正常に動作している

### データベース設計の統一 (2025-07-13)
**変更内容**:
- テーブル設計を「users」テーブルに共通情報、詳細は「job_seekers」「companies」テーブルに分ける形に統一
- emailカラムをサブテーブルから削除
- 登録・更新処理を修正

### AuthContext.tsxの型エラー修正 (2025-07-13)
**問題**: localStorageからのユーザー復元時に`id.startsWith`エラーが発生

**解決策**:
- `id`の型を`string | number`に変更
- `id`を文字列に変換してから処理するよう修正
- localStorage保存時も`id`を文字列化
- 堅牢な型チェックとデバッグログを追加

### CSS表示問題の解決 (2025-07-13)
**問題**: サイトのCSSが反映されていない

**解決策**:
- ビルド設定のファイル名に`Date.now()`が含まれていたため安定したハッシュに修正
- `cssCodeSplit`を`false`に変更
- PostCSS設定をESM形式に修正

### 書類保存APIエンドポイントの追加 (2025-07-13)
**問題**: DocumentGenerator.tsxで`/api/jobseekers/documents`エンドポイントが404エラーを返していた

**原因**: 
1. サーバー設定で`documentsRoutes`が`/api`にマウントされていたが、フロントエンドは`/api/jobseekers/documents`を呼び出していた
2. データベースの`document_type`カラムが正しく指定されていなかった

**解決策**:
1. サーバー設定に`/api/jobseekers/documents`エンドポイントを追加
2. データベースクエリで`document_type`カラムを正しく指定
3. 保存・取得APIの両方を実装

**結果**:
- APIエンドポイントが正常に動作している
- 書類データの保存・取得が成功している
- フロントエンドからの呼び出しが正常に動作する

### 書類読み込みAPIエンドポイントの修正 (2025-07-13)
**問題**: DocumentGenerator.tsxで読み込み時にJSONパースエラーが発生していた

**原因**: 
1. フロントエンドは`/api/jobseekers/documents/${user.id}`（パスパラメータ）を呼び出していた
2. サーバー側のAPIは`/api/jobseekers/documents?userId=5`（クエリパラメータ）のみ対応していた
3. レスポンス形式がフロントエンドの期待と異なっていた

**解決策**:
1. サーバー側にパスパラメータ版のAPIエンドポイントを追加
2. レスポンス形式を`{success: true, data: {...}}`に統一
3. 両方のAPIエンドポイント（クエリパラメータ版とパスパラメータ版）を実装

**結果**:
- 読み込みAPIエンドポイントが正常に動作している
- 保存されたデータが正しく取得されている
- フロントエンドからの呼び出しが正常に動作する

### 書類保存時の413エラー修正 (2025-07-13)
**問題**: DocumentGenerator.tsxで書類保存時に413エラー（Content Too Large）が発生していた

**原因**: 
1. 書類データにBase64画像が含まれているため、リクエストサイズがCloud Runの制限（1MB）を超えていた
2. 画像が圧縮されていなかったため、非常に大きなサイズになっていた

**解決策**:
1. **画像圧縮機能の追加**: Canvas APIを使用して画像を800px幅、70%品質で圧縮
2. **データサイズチェック**: 保存時にデータサイズをチェックし、1MBを超える場合は画像を除外
3. **ファイルサイズ制限の緩和**: アップロード時の制限を10MBに変更（圧縮後は2MB以下になる）

**結果**:
- 画像が自動的に圧縮される
- データサイズが制限内に収まる
- 書類保存が正常に動作する
- 読み込み機能も正常に動作する

### 管理者用APIエンドポイントの追加 (2025-07-13)
**問題**: AdminJobSeekers.tsxで管理者画面の求職者一覧が表示されず、APIエンドポイントが存在しないエラーが発生していた

**原因**: 
1. サーバー側に管理者用のAPIエンドポイント（`/api/admin/jobseekers`）が実装されていなかった
2. AdminJobSeekers.tsxが存在しないエンドポイントを呼び出していたため、404エラーが発生

**解決策**:
1. **管理者用求職者一覧取得API**: `/api/admin/jobseekers`エンドポイントを追加
   - すべての求職者データを取得
   - ユーザー情報と結合して詳細データを返却
   - skillsフィールドのJSONパース処理を追加

2. **管理者用求職者詳細取得API**: `/api/jobseekers/:id`エンドポイントを追加
   - 特定の求職者IDで詳細データを取得
   - ユーザー情報と結合して詳細データを返却
   - skillsフィールドのJSONパース処理を追加

**結果**:
- 管理者画面の求職者一覧が正常に表示される
- 求職者データの詳細表示が可能
- 書類生成機能が管理者画面から利用可能
- APIエンドポイントが正常に動作する

## 🚀 次のステップ
1. ✅ ~~AI面接システムの実装~~ **完了**
2. ✅ ~~メインプラットフォームとの統合~~ **完了**
3. ✅ ~~1回制限システムの実装~~ **完了**
4. ✅ ~~通知機能の実装~~ **完了**
5. ✅ ~~面接準備フローの実装~~ **完了**
6. ✅ ~~面接システムテスト環境の構築~~ **完了**
7. ✅ ~~ブログシステムの実装~~ **完了**
8. ✅ ~~SEO対応・多言語対応~~ **完了**
9. ✅ ~~求職者向けブログサブドメイン対応~~ **完了**
10. ✅ ~~管理者ブログ管理統合~~ **完了**
11. ✅ ~~一括書類生成機能の実装~~ **完了**
12. ✅ ~~ログインページUX改善~~ **完了**
13. ✅ ~~仮登録システムの完全実装~~ **完了（2025-08-29）**
14. 🔄 面接システムの本番デプロイ（`interview.justjoin.jp`）
15. 🔄 ブログサブドメインデプロイ（`blog.jobseeker.justjoin.jp`）
16. 🔄 DNSサブドメイン設定（お名前.com）
17. ✅ ~~面接結果分析ダッシュボードの実装~~ **完了**
18. 🔄 求人投稿機能の実装
19. 🔄 求人検索機能の実装
20. 🔄 マッチング機能の実装
21. 🔄 管理者ダッシュボードの拡張

## 📝 注意事項
- 本番環境では適切なSSL証明書を使用
- セキュリティ設定の定期的な見直し
- データベースバックアップの定期実行
- ログ監視とアラート設定
- Cloud SQL Proxyのポート5432が既に使用されている場合は別ポートを使用
- 面接システムは1回限りの制限のため慎重な運用が必要
- 通知システムは大量送信時のパフォーマンス監視が必要
- 通知データの定期的なクリーンアップ（古い通知の削除）を推奨
- ブログサブドメイン設定時はDNS伝播に最大24時間かかる場合があります
- サブドメインデプロイ前にお名前.comでのDNS設定が必要です
- **仮登録システム**: 30分の有効期限と1回限りの使用制限のため、適切なクリーンアップ処理が必要
- **仮登録データ**: 期限切れデータの自動削除と手動クリーンアップの両方を推奨
- **重要**: コンポーネントの作成・修正時は、既存のコードを完全に踏襲すること。絶対に新しく作り直さないこと。既存のコードにデータを流し込んでforループで処理するだけのシンプルな実装を心がけること。

## 🔍 トラブルシューティング

### Cloud SQL Proxy接続エラー
```bash
# ポート5432が使用中の場合は別ポートを使用
./cloud-sql-proxy justjoin-platform:asia-northeast1:justjoin-enterprise --port=5433
```

### データベース接続テスト
```bash
# ローカル接続テスト
psql "postgresql://postgres:justjoin2024@localhost:5432/justjoin"

# テストユーザー作成
curl -X POST https://justjoin.jp/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"jobseeker","firstName":"Test","lastName":"User"}'
```

### AI面接システムのトラブルシューティング
```bash
# 面接システムの健康状態確認
curl http://localhost:3002/api/interview/health

# 面接システムデータベーステーブル確認
psql -U postgres -d justjoin -c "\dt interview_*"

# 面接セッション確認
psql -U postgres -d justjoin -c "SELECT * FROM interview_sessions ORDER BY created_at DESC LIMIT 5;"

# 面接履歴テスト
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/documents/interview-history/USER_ID

# 面接結果分析APIテスト
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3001/api/admin/interview/analytics

# 面接セッション一覧取得
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3001/api/admin/interview/sessions

# 面接サマリー一覧取得
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3001/api/admin/interview/summaries
```

### ブログシステムのトラブルシューティング
```bash
# ブログ記事一覧確認
psql -U postgres -d justjoin -c "SELECT title_ja, category, status FROM blog_posts ORDER BY created_at DESC;"

# ブログAPIテスト
curl http://localhost:3001/api/blog/posts?category=jobseeker&limit=5

# ブログ記事詳細テスト
curl -X POST -H "Content-Type: application/json" \
     -d '{"slug":"test-article","language":"ja","incrementView":true}' \
     http://localhost:3001/api/blog/post

# 管理者ブログAPIテスト
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3001/api/admin/blog/posts

# サブドメインDNS確認
nslookup blog.jobseeker.justjoin.jp
dig blog.jobseeker.justjoin.jp

# Cloud Runブログサービス確認
gcloud run services list --region=asia-northeast1 | grep justjoin-blog
```

### 通知システムのトラブルシューティング
```bash
# 通知テーブル確認
psql -U postgres -d justjoin -c "\dt notifications"

# 通知データ確認
psql -U postgres -d justjoin -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;"

# 未読通知数確認
psql -U postgres -d justjoin -c "SELECT user_id, COUNT(*) FROM notifications WHERE is_read = FALSE GROUP BY user_id;"

# 通知APIテスト
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/notifications/user/USER_ID

# 管理者通知送信テスト
curl -X POST -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"テスト通知","message":"テストメッセージ","type":"info"}' \
     http://localhost:3001/api/notifications/admin/send-to-all

# スポット通知履歴確認
psql -U postgres -d justjoin -c "SELECT * FROM spot_notification_history ORDER BY created_at DESC LIMIT 5;"

# ワークフロー通知履歴確認
psql -U postgres -d justjoin -c "SELECT * FROM workflow_notification_history ORDER BY created_at DESC LIMIT 5;"

# 通知履歴APIテスト
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3001/api/notifications/admin/spot-history

# 通知編集APIテスト
curl -X PUT -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"更新されたタイトル","message":"更新されたメッセージ","type":"success"}' \
     http://localhost:3001/api/notifications/admin/spot/NOTIFICATION_ID
```

## gitへのpush

### 基本的な手順

```bash
# 1. 変更されたファイルを確認
git status

# 2. すべての変更をステージングエリアに追加
git add .

# 3. 変更をコミット（適切なメッセージを記述）
git commit -m "変更内容の説明"

# 4. リモートリポジトリにプッシュ
git push insidejustjoin main
```

### 詳細な手順

#### 1. 変更の確認
```bash
# 現在のブランチと変更状態を確認
git status

# 変更されたファイルの差分を確認
git diff

# 変更されたファイルの詳細な差分を確認
git diff --cached
```

#### 2. ファイルのステージング
```bash
# 特定のファイルのみをステージング
git add ファイル名

# 特定のディレクトリ内のファイルをステージング
git add ディレクトリ名/

# すべての変更をステージング
git add .

# 削除されたファイルも含めてステージング
git add -A
```

#### 3. コミット
```bash
# 基本的なコミット
git commit -m "変更内容の説明"

# 詳細なコミットメッセージ（エディタが開く）
git commit

# ステージングとコミットを同時に実行
git commit -am "変更内容の説明"

# 前回のコミットメッセージを修正
git commit --amend
```

#### 4. プッシュ
```bash
# 現在のブランチをリモートにプッシュ
git push insidejustjoin main

# 強制プッシュ（注意: 既存の履歴が上書きされる）
git push insidejustjoin main --force

# タグも同時にプッシュ
git push insidejustjoin main --tags
```

### よく使用するコマンド

#### 履歴の確認
```bash
# コミット履歴を確認
git log

# 簡潔な履歴を確認
git log --oneline

# グラフィカルな履歴を確認
git log --graph --oneline --all

# 特定のファイルの履歴を確認
git log --follow ファイル名
```

#### ブランチ操作
```bash
# 新しいブランチを作成
git checkout -b ブランチ名

# ブランチを切り替え
git checkout ブランチ名

# ブランチ一覧を表示
git branch -a

# ブランチを削除
git branch -d ブランチ名
```

#### 変更の取り消し
```bash
# ステージングした変更を取り消し
git reset HEAD ファイル名

# ファイルの変更を取り消し
git checkout -- ファイル名

# 最後のコミットを取り消し
git reset --soft HEAD~1
```

### コミットメッセージの例

#### 面接システム関連
```bash
git commit -m "面接システムの大幅改善: システムチェック機能追加、UI/UX改善、日本語の流暢性向上"
git commit -m "面接システム: 自動音声・録画・録音機能を実装"
git commit -m "面接システム: 質問リストを10個に更新"
git commit -m "面接システム: 名前表示のバグを修正"
```

#### 一般的な改善
```bash
git commit -m "UI改善: ボタンデザインとアニメーションを追加"
git commit -m "バグ修正: 音声認識エラーを解決"
git commit -m "新機能: システムチェック機能を追加"
git commit -m "ドキュメント更新: READMEにgit手順を追加"
```

### トラブルシューティング

#### プッシュエラー
```bash
# リモートの変更を取得
git pull insidejustjoin main

# コンフリクトが発生した場合
git status  # コンフリクトファイルを確認
# 手動でコンフリクトを解決後
git add .
git commit -m "コンフリクトを解決"
git push insidejustjoin main
```

#### 認証エラー
```bash
# GitHubのPersonal Access Tokenを使用
# または、SSHキーを設定
git remote set-url insidejustjoin git@github.com:insidejustjoin/justjoin.git
```

### 注意事項

- **コミット前**: 必ず`git status`で変更内容を確認
- **コミットメッセージ**: 具体的で分かりやすい説明を記述
- **プッシュ前**: ローカルでのテスト完了を確認
- **強制プッシュ**: チーム開発では使用を避ける
- **ブランチ**: 大きな変更は新しいブランチで作業

### 推奨ワークフロー

```bash
# 1. 作業開始
git status
git pull insidejustjoin main

# 2. 開発・修正
# ... コードを編集 ...

# 3. 変更の確認
git status
git diff

# 4. コミット
git add .
git commit -m "具体的な変更内容"

# 5. プッシュ
git push insidejustjoin main

# 6. 確認
git log --oneline -5
```

## 🎊 仮登録システム完全実装完了！

**求職者登録プロセスが大幅に改善され、セキュアでユーザーフレンドリーな仮登録システムが完全実装されました！**

### 新機能
- **多段階登録プロセス**: 仮登録 → メール確認 → 書類入力 → パスワード設定 → 本登録完了
- **セキュアな認証**: 30分有効なトークンベース認証と1回限りの使用制限
- **完全な書類入力**: `/jobseeker/documents`と同じ内容・レイアウトでの必須項目入力
- **自動ログイン**: 本登録完了後の自動ログインとマイページリダイレクト
- **多言語対応**: 日本語・英語両方での完全対応

### ユーザーフロー
1. 仮登録フォームでメールアドレス・名・姓を入力
2. 30分有効な確認メールが送信される
3. メール内リンクをクリックして仮登録完了
4. 書類入力画面で必須項目を完了まで入力
5. パスワード設定（8文字以上、英数字混合）
6. 本登録完了・自動ログイン・マイページリダイレクト

### 技術的特徴
- 完全なデータベース設計（仮登録テーブル、インデックス、クリーンアップ関数）
- セキュアなAPI設計（レート制限、トークン管理、バリデーション）
- 既存コンポーネントの再利用（DocumentGenerator、EmailService等）
- 完全なエラーハンドリングとユーザーフレンドリーなメッセージ
- 運用・保守を考慮した設計（自動クリーンアップ、監視機能）

## 🎊 ログインページUX改善完了！

**求職者ログインページのユーザーエクスペリエンスが大幅に改善されました！**

### 新機能
- **ステップバイステップガイダンス**: 初回訪問時に直感的なナビゲーション
- **タブハイライト表示**: 現在のステップを視覚的に明確化
- **適切なβ版表記**: フォーム下に配置でユーザビリティ向上
- **ガイダンス内言語切り替え**: リアルタイムで言語を切り替え可能

### ユーザーフロー
1. 初回訪問時に1秒後にガイダンス表示
2. ログインタブがハイライトされ「登録済みの方はこちら」を表示
3. 「次へ」ボタンで求職者登録タブに移動
4. 求職者登録タブがハイライトされ「初回登録の方はこちら」を表示
5. 「入力に進む」ボタンでガイダンス終了
6. フォーム入力可能
7. ガイダンス表示中は左上のボタンで言語切り替え可能

### 技術的特徴
- 完全な多言語対応（日本語・英語）
- リアルタイム言語切り替え機能
- 自動消去機能（10秒後）
- 手動操作によるステップ進行
- 視覚的なタブハイライト
- レスポンシブデザイン対応
- 言語切り替えヒント表示

## 🎊 AI面接システム統合完了！

**AI面接システムがメインプラットフォームに完全統合されました！**

求職者は[justjoin.jp/jobseeker/my-page](https://justjoin.jp/jobseeker/my-page)から：
- ワンクリックでAI面接開始
- 面接準備画面で求職者情報確認と面接の流れ説明
- 実際の面接（10個の質問に音声で回答）
- 1次面接として1回のみ受験
- 面接完了後に自動的に面接URLが無効化
- 既存プロフィール情報を活用した個人化面接
- リアルタイム結果表示・評価確認

採用担当者は：
- 自動化された1次面接プロセス
- 詳細な面接結果・推奨レベル確認
- 効率的な候補者スクリーニング
- 管理者画面から面接の再有効化が可能

技術的には：
- 独立したマイクロサービス構成
- 安全なトークンベース認証
- 堅牢な1回制限システム
- 実際の音声認識機能（Web Speech API）
- 面接開始・完了時の自動通知システム
- スケーラブルなCloud Run構成
- テスト環境での完全動作確認済み

## 📝 ブログシステム実装完了！

**SEO対応・多言語対応のブログシステムが完全実装されました！**

### 主要機能
- **管理者ブログ管理**: [justjoin.jp/admin/blog](https://justjoin.jp/admin/blog)から記事作成・編集・管理
- **求職者向けブログ**: [justjoin.jp/blog](https://justjoin.jp/blog)で求職者向け記事表示
- **求職者向け専用ブログ**: [justjoin.jp/jobseeker/blog](https://justjoin.jp/jobseeker/blog)で求職者向けコンテンツ専用表示
- **企業向けブログ**: 企業向け記事の分類表示
- **SEO対応**: メタタイトル・メタ説明・OGP対応
- **多言語対応**: Gemini APIによる日本語→英語自動翻訳
- **閲覧数カウント**: 記事閲覧数の自動カウント
- **タグ・カテゴリ**: 記事の分類・タグ付け機能

### 技術実装
- **データベース設計**: 日本語・英語両方のコンテンツ保存
- **API設計**: RESTful APIによる記事取得・管理
- **フロントエンド**: React + TypeScript + shadcn/ui
- **翻訳機能**: Gemini APIによる自動翻訳
- **SEO最適化**: メタデータ・OGP・構造化データ対応
- **サブドメイン対応**: `blog.jobseeker.justjoin.jp` 用デプロイ準備

### 使用方法
1. **管理者**: `/admin/blog`で記事作成・編集
2. **求職者**: `/blog`で記事閲覧
3. **求職者専用**: `/jobseeker/blog`で求職者向けコンテンツ専用閲覧
4. **企業**: `/blog`で企業向け記事閲覧
5. **記事詳細**: `/blog/[slug]`で個別記事表示

### サンプル記事
以下のサンプル記事が作成済みです：
- **求職者向け**:
  - 転職活動を成功させるための5つのポイント
  - IT業界で求められるスキルと学習方法
- **企業向け**:
  - 優秀な人材を採用するための効果的な方法
  - リモートワーク時代の人材育成とマネジメント

### API エンドポイント
```
GET  /api/blog/posts?category=jobseeker&limit=10&offset=0  # 記事一覧取得
POST /api/blog/post                                         # 記事詳細取得
```

### データベース操作
```bash
# サンプル記事作成
npx tsx scripts/create-sample-blog-posts.ts

# 記事を公開状態に変更
psql -U postgres -d justjoin -c "UPDATE blog_posts SET status = 'published', published_at = NOW() WHERE status = 'draft';"

# 記事一覧確認
psql -U postgres -d justjoin -c "SELECT title_ja, category, status FROM blog_posts ORDER BY created_at DESC;"
```

### サブドメイン設定（予定）
```bash
# サブドメインデプロイ
./deploy-blog-subdomain.sh

# DNS設定（お名前.com）
# CNAMEレコード: blog.jobseeker → justjoin-blog-xxxxx.asia-northeast1.run.app
```

## 🔔 通知システム機能

### 主要機能
- **リアルタイム通知**: ユーザーアクションに応じた即座の通知
- **通知センター**: 専用ページでの通知管理・閲覧
- **未読カウント**: ヘッダーに未読通知数の表示
- **通知タイプ**: 情報・成功・警告・エラーの4種類
- **管理者通知**: 管理者による全ユーザー・特定ユーザーへの通知送信
- **自動通知**: プロフィール完成・書類作成完了時の自動通知
- **通知編集機能**: 管理者による通知内容の編集・更新
- **通知履歴管理**: スポット通知・ワークフロー通知の履歴表示・削除

### 通知タイプ
1. **情報 (info)**: 一般的な情報通知（青色）
2. **成功 (success)**: 完了・成功通知（緑色）
3. **警告 (warning)**: 注意喚起通知（黄色）
4. **エラー (error)**: エラー・問題通知（赤色）

### ユーザー機能
- **通知一覧表示**: 時系列順での通知表示
- **既読・未読管理**: 個別・一括既読化
- **通知削除**: 不要な通知の削除
- **未読カウント**: リアルタイム未読数表示
- **通知センター**: `/notifications` 専用ページ

### 管理者機能
- **通知送信**: 全ユーザー・特定ユーザーへの通知送信
- **通知管理**: 送信履歴の確認・削除・編集
- **通知タイプ選択**: 情報・成功・警告・エラーの選択
- **通知編集**: 送信済み通知の内容編集・更新
- **通知履歴**: スポット通知・ワークフロー通知の詳細履歴
- **管理者画面**: `/admin/notifications` 専用管理ページ
- **履歴管理**: `/admin/notification-history` 通知履歴専用ページ

### 自動通知トリガー
- **プロフィール完成**: プロフィール100%完成時の成功通知
- **書類作成完了**: 書類作成100%完成時の成功通知
- **システムエラー**: エラーログ閾値超過時の管理者通知
- **企業登録申請**: 新規企業登録申請時の管理者通知

### API エンドポイント
```
GET    /api/notifications/user/:userId          # ユーザー通知一覧取得
GET    /api/notifications/unread-count/:userId  # 未読通知数取得
PUT    /api/notifications/mark-read/:id         # 通知既読化
PUT    /api/notifications/mark-all-read/:userId # 全通知既読化
DELETE /api/notifications/:id                   # 通知削除
GET    /api/notifications/admin/all             # 管理者：全通知取得
POST   /api/notifications/admin/send-to-user    # 管理者：特定ユーザー通知送信
POST   /api/notifications/admin/send-to-all     # 管理者：全ユーザー通知送信
GET    /api/notifications/admin/spot-history    # 管理者：スポット通知履歴取得
GET    /api/notifications/admin/workflow-history # 管理者：ワークフロー通知履歴取得
PUT    /api/notifications/admin/spot/:id        # 管理者：スポット通知編集
DELETE /api/notifications/admin/spot/:id        # 管理者：スポット通知削除
PUT    /api/notifications/admin/update-user-notifications/:id # 管理者：ユーザー通知更新
```

### データベース設計
```sql
-- 通知テーブル
notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### UI/UX 機能
- **トースト通知**: 即座のフィードバック表示（sonner）
- **通知バッジ**: 未読通知数の視覚的表示
- **通知アイコン**: タイプ別の色分けアイコン
- **通知バッジ**: タイプ別の色分けバッジ
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **多言語対応**: 日本語・英語対応

### セキュリティ機能
- **JWT認証**: すべての通知APIで認証必須
- **管理者権限**: 管理者専用機能の権限チェック
- **ユーザー分離**: ユーザー間の通知データ分離
- **SQLインジェクション対策**: パラメータ化クエリ使用

### パフォーマンス最適化
- **インデックス最適化**: 高速な通知取得
- **ページネーション**: 大量通知の効率的表示
- **キャッシュ戦略**: 未読カウントの効率的取得
- **非同期処理**: 通知送信の非同期処理

### 運用機能
- **ログ記録**: 通知送信・受信の詳細ログ
- **エラーハンドリング**: 通知送信失敗時の適切な処理
- **監視機能**: 通知システムの健康状態監視
- **バックアップ**: 通知データの定期バックアップ

## 管理者画面機能拡張 (2025-01-27)

管理者画面に以下の機能を追加しました。

#### データ取得仕様
- **日本語資格**: `certificateStatus.name`から取得（例：N1、N2、N3、N4、N5、なし）
- **スキルレベル**: `skillSheet.skills[スキル名].evaluation`から取得（例：A、B、C、D、E）
- **性別**: 英語（male/female/other）と日本語（男性/女性/その他）の両方に対応
- **職歴**: `documentData.resume.workExperience`の存在有無で判定

### 追加機能

1. **求職者削除機能**
   - 求職者データの完全削除（ユーザーアカウントも含む）
   - 削除前の確認ダイアログ
   - 削除後のリスト自動更新

2. **管理者管理機能**
   - 管理者アカウントの追加・更新・削除
   - 管理者権限の管理（admin/super_admin）
   - 管理者ステータス管理（active/inactive）

3. **詳細フィルタリング機能**
   - ポップアップモーダルでの詳細フィルター設定
   - 年齢範囲、経験年数範囲、スキル、性別、配偶者、希望職種、住所での絞り込み
   - 登録日範囲、自己紹介記入済みなどの条件設定
   - 適用中のフィルター表示とクリア機能
   - **クイックフィルター改善**: 性別・職歴をチェックボックス式、日本語資格をドロップダウン選択

4. **一括書類生成機能** ✅ **完全実装完了**
   - 選択された求職者に対して一括で書類を生成
   - 進捗表示とエラーハンドリング
   - 個別・全選択機能
   - 生成された書類のZIPファイルでの一括ダウンロード
   - **モーダル表示**: 一括書類生成ボタンクリックでモーダル表示
   - **ファイル名自動生成**: `{姓名}_履歴書_職務経歴書_スキルシート.xlsx`形式
   - **ExcelJS統合**: 既存の書類生成ロジックを完全踏襲
   - **JSZip統合**: 複数ファイルのZIP形式での一括ダウンロード

### 技術的詳細

- **サーバー側API追加**：
  - `DELETE /api/admin/jobseekers/:id` - 求職者削除
  - `GET /api/admin/users` - 管理者一覧取得
  - `POST /api/admin/users` - 管理者追加
  - `PUT /api/admin/users/:id` - 管理者更新
  - `DELETE /api/admin/users/:id` - 管理者削除

- **フロントエンドコンポーネント**：
  - `AdvancedFilterModal.tsx` - 詳細フィルタリングモーダル
  - `BulkDocumentGenerator.tsx` - 一括書類生成コンポーネント
  - `AdminUsers.tsx` - 管理者管理ページ

- **UI/UX改善**：
  - チェックボックスによる求職者選択
  - フィルター適用状況の視覚的表示
  - 進捗バーとエラー表示
  - レスポンシブデザイン対応

### 使用方法

1. **求職者削除**：求職者カードの「削除」ボタンをクリック
2. **詳細フィルター**：「詳細フィルター」ボタンをクリックしてモーダルを開く
3. **一括書類生成**：求職者を選択後「一括書類生成」ボタンをクリック
4. **管理者管理**：ナビゲーションの「管理者管理」をクリック

これらの機能により、管理者の業務効率が大幅に向上し、より柔軟な求職者管理が可能になりました。

## 面接システム機能拡張と管理者画面改善 (2025-08-12)

面接システムと管理者画面の機能を大幅に改善・拡張しました。

### 面接システムの改善

1. **面接URLの有効期限を無限に変更**
   - 面接URLの有効期限を30分から無限に変更
   - `expires_at`をNULLに設定して期限切れを回避
   - 1回受験後に面接URLを無効化する仕組みを実装

2. **面接開始時の面接URL無効化**
   - 面接開始時に面接URLを使用済み（`is_used = TRUE`）にするAPIを追加
   - `/api/documents/interview-start/:token`エンドポイントを実装
   - 1回使用後の面接URLは再利用不可

3. **面接履歴取得APIの500エラー解消**
   - 面接セッションテーブルが空の場合のエラーハンドリングを追加
   - 面接履歴チェックでエラーが発生した場合は無視して処理を継続
   - 複雑なJOINクエリを簡素化して安定性を向上

4. **面接システムのテスト用ボタンを追加**
   - 求職者マイページに「テスト用面接システム」ボタンを追加
   - `https://interview.justjoin.jp/test` へのリンクを提供
   - 開発・テスト環境での面接システム動作確認が可能

### 管理者画面の面接状態表示改善

1. **面接状態の詳細表示**
   - 面接状態を取得するAPIエンドポイントを追加
   - `/api/documents/admin/interview-status/:userId`で面接状態を取得
   - 面接状態を以下のように分類：
     - **公開前**: 面接が無効化されている場合
     - **受験前**: 面接が有効で、面接URLが存在する場合
     - **受験完了**: 面接が有効だが、面接URLが使用済みの場合

2. **面接状態の視覚的表示**
   - 求職者カードに面接状態バッジを追加
   - 状態に応じた色分け表示（公開前：グレー、受験前：ブルー、受験完了：グリーン）
   - 面接有効化/無効化の切り替え状態も併せて表示

3. **面接管理機能の統合**
   - 「1次面接開始」ボタンを削除してUIをクリーンアップ
   - 面接のオンオフ機能を面接状態表示と統合
   - 面接状態の自動更新機能を実装

### 技術的実装

- **新しいAPIエンドポイント**：
  - `POST /api/documents/interview-start/:token` - 面接開始時の面接URL無効化
  - `GET /api/documents/admin/interview-status/:userId` - 管理者用面接状態取得

- **データベース設計の改善**：
  - `interview_urls`テーブルの`expires_at`をNULL許容に変更
  - 面接URLの有効期限管理を`is_used`フラグに集約

- **エラーハンドリングの強化**：
  - 面接セッションテーブルが空の場合の適切な処理
  - 面接履歴チェックでのエラー発生時のフォールバック処理

### 使用方法

1. **面接URL生成**: 管理者が面接有効化を設定
2. **面接状態確認**: 管理者画面で面接状態を確認
3. **面接受験**: 求職者が面接URLを使用して面接開始
4. **状態更新**: 面接開始時に面接URLが自動的に無効化
5. **状態表示**: 管理者画面で面接状態が「受験完了」に更新

### 期待される効果

- **面接システムの安定性向上**: 500エラーの解消と安定した動作
- **面接管理の効率化**: 面接状態の一目での把握が可能
- **面接URLの適切な管理**: 1回使用後の無効化でセキュリティ向上
- **開発・テスト環境の充実**: テスト用面接システムボタンで動作確認が容易

これらの改善により、面接システムの安定性と管理者の面接管理効率が大幅に向上しました。

## 仮登録システムの完全実装 (2025-08-29)

求職者登録プロセスを大幅に改善し、セキュアでユーザーフレンドリーな仮登録システムを完全実装しました。

### 新システムの概要

**従来のシステム**: 直接登録（パスワード入力 → 即座にアカウント作成）
**新しいシステム**: 仮登録 → メール確認 → 書類入力 → パスワード設定 → 本登録完了

### 主要機能

1. **仮登録フロー**
   - メールアドレス、名、姓の入力
   - 30分有効な確認メール送信
   - メール内のリンククリックで仮登録完了

2. **書類入力フロー**
   - `/jobseeker/documents`と同じ内容・レイアウト
   - 「書類作成」ボタンを「次へ（パスワード設定）」ボタンに変更
   - 必須項目の完全なバリデーション
   - 「学歴なし」「職歴なし」「資格なし」チェックボックス対応

3. **パスワード設定**
   - 8文字以上、英数字混合のバリデーション
   - パスワード設定完了後に本登録完了
   - 自動ログインとマイページリダイレクト

4. **セキュリティ機能**
   - UUID + タイムスタンプによるトークン生成
   - 30分の有効期限
   - 1回限りの使用制限
   - レート制限（3リクエスト/分/IP）
   - 期限切れデータの自動削除

### 技術実装

#### データベース設計
```sql
-- 仮登録テーブル
CREATE TABLE temporary_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    documents_data JSONB, -- 書類入力データ
    password_hash VARCHAR(255), -- パスワード設定後のハッシュ
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'documents_completed', 'completed')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスとクリーンアップ関数
CREATE INDEX idx_temporary_registrations_email ON temporary_registrations(email);
CREATE INDEX idx_temporary_registrations_token ON temporary_registrations(verification_token);
CREATE INDEX idx_temporary_registrations_expires ON temporary_registrations(expires_at);
CREATE INDEX idx_temporary_registrations_status ON temporary_registrations(status);

-- 期限切れデータの自動削除用関数
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_registrations()
RETURNS void AS $$
BEGIN
    DELETE FROM temporary_registrations 
    WHERE expires_at < NOW() AND status != 'completed';
END;
$$ LANGUAGE plpgsql;
```

#### バックエンドAPI
- **`/api/register/temporary`**: 仮登録開始（メール送信）
- **`/api/register/verify/:token`**: トークン検証
- **`/api/register/documents/:token`**: 書類データ保存
- **`/api/register/complete/:token`**: パスワード設定と本登録完了

#### フロントエンドコンポーネント
- **`TemporaryRegistrationForm.tsx`**: 仮登録フォーム（メール、名、姓）
- **`RegistrationVerification.tsx`**: 多段階登録プロセス管理
- **`DocumentGenerator.tsx`**: 登録モード対応（書類入力）
- **`PasswordSettingForm.tsx`**: パスワード設定フォーム

#### メールサービス
- **多言語対応**: 日本語・英語両方でメール送信
- **テンプレート**: 仮登録確認メールの専用テンプレート
- **リンク生成**: 30分有効な確認リンク

### ユーザーフロー

```
1. 仮登録フォーム入力
   ↓
2. 確認メール送信（30分有効）
   ↓
3. メール内リンククリック
   ↓
4. 書類入力（必須項目完了まで）
   ↓
5. パスワード設定
   ↓
6. 本登録完了・自動ログイン
   ↓
7. マイページリダイレクト
```

### バリデーション機能

#### 必須項目チェック
- **基本情報**: 氏名、メール、電話、生年月日、住所
- **学歴**: 学歴データまたは「学歴なし」チェック
- **職歴**: 職歴データまたは「職歴なし」チェック
- **スキル**: スキルシートの必須入力

#### パスワード要件
- 8文字以上
- 英数字混合
- 特殊文字は任意

### セキュリティ対策

1. **トークン管理**
   - UUID v4による一意性保証
   - タイムスタンプによる期限管理
   - 1回限りの使用制限

2. **レート制限**
   - IPアドレスベースの制限
   - 3リクエスト/分の制限
   - ブルートフォース攻撃対策

3. **データ保護**
   - パスワードのbcryptハッシュ化
   - 期限切れデータの自動削除
   - 既存ユーザーの重複登録防止

### エラーハンドリング

- **無効なトークン**: 期限切れ・既使用の場合の適切なエラーメッセージ
- **必須項目未入力**: 具体的な項目名と入力方法の案内
- **パスワード要件**: 要件を満たしていない場合の詳細な説明
- **システムエラー**: ユーザーフレンドリーなエラーメッセージ

### 多言語対応

- **日本語**: メイン言語として完全対応
- **英語**: 全機能の英語翻訳対応
- **動的切り替え**: リアルタイムでの言語切り替え
- **メール**: 日本語・英語両方での送信

### 運用・保守

1. **定期クリーンアップ**
   - 期限切れデータの自動削除
   - データベースの最適化
   - ログの監視と分析

2. **パフォーマンス監視**
   - API応答時間の監視
   - データベースクエリの最適化
   - メール送信の成功率監視

3. **セキュリティ監視**
   - 不正アクセスの検出
   - レート制限の効果測定
   - トークンの使用パターン分析

### 期待される効果

- **ユーザビリティ向上**: 段階的な登録プロセスでユーザーの負担軽減
- **セキュリティ強化**: メール確認による本人確認の確実性向上
- **データ品質向上**: 必須項目の完全な入力によるプロフィール完成度向上
- **運用効率化**: 自動化された登録プロセスによる運用負荷軽減
- **国際展開対応**: 多言語対応によるグローバル展開の準備

### 今後の拡張予定

1. **SMS認証**: メール認証に加えてSMS認証の追加
2. **ソーシャルログイン**: Google、Facebook等のソーシャルログイン統合
3. **二段階認証**: セキュリティ強化のための二段階認証
4. **AI面接統合**: 仮登録完了後のAI面接自動開始
5. **オンボーディング**: 新規ユーザー向けの段階的ガイダンス

この仮登録システムにより、JustJoinプラットフォームのユーザー体験とセキュリティが大幅に向上し、より多くの求職者に安全で使いやすいサービスを提供できるようになりました。