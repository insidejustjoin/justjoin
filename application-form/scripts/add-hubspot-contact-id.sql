-- HubSpotコンタクトIDをusersテーブルに追加
-- このカラムにより、メールアドレス検索をスキップして直接HubSpotコンタクトを更新できる

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT;

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_hubspot_contact_id ON users(hubspot_contact_id) WHERE hubspot_contact_id IS NOT NULL;

-- コメントを追加
COMMENT ON COLUMN users.hubspot_contact_id IS 'HubSpotのコンタクトID。メールアドレス検索をスキップして直接更新するために使用';

