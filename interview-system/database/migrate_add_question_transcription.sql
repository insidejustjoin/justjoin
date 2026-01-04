-- 面接録画テーブルにquestion_idとtranscription_textカラムを追加
-- Migration: Add question_id and transcription_text to interview_recordings table

-- question_idカラムを追加（質問ID: q1, q2, ..., q10）
ALTER TABLE interview_recordings 
ADD COLUMN IF NOT EXISTS question_id VARCHAR(10);

-- transcription_textカラムを追加（文字起こしテキスト）
ALTER TABLE interview_recordings 
ADD COLUMN IF NOT EXISTS transcription_text TEXT;

-- インデックスを追加（question_idで検索しやすくする）
CREATE INDEX IF NOT EXISTS idx_interview_recordings_question_id 
ON interview_recordings(question_id);

-- インデックスを追加（session_idとquestion_idの組み合わせで検索）
CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_question 
ON interview_recordings(session_id, question_id);



