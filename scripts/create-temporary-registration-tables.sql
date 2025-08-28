-- 仮登録システム用テーブル作成スクリプト
-- 実行方法: psql -U postgres -d justjoin -f scripts/create-temporary-registration-tables.sql

-- 仮登録テーブル
CREATE TABLE IF NOT EXISTS temporary_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    documents_data JSONB, -- 書類入力データ
    password_hash VARCHAR(255), -- パスワード設定後のハッシュ
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'documents_completed', 'completed')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_temporary_registrations_email ON temporary_registrations(email);
CREATE INDEX IF NOT EXISTS idx_temporary_registrations_token ON temporary_registrations(verification_token);
CREATE INDEX IF NOT EXISTS idx_temporary_registrations_expires ON temporary_registrations(expires_at);
CREATE INDEX IF NOT EXISTS idx_temporary_registrations_status ON temporary_registrations(status);

-- 期限切れデータの自動削除用関数
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_registrations()
RETURNS void AS $$
BEGIN
    DELETE FROM temporary_registrations 
    WHERE expires_at < NOW() AND status != 'completed';
END;
$$ LANGUAGE plpgsql;

-- 定期的なクリーンアップ用のコメント（手動実行またはcronで実行）
-- SELECT cleanup_expired_temporary_registrations();

-- テーブル作成確認
\dt temporary_registrations;

-- サンプルデータ挿入（テスト用）
-- INSERT INTO temporary_registrations (email, first_name, last_name, verification_token, expires_at) 
-- VALUES ('test@example.com', '太郎', '田中', 'test-token-123', NOW() + INTERVAL '30 minutes'); 