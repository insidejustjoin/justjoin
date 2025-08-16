-- GCP Cloud SQL PostgreSQL用スキーマ
-- Supabaseのauth.usersテーブルに相当するユーザーテーブルを作成

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  password_hash TEXT,
  user_type TEXT CHECK (user_type IN ('job_seeker', 'company', 'admin')),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'active')) DEFAULT 'pending'
);

-- 求職者プロフィール用のテーブルを作成
CREATE TABLE IF NOT EXISTS job_seekers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  kana_first_name TEXT,
  kana_last_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  email TEXT,
  phone TEXT,
  address TEXT,
  desired_job_title TEXT,
  experience_years INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  self_introduction TEXT,
  -- 追加フィールド（DocumentGenerator対応）
  spouse TEXT,
  spouse_support TEXT,
  commuting_time TEXT,
  family_number TEXT,
  profile_photo TEXT,
  -- 面接表示制御用フィールド
  interview_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 企業テーブルを作成
CREATE TABLE IF NOT EXISTS companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large')),
  founded_year INTEGER,
  website TEXT,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 求人情報テーブルを作成
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship')),
  remote_work BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'inactive', 'closed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 応募テーブルを作成
CREATE TABLE IF NOT EXISTS applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  job_seeker_id UUID REFERENCES job_seekers(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('applied', 'reviewing', 'interview', 'offered', 'rejected')) DEFAULT 'applied',
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id, job_seeker_id)
);

-- ユーザーの書類データを保存するテーブルを作成
CREATE TABLE IF NOT EXISTS user_documents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) DEFAULT 'all',
  document_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログ記事テーブルを作成
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ja TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ja TEXT NOT NULL,
  content_en TEXT NOT NULL,
  excerpt_ja TEXT,
  excerpt_en TEXT,
  slug_ja TEXT UNIQUE NOT NULL,
  slug_en TEXT UNIQUE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT CHECK (category IN ('jobseeker', 'company')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  featured_image_url TEXT,
  meta_title_ja TEXT,
  meta_title_en TEXT,
  meta_description_ja TEXT,
  meta_description_en TEXT,
  meta_keywords_ja TEXT[] DEFAULT '{}',
  meta_keywords_en TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログカテゴリテーブルを作成
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug_ja TEXT UNIQUE NOT NULL,
  slug_en TEXT UNIQUE NOT NULL,
  description_ja TEXT,
  description_en TEXT,
  parent_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログタグテーブルを作成
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug_ja TEXT UNIQUE NOT NULL,
  slug_en TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブログ記事とタグの関連テーブルを作成
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_job_seekers_user_id ON job_seekers(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(location);
CREATE INDEX IF NOT EXISTS idx_applications_job_posting_id ON applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ブログ関連のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_ja ON blog_posts(slug_ja);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_en ON blog_posts(slug_en);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- updated_atを自動更新する関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atを自動更新するトリガーを追加
DROP TRIGGER IF EXISTS update_job_seekers_updated_at ON job_seekers;
CREATE TRIGGER update_job_seekers_updated_at
  BEFORE UPDATE ON job_seekers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ブログ関連のトリガーを追加
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_tags_updated_at ON blog_tags;
CREATE TRIGGER update_blog_tags_updated_at
  BEFORE UPDATE ON blog_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 年齢カラム追加（2025-07-15）
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS age INTEGER; 