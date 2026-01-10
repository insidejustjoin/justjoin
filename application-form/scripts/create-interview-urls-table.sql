-- interview_urlsテーブルを作成
-- 面接システムとの統合のためにメインプラットフォームのデータベースにも作成

CREATE TABLE IF NOT EXISTS interview_urls (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_token TEXT NOT NULL,
    interview_url TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_interview_urls_user_id ON interview_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_urls_token ON interview_urls(interview_token);
CREATE INDEX IF NOT EXISTS idx_interview_urls_is_used ON interview_urls(is_used);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_interview_urls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_interview_urls_updated_at_trigger ON interview_urls;
CREATE TRIGGER update_interview_urls_updated_at_trigger
    BEFORE UPDATE ON interview_urls
    FOR EACH ROW
    EXECUTE FUNCTION update_interview_urls_updated_at();






