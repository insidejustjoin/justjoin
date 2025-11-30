-- 新規登録の求職者の面接システムを無効にするスクリプト
-- このスクリプトは、面接システムが有効になっている新規求職者を無効にします

-- 面接システムが有効になっている求職者を確認
SELECT 
  js.id,
  js.full_name,
  js.interview_enabled,
  js.created_at
FROM job_seekers js
WHERE js.interview_enabled = true
ORDER BY js.created_at DESC;

-- 面接システムを無効にする（新規登録の求職者のみ）
UPDATE job_seekers 
SET interview_enabled = false 
WHERE interview_enabled = true;

-- 更新後の確認
SELECT 
  js.id,
  js.full_name,
  js.interview_enabled,
  js.created_at
FROM job_seekers js
ORDER BY js.created_at DESC
LIMIT 10; 