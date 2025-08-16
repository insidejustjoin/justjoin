#!/bin/bash

# データベースセットアップスクリプト
echo "=== JustJoin データベースセットアップ ==="

# 環境変数の確認
echo "環境変数を確認中..."
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URLが設定されていません"
    echo "env.gcp.yamlの設定を確認してください"
    exit 1
fi

echo "DATABASE_URL: $DATABASE_URL"

# データベース接続テスト
echo "データベース接続をテスト中..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "データベース接続に失敗しました"
    echo "Cloud SQLインスタンスが起動していることを確認してください"
    exit 1
fi

echo "データベース接続成功"

# テーブル作成
echo "テーブルを作成中..."

# ユーザーテーブル作成
echo "usersテーブルを作成中..."
psql "$DATABASE_URL" -f create-users-table.sql

# 求職者テーブル作成
echo "job_seekersテーブルを作成中..."
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS job_seekers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  desired_job_title VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  skills TEXT[],
  self_introduction TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

# 企業テーブル作成
echo "companiesテーブルを作成中..."
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  description TEXT,
  industry VARCHAR(255),
  company_size VARCHAR(100),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

# 書類テーブル作成
echo "user_documentsテーブルを作成中..."
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS user_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

# インデックス作成
echo "インデックスを作成中..."
psql "$DATABASE_URL" -c "
CREATE INDEX IF NOT EXISTS idx_job_seekers_user_id ON job_seekers(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);
"

echo "=== データベースセットアップ完了 ==="
echo "管理者アカウント: admin@justjoin.jp / admin123"
echo "データベース接続情報:"
echo "  インスタンス名: justjoin"
echo "  データベース名: postgres"
echo "  ユーザー名: postgres"
echo "  パスワード: justjoin2024" 