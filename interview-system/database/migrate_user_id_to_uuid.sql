-- interview_recordingsテーブルのuser_idカラムをUUID型に変更するマイグレーション
-- Migration: Change user_id column type from INTEGER to UUID in interview_recordings table

-- user_idカラムがINTEGER型の場合、UUID型に変更
DO $$
BEGIN
    -- user_idカラムの現在の型を確認
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interview_recordings' 
        AND column_name = 'user_id'
        AND data_type = 'integer'
    ) THEN
        -- 既存のインデックスを削除
        DROP INDEX IF EXISTS idx_interview_recordings_user_id;
        
        -- user_idカラムをUUID型に変更
        -- 既存のINTEGER値をNULLにする（UUIDに変換できないため）
        ALTER TABLE interview_recordings 
        ALTER COLUMN user_id TYPE UUID USING NULL;
        
        -- インデックスを再作成
        CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id 
        ON interview_recordings(user_id);
        
        RAISE NOTICE 'user_id column changed from INTEGER to UUID';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interview_recordings' 
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'user_id column is already UUID type';
    ELSE
        RAISE NOTICE 'user_id column does not exist';
    END IF;
END $$;

