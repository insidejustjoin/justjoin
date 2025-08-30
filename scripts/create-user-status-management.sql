-- 退会ユーザー管理システムのためのテーブル構造とデータ更新

-- 1. 既存のsonokenno25work@gmail.comユーザーを退会状態に変更
UPDATE users 
SET status = 'inactive', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'sonokenno25work@gmail.com';

-- 2. 退会理由を記録するためのテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS user_status_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    reason VARCHAR(255),
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 退会理由を記録
INSERT INTO user_status_history (user_id, previous_status, new_status, reason, changed_by)
VALUES (
    (SELECT id FROM users WHERE email = 'sonokenno25work@gmail.com'),
    'active',
    'inactive',
    '仮登録システムテスト後の退会処理',
    (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1)
);

-- 4. 仮登録データをクリーンアップ（期限切れのもの）
DELETE FROM temporary_registrations 
WHERE expires_at < NOW() AND status != 'completed';

-- 5. 仮登録システムで既存ユーザーをチェックする際の条件を確認
-- 現在は 'active' なユーザーのみチェックしているが、
-- 'inactive' なユーザーは再登録可能にする必要がある

-- 6. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_user_status_history_user_id ON user_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_history_changed_at ON user_status_history(changed_at);

-- 7. 現在の状況確認
SELECT 
    'Current Status' as info,
    u.email,
    u.status,
    u.user_type,
    u.created_at,
    CASE 
        WHEN js.id IS NOT NULL THEN 'Has Job Seeker Profile'
        ELSE 'No Job Seeker Profile'
    END as profile_status
FROM users u
LEFT JOIN job_seekers js ON u.id = js.user_id
WHERE u.email = 'sonokenno25work@gmail.com';

-- 8. 仮登録データの状況確認
SELECT 
    'Temporary Registration Status' as info,
    email,
    status,
    expires_at,
    created_at
FROM temporary_registrations 
WHERE email = 'sonokenno25work@gmail.com'; 