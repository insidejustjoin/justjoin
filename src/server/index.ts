import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../services/logger.js';
import spreadsheetRoutes from './api/spreadsheet.js';
import documentsRoutes from './api/documents.js';
import notificationsRoutes from './api/notifications.js';
import interviewAnalyticsRoutes from './api/interviewAnalytics.js';
import interviewRoutes from './api/interview.js';
import temporaryRegistrationRoutes from './api/temporaryRegistration.js';
import jobSeekerStatusRoutes from './api/jobSeekerStatus.js';

import uploadImageRoutes from './api/uploadImage.js';
import { generateHeadings } from './api/generateHeadings.js';
import { generateSitemap } from './api/sitemap.js';
import { authenticate } from './authenticate.js';

const app = express();

// CORS設定
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// リクエストログミドルウェア
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// APIルート
app.use('/api/spreadsheet', spreadsheetRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/interview', interviewAnalyticsRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/register', temporaryRegistrationRoutes);
app.use('/api/job-seeker-status', jobSeekerStatusRoutes);

app.use('/api/admin', uploadImageRoutes);

// 見出し生成API
app.post('/api/generate-headings', generateHeadings);

// 管理者用企業管理API
app.get('/api/admin/companies', authenticate, async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    
    const result = await query(`
      SELECT 
        c.id,
        c.user_id,
        c.company_name,
        c.industry,
        c.company_size,
        c.created_at,
        c.updated_at,
        u.email,
        u.status as user_status
      FROM companies c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);

    const companies = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      email: row.email,
      industry: row.industry,
      company_size: row.company_size,
      status: row.user_status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    res.json({
      success: true,
      companies: companies
    });
  } catch (error) {
    console.error('企業データ取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '企業データの取得に失敗しました'
    });
  }
});

// 企業承認API
app.post('/api/admin/companies/approve', authenticate, async (req, res) => {
  try {
    const { companyId } = req.body;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: '企業IDが必要です'
      });
    }

    const { query } = await import('../integrations/postgres/client.js');
    
    // 企業のステータスを承認に更新
    await query(`
      UPDATE users 
      SET status = 'active', updated_at = NOW()
      WHERE id = (SELECT user_id FROM companies WHERE id = $1)
    `, [companyId]);

    res.json({
      success: true,
      message: '企業を承認しました'
    });
  } catch (error) {
    console.error('企業承認エラー:', error);
    res.status(500).json({
      success: false,
      message: '企業の承認に失敗しました'
    });
  }
});

// 企業却下API
app.post('/api/admin/companies/reject', authenticate, async (req, res) => {
  try {
    const { companyId } = req.body;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: '企業IDが必要です'
      });
    }

    const { query } = await import('../integrations/postgres/client.js');
    
    // 企業のステータスを却下に更新
    await query(`
      UPDATE users 
      SET status = 'rejected', updated_at = NOW()
      WHERE id = (SELECT user_id FROM companies WHERE id = $1)
    `, [companyId]);

    res.json({
      success: true,
      message: '企業を却下しました'
    });
  } catch (error) {
    console.error('企業却下エラー:', error);
    res.status(500).json({
      success: false,
      message: '企業の却下に失敗しました'
    });
  }
});

// 通知履歴API
app.get('/api/notifications/admin/spot-history', authenticate, async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    
    const result = await query(`
      SELECT 
        id,
        title,
        message,
        type,
        is_read,
        created_at,
        updated_at
      FROM notifications 
      WHERE type IN ('notice', 'important')
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const notifications = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      targetUsers: 'all',
      status: 'sent',
      createdAt: row.created_at,
      sentAt: row.created_at,
      recipientCount: 1
    }));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('通知履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '通知履歴の取得に失敗しました'
    });
  }
});

app.get('/api/notifications/admin/workflow-history', authenticate, async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    
    // ワークフロー通知の履歴を取得（実際のデータベース構造に応じて調整）
    const result = await query(`
      SELECT 
        'workflow_' || id as id,
        '自動通知' as name,
        'システム自動通知' as description,
        'custom' as trigger,
        true as enabled,
        title,
        message,
        type,
        created_at as lastSentAt,
        1 as totalSentCount
      FROM notifications 
      WHERE type IN ('notice', 'important')
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const workflows = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      enabled: row.enabled,
      title: row.title,
      message: row.message,
      type: row.type,
      lastSentAt: row.lastsentat,
      totalSentCount: row.totalsentcount
    }));

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('ワークフロー通知履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ワークフロー通知履歴の取得に失敗しました'
    });
  }
});

// サイトマップ生成エンドポイント
app.get('/sitemap.xml', generateSitemap);

// 書類データから基本情報を取得するAPIエンドポイント
app.get('/api/jobseekers/profile-from-documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('=== 書類データからプロフィール取得API開始 ===');
    console.log('userId:', userId);
    
    if (!userId) {
      console.log('エラー: userIdが未指定');
      return res.status(400).json({ error: 'userIdが必要です' });
    }
    
    console.log('データベースクライアントをインポート中...');
    const { query } = await import('../integrations/postgres/client.js');
    console.log('データベースクライアントのインポート完了');
    
    // 書類データを取得
    console.log('書類データ取得クエリ実行中...');
    const documentResult = await query(
      'SELECT document_data FROM user_documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    console.log('クエリ実行完了。結果件数:', documentResult.rows.length);
    
    if (documentResult.rows.length > 0) {
      const rawDocumentData = documentResult.rows[0].document_data;
      console.log('取得したdocument_dataの型:', typeof rawDocumentData);
      console.log('document_dataの最初の文字:', rawDocumentData ? String(rawDocumentData).substring(0, 10) : 'null');
      
      // document_dataが文字列の場合のみJSONパースを実行
      let documentData;
      if (typeof rawDocumentData === 'string') {
        console.log('document_dataは文字列です。JSONパース中...');
        documentData = JSON.parse(rawDocumentData);
      } else {
        console.log('document_dataは既にオブジェクトです。そのまま使用します');
        documentData = rawDocumentData;
      }
      
      console.log('処理後のドキュメントデータキー:', Object.keys(documentData));
      
      // 書類データから基本情報を抽出
      const profileData = {
        full_name: documentData.basicInfo?.lastName && documentData.basicInfo?.firstName 
          ? `${documentData.basicInfo.lastName} ${documentData.basicInfo.firstName}` 
          : documentData.lastName && documentData.firstName 
            ? `${documentData.lastName} ${documentData.firstName}` 
            : null,
        phone: documentData.addressInfo?.livePhoneNumber || 
               documentData.livePhoneNumber || 
               documentData.basicInfo?.phone || 
               null,
        self_introduction: documentData.additionalInfo?.selfIntroduction || 
                          documentData.selfIntroduction || 
                          documentData.resume?.selfPR || 
                          null,
      };
      
      console.log('書類データからプロフィール情報を抽出:', profileData);
      console.log('=== API処理完了（成功） ===');
      
      res.json({
        success: true,
        data: profileData,
        message: '書類データからプロフィール情報を取得しました'
      });
    } else {
      console.log('書類データが見つかりませんでした');
      console.log('=== API処理完了（データなし） ===');
      
      res.json({
        success: false,
        message: '書類データが見つかりません'
      });
    }
    
  } catch (error) {
    console.error('=== 書類データからプロフィール取得エラー ===');
    console.error('エラー詳細:', error);
    console.error('エラーメッセージ:', error.message);
    console.error('エラースタック:', error.stack);
    console.error('=== エラー情報終了 ===');
    
    res.status(500).json({
      success: false,
      error: '書類データからプロフィールの取得に失敗しました',
      details: error.message
    });
  }
});

// プロフィール更新APIエンドポイント
app.put('/api/jobseekers/profile', async (req, res) => {
  try {
    const { userId, full_name, phone, self_introduction } = req.body;
    
    console.log('プロフィール更新API呼び出し - userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'userIdが必要です' });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    
    // プロフィール更新
    const updateResult = await query(
      `UPDATE job_seekers 
       SET full_name = $2, phone = $3, self_introduction = $4, updated_at = NOW()
       WHERE user_id = $1`,
      [userId, full_name, phone, self_introduction]
    );
    
    console.log('プロフィール更新結果:', updateResult);
    
    res.json({
      success: true,
      message: 'プロフィールを更新しました'
    });
    
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({
      success: false,
      error: 'プロフィールの更新に失敗しました'
    });
  }
});

// 完成度取得APIエンドポイント（直接ルート）
app.get('/api/jobseekers/completion-rate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('完成度取得API呼び出し - userId:', userId);
    
    if (!userId) {
      console.log('userIdが未指定');
      return res.status(400).json({ error: 'userIdが必要です' });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    console.log('データベースクエリ実行中...');
    const result = await query(
      'SELECT completion_rate FROM job_seekers WHERE user_id = $1',
      [userId]
    );
    console.log('クエリ結果:', result.rows);
    
    if (result.rows.length > 0) {
      const completionRate = result.rows[0].completion_rate || 0;
      console.log('完成度を返却:', completionRate);
      res.json({ 
        success: true, 
        completionRate: completionRate
      });
    } else {
      console.log('ユーザーが見つからない、デフォルト値0を返却');
      res.json({ 
        success: true, 
        completionRate: 0 
      });
    }
  } catch (error) {
    console.error('入力率取得エラー:', error);
    res.status(500).json({ error: '入力率の取得に失敗しました' });
  }
});

// 管理者ログインAPI
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    
    // 管理者ユーザーを検索
    const result = await query(`
      SELECT id, email, password_hash, user_type as role, status
      FROM users 
      WHERE email = $1 AND user_type = 'admin'
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    const user = result.rows[0];
    
    // パスワード検証
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    // ステータスチェック
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効です'
      });
    }
    
    // JWTトークン生成
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.role,
        status: user.status,
        created_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('管理者ログインエラー:', error);
    res.status(500).json({
      success: false,
      message: 'ログイン処理中にエラーが発生しました'
    });
  }
});



// 管理者用：求職者一覧取得API
app.get('/api/admin/jobseekers', async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    
    // クエリパラメータでステータスフィルタリング
    const { status = 'all' } = req.query;
    
    let statusFilter = '';
    let statusParams: string[] = [];
    
    if (status === 'active') {
      statusFilter = 'WHERE u.status = $1';
      statusParams = ['active'];
    } else if (status === 'inactive') {
      statusFilter = 'WHERE u.status = $1';
      statusParams = ['inactive'];
    } else if (status === 'employed') {
      statusFilter = 'WHERE js.employment_status = $1';
      statusParams = ['employed'];
    }
    
    // 基本的な求職者データを取得（ステータスフィルタリング対応）
    const result = await query(`
      SELECT 
        js.*,
        u.email as user_email,
        u.status as user_status,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        -- 年齢計算用の生年月日
        js.date_of_birth,
        -- 性別情報
        js.gender,
        -- 国籍情報
        js.nationality,
        -- 電話番号
        js.phone,
        -- 住所
        js.address,
        -- 就職状況（デフォルトは未就職）
        COALESCE(js.employment_status, 'unemployed') as employment_status
      FROM job_seekers js
      LEFT JOIN users u ON js.user_id = u.id
      ${statusFilter}
      ORDER BY js.created_at DESC
    `, statusParams);
    
    // 各求職者に対して詳細情報を取得
    const processedRows = await Promise.all(result.rows.map(async (row) => {
      console.log('===DEBUG reached forEach start, user_id:', row.user_id);
      // skillsフィールドの処理
      if (row.skills && typeof row.skills === 'string') {
        try {
          row.skills = JSON.parse(row.skills);
        } catch (e) {
          console.warn('Skills JSON parse error:', e);
          row.skills = [];
        }
      } else if (!row.skills) {
        row.skills = [];
      }
      
      // user_documentsから詳細情報を取得
      let photoUrl = null;
      let detailedInfo = null;
      let japaneseLevel = '未設定'; // デフォルト値を外側で設定
      let nationality = row.nationality; // 基本の国籍情報
      let phone = row.phone; // 基本の電話番号
      let birthDate = row.date_of_birth; // 基本の生年月日
      let gender = row.gender; // 基本の性別
      
      try {
        const docResult = await query(`
          SELECT document_data
          FROM user_documents 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        `, [row.user_id]);
        
        if (docResult.rows.length > 0) {
          const documentData = docResult.rows[0].document_data;
          
          // デバッグログを追加
          console.log(`User ${row.user_id} document data:`, JSON.stringify(documentData, null, 2));
          
          // 写真URLを取得（photoUrlまたはprofile_photoから）
          if (documentData && documentData.resume) {
            if (documentData.resume.photoUrl) {
              photoUrl = documentData.resume.photoUrl;
            } else if (documentData.resume.profile_photo) {
              photoUrl = documentData.resume.profile_photo;
            }
          }
          
          // 国籍情報を取得（user_documentsから優先、なければjob_seekersから）
          if (documentData?.nationality) {
            nationality = documentData.nationality;
          }
          
          // 電話番号を取得（user_documentsから優先、なければjob_seekersから）
          if (documentData?.livePhoneNumber) {
            phone = documentData.livePhoneNumber;
          }
          
          // 生年月日を取得（user_documentsから優先、なければjob_seekersから）
          if (documentData?.birthDate) {
            birthDate = documentData.birthDate;
          }
          
          // 性別を取得（user_documentsから優先、なければjob_seekersから）
          if (documentData?.gender) {
            gender = documentData.gender;
          }
          
          // 日本語レベルを取得（複数候補から最初に値が入っているものをセット）
          
          // デバッグログを追加
          console.log('documentData.japaneseInfo:', documentData?.japaneseInfo);
          console.log('documentData.japaneseInfo.nextJapaneseTestLevel:', documentData?.japaneseInfo?.nextJapaneseTestLevel);
          console.log('documentData.japaneseInfo.certificateStatus:', documentData?.japaneseInfo?.certificateStatus);
          
          if (documentData?.japaneseInfo?.nextJapaneseTestLevel) {
            japaneseLevel = documentData.japaneseInfo.nextJapaneseTestLevel;
            console.log('japaneseLevel set to nextJapaneseTestLevel:', japaneseLevel);
          } else if (documentData?.japaneseInfo?.certificateStatus?.name) {
            japaneseLevel = documentData.japaneseInfo.certificateStatus.name;
            console.log('japaneseLevel set to certificateStatus.name:', japaneseLevel);
          } else if (documentData?.nextJapaneseTestLevel) {
            japaneseLevel = documentData.nextJapaneseTestLevel;
            console.log('japaneseLevel set to documentData.nextJapaneseTestLevel:', japaneseLevel);
          } else if (documentData?.certificateStatus?.name) {
            japaneseLevel = documentData.certificateStatus.name;
            console.log('japaneseLevel set to documentData.certificateStatus.name:', japaneseLevel);
          }

          // 詳細情報を設定
          detailedInfo = {
            japaneseLevel: japaneseLevel,
            nextJapaneseTest: documentData?.nextJapaneseTestDate || documentData?.nextJapaneseTestLevel || '未設定',
            selfIntroduction: documentData?.resume?.selfPR || documentData?.selfIntroduction || documentData?.resume?.selfIntroduction || '',
            hasSelfIntroduction: !!(documentData?.resume?.selfPR || documentData?.selfIntroduction || documentData?.resume?.selfIntroduction),
            documentData: documentData
          };
        }
      } catch (error) {
        console.warn(`詳細情報取得エラー (ユーザーID: ${row.user_id}):`, error);
      }
      // デバッグ: japaneseLevelの値を出力
      console.log('===DEBUG japaneseLevel:', japaneseLevel);
      console.error('===DEBUG japaneseLevel (stderr):', japaneseLevel);
      // 年齢計算
      let calculatedAge = null;
      if (birthDate) {
        try {
          const birthDateObj = new Date(birthDate);
          const today = new Date();
          let age = today.getFullYear() - birthDateObj.getFullYear();
          const monthDiff = today.getMonth() - birthDateObj.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
          }
          calculatedAge = age;
        } catch (error) {
          console.warn(`年齢計算エラー (ユーザーID: ${row.user_id}):`, error);
        }
      }

      // 処理済みデータを返す
      const processedRow = {
        ...row,
        // 写真情報をuser_documentsから取得
        profile_photo: photoUrl,
        // 日本語レベルを設定（両方のフィールド名に対応）
        japaneseLevel: japaneseLevel,
        japanese_level: japaneseLevel,
        // 年齢情報を追加
        age: calculatedAge,
        // 基本情報を更新（user_documentsから取得した情報で上書き）
        nationality: nationality,
        phone: phone,
        date_of_birth: birthDate,
        gender: gender,
        // 詳細情報を設定
        detailed_info: detailedInfo ? {
          ...detailedInfo,
          japaneseLevel: japaneseLevel
        } : {
          japaneseLevel: japaneseLevel,
          nextJapaneseTest: '未設定',
          selfIntroduction: '',
          hasSelfIntroduction: false
        },
        // 配偶者情報はデータベースから取得
        spouse: row.spouse || null,
        spouse_support: row.spouse_support || null,
        commuting_time: row.commuting_time || null,
        family_number: row.family_number || null
      };
      
      // 面接受験回数を取得
      try {
        const attemptsResult = await query(`
          SELECT attempt_count, first_attempt_at, last_attempt_at
          FROM interview_attempts
          WHERE user_id = $1
        `, [row.user_id]);
        
        if (attemptsResult.rows.length > 0) {
          const attemptsData = attemptsResult.rows[0];
          processedRow.interview_attempts = {
            count: attemptsData.attempt_count,
            firstAttemptAt: attemptsData.first_attempt_at,
            lastAttemptAt: attemptsData.last_attempt_at
          };
        } else {
          processedRow.interview_attempts = {
            count: 0,
            firstAttemptAt: null,
            lastAttemptAt: null
          };
        }
      } catch (error) {
        console.warn(`面接受験回数取得エラー (ユーザーID: ${row.user_id}):`, error);
        processedRow.interview_attempts = {
          count: 0,
          firstAttemptAt: null,
          lastAttemptAt: null
        };
      }
      
      return processedRow;
    }));
    
    console.log(`管理者求職者一覧取得: ${processedRows.length}件`);
    
    res.json({
      success: true,
      jobSeekers: processedRows
    });
  } catch (error) {
    console.error('管理者求職者一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '求職者一覧の取得に失敗しました'
    });
  }
});

// 管理者用：求職者詳細取得API
app.get('/api/jobseekers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { query } = await import('../integrations/postgres/client.js');
    
    // まずuser_idで検索、見つからない場合はidで検索
    let result = await query(`
      SELECT 
        js.*,
        u.email as user_email,
        u.status as user_status,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
      FROM job_seekers js
      LEFT JOIN users u ON js.user_id = u.id
      WHERE js.user_id = $1
    `, [id]);
    
    // user_idで見つからない場合はidで検索
    if (result.rows.length === 0) {
      result = await query(`
        SELECT 
          js.*,
          u.email as user_email,
          u.status as user_status,
          u.created_at as user_created_at,
          u.updated_at as user_updated_at
        FROM job_seekers js
        LEFT JOIN users u ON js.user_id = u.id
        WHERE js.id = $1
      `, [id]);
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '求職者が見つかりません'
      });
    }
    
    // skillsフィールドを配列に変換し、追加情報を設定
    const jobSeeker = result.rows[0];
    if (jobSeeker.skills && typeof jobSeeker.skills === 'string') {
      try {
        jobSeeker.skills = JSON.parse(jobSeeker.skills);
      } catch (e) {
        console.warn('Skills JSON parse error:', e);
        jobSeeker.skills = [];
      }
    } else if (!jobSeeker.skills) {
      jobSeeker.skills = [];
    }
    
    // user_documentsから写真データを取得
    let photoUrl = null;
    try {
      const docResult = await query(`
        SELECT document_data
        FROM user_documents 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [jobSeeker.user_id]);
      
      if (docResult.rows.length > 0) {
        const documentData = docResult.rows[0].document_data;
        if (documentData && documentData.resume && documentData.resume.photoUrl) {
          photoUrl = documentData.resume.photoUrl;
        }
      }
    } catch (error) {
      console.warn('写真データ取得エラー:', error);
    }
    
    // 追加フィールドの設定
    const processedJobSeeker = {
      ...jobSeeker,
      // 写真情報をuser_documentsから取得
      profile_photo: photoUrl,
      // 配偶者情報はデータベースから取得
      spouse: jobSeeker.spouse || null,
      spouse_support: jobSeeker.spouse_support || null,
      commuting_time: jobSeeker.commuting_time || null,
      family_number: jobSeeker.family_number || null
    };
    
    console.log(`求職者詳細取得: ID ${id}`);
    
    res.json({
      success: true,
      data: processedJobSeeker
    });
  } catch (error) {
    console.error('求職者詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '求職者詳細の取得に失敗しました'
    });
  }
});

// 求職者プロフィール取得API（設定ページ用）
app.get('/api/jobseekers/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { query } = await import('../integrations/postgres/client.js');
    
    const result = await query(`
      SELECT 
        full_name,
        phone,
        self_introduction,
        address,
        desired_job_title,
        experience_years,
        updated_at
      FROM job_seekers
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'プロフィールが見つかりません'
      });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'プロフィールの取得に失敗しました'
    });
  }
});

// 求職者書類データ取得API（一括書類生成用）
app.get('/api/jobseekers/documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDは必須です'
      });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    
    // user_documentsから書類データを取得
    const result = await query(`
      SELECT document_data, created_at, updated_at 
      FROM user_documents 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [userId]);
    
    if (result.rows.length > 0) {
      const documentData = result.rows[0].document_data;
      console.log(`求職者 ${userId} の書類データ取得成功`);
      
      return res.json({
        success: true,
        data: documentData,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      });
    } else {
      console.log(`求職者 ${userId} の書類データが見つかりません`);
      return res.status(404).json({
        success: false,
        message: '書類データが見つかりません'
      });
    }
  } catch (error) {
    console.error('書類データ取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '書類データの取得に失敗しました'
    });
  }
});

// 求職者プロフィール更新API（設定ページ用）
app.put('/api/jobseekers/profile', async (req, res) => {
  try {
    const { userId, full_name, phone, self_introduction, address, desired_job_title, experience_years } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDは必須です'
      });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    
    // プロフィールが存在するかチェック
    const existingProfile = await query(`
      SELECT id FROM job_seekers WHERE user_id = $1
    `, [userId]);
    
    if (existingProfile.rows.length === 0) {
      // プロフィールが存在しない場合は作成
      const result = await query(`
        INSERT INTO job_seekers (
          user_id, full_name, phone, self_introduction, address, 
          desired_job_title, experience_years, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING full_name, phone, self_introduction, address, desired_job_title, experience_years
      `, [userId, full_name, phone, self_introduction, address, desired_job_title, experience_years || 0]);
      
      res.json({
        success: true,
        message: 'プロフィールを作成しました',
        profile: result.rows[0]
      });
    } else {
      // プロフィールが存在する場合は更新
      const result = await query(`
        UPDATE job_seekers 
        SET full_name = $2, phone = $3, self_introduction = $4, 
            address = $5, desired_job_title = $6, experience_years = $7, updated_at = NOW()
        WHERE user_id = $1
        RETURNING full_name, phone, self_introduction, address, desired_job_title, experience_years
      `, [userId, full_name, phone, self_introduction, address, desired_job_title, experience_years || 0]);
      
      res.json({
        success: true,
        message: 'プロフィールを更新しました',
        profile: result.rows[0]
      });
    }
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'プロフィールの更新に失敗しました'
    });
  }
});

// --- 求職者情報更新API ---
app.put('/api/jobseekers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    // 年齢も受け取る
    const { full_name, date_of_birth, gender, address, phone, email, self_introduction, age } = updateData;
    // jobSeekersRepository.updateにageも渡す
    const { jobSeekersRepository } = await import('../integrations/postgres/jobSeekers.js');
    const updated = await jobSeekersRepository.update(id, {
      full_name,
      date_of_birth,
      gender,
      address,
      phone,
      email,
      self_introduction,
      age // 追加
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: '求職者が見つかりません' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('/api/jobseekers/:id 更新エラー:', error);
    res.status(500).json({ success: false, message: '求職者情報の更新に失敗しました' });
  }
});

// --- 管理者用：求職者削除API（完全削除版） ---
app.delete('/api/admin/jobseekers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params; // job_seekers.id
    const { query } = await import('../integrations/postgres/client.js');
    
    // まずjob_seekersテーブルからuser_idを取得
    let result = await query('SELECT user_id, first_name, last_name FROM job_seekers WHERE id = $1', [id]);
    let userId, fullName, jobSeekerId;
    
    if (result.rows.length > 0) {
      // job_seekersレコードが存在する場合
      userId = result.rows[0].user_id;
      fullName = `${result.rows[0].first_name || ''} ${result.rows[0].last_name || ''}`.trim();
      jobSeekerId = id;
    } else {
      // job_seekersレコードが存在しない場合、直接usersテーブルから削除
      result = await query('SELECT id, email FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
      }
      
      userId = result.rows[0].id;
      fullName = result.rows[0].email;
      jobSeekerId = null;
    }
    
    console.log(`ユーザー完全削除開始: UserID=${userId}, Name=${fullName}, JobSeekerID=${jobSeekerId}`);
    
    // トランザクション開始
    await query('BEGIN');
    
    try {
      const deletedRecords: { [key: string]: number } = {};
      
      // 1. user_documentsテーブルから削除
      const documentsResult = await query('DELETE FROM user_documents WHERE user_id = $1', [userId]);
      deletedRecords.documents = documentsResult.rowCount;
      console.log(`user_documents削除: ${documentsResult.rowCount}件`);
      
      // 2. applicationsテーブルから削除（将来的に追加される場合）
      if (jobSeekerId) {
        try {
          const applicationsResult = await query('DELETE FROM applications WHERE job_seeker_id = $1', [jobSeekerId]);
          deletedRecords.applications = applicationsResult.rowCount;
          console.log(`applications削除: ${applicationsResult.rowCount}件`);
        } catch (error) {
          // applicationsテーブルがまだ存在しない場合はスキップ
          console.log('applicationsテーブルは存在しないか、データがありません');
          deletedRecords.applications = 0;
        }
      }
      
      // 3. 他の関連テーブルからの削除（将来的な拡張用）
      // 例: job_seeker_skills, job_seeker_preferences など
      
      // 4. job_seekersテーブルから削除（存在する場合のみ）
      if (jobSeekerId) {
        const jobSeekersResult = await query('DELETE FROM job_seekers WHERE user_id = $1', [userId]);
        deletedRecords.jobSeeker = jobSeekersResult.rowCount;
        console.log(`job_seekers削除: ${jobSeekersResult.rowCount}件`);
      } else {
        deletedRecords.jobSeeker = 0;
        console.log('job_seekersレコードは存在しません');
      }
      
      // 5. usersテーブルから削除（最後に実行）
      const usersResult = await query('DELETE FROM users WHERE id = $1', [userId]);
      deletedRecords.user = usersResult.rowCount;
      console.log(`users削除: ${usersResult.rowCount}件`);
      
      // トランザクションコミット
      await query('COMMIT');
      
      console.log(`ユーザー完全削除完了: ${fullName} (UserID: ${userId})`);
      res.json({ 
        success: true, 
        message: `ユーザー「${fullName}」を完全に削除しました`,
        deletedRecords
      });
    } catch (deleteError) {
      // トランザクションロールバック
      await query('ROLLBACK');
      throw deleteError;
    }
  } catch (error) {
    console.error('/api/admin/jobseekers/:id 完全削除エラー:', error);
    res.status(500).json({ success: false, message: 'ユーザーの完全削除に失敗しました' });
  }
});

// 管理者用：管理者ログインAPI
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    const bcrypt = await import('bcrypt');
    
    // 管理者ユーザーを検索
    const result = await query(`
      SELECT id, email, password_hash, user_type, status
      FROM users 
      WHERE email = $1 AND user_type = 'admin'
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    const user = result.rows[0];
    
    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    // ステータスチェック
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'アカウントが無効です'
      });
    }
    
    console.log(`管理者ログイン成功: ${email}`);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_type,
        status: user.status
      }
    });
  } catch (error) {
    console.error('管理者ログインエラー:', error);
    res.status(500).json({
      success: false,
      message: 'ログインに失敗しました'
    });
  }
});

// 管理者用：パスワードリセットAPI
app.post('/api/admins/reset-password', async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    
    // 管理者ユーザーを検索（inside.justjoin@gmail.com固定）
    const result = await query(`
      SELECT id, email, user_type, status
      FROM users 
      WHERE email = 'inside.justjoin@gmail.com' AND user_type = 'admin'
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '管理者アカウントが見つかりません'
      });
    }
    
    const user = result.rows[0];
    
    // ステータスチェック
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'アカウントが無効です'
      });
    }
    
    // 新しいパスワードを生成
    const newPassword = Math.random().toString(36).slice(-8);
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // パスワードを更新
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [passwordHash, user.id]);
    
    console.log(`管理者パスワードリセット: inside.justjoin@gmail.com (新パスワード: ${newPassword})`);
    
    res.json({
      success: true,
      message: 'パスワードリセットが完了しました',
      newPassword: newPassword
    });
  } catch (error) {
    console.error('管理者パスワードリセットエラー:', error);
    res.status(500).json({
      success: false,
      message: 'パスワードリセットに失敗しました'
    });
  }
});

// 管理者用：管理者ユーザー一覧取得API
app.get('/api/admin/users', async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    
    const result = await query(`
      SELECT 
        id,
        email,
        user_type as role,
        status,
        created_at,
        updated_at
      FROM users 
      WHERE user_type = 'admin'
      ORDER BY created_at DESC
    `);
    
    console.log(`管理者ユーザー一覧取得: ${result.rows.length}件`);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('管理者ユーザー一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '管理者ユーザー一覧の取得に失敗しました'
    });
  }
});

// ドキュメントデータ取得API
app.get('/api/documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { query } = await import('../integrations/postgres/client.js');
    
    const result = await query(`
      SELECT 
        document_data
      FROM user_documents 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ドキュメントデータが見つかりません'
      });
    }
    
    const documentData = result.rows[0].document_data;
    
    console.log(`ドキュメントデータ取得: ユーザーID ${userId}`);
    
    res.json({
      success: true,
      data: documentData
    });
  } catch (error) {
    console.error('ドキュメントデータ取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ドキュメントデータの取得に失敗しました'
    });
  }
});

// 管理者用：管理者ユーザー追加API
app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, password, role = 'admin', status = 'active' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    const bcrypt = await import('bcrypt');
    
    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await query(`
      INSERT INTO users (email, password_hash, user_type, status)
      VALUES ($1, $2, 'admin', $3)
      RETURNING id, email, user_type as role, status, created_at, updated_at
    `, [email, passwordHash, status]);
    
    console.log(`管理者ユーザー追加: ${email}`);
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('管理者ユーザー追加エラー:', error);
    res.status(500).json({
      success: false,
      message: '管理者ユーザーの追加に失敗しました'
    });
  }
});

// 管理者用：管理者ユーザー更新API
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, status } = req.body;
    
    const { query } = await import('../integrations/postgres/client.js');
    
    let updateQuery = 'UPDATE users SET email = $1, status = $2';
    let queryParams = [email, status];
    
    // パスワードが提供された場合のみ更新
    if (password) {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = $3';
      queryParams.push(passwordHash);
    }
    
    updateQuery += ', updated_at = NOW() WHERE id = $' + (queryParams.length + 1);
    queryParams.push(id);
    
    const result = await query(updateQuery, queryParams);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '管理者ユーザーが見つかりません'
      });
    }
    
    console.log(`管理者ユーザー更新: ID ${id}`);
    
    res.json({
      success: true,
      message: '管理者ユーザーが更新されました'
    });
  } catch (error) {
    console.error('管理者ユーザー更新エラー:', error);
    res.status(500).json({
      success: false,
      message: '管理者ユーザーの更新に失敗しました'
    });
  }
});

// 管理者用：管理者ユーザー削除API
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { query } = await import('../integrations/postgres/client.js');
    
    const result = await query(`
      DELETE FROM users 
      WHERE id = $1 AND user_type = 'admin'
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '管理者ユーザーが見つかりません'
      });
    }
    
    console.log(`管理者ユーザー削除: ID ${id}`);
    
    res.json({
      success: true,
      message: '管理者ユーザーが削除されました'
    });
  } catch (error) {
    console.error('管理者ユーザー削除エラー:', error);
    res.status(500).json({
      success: false,
      message: '管理者ユーザーの削除に失敗しました'
    });
  }
});

// ユーザー自身によるアカウント削除API
app.delete('/api/user/account/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { query } = await import('../integrations/postgres/client.js');
    const { deleteUserDocumentsFromGCS } = await import('../integrations/gcp/storage.js');
    
    // まずユーザーが存在することを確認
    const userResult = await query(`
      SELECT id, user_type, email
      FROM users
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    const user = userResult.rows[0];
    
    try {
      // Cloud Storageからユーザーのドキュメントを削除
      await deleteUserDocumentsFromGCS(userId);
      
      // データベースから関連データを削除
      // 1. user_documentsから削除
      await query(`DELETE FROM user_documents WHERE user_id = $1`, [userId]);
      
      // 2. 求職者の場合はjob_seekersから削除
      if (user.user_type === 'job_seeker') {
        await query(`DELETE FROM job_seekers WHERE user_id = $1`, [userId]);
      }
      
      // 3. 企業の場合はcompaniesから削除
      if (user.user_type === 'company') {
        await query(`DELETE FROM companies WHERE user_id = $1`, [userId]);
      }
      
      // 4. 最後にusersテーブルから削除
      const deleteResult = await query(`
        DELETE FROM users 
        WHERE id = $1
      `, [userId]);
      
      if (deleteResult.rowCount === 0) {
        return res.status(500).json({
          success: false,
          message: 'ユーザーの削除に失敗しました'
        });
      }
      
      console.log(`ユーザーアカウント削除成功: ID ${userId}, Email: ${user.email}`);
      
      res.json({
        success: true,
        message: 'アカウントが正常に削除されました'
      });
      
    } catch (deletionError) {
      console.error('アカウント削除処理エラー:', deletionError);
      res.status(500).json({
        success: false,
        message: 'アカウント削除処理中にエラーが発生しました'
      });
    }
    
  } catch (error) {
    console.error('ユーザーアカウント削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'アカウントの削除に失敗しました'
    });
  }
});



// 統一ログインAPI（求職者・企業・管理者対応）
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log('=== ログインリクエスト開始 ===');
    console.log('リクエストボディ:', { email, userType, hasPassword: !!password, passwordLength: password ? password.length : 0 });
    
    if (!email || !password) {
      console.log('バリデーションエラー: メールアドレスまたはパスワードが不足');
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('メールアドレス形式エラー:', email);
      return res.status(400).json({
        success: false,
        message: '有効なメールアドレスを入力してください'
      });
    }

    console.log('データベースクライアントをインポート中...');
    const { query } = await import('../integrations/postgres/client.js');
    console.log('データベースクライアントのインポート完了');
    
    // userTypeが指定されている場合はそのタイプで検索、そうでなければ全タイプで検索
    let result;
    if (userType) {
      console.log(`ユーザータイプ指定で検索: ${userType}`);
      result = await query(`
        SELECT id, email, password_hash, user_type as role, status, created_at, updated_at
        FROM users
        WHERE email = $1 AND user_type = $2
      `, [email, userType]);
    } else {
      console.log('全ユーザータイプで検索');
      result = await query(`
        SELECT id, email, password_hash, user_type as role, status, created_at, updated_at
        FROM users
        WHERE email = $1
      `, [email]);
    }
    
    console.log('検索結果件数:', result.rows.length);
    console.log('検索結果:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('ユーザーが見つかりません:', email);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    const user = result.rows[0];
    console.log('ユーザー情報:', { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      status: user.status,
      hasPassword: !!user.password_hash,
      passwordHashLength: user.password_hash ? user.password_hash.length : 0
    });
    
    // パスワードハッシュが存在しない場合
    if (!user.password_hash) {
      console.log('パスワードが設定されていません:', email);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    // パスワード検証
    console.log('bcryptをインポート中...');
    const bcrypt = await import('bcrypt');
    console.log('パスワード検証開始...');
    console.log('入力パスワード:', password);
    console.log('保存されたハッシュ:', user.password_hash);
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('パスワード検証結果:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('パスワードが一致しません:', email);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    // ステータスチェック（管理者の場合はactiveでなくてもOK）
    if (user.role !== 'admin' && user.status !== 'active') {
      console.log('アカウントが無効です:', user.status);
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効です'
      });
    }
    
    // JWTトークン生成（有効期限を8時間に短縮）
    console.log('JWTをインポート中...');
    const jwt = await import('jsonwebtoken');
    console.log('JWTトークン生成中...');
    const token = jwt.default.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
      },
      process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
      { expiresIn: '8h' } // 8時間に短縮
    );
    
    console.log('ログイン成功:', { email: user.email, role: user.role });
    console.log('=== ログインリクエスト完了 ===');
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('=== ログインエラー ===');
    console.error('エラー詳細:', error);
    console.error('エラーメッセージ:', error.message);
    console.error('エラースタック:', error.stack);
    console.error('=== エラー情報終了 ===');
    res.status(500).json({
      success: false,
      message: 'ログイン処理中にエラーが発生しました'
    });
  }
});

// --- 求職者マイページ用：基本情報取得API ---
app.get('/api/jobseeker/me', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { query } = await import('../integrations/postgres/client.js');
    const result = await query(`
      SELECT u.email, js.first_name, js.last_name
      FROM users u
      JOIN job_seekers js ON js.user_id = u.id
      WHERE u.id = $1
    `, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ユーザー情報が見つかりません' });
    }
    const { email, first_name, last_name } = result.rows[0];
    res.json({ success: true, data: { email, firstName: first_name, lastName: last_name } });
  } catch (error) {
    console.error('/api/jobseeker/me エラー:', error);
    res.status(500).json({ success: false, message: 'ユーザー情報の取得に失敗しました' });
  }
});

// --- 求職者登録API ---
app.post('/api/register-jobseeker', async (req, res) => {
  try {
    const { email, firstName, lastName, language = 'ja' } = req.body;
    console.log('求職者登録リクエスト:', { email, firstName, lastName, language });
    
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'メールアドレス、姓、名は必須です' });
    }
    
    const { registerJobSeekerAPI } = await import('../api/register.js');
    const result = await registerJobSeekerAPI(email, firstName, lastName, language);
    
    console.log('求職者登録結果:', result);
    res.json(result);
  } catch (error) {
    console.error('/api/register-jobseeker エラー:', error);
    res.status(500).json({ success: false, message: '登録に失敗しました' });
  }
});

// --- 統一登録API（フロントエンド互換性のため） ---
app.post('/api/register', async (req, res) => {
  try {
    const { email, firstName, lastName, role, language = 'ja' } = req.body;
    
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレス、姓、名、ユーザータイプは必須です' 
      });
    }
    
    // roleをuser_typeに変換
    let userType;
    if (role === 'jobseeker') {
      userType = 'job_seeker';
    } else if (role === 'company') {
      userType = 'company';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '無効なユーザータイプです' 
      });
    }
    
    // 求職者の場合は既存のAPIを使用
    if (userType === 'job_seeker') {
      const { registerJobSeekerAPI } = await import('../api/register.js');
      const result = await registerJobSeekerAPI(email, firstName, lastName, language);
      res.json(result);
    } else {
      // 企業の場合は企業登録APIを使用（将来的に実装）
      res.status(501).json({ 
        success: false, 
        message: '企業登録は現在サポートされていません' 
      });
    }
  } catch (error) {
    console.error('/api/register エラー:', error);
    res.status(500).json({ success: false, message: '登録に失敗しました' });
  }
});

// --- 企業登録API ---
app.post('/api/register-company', async (req, res) => {
  try {
    const { email, companyName, description } = req.body;
    console.log('企業登録リクエスト:', { email, companyName, description });
    
    if (!email || !companyName) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレス、会社名は必須です' 
      });
    }
    
    const { query } = await import('../integrations/postgres/client.js');
    const bcrypt = await import('bcrypt');
    
    // 既存ユーザーの確認
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスはすでに使われています'
      });
    }
    
    // ランダムパスワード生成
    const password = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(password, 10);
    
    // ユーザー作成
    const userResult = await query(`
      INSERT INTO users (email, password_hash, user_type, status)
      VALUES ($1, $2, 'company', 'pending')
      RETURNING id, email, user_type, status, created_at
    `, [email, passwordHash]);
    
    const user = userResult.rows[0];
    
    // 企業情報作成
    await query(`
      INSERT INTO companies (user_id, company_name, description)
      VALUES ($1, $2, $3)
    `, [user.id, companyName, description || '']);
    
    // 管理者への通知メール送信
    try {
      const { emailService } = await import('../services/emailService.js');
      await emailService.sendAdminNewRegistrationNotification(
        'inside.justjoin@gmail.com',
        'company',
        {
          email: email,
          companyName: companyName,
          description: description || ''
        }
      );
    } catch (emailError) {
      console.error('管理者通知メール送信エラー:', emailError);
    }
    
    console.log('企業登録成功:', { userId: user.id, email });
    
    res.json({
      success: true,
      message: '企業登録申請を送信しました。審査後に担当者から連絡いたします。',
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('/api/register-company エラー:', error);
    res.status(500).json({ success: false, message: '企業登録に失敗しました' });
  }
});

// --- パスワード再発行API ---
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, userType, language = 'ja' } = req.body;
    if (!email || !userType) {
      return res.status(400).json({ success: false, message: 'メールアドレスとユーザータイプは必須です' });
    }

    const { authRepository } = await import('../integrations/postgres/auth.js');
    
    let result;
    if (userType === 'job_seeker') {
      result = await authRepository.resetJobSeekerPassword(email, language);
    } else if (userType === 'company') {
      result = await authRepository.resetCompanyPassword(email, language);
    } else {
      return res.status(400).json({ success: false, message: '無効なユーザータイプです' });
    }

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('/api/reset-password エラー:', error);
    res.status(500).json({ success: false, message: 'パスワード再発行に失敗しました' });
  }
});

// --- 認証用パスワードリセットAPI ---
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, userType } = req.body;
    if (!email || !userType) {
      return res.status(400).json({ success: false, message: 'メールアドレスとユーザータイプは必須です' });
    }

    const { authRepository } = await import('../integrations/postgres/auth.js');
    
    let result;
    if (userType === 'job_seeker') {
      result = await authRepository.resetJobSeekerPassword(email);
    } else if (userType === 'company') {
      result = await authRepository.resetCompanyPassword(email);
    } else {
      return res.status(400).json({ success: false, message: '無効なユーザータイプです' });
    }

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('/api/auth/reset-password エラー:', error);
    res.status(500).json({ success: false, message: 'パスワード再発行に失敗しました' });
  }
});

// --- パスワード変更API ---
app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, language = 'ja' } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'ユーザーID、現在のパスワード、新しいパスワードは必須です' });
    }

    const { authRepository } = await import('../integrations/postgres/auth.js');
    const result = await authRepository.changePassword(userId, currentPassword, newPassword, language);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('/api/change-password エラー:', error);
    res.status(500).json({ success: false, message: 'パスワード変更に失敗しました' });
  }
});

// デバッグ用のルート
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'サーバーは正常に動作しています',
    timestamp: new Date().toISOString(),
    routes: ['/api/spreadsheet', '/api/generate-documents', '/api/test']
  });
});

// 静的ファイルの配信
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 本番環境でのみ静的ファイルを配信
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  // SPAルーティング: すべてのGETリクエストをindex.htmlにリダイレクト
  app.get('*', (req, res) => {
    // APIルートは除外
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
} else {
  // 開発環境ではAPIルートのみ処理
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.status(404).json({ error: 'Route not found' });
  });
}

// エラーハンドリングミドルウェア
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('サーバーエラー:', err);
  res.status(500).json({ error: '内部サーバーエラーが発生しました' });
});

const PORT = parseInt(process.env.PORT || '8080');

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`サーバーがポート${PORT}で起動しました`);
  console.log(`🚀 サーバーがポート${PORT}で起動しました`);
}); 