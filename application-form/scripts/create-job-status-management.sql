-- 求職者ステータス管理テーブル
-- このスクリプトは求職者の就職・退会状態を管理するためのテーブルを作成します

-- 求職者ステータス履歴テーブル
CREATE TABLE IF NOT EXISTS job_seeker_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'employed', 'withdrawn')),
    company_name VARCHAR(255), -- 就職先企業名（就職済みの場合）
    company_url TEXT, -- 就職先企業URL（就職済みの場合）
    employment_date DATE, -- 就職日（就職済みの場合）
    withdrawal_date DATE, -- 退会日（退会済みの場合）
    reason TEXT, -- 退会理由（退会済みの場合）
    notes TEXT, -- 備考
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_job_seeker_status_history_user_id ON job_seeker_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_status_history_status ON job_seeker_status_history(status);
CREATE INDEX IF NOT EXISTS idx_job_seeker_status_history_created_at ON job_seeker_status_history(created_at);

-- 現在のステータスを管理するビュー（最新のステータスのみ）
CREATE OR REPLACE VIEW current_job_seeker_status AS
SELECT DISTINCT ON (user_id) 
    user_id,
    status,
    company_name,
    company_url,
    employment_date,
    withdrawal_date,
    reason,
    notes,
    created_at,
    updated_at
FROM job_seeker_status_history
ORDER BY user_id, created_at DESC;

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_job_seeker_status_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
CREATE TRIGGER trigger_update_job_seeker_status_history_updated_at
    BEFORE UPDATE ON job_seeker_status_history
    FOR EACH ROW
    EXECUTE FUNCTION update_job_seeker_status_history_updated_at();

-- 既存の求職者をアクティブステータスとして登録
INSERT INTO job_seeker_status_history (user_id, status, created_at)
SELECT DISTINCT js.user_id, 'active', NOW()
FROM job_seekers js
WHERE NOT EXISTS (
    SELECT 1 FROM job_seeker_status_history jsh 
    WHERE jsh.user_id = js.user_id
);

-- サンプルデータ（テスト用）
-- INSERT INTO job_seeker_status_history (user_id, status, company_name, company_url, employment_date, created_at)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'employed', 'サンプル株式会社', 'https://example.com', '2024-01-15', NOW()),
--     ('00000000-0000-0000-0000-000000000002', 'withdrawn', NULL, NULL, NULL, NOW());

-- コメント
COMMENT ON TABLE job_seeker_status_history IS '求職者のステータス履歴を管理するテーブル';
COMMENT ON COLUMN job_seeker_status_history.status IS 'ステータス: active(求職中), employed(就職済み), withdrawn(退会済み)';
COMMENT ON COLUMN job_seeker_status_history.company_name IS '就職先企業名（就職済みの場合のみ）';
COMMENT ON COLUMN job_seeker_status_history.company_url IS '就職先企業URL（就職済みの場合のみ）';
COMMENT ON COLUMN job_seeker_status_history.employment_date IS '就職日（就職済みの場合のみ）';
COMMENT ON COLUMN job_seeker_status_history.withdrawal_date IS '退会日（退会済みの場合のみ）';
COMMENT ON COLUMN job_seeker_status_history.reason IS '退会理由（退会済みの場合のみ）'; 