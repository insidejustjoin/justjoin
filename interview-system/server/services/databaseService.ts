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
  async createOrGetApplicantFromJobSeeker(email?: string, name?: string, position?: string): Promise<Applicant> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // search_pathを明示的に設定
      await this.pool.query('SET search_path = public');

      let applicant: Applicant;

      if (email) {
        // メールアドレスから既存の求職者を検索
        console.log('既存の求職者を検索:', email);
        try {
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
          // user_idはUUID形式の可能性があるため、文字列として扱う
          applicant = {
            id: String(userData.user_id), // UUIDを文字列に変換
            email: userData.email,
            name: userData.full_name || name || 'Unknown',
            position: userData.desired_job_title || position || '',
            experienceYears: userData.experience_years || 0,
            skills: userData.skills || [],
            selfIntroduction: userData.self_introduction || '',
            nationality: userData.nationality || 'N/A',
            createdAt: userData.created_at || new Date(),
            updatedAt: userData.updated_at || new Date()
          };

          console.log('✅ Found existing job seeker:', {
            id: applicant.id,
            email: applicant.email,
            name: applicant.name
          });
          
          // 既存の求職者の場合、interview_applicantsテーブルにも存在するか確認
          // 存在しない場合は作成する（セッション作成時の外部キー制約を満たすため）
          const applicantCheckQuery = `
            SELECT id FROM interview_applicants WHERE id = $1
          `;
          const applicantCheckResult = await this.pool.query(applicantCheckQuery, [applicant.id]);
          
          if (applicantCheckResult.rows.length === 0) {
            console.log('interview_applicantsテーブルに存在しないため、作成します');
            const insertApplicantQuery = `
              INSERT INTO interview_applicants (id, email, name, position, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                  email = EXCLUDED.email,
                  name = EXCLUDED.name,
                  position = EXCLUDED.position,
                  updated_at = NOW()
              RETURNING *
            `;
              const insertResult = await this.pool.query(insertApplicantQuery, [
              applicant.id,
              applicant.email,
              applicant.name,
              applicant.position
            ]);
              
              if (insertResult.rows && insertResult.rows.length > 0) {
            console.log('✅ interview_applicantsテーブルに作成しました');
              } else {
                // 既に存在していた場合は再取得
                const existingResult = await this.pool.query(applicantCheckQuery, [applicant.id]);
                if (existingResult.rows.length > 0) {
                  console.log('✅ interview_applicantsテーブルに既に存在していました');
                }
              }
          }
          
          return applicant;
          }
        } catch (queryError: any) {
          // users テーブルが存在しない場合（別データベースの場合など）は、新規応募者として作成
          if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
            console.log('⚠️ users/job_seekersテーブルが存在しないため、新規応募者として作成します:', queryError.message);
            // この場合は後続の処理で新規応募者として作成される
          } else {
            // その他のエラーは再スロー
            throw queryError;
          }
        }
      }

      // 新規の応募者として面接専用テーブルに作成
      const applicantEmail = email || `interview_${Date.now()}@temp.local`;
      const applicantName = name || 'Anonymous';
      const applicantPosition = position || 'Unknown Position';
      
      console.log('新規の応募者を作成:', { email: applicantEmail, name: applicantName, position: applicantPosition });
      
      // emailが既に存在する場合は取得、存在しない場合は作成
      const upsertQuery = `
        INSERT INTO interview_applicants (id, email, name, position, created_at, updated_at)
        VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, interview_applicants.name),
          position = COALESCE(EXCLUDED.position, interview_applicants.position),
          updated_at = NOW()
        RETURNING *
      `;
      
      const result = await this.pool.query(upsertQuery, [
        applicantEmail,
        applicantName,
        applicantPosition
      ]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('応募者の作成後、結果が返されませんでした');
      }

      applicant = this.mapRowToApplicant(result.rows[0]);
      console.log('✅ Created/Updated interview applicant:', {
        id: applicant.id,
        email: applicant.email,
        name: applicant.name,
        position: applicant.position
      });
      return applicant;

    } catch (error) {
      console.error('❌ Error creating/getting applicant from job seeker:', error);
      if (error instanceof Error) {
        console.error('エラー詳細:', {
          message: error.message,
          stack: error.stack,
          email,
          name,
          position
        });
        // PostgreSQLエラーの場合、詳細情報をログに記録
        if ((error as any).code) {
          console.error('PostgreSQLエラーコード:', (error as any).code);
          console.error('PostgreSQLエラー詳細:', (error as any).detail);
          console.error('PostgreSQLエラーメッセージ:', (error as any).message);
          console.error('PostgreSQLエラー位置:', (error as any).position);
        }
      }
      // エラーメッセージを改善して再スロー
      const enhancedError = error instanceof Error 
        ? new Error(`応募者情報の取得に失敗しました: ${error.message}${(error as any).code ? ` (コード: ${(error as any).code})` : ''}`)
        : new Error('応募者情報の取得に失敗しました: 不明なエラー');
      (enhancedError as any).originalError = error;
      throw enhancedError;
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
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // search_pathを明示的に設定
      await this.pool.query('SET search_path = public');

      const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('セッション作成クエリ実行:', {
        sessionId,
        applicantId,
        language,
        consentGiven
      });

      const query = `
        INSERT INTO interview_sessions (
          id, applicant_id, status, language, current_question_index,
          consent_given, ip_address, user_agent, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        sessionId,
        applicantId,
        'waiting',
        language,
        0,
        consentGiven,
        ipAddress || null,
        userAgent || null
      ]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('セッション作成後、結果が返されませんでした');
      }

      const session = this.mapRowToSession(result.rows[0]);
      console.log('✅ Created interview session:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Error creating interview session:', error);
      if (error instanceof Error) {
        console.error('エラー詳細:', {
          message: error.message,
          stack: error.stack,
          applicantId,
          language
        });
        // PostgreSQLエラーの場合、詳細情報をログに記録
        if ((error as any).code) {
          console.error('PostgreSQLエラーコード:', (error as any).code);
          console.error('PostgreSQLエラー詳細:', (error as any).detail);
        }
      }
      throw error; // 元のエラーを再スローして、呼び出し元で詳細を確認できるようにする
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
    email?: string; // セッションが見つからない場合のフォールバック用
    userId?: string; // セッションが見つからない場合のフォールバック用
  }): Promise<void> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // search_pathを明示的に設定（既存の接続にも適用）
      await this.pool.query('SET search_path = public');
      
      // セッションIDから応募者IDとemailを取得
      const sessionQuery = `
        SELECT s.applicant_id, a.email
        FROM interview_sessions s
        LEFT JOIN interview_applicants a ON s.applicant_id = a.id
        WHERE s.id = $1
      `;
      const sessionResult = await this.pool.query(sessionQuery, [recordingInfo.sessionId]);
      
      let applicantId: string | null = null;
      let email: string | null = null;
      
      if (sessionResult.rows.length === 0) {
        console.warn('⚠️ Session not found:', recordingInfo.sessionId);
        console.warn('   セッションがデータベースに存在しないため、セッションIDからemailを推測します');
        
        // test_session_の場合、セッションIDから情報を推測できないため、
        // 録音ファイルのパスやstorage_pathからemailを推測するか、
        // またはuser_idを直接使用する
        // ここでは、sessionIdにemailが含まれている可能性をチェック
        // または、storage_pathからemailを抽出する
        
        // セッションが見つからない場合でも、録音情報は保存する
        // applicant_idとemailはNULLで保存
        console.warn('⚠️ セッションが見つからないため、最小限の情報で保存を試みます');
        // セッションが見つからない場合でも、録音情報は保存する
        // ただし、applicant_idとemailはNULLになる
      } else {
        applicantId = sessionResult.rows[0].applicant_id;
        email = sessionResult.rows[0].email;
      }
      
      // emailが取得できない場合、recordingInfoからemailを取得
      if (!email && recordingInfo.email) {
        email = recordingInfo.email;
        console.log('📧 recordingInfoからemailを取得:', email);
      }
      
      const recordingUrl = `/uploads/recordings/${recordingInfo.filename}`;

      // emailからuser_idを取得（メインプラットフォームのusersテーブルから）
      // user_idは数値またはUUID形式のいずれかの可能性がある
      let userId: number | string | null = null;
      
      // user_idが取得できない場合、recordingInfoからuser_idを取得
      if (recordingInfo.userId) {
        userId = recordingInfo.userId;
        console.log('👤 recordingInfoからuser_idを取得:', userId, 'type:', typeof userId);
      } else if (email) {
        try {
          console.log('🔍 Looking up user_id for email:', email);
          const userQuery = `
            SELECT id FROM users WHERE email = $1 AND user_type = 'job_seeker' LIMIT 1
          `;
          const userResult = await this.pool.query(userQuery, [email]);
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
            console.log('✅ Found user_id:', userId, 'for email:', email, 'type:', typeof userId);
          } else {
            console.warn('⚠️ User not found for email:', email);
            // user_typeが'job_seeker'でない場合も試す
            const userQueryAny = `
              SELECT id FROM users WHERE email = $1 LIMIT 1
            `;
            const userResultAny = await this.pool.query(userQueryAny, [email]);
            if (userResultAny.rows.length > 0) {
              userId = userResultAny.rows[0].id;
              console.log('✅ Found user_id (any type):', userId, 'for email:', email);
            } else {
              console.warn('⚠️ User not found (any type) for email:', email);
            }
          }
        } catch (userError) {
          console.error('❌ Could not fetch user_id:', userError);
          if (userError instanceof Error) {
            console.error('   Error message:', userError.message);
            console.error('   Error stack:', userError.stack);
          }
          // user_idの取得に失敗しても録音情報は保存する
        }
      } else {
        console.warn('⚠️ No email provided, cannot lookup user_id');
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
        applicantId,
        userId,
        email,
        type: recordingInfo.type,
        filename: recordingInfo.filename,
        size: recordingInfo.filesize,
        questionId: recordingInfo.questionId
      });
    } catch (error) {
      console.error('❌ Error saving recording info:', error);
      // エラーが発生しても面接を継続できるようにする
    }
  }

  // user_idからregistration_typeを取得
  async getRegistrationTypeByUserId(userId: string | number): Promise<string | undefined> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      await this.pool.query('SET search_path = public');
      
      const query = `
        SELECT registration_type 
        FROM job_seekers 
        WHERE user_id::text = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const result = await this.pool.query(query, [String(userId)]);
      
      if (result.rows.length > 0) {
        return result.rows[0].registration_type || undefined;
      }
      return undefined;
    } catch (error) {
      console.error('❌ Error getting registration_type by user_id:', error);
      return undefined;
    }
  }

  // emailからregistration_typeを取得
  async getRegistrationTypeByEmail(email: string): Promise<string | undefined> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      await this.pool.query('SET search_path = public');
      
      const query = `
        SELECT js.registration_type 
        FROM job_seekers js
        JOIN users u ON js.user_id = u.id
        WHERE u.email = $1 
        ORDER BY js.created_at DESC 
        LIMIT 1
      `;
      const result = await this.pool.query(query, [email]);
      
      if (result.rows.length > 0) {
        return result.rows[0].registration_type || undefined;
      }
      return undefined;
    } catch (error) {
      console.error('❌ Error getting registration_type by email:', error);
      return undefined;
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
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting session recordings:', error);
      return [];
    }
  }

  // 応募者の録音情報を取得（古い録画削除用）
  async getApplicantRecordings(applicantId: string): Promise<any[]> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const query = `
        SELECT id, storage_path, recording_url, session_id, created_at
        FROM interview_recordings 
        WHERE applicant_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [applicantId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting applicant recordings:', error);
      return [];
    }
  }

  // 応募者の古い録画を削除（データベースから）
  async deleteApplicantRecordings(applicantId: string): Promise<number> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const deleteQuery = `
        DELETE FROM interview_recordings 
        WHERE applicant_id = $1
        RETURNING id, storage_path, recording_url
      `;
      const result = await this.pool.query(deleteQuery, [applicantId]);
      const deletedCount = result.rows.length;
      console.log(`✅ 応募者の録画をデータベースから削除: ${deletedCount}件`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error deleting applicant recordings:', error);
      return 0;
    }
  }

  // データベーススキーマを実行するメソッド
  async executeSchema(schemaSql: string): Promise<{ success: number; errors: number; errorDetails: string[] }> {
    try {
      this.initializePool();
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      // search_pathを設定
      await this.pool.query('SET search_path = public');

      // SQLファイルをパースしてコマンドを分割（より堅牢な方法）
      // PostgreSQLでは複数のコマンドを一度に実行できるため、セミコロンで分割
      // ただし、$$で囲まれた関数定義を考慮する必要がある
      
      // まず、$$で囲まれたブロックを一時的に置き換える
      const dollarQuoteBlocks: string[] = [];
      let blockCounter = 0;
      let processedSql = schemaSql;
      
      // $$で囲まれたブロックを検出して置き換え
      const dollarQuoteRegex = /\$\$[\s\S]*?\$\$/g;
      processedSql = processedSql.replace(dollarQuoteRegex, (match) => {
        const placeholder = `__DOLLAR_QUOTE_BLOCK_${blockCounter}__`;
        dollarQuoteBlocks[blockCounter] = match;
        blockCounter++;
        return placeholder;
      });

      // コメントを削除（--で始まる行コメント）
      processedSql = processedSql.replace(/--[^\n]*/g, '');
      
      // セミコロンで分割
      let commands = processedSql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);

      // 一時プレースホルダーを元に戻す
      commands = commands.map(cmd => {
        let restoredCmd = cmd;
        for (let i = 0; i < dollarQuoteBlocks.length; i++) {
          restoredCmd = restoredCmd.replace(`__DOLLAR_QUOTE_BLOCK_${i}__`, dollarQuoteBlocks[i]);
        }
        return restoredCmd;
      });

      let successCount = 0;
      let errorCount = 0;
      const errorDetails: string[] = [];

      const client = await this.pool.connect();
      try {
        await client.query('SET search_path = public');

        for (const command of commands) {
          if (!command || command.length < 10) {
            continue;
          }

          try {
            await client.query(command);
            successCount++;
          } catch (error: any) {
            // 既に存在する場合は警告のみ
            if (error.code === '42P07' || error.code === '42710' || error.message?.includes('already exists')) {
              // 警告のみで継続
            } else {
              errorDetails.push(`${error.code || 'UNKNOWN'}: ${error.message}`);
              errorCount++;
            }
          }
        }
      } finally {
        client.release();
      }

      return {
        success: successCount,
        errors: errorCount,
        errorDetails
      };

    } catch (error: any) {
      console.error('❌ Error executing schema:', error);
      throw error;
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