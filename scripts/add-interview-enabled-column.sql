-- 既存のjob_seekersテーブルにinterview_enabledカラムを追加
-- このスクリプトは既存のデータベースに対して実行してください

-- interview_enabledカラムが存在しない場合のみ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_seekers' 
        AND column_name = 'interview_enabled'
    ) THEN
        ALTER TABLE job_seekers 
        ADD COLUMN interview_enabled BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'interview_enabledカラムを追加しました';
    ELSE
        RAISE NOTICE 'interview_enabledカラムは既に存在します';
    END IF;
END $$;

-- 既存のレコードのinterview_enabledをfalseに設定
UPDATE job_seekers 
SET interview_enabled = false
WHERE interview_enabled IS NULL;

-- 確認用クエリ
SELECT 
    id, 
    full_name, 
    interview_enabled, 
    created_at 
FROM job_seekers 
ORDER BY created_at DESC 
LIMIT 5; 