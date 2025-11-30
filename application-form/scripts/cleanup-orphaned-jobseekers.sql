-- 孤立したjob_seekersレコードをクリーンアップするスクリプト
-- 対応するusersレコードが存在しないjob_seekersレコードを削除

-- 削除対象の確認
SELECT 
  js.id,
  js.user_id,
  js.first_name,
  js.last_name,
  js.created_at,
  '孤立したレコード - 削除対象' as status
FROM job_seekers js
LEFT JOIN users u ON js.user_id = u.id
WHERE u.id IS NULL;

-- 孤立したレコードの削除
DELETE FROM job_seekers 
WHERE user_id NOT IN (SELECT id FROM users);

-- 削除後の確認
SELECT 
  COUNT(*) as remaining_jobseekers
FROM job_seekers js
INNER JOIN users u ON js.user_id = u.id;

-- データの整合性確認
SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
  'job_seekers' as table_name,
  COUNT(*) as record_count
FROM job_seekers js
INNER JOIN users u ON js.user_id = u.id; 