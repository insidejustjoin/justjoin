-- 求職者テーブルに就職状況カラムを追加

-- 1. employment_statusカラムを追加
ALTER TABLE job_seekers 
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'unemployed';

-- 2. 就職状況の制約を追加
ALTER TABLE job_seekers 
ADD CONSTRAINT IF NOT EXISTS check_employment_status 
CHECK (employment_status IN ('unemployed', 'employed', 'part_time', 'freelance', 'student'));

-- 3. 既存データの更新（例：特定の条件で就職済みに設定）
-- UPDATE job_seekers SET employment_status = 'employed' WHERE id IN (SELECT id FROM job_seekers LIMIT 5);

-- 4. インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_job_seekers_employment_status ON job_seekers(employment_status);

-- 5. 現在の状況確認
SELECT 
    'Current Job Seekers Status' as info,
    COUNT(*) as total_count,
    COUNT(CASE WHEN u.status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN u.status = 'inactive' THEN 1 END) as inactive_users,
    COUNT(CASE WHEN js.employment_status = 'employed' THEN 1 END) as employed_users,
    COUNT(CASE WHEN js.employment_status = 'unemployed' THEN 1 END) as unemployed_users
FROM job_seekers js
LEFT JOIN users u ON js.user_id = u.id;

-- 6. サンプルデータの表示
SELECT 
    js.id,
    js.first_name,
    js.last_name,
    u.email,
    u.status as user_status,
    js.employment_status,
    js.created_at
FROM job_seekers js
LEFT JOIN users u ON js.user_id = u.id
ORDER BY js.created_at DESC
LIMIT 10; 