-- 面接システム用データベーススキーマ
-- Just Join Interview System Database Schema

-- 応募者テーブル
CREATE TABLE IF NOT EXISTS interview_applicants (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    position VARCHAR(255),
    experience_years INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 面接セッションテーブル
CREATE TABLE IF NOT EXISTS interview_sessions (
    id VARCHAR(36) PRIMARY KEY,
    applicant_id VARCHAR(36) REFERENCES interview_applicants(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, in_progress, completed, cancelled
    language VARCHAR(2) NOT NULL DEFAULT 'ja', -- ja, en
    current_question_index INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_duration INTEGER, -- 秒数
    consent_given BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 面接回答テーブル
CREATE TABLE IF NOT EXISTS interview_answers (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(10) NOT NULL, -- q1, q2, etc.
    session_id VARCHAR(36) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    applicant_id VARCHAR(36) REFERENCES interview_applicants(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    response_time INTEGER NOT NULL, -- 秒数
    word_count INTEGER DEFAULT 0,
    sentiment_score DECIMAL(3, 2), -- -1.00 から 1.00
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 面接サマリーテーブル
CREATE TABLE IF NOT EXISTS interview_summaries (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(36) UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    applicant_id VARCHAR(36) REFERENCES interview_applicants(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL,
    answered_questions INTEGER NOT NULL,
    total_duration INTEGER NOT NULL, -- 秒数
    average_response_time DECIMAL(10, 2),
    completion_rate DECIMAL(5, 4), -- 0.0000 から 1.0000
    key_insights JSONB DEFAULT '[]',
    overall_score INTEGER, -- 0-100
    strengths JSONB DEFAULT '[]',
    areas_for_improvement JSONB DEFAULT '[]',
    recommendation VARCHAR(20), -- strong_yes, yes, maybe, no, strong_no
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 面接URL管理テーブル（新規追加）
CREATE TABLE IF NOT EXISTS interview_urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    interview_token TEXT NOT NULL,
    interview_url TEXT NOT NULL,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 面接受験回数管理テーブル（新規追加）
CREATE TABLE IF NOT EXISTS interview_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    first_attempt_at TIMESTAMP,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 面接録画テーブル（新規追加）
CREATE TABLE IF NOT EXISTS interview_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    recording_url TEXT,
    duration INTEGER DEFAULT 0, -- 秒
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_interview_sessions_applicant_id ON interview_sessions(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_applicant_id ON interview_answers(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_question_id ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_timestamp ON interview_answers(timestamp);

CREATE INDEX IF NOT EXISTS idx_interview_summaries_applicant_id ON interview_summaries(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_summaries_recommendation ON interview_summaries(recommendation);
CREATE INDEX IF NOT EXISTS idx_interview_summaries_overall_score ON interview_summaries(overall_score);

-- 新規追加テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_interview_urls_user_id ON interview_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_urls_token ON interview_urls(interview_token);
CREATE INDEX IF NOT EXISTS idx_interview_urls_is_used ON interview_urls(is_used);

CREATE INDEX IF NOT EXISTS idx_interview_attempts_user_id ON interview_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_attempts_attempt_count ON interview_attempts(attempt_count);

CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_id ON interview_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_applicant_id ON interview_recordings(applicant_id);

-- トリガーの作成（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_applicants_updated_at 
    BEFORE UPDATE ON interview_applicants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON interview_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_urls_updated_at 
    BEFORE UPDATE ON interview_urls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_attempts_updated_at 
    BEFORE UPDATE ON interview_attempts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 面接録画テーブルのトリガー
CREATE OR REPLACE FUNCTION update_interview_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_interview_recordings_updated_at
  BEFORE UPDATE ON interview_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_recordings_updated_at();

-- サンプルデータの挿入（開発用）
INSERT INTO interview_applicants (id, email, name, position) VALUES 
('test-applicant-1', 'test@example.com', 'テストユーザー', 'ソフトウェアエンジニア')
ON CONFLICT (id) DO NOTHING;

-- 統計ビューの作成
CREATE OR REPLACE VIEW interview_statistics AS
SELECT 
    COUNT(DISTINCT ia.id) as total_applicants,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'in_progress' THEN s.id END) as in_progress_sessions,
    AVG(s.total_duration) as avg_interview_duration,
    AVG(sm.overall_score) as avg_overall_score,
    COUNT(DISTINCT CASE WHEN sm.recommendation IN ('strong_yes', 'yes') THEN sm.session_id END) as positive_recommendations
FROM interview_applicants ia
LEFT JOIN interview_sessions s ON ia.id = s.applicant_id
LEFT JOIN interview_summaries sm ON s.id = sm.session_id; 