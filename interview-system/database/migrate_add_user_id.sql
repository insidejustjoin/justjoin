-- interview_recordingsテーブルにuser_idカラムを追加するマイグレーション
-- Migration to add user_id column to interview_recordings table

-- user_idカラムが存在しない場合のみ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interview_recordings' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE interview_recordings 
        ADD COLUMN user_id INTEGER;
        
        -- インデックスの作成
        CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id 
        ON interview_recordings(user_id);
        
        RAISE NOTICE 'user_id column added to interview_recordings table';
    ELSE
        RAISE NOTICE 'user_id column already exists in interview_recordings table';
    END IF;
END $$;

