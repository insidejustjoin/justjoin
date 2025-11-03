-- job_seekersテーブルにregistration_typeカラムを追加（なければ追加）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_seekers' 
        AND column_name = 'registration_type'
    ) THEN
        ALTER TABLE job_seekers 
        ADD COLUMN registration_type VARCHAR(20) DEFAULT 'engineer' 
        CHECK (registration_type IN ('engineer', 'general'));
        -- 既存データは全てエンジニアとして扱う
        UPDATE job_seekers SET registration_type = 'engineer' WHERE registration_type IS NULL;
    END IF;
END $$;

