-- ユーザーテーブルでsonokenno25work@gmail.comの状況を確認
SELECT 
    u.id as user_id, 
    u.email, 
    u.status as user_status,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at
FROM users u 
WHERE u.email = 'sonokenno25work@gmail.com';

-- 求職者テーブルで関連データを確認
SELECT 
    js.id as job_seeker_id,
    js.user_id,
    js.first_name,
    js.last_name,
    js.created_at as job_seeker_created_at
FROM job_seekers js 
JOIN users u ON js.user_id = u.id 
WHERE u.email = 'sonokenno25work@gmail.com';

-- 仮登録テーブルで関連データを確認
SELECT 
    tr.id as temp_reg_id,
    tr.email,
    tr.status as temp_status,
    tr.created_at as temp_created_at,
    tr.expires_at
FROM temporary_registrations tr 
WHERE tr.email = 'sonokenno25work@gmail.com';

-- ユーザードキュメントテーブルで関連データを確認
SELECT 
    ud.id as doc_id,
    ud.user_id,
    ud.document_type,
    ud.created_at as doc_created_at
FROM user_documents ud 
JOIN users u ON ud.user_id = u.id 
WHERE u.email = 'sonokenno25work@gmail.com';
