import { Pool } from 'pg';
import { 
  Applicant, 
  InterviewSession, 
  Answer, 
  InterviewSummary,
  Language 
} from '../../src/types/interview.js';

class DatabaseService {
  private pool: Pool | null = null;

  constructor() {
    // 初期化は遅延させる
  }

  private initializePool() {
    if (this.pool) return;

    console.log('🔧 DatabaseService initializePool:');
    console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    if (process.env.DATABASE_URL) {
      // パスワードを隠してURLを表示
      const url = process.env.DATABASE_URL;
      const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');
      console.log('  DATABASE_URL (masked):', maskedUrl);
    } else {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 接続時にsearch_pathを設定してpublicスキーマを確実に使用
    this.pool.on('connect', async (client: any) => {
      try {
        await client.query('SET search_path = public');
      } catch (error) {
        console.error('❌ Error setting search_path:', error);
      }
    });

    console.log('  Pool created with settings:');
    console.log('    max:', 10);
    console.log('    idleTimeoutMillis:', 30000);
    console.log('    connectionTimeoutMillis:', 2000);
  }

  // 接続テスト
  async testConnection(): Promise<boolean> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // メインプラットフォームの求職者データから応募者を取得または作成
  async createOrGetApplicantFromJobSeeker(email?: string, name?: string): Promise<Applicant> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      let applicant: Applicant;

      if (email) {
        // メールアドレスから既存の求職者を検索
        const userQuery = `
          SELECT u.id as user_id, u.email, js.* 
          FROM users u 
          LEFT JOIN job_seekers js ON u.id = js.user_id 
          WHERE u.email = $1 AND u.user_type = 'job_seeker'
        `;
        const userResult = await this.pool.query(userQuery, [email]);

        if (userResult.rows.length > 0) {
          const userData = userResult.rows[0];
          // 既存の求職者データを面接システム用の応募者として使用
          applicant = {
            id: userData.user_id,
            email: userData.email,
            name: userData.full_name || name || 'Unknown',
            position: userData.desired_job_title || '',
            experienceYears: userData.experience_years || 0,
            skills: userData.skills || [],
            selfIntroduction: userData.self_introduction || '',
                          nationality: userData.nationality || 'N/A',
            createdAt: userData.created_at || new Date(),
            updatedAt: userData.updated_at || new Date()
          };

          console.log('✅ Found existing job seeker:', userData.email);
          return applicant;
        }
      }

      // 新規の応募者として面接専用テーブルに作成
      const insertQuery = `
        INSERT INTO interview_applicants (id, email, name, position, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const result = await this.pool.query(insertQuery, [
        email || `interview_${Date.now()}@temp.local`,
        name || 'Anonymous',
        'Unknown Position'
      ]);

      applicant = this.mapRowToApplicant(result.rows[0]);
      console.log('✅ Created new interview applicant:', applicant.email);
      return applicant;

    } catch (error) {
      console.error('❌ Error creating/getting applicant from job seeker:', error);
      throw new Error('Failed to create or get applicant');
    }
  }

  // 求職者プロフィールの詳細情報を取得
  async getJobSeekerProfile(applicantId: string): Promise<any> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const query = `
        SELECT u.*, js.* 
        FROM users u 
        LEFT JOIN job_seekers js ON u.id = js.user_id 
        WHERE u.id = $1
      `;
      const result = await this.pool.query(query, [applicantId]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting job seeker profile:', error);
      return null;
    }
  }

  // 面接セッションを作成
  async createInterviewSession(
    applicantId: string,
    language: Language = 'ja',
    consentGiven: boolean = false,
    ipAddress?: string,
    userAgent?: string
  ): Promise<InterviewSession> {
    try {
      const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const query = `
        INSERT INTO interview_sessions (
          id, applicant_id, status, language, current_question_index,
          consent_given, ip_address, user_agent, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const result = await this.pool?.query(query, [
        sessionId,
        applicantId,
        'waiting',
        language,
        0,
        consentGiven,
        ipAddress,
        userAgent
      ]);

      const session = this.mapRowToSession(result?.rows[0]);
      console.log('✅ Created interview session:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Error creating interview session:', error);
      throw new Error('Failed to create interview session');
    }
  }

  // 面接セッションを取得
  async getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
    try {
      const query = `
        SELECT * FROM interview_sessions 
        WHERE id = $1
      `;
      const result = await this.pool?.query(query, [sessionId]);

      if (result?.rows.length === 0) {
        return null;
      }

      return this.mapRowToSession(result?.rows[0]);
    } catch (error) {
      console.error('❌ Error getting interview session:', error);
      return null;
    }
  }

  // 面接セッションを更新
  async updateInterviewSession(
    sessionId: string,
    updates: Partial<InterviewSession>
  ): Promise<void> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt') {
          const dbKey = this.camelToSnake(key);
          setClause.push(`${dbKey} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (setClause.length === 0) return;

      setClause.push(`updated_at = NOW()`);
      values.push(sessionId);

      const query = `
        UPDATE interview_sessions 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
      `;

      await this.pool?.query(query, values);
      console.log('✅ Updated interview session:', sessionId);

    } catch (error) {
      console.error('❌ Error updating interview session:', error);
      throw new Error('Failed to update interview session');
    }
  }

  // 回答を保存
  async saveAnswer(answer: Answer): Promise<void> {
    try {
      const query = `
        INSERT INTO interview_answers (
          id, question_id, session_id, applicant_id, text, response_time,
          word_count, sentiment_score, timestamp, created_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;

      await this.pool?.query(query, [
        answer.questionId,
        answer.sessionId,
        answer.applicantId,
        answer.text,
        answer.responseTime,
        answer.wordCount,
        answer.sentimentScore,
        answer.timestamp
      ]);

      console.log('✅ Saved answer for question:', answer.questionId);
    } catch (error) {
      console.error('❌ Error saving answer:', error);
      throw new Error('Failed to save answer');
    }
  }

  // 面接サマリーを保存
  async saveInterviewSummary(summary: InterviewSummary): Promise<void> {
    try {
      const query = `
        INSERT INTO interview_summaries (
          session_id, applicant_id, total_questions, answered_questions,
          total_duration, average_response_time, completion_rate,
          key_insights, overall_score, strengths, areas_for_improvement,
          recommendation, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      `;

      await this.pool?.query(query, [
        summary.sessionId,
        summary.applicantId,
        summary.totalQuestions,
        summary.answeredQuestions,
        summary.totalDuration,
        summary.averageResponseTime,
        summary.completionRate,
        JSON.stringify(summary.keyInsights),
        summary.overallScore,
        JSON.stringify(summary.strengths),
        JSON.stringify(summary.areas_for_improvement),
        summary.recommendation,
        summary.notes
      ]);

      console.log('✅ Saved interview summary for session:', summary.sessionId);
    } catch (error) {
      console.error('❌ Error saving interview summary:', error);
      throw new Error('Failed to save interview summary');
    }
  }

  // 応募者の面接履歴を取得
  async getApplicantInterviewHistory(applicantId: string): Promise<InterviewSession[]> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const query = `
        SELECT * FROM interview_sessions 
        WHERE applicant_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [applicantId]);
      return result.rows.map(row => this.mapRowToSession(row));
    } catch (error) {
      console.error('❌ Error getting applicant interview history:', error);
      return [];
    }
  }

  // 求職者プロフィールに面接結果を関連付け
  async linkInterviewToJobSeekerProfile(sessionId: string, jobSeekerId: string): Promise<void> {
    try {
      // 面接結果を求職者のメタデータに追加
      const updateQuery = `
        UPDATE job_seekers 
        SET updated_at = NOW()
        WHERE user_id = $1
      `;
      await this.pool?.query(updateQuery, [jobSeekerId]);

      console.log('✅ Linked interview to job seeker profile:', jobSeekerId);
    } catch (error) {
      console.error('❌ Error linking interview to job seeker profile:', error);
    }
  }

  // 録音情報を保存
  async saveRecordingInfo(recordingInfo: {
    sessionId: string;
    type: 'video' | 'audio';
    filename: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    uploadedAt: Date;
    questionId?: string; // 質問ID（q1, q2, ..., q10）
    transcriptionText?: string; // 文字起こしテキスト
  }): Promise<void> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // セッションIDから応募者IDとemailを取得
      const sessionQuery = `
        SELECT s.applicant_id, a.email
        FROM interview_sessions s
        LEFT JOIN interview_applicants a ON s.applicant_id = a.id
        WHERE s.id = $1
      `;
      const sessionResult = await this.pool.query(sessionQuery, [recordingInfo.sessionId]);
      
      if (sessionResult.rows.length === 0) {
        console.error('❌ Session not found:', recordingInfo.sessionId);
        return;
      }

      const applicantId = sessionResult.rows[0].applicant_id;
      const email = sessionResult.rows[0].email;
      const recordingUrl = `/uploads/recordings/${recordingInfo.filename}`;

      // emailからuser_idを取得（メインプラットフォームのusersテーブルから）
      // user_idは数値またはUUID形式のいずれかの可能性がある
      let userId: number | string | null = null;
      if (email) {
        try {
          const userQuery = `
            SELECT id FROM users WHERE email = $1 AND user_type = 'job_seeker' LIMIT 1
          `;
          const userResult = await this.pool.query(userQuery, [email]);
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
            console.log('✅ Found user_id:', userId, 'for email:', email, 'type:', typeof userId);
          } else {
            console.warn('⚠️ User not found for email:', email);
          }
        } catch (userError) {
          console.warn('⚠️ Could not fetch user_id:', userError);
          // user_idの取得に失敗しても録音情報は保存する
        }
      }

      // 録音情報を保存（user_id、question_id、transcription_textも含める）
      const insertQuery = `
        INSERT INTO interview_recordings (
          session_id, applicant_id, user_id, recording_url, recording_type, file_size, storage_path, question_id, transcription_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await this.pool.query(insertQuery, [
        recordingInfo.sessionId,
        applicantId,
        userId,
        recordingUrl,
        recordingInfo.type,
        recordingInfo.filesize,
        recordingInfo.filepath,
        recordingInfo.questionId || null,
        recordingInfo.transcriptionText || null
      ]);

      console.log('✅ Saved recording info:', {
        sessionId: recordingInfo.sessionId,
        type: recordingInfo.type,
        filename: recordingInfo.filename,
        size: recordingInfo.filesize
      });
    } catch (error) {
      console.error('❌ Error saving recording info:', error);
      // エラーが発生しても面接を継続できるようにする
    }
  }

  // セッションの録音情報を取得
  async getSessionRecordings(sessionId: string): Promise<any[]> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const query = `
        SELECT * FROM interview_recordings 
        WHERE session_id = $1 
        ORDER BY uploaded_at DESC
      `;
      const result = await this.pool.query(query, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting session recordings:', error);
      return [];
    }
  }

  // プライベートヘルパーメソッド
  private mapRowToApplicant(row: any): Applicant {
    return {
      id: row.id,
      email: row.email || '',
      name: row.name || '',
      position: row.position || '',
      experienceYears: row.experience_years || 0,
      skills: row.skills || [],
      selfIntroduction: row.self_introduction || '',
      nationality: row.nationality || 'N/A',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToSession(row: any): InterviewSession {
    return {
      id: row.id,
      applicantId: row.applicant_id,
      status: row.status,
      language: row.language,
      currentQuestionIndex: row.current_question_index,
      startedAt: row.started_at ? new Date(row.started_at) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      totalDuration: row.total_duration,
      consentGiven: row.consent_given,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  async close(): Promise<void> {
    await this.pool?.end();
  }
}

export default new DatabaseService(); 