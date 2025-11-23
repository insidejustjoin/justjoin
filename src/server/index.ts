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
import directRegistrationRoutes from './api/directRegistration.js';
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
// 新しい直接登録システム
app.use('/api/register', directRegistrationRoutes);
// 旧仮登録システム（互換性のため残す）
app.use('/api/register/temporary', temporaryRegistrationRoutes);

// リマインドAPI: 書類入力率が100%未満の求職者にメール送信（登録から指定日数経過）
app.post('/api/reminders/incomplete-documents', async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    const { emailService } = await import('../services/emailService.js');

    // 対象日数（デフォルトすべて）
    const targetDays: number[] = req.body?.days?.length ? req.body.days : [3, 7, 10, 30, 90];

    // それぞれの対象日に一致するユーザーを抽出
    const sent: any[] = [];
    for (const days of targetDays) {
      const result = await query(`
        SELECT u.id AS user_id, u.email, COALESCE(js.completion_rate, 0) AS completion_rate,
               COALESCE(js.first_name, '') AS first_name, COALESCE(js.last_name, '') AS last_name,
               DATE_TRUNC('day', u.created_at) AS created_day
        FROM users u
        LEFT JOIN job_seekers js ON js.user_id = u.id
        WHERE u.user_type = 'job_seeker'
          AND u.status = 'active'
          AND COALESCE(js.completion_rate, 0) < 100
          AND DATE_TRUNC('day', u.created_at) = DATE_TRUNC('day', NOW() - INTERVAL '${days} days')
      `);

      for (const row of result.rows) {
        const fullName = `${row.last_name} ${row.first_name}`.trim() || row.email;
        await emailService.sendDocumentsReminder(row.email, fullName, row.completion_rate, days);
        sent.push({ userId: row.user_id, email: row.email, days });
      }
    }

    res.json({ success: true, sent });
  } catch (error: any) {
    console.error('リマインド送信エラー:', error?.message || error);
    res.status(500).json({ success: false, message: 'リマインド送信に失敗しました' });
  }
});
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

// 管理者ダッシュボード：統計情報
app.get('/api/admin/dashboard/stats', authenticate, async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    const period = (req.query.period as string) || '30d';
    const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';

    const [jobSeekers, companies, documents, notifications, recentRegs, activeUsers, totalViews, currentPeriodRegs, prevPeriodRegs] = await Promise.all([
      query('SELECT COUNT(*)::int AS c FROM job_seekers'),
      query('SELECT COUNT(*)::int AS c FROM companies'),
      query('SELECT COUNT(*)::int AS c FROM user_documents'),
      query('SELECT COUNT(*)::int AS c FROM notifications'),
      query(`SELECT COUNT(*)::int AS c FROM users WHERE created_at > NOW() - INTERVAL '${interval}'`),
      query(`SELECT COUNT(*)::int AS c FROM users WHERE status = 'active'`),
      query(`SELECT COALESCE(SUM(view_count),0)::int AS c FROM blog_posts`),
      query(`SELECT COUNT(*)::int AS c FROM users WHERE created_at > NOW() - INTERVAL '${interval}'`),
      query(`SELECT COUNT(*)::int AS c FROM users WHERE created_at BETWEEN NOW() - INTERVAL '${interval}'*2 AND NOW() - INTERVAL '${interval}'`),
    ]);

    const cur = currentPeriodRegs.rows[0].c || 0;
    const prev = prevPeriodRegs.rows[0].c || 0;
    const monthlyGrowth = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    const data = {
      totalJobSeekers: jobSeekers.rows[0].c || 0,
      totalCompanies: companies.rows[0].c || 0,
      totalDocuments: documents.rows[0].c || 0,
      totalNotifications: notifications.rows[0].c || 0,
      recentRegistrations: recentRegs.rows[0].c || 0,
      activeUsers: activeUsers.rows[0].c || 0,
      totalViews: totalViews.rows[0].c || 0,
      monthlyGrowth,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('/api/admin/dashboard/stats エラー:', error);
    res.status(500).json({ success: false, error: '統計情報の取得に失敗しました' });
  }
});

// 管理者ダッシュボード：最近のアクティビティ
app.get('/api/admin/dashboard/activity', authenticate, async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    const limit = 20;

    // 登録、書類、通知を統合
    const result = await query(`
      (
        SELECT 
          u.id::text AS id,
          'registration' AS type,
          CONCAT('新規登録: ', u.email) AS title,
          'ユーザーが登録しました' AS description,
          u.created_at AS timestamp,
          u.id AS user_id
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT $1
      )
      UNION ALL
      (
        SELECT 
          ud.id::text AS id,
          'document' AS type,
          CONCAT('書類更新: ', ud.document_type) AS title,
          'ユーザーの書類が保存されました' AS description,
          ud.updated_at AS timestamp,
          ud.user_id::int AS user_id
        FROM user_documents ud
        ORDER BY ud.updated_at DESC
        LIMIT $1
      )
      UNION ALL
      (
        SELECT 
          n.id::text AS id,
          'notification' AS type,
          n.title AS title,
          n.message AS description,
          n.created_at AS timestamp,
          n.user_id AS user_id
        FROM notifications n
        ORDER BY n.created_at DESC
        LIMIT $1
      )
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    const data = result.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      timestamp: r.timestamp,
      user_id: r.user_id,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('/api/admin/dashboard/activity エラー:', error);
    res.status(500).json({ success: false, error: 'アクティビティの取得に失敗しました' });
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

// 完成度取得APIエンドポイント（documentsのロジックと同一の再計算を実施）
app.get('/api/jobseekers/completion-rate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { registrationType } = req.query;
    
    console.log('[入力率取得API] userId:', userId, 'registrationType:', registrationType);
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userIdが必要です' });
    }

    const { query } = await import('../integrations/postgres/client.js');
    const documentsModule = await import('./api/documents.js');
    const calculateCompletionRate = (documentsModule as any).calculateCompletionRate as (data: any, registrationType?: 'engineer' | 'general') => number;

    const normalizeRegistrationType = (value: any): 'engineer' | 'general' => {
      if (typeof value !== 'string') return 'engineer';
      const trimmed = value.trim().toLowerCase();
      return trimmed === 'general' ? 'general' : 'engineer';
    };
    const registrationTypeFilter = registrationType ? normalizeRegistrationType(registrationType) : null;

    // job_seekersテーブルから現在の入力率を取得
    const jsResult = await query(
      `SELECT completion_rate, registration_type 
         FROM job_seekers 
        WHERE user_id = $1`,
      [userId]
    );

    const existingRecord = jsResult.rows[0] || null;
    const existingRate = typeof existingRecord?.completion_rate === 'number' ? existingRecord?.completion_rate : 0;
    const existingRegistrationType = normalizeRegistrationType(existingRecord?.registration_type || 'engineer');

    // 最新の書類データを取得
    const docParams: any[] = [userId];
    let docSql = `
      SELECT document_data, COALESCE(registration_type, 'engineer') AS registration_type
      FROM user_documents
      WHERE user_id = $1
    `;
    if (registrationTypeFilter) {
      docSql += ` AND LOWER(COALESCE(registration_type, 'engineer')) = LOWER($${docParams.length + 1})`;
      docParams.push(registrationTypeFilter);
    }
    docSql += ' ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1';

    let docResult = await query(docSql, docParams);

    // registrationType指定で見つからない場合は直近のデータをフォールバックで取得
    if (docResult.rows.length === 0 && registrationTypeFilter) {
      docResult = await query(
        `
        SELECT document_data, COALESCE(registration_type, 'engineer') AS registration_type
        FROM user_documents
        WHERE user_id = $1
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 1
        `,
        [userId]
      );
    }

    let finalRate = existingRate;
    let finalRegistrationType = registrationTypeFilter || existingRegistrationType;

    if (docResult.rows.length > 0 && docResult.rows[0].document_data && calculateCompletionRate) {
      let documentData = docResult.rows[0].document_data;
      if (typeof documentData === 'string') {
        try {
          documentData = JSON.parse(documentData);
        } catch (parseError) {
          console.warn('[入力率取得API] document_data parse error:', parseError);
        }
      }
      
      const docRegistrationType = normalizeRegistrationType(
        docResult.rows[0].registration_type || registrationTypeFilter || existingRegistrationType
      );
      finalRegistrationType = docRegistrationType;
      finalRate = calculateCompletionRate(documentData, docRegistrationType);
    } else {
      // 書類データが無い場合もregistrationTypeFilterを尊重
      finalRegistrationType = registrationTypeFilter || existingRegistrationType;
    }

    if (!Number.isFinite(finalRate) || finalRate < 0) {
      finalRate = 0;
    }
    if (finalRate > 100) {
      finalRate = 100;
    }

    // job_seekersテーブルを最新の入力率で更新（登録タイプごとに保持）
    // 入力率が100%の場合は自動的にinterview_enabledをtrueにする
    const shouldEnableInterview = finalRate >= 100;
    const updateResult = await query(
      `
      UPDATE job_seekers
         SET completion_rate = $2,
             interview_enabled = CASE 
               WHEN $4 = true THEN true 
               ELSE COALESCE(interview_enabled, false) 
             END,
             updated_at = NOW()
       WHERE user_id = $1
         AND LOWER(COALESCE(rtrim(registration_type), 'engineer')) = LOWER($3)
       RETURNING user_id
      `,
      [userId, finalRate, finalRegistrationType, shouldEnableInterview]
    );

    if (updateResult.rowCount === 0) {
      await query(
        `
        INSERT INTO job_seekers (user_id, completion_rate, registration_type, interview_enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        `,
        [userId, finalRate, finalRegistrationType, shouldEnableInterview]
      );
    }

    console.log('[入力率取得API] final completionRate:', finalRate, 'registrationType:', finalRegistrationType);

    res.json({ 
      success: true, 
      completionRate: finalRate,
      registrationType: finalRegistrationType
    });

  } catch (error) {
    console.error('入力率取得エラー:', error);
    res.status(500).json({ success: false, error: '入力率の取得に失敗しました' });
  }
});

// 求職者の登録タイプ一覧取得（エンジニア/一般職）
app.get('/api/jobseekers/registration-types/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { query } = await import('../integrations/postgres/client.js');
    console.log('[registration-types] resolve for userId=', userId);
    const all: string[] = [];
    // job_seekers
    try {
      const js = await query(
        `SELECT COALESCE(registration_type, 'engineer') AS registration_type
           FROM job_seekers
          WHERE user_id = $1`,
        [userId]
      );
      js.rows.forEach((r: any) => all.push(r.registration_type));
    } catch (e) {
      console.warn('[registration-types] job_seekers query failed:', (e as any)?.message || e);
    }
    // user_documents
    try {
      const docs = await query(
        `SELECT DISTINCT COALESCE(registration_type, 'engineer') AS registration_type
           FROM user_documents
          WHERE user_id = $1`,
        [userId]
      );
      docs.rows.forEach((r: any) => all.push(r.registration_type));
    } catch (e) {
      console.warn('[registration-types] user_documents query failed:', (e as any)?.message || e);
    }
    // temporary_registrations（仮登録でdocuments_completed/completedのもの）
    try {
      const temps = await query(
        `SELECT DISTINCT COALESCE(tr.registration_type, 'engineer') AS registration_type
           FROM temporary_registrations tr
           JOIN users u ON u.email = tr.email
          WHERE u.id = $1
            AND tr.status IN ('documents_completed','completed')`,
        [userId]
      );
      temps.rows.forEach((r: any) => all.push(r.registration_type));
    } catch (e) {
      console.warn('[registration-types] temporary_registrations query failed:', (e as any)?.message || e);
    }
    const types = Array.from(
      new Set(
        all
          .filter(Boolean)
          .map((t: string) => (String(t).toLowerCase().trim() === 'general' ? 'general' : 'engineer'))
      )
    );
    console.log('[registration-types] resolved types:', types);
    res.json({ success: true, types });
  } catch (error) {
    console.error('登録タイプ取得エラー:', error);
    res.status(500).json({ success: false, message: '登録タイプの取得に失敗しました' });
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
    console.log(`[admin-login] email=${email}`);
    const { query } = await import('../integrations/postgres/client.js');
    
    // 管理者ユーザーを検索
    const result = await query(`
      SELECT id, email, password_hash, user_type as role, status
      FROM users 
      WHERE email = $1 AND user_type = 'admin'
    `, [email]);
    
    console.log('[admin-login] query rows:', result.rows.length);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    const user = result.rows[0];
    
    // パスワード検証
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
    console.log('[admin-login] password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    // ステータスチェック
    if (user.status !== 'active') {
      console.warn('[admin-login] inactive status:', user.status);
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

    await ensureJobSeekerColumns(query);

    const { registrationType = 'all' } = req.query;
    const normalizeRegistrationType = (value: any) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim().toLowerCase();
      if (trimmed === 'engineer' || trimmed === 'general') {
        return trimmed as 'engineer' | 'general';
      }
      return null;
    };

    const normalizedType = normalizeRegistrationType(registrationType);

    const buildQuery = async (type: 'engineer' | 'general' | 'all') => {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let typeIdx: number | null = null;
      if (type === 'engineer') {
        // engineer: 明示engineer または 未設定(NULL)を含める
        whereClause += ` AND (js.registration_type IS NULL OR LOWER(js.registration_type) = $${params.length + 1})`;
        params.push('engineer');
      } else if (type === 'general') {
        // general: 厳密にgeneralのみ（NULLは含めない）
        whereClause += ` AND LOWER(js.registration_type) = $${params.length + 1}`;
        params.push('general');
      }

      const result = await query(
        `
          WITH latest AS (
            SELECT DISTINCT ON (user_id, registration_type)
              user_id,
              registration_type,
              status,
              company_name,
              company_url,
              employment_date,
              withdrawal_date,
              reason,
              notes,
              updated_at
            FROM job_seeker_status_history
            ORDER BY user_id, registration_type, created_at DESC
          )
          SELECT 
            u.id as id,
            js.id as js_id,
            u.id as user_id,
            js.first_name,
            js.last_name,
            CONCAT(js.first_name, ' ', js.last_name) as full_name,
            js.date_of_birth,
            js.date_of_birth as dateOfBirth,
            js.gender,
            js.nationality,
            js.phone,
            js.address,
            js.created_at,
            js.updated_at,
            u.email as user_email,
            u.email as email,
            u.status as user_status,
            u.created_at as user_created_at,
            u.created_at as registeredAt,
            u.updated_at as user_updated_at,
            COALESCE(latest.status, 'active')::text as employment_status,
            latest.company_name,
            latest.company_url,
            latest.employment_date,
            latest.withdrawal_date,
            latest.reason,
            latest.notes,
            -- 最新の音声録音があるかどうか（テーブルが存在しない場合はfalse）
            false as has_interview_audio,
            COALESCE(js.completion_rate, 0)::int as completion_rate,
            COALESCE(js.registration_type, 'engineer') as registration_type,
            COALESCE(
              js.profile_photo,
              doc.document_data -> 'resume' ->> 'photoUrl'
            ) as profile_photo,
            '[]' as skills,
            0 as experience_years,
            '' as desired_job_title,
            '' as self_introduction,
            doc.document_data as document_data,
            doc.registration_type as doc_registration_type
          FROM job_seekers js
          LEFT JOIN users u ON js.user_id = u.id
          LEFT JOIN latest ON latest.user_id = js.user_id 
            AND LOWER(COALESCE(latest.registration_type, 'engineer')) = LOWER(COALESCE(js.registration_type, 'engineer'))
          LEFT JOIN LATERAL (
            SELECT 
              document_data, 
              COALESCE(ud.registration_type, 'engineer') as registration_type
            FROM user_documents ud
            WHERE ud.user_id = u.id
              AND LOWER(COALESCE(ud.registration_type, 'engineer')) = LOWER(COALESCE(js.registration_type, 'engineer'))
            ORDER BY ud.updated_at DESC
            LIMIT 1
          ) doc ON TRUE
          ${whereClause}
          ORDER BY js.created_at DESC
        `,
        params
      );

      // 入力率を再計算して確認（documents.tsのロジックを使用）
      const documentsModule = await import('./api/documents.js');
      const calculateCompletionRate = (documentsModule as any).calculateCompletionRate;
      const normalizeRegistrationType = (value: any): 'engineer' | 'general' => {
        if (typeof value !== 'string') return 'engineer';
        const trimmed = value.trim().toLowerCase();
        return trimmed === 'general' ? 'general' : 'engineer';
      };

      return Promise.all(result.rows.map(async (row) => {
        let finalCompletionRate = row.completion_rate;
        
        // 書類データがある場合は再計算して確認
        if (row.document_data && calculateCompletionRate) {
          try {
            const docData = typeof row.document_data === 'string' 
              ? JSON.parse(row.document_data) 
              : row.document_data;
            const regType = normalizeRegistrationType(row.registration_type || row.doc_registration_type || 'engineer');
            const calculated = calculateCompletionRate(docData, regType);
            
            // デバッグログ（一般職の場合のみ詳細ログ）
            if (regType === 'general') {
              console.log('[管理者ページ] 入力率再計算（一般職）:', {
                userId: row.user_id,
                registrationType: regType,
                jsRegistrationType: row.registration_type,
                docRegistrationType: row.doc_registration_type,
                oldRate: finalCompletionRate,
                newRate: calculated,
                hasSkillSheet: !!docData.skillSheet,
                skillCount: docData.skillSheet?.skills ? Object.keys(docData.skillSheet.skills).length : 0
              });
            }
            
            // 計算結果が異なる場合は更新
            if (calculated !== finalCompletionRate) {
              finalCompletionRate = calculated;
              // 入力率が100%の場合は自動的にinterview_enabledをtrueにする
              const shouldEnableInterview = calculated >= 100;
              // バックグラウンドでデータベースを更新
              query(
                `UPDATE job_seekers 
                 SET completion_rate = $1, 
                     interview_enabled = CASE 
                       WHEN $4 = true THEN true 
                       ELSE COALESCE(interview_enabled, false) 
                     END,
                     updated_at = NOW() 
                 WHERE user_id = $2 AND LOWER(COALESCE(registration_type, 'engineer')) = LOWER($3)`,
                [calculated, row.user_id, regType, shouldEnableInterview]
              ).catch(err => console.warn('Completion rate update failed:', err));
            }
          } catch (err) {
            console.warn('Completion rate recalculation failed for user', row.user_id, err);
          }
        }
        
        return {
          id: row.id,
          js_id: row.js_id,
          user_id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name,
          full_name: row.full_name,
          date_of_birth: row.date_of_birth,
          gender: row.gender,
          nationality: row.nationality,
          phone: row.phone,
          address: row.address,
          created_at: row.created_at,
          updated_at: row.updated_at,
          email: row.email,
          user_status: row.user_status,
          registeredAt: row.registeredAt,
          employment_status: row.employment_status,
          company_name: row.company_name,
          company_url: row.company_url,
          employment_date: row.employment_date,
          withdrawal_date: row.withdrawal_date,
          reason: row.reason,
          notes: row.notes,
          completion_rate: finalCompletionRate,
          registration_type: row.registration_type,
          profile_photo: row.profile_photo
        };
      }));
    };

    const buildMinimalQuery = async (type: 'engineer' | 'general' | 'all') => {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      if (type === 'engineer') {
        whereClause += ` AND (js.registration_type IS NULL OR LOWER(js.registration_type) = $${params.length + 1})`;
        params.push('engineer');
      } else if (type === 'general') {
        whereClause += ` AND LOWER(js.registration_type) = $${params.length + 1}`;
        params.push('general');
      }

      const result = await query(
        `
          WITH latest AS (
            SELECT DISTINCT ON (user_id, registration_type)
              user_id,
              registration_type,
              status,
              company_name,
              company_url,
              employment_date,
              withdrawal_date,
              reason,
              notes,
              updated_at
            FROM job_seeker_status_history
            ORDER BY user_id, registration_type, created_at DESC
          )
          SELECT
            u.id as id,
            js.id as js_id,
            u.id as user_id,
            js.first_name,
            js.last_name,
            js.date_of_birth,
            js.gender,
            js.nationality,
            js.phone,
            js.address,
            js.created_at,
            js.updated_at,
            u.email,
            u.status as user_status,
            COALESCE(js.registration_type, 'engineer') as registration_type,
            COALESCE(js.completion_rate, 0)::int as completion_rate,
            COALESCE(latest.status, 'active')::text as employment_status,
            latest.company_name,
            latest.company_url,
            latest.employment_date,
            latest.withdrawal_date,
            latest.reason,
            latest.notes,
            -- 最新の音声録音があるかどうか（テーブルが存在しない場合はfalse）
            false as has_interview_audio
          FROM job_seekers js
          LEFT JOIN users u ON js.user_id = u.id
          LEFT JOIN latest ON latest.user_id = js.user_id 
            AND LOWER(COALESCE(latest.registration_type, 'engineer')) = LOWER(COALESCE(js.registration_type, 'engineer'))
          ${whereClause}
          ORDER BY js.created_at DESC
        `,
        params
      );

      return result.rows.map((row) => ({
        id: row.id,
        js_id: row.js_id,
        user_id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        full_name: [row.first_name, row.last_name].filter(Boolean).join(' '),
        date_of_birth: row.date_of_birth,
        gender: row.gender,
        nationality: row.nationality,
        phone: row.phone,
        address: row.address,
        created_at: row.created_at,
        updated_at: row.updated_at,
        email: row.email,
        user_status: row.user_status,
        registeredAt: row.created_at,
        employment_status: row.employment_status || 'active',
        company_name: row.company_name,
        company_url: row.company_url,
        employment_date: row.employment_date,
        withdrawal_date: row.withdrawal_date,
        reason: row.reason,
        notes: row.notes,
        has_interview_audio: row.has_interview_audio,
        completion_rate: row.completion_rate,
        registration_type: row.registration_type,
        profile_photo: null
      }));
    };

    let jobSeekers: any[] = [];
    try {
      jobSeekers = await buildQuery(normalizedType ?? 'all');
    } catch (primaryError: any) {
      // interview_recordingsテーブルが存在しない場合のエラーハンドリング
      if (primaryError?.message?.includes('interview_recordings') || primaryError?.detail?.includes('interview_recordings')) {
        console.warn('interview_recordings table does not exist, using minimal query', primaryError);
        try {
          jobSeekers = await buildMinimalQuery(normalizedType ?? 'all');
        } catch (minimalError: any) {
          console.error('jobseekers minimal query also failed', minimalError);
          // さらにフォールバック: has_interview_audioを除外したクエリにフォールバック
          // buildQueryWithoutRecordingsは既存のbuildQueryをベースに作成
          throw minimalError;
        }
      } else {
        console.warn('jobseekers query primary failed, retrying with minimal', primaryError);
        try {
          jobSeekers = await buildMinimalQuery(normalizedType ?? 'all');
        } catch (minimalError) {
          console.error('jobseekers minimal query failed', minimalError);
          if (normalizedType) {
            try {
              jobSeekers = await buildMinimalQuery('all');
            } catch (fallbackError) {
              console.error('jobseekers query fallback failed', fallbackError);
              throw fallbackError;
            }
          } else {
            throw minimalError;
          }
        }
      }
    }

    if (jobSeekers.length === 0 && (normalizedType === 'engineer' || normalizedType === 'general')) {
      return res.json({ success: true, jobSeekers: [] });
    }

    return res.json({ success: true, jobSeekers });
  } catch (error) {
    console.error('管理者求職者取得エラー:', error);
    res.status(500).json({ success: false, message: '求職者一覧の取得に失敗しました', detail: (error as any)?.message || null });
  }
});

// 管理者用：求職者詳細取得API
app.get('/api/jobseekers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { query } = await import('../integrations/postgres/client.js');
    
    const base = await query(`
      SELECT js.*, u.email, u.status as user_status, js.completion_rate
      FROM job_seekers js
      LEFT JOIN users u ON u.id = js.user_id
      WHERE js.user_id::text = $1 OR js.id::text = $1
      LIMIT 1
    `, [id]);
    
    let row = base.rows[0];
    if (!row) {
      // フォールバック: users から基本情報を取得して最低限のプロフィールを構築
      const userOnly = await query(`
        SELECT id as user_id, email, status as user_status, created_at, updated_at
        FROM users
        WHERE id::text = $1
        LIMIT 1
      `, [id]);
      if (userOnly.rows.length === 0) {
        return res.status(404).json({ success: false, message: '求職者が見つかりません' });
      }
      const u = userOnly.rows[0];
      row = {
        id: u.user_id, // job_seekers.id 不明のため user_id を割当
        user_id: u.user_id,
        email: u.email,
        first_name: null,
        last_name: null,
        phone: null,
        address: null,
        date_of_birth: null,
        gender: null,
        nationality: null,
        profile_photo: null,
        completion_rate: 0,
        created_at: u.created_at,
        updated_at: u.updated_at,
      } as any;
    }
 
    // すべての書類データを取得してマージ
    const allDocs = await query(`
      SELECT document_type, document_data, created_at
        FROM user_documents 
        WHERE user_id = $1 
      ORDER BY created_at ASC
    `, [row.user_id]);
 
    const merged: any = {
      id: row.id,
      user_id: row.user_id,
      email: row.email,
      full_name: row.full_name,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      address: row.address,
      date_of_birth: row.date_of_birth,
      gender: row.gender,
      nationality: row.nationality,
      profile_photo: row.profile_photo,
      completion_rate: row.completion_rate || 0,
      interview_enabled: row.interview_enabled || false,
      registration_type: row.registration_type || 'engineer',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    const liftBasic = (d: any) => {
      const b = d?.resume?.basicInfo;
      if (!b) return;
      merged.last_name = merged.last_name || b.lastName;
      merged.first_name = merged.first_name || b.firstName;
      merged.kana_last_name = merged.kana_last_name || b.kanaLastName;
      merged.kana_first_name = merged.kana_first_name || b.kanaFirstName;
      merged.date_of_birth = merged.date_of_birth || b.dateOfBirth;
      merged.gender = merged.gender || b.gender;
      merged.nationality = merged.nationality || b.nationality;
      merged.address = merged.address || b.address;
      merged.phone = merged.phone || b.phone;
      merged.email = merged.email || b.email;
    };

    for (const r of allDocs.rows) {
      const data = r.document_data || {};
      Object.assign(merged, data);
      liftBasic(data);

      const mapBasicTop = (b: any) => {
        if (!b) return;
        merged.last_name = merged.last_name || b.lastName;
        merged.first_name = merged.first_name || b.firstName;
        merged.kana_last_name = merged.kana_last_name || b.kanaLastName;
        merged.kana_first_name = merged.kana_first_name || b.kanaFirstName;
        merged.date_of_birth = merged.date_of_birth || b.dateOfBirth;
        merged.gender = merged.gender || b.gender;
        merged.nationality = merged.nationality || b.nationality;
        merged.address = merged.address || b.address;
        merged.phone = merged.phone || b.phone;
        merged.email = merged.email || b.email;
      };

      if (r.document_type === 'basic_info') {
        mapBasicTop(data);
      }
      if (data.lastName || data.firstName || data.kanaLastName || data.kanaFirstName || data.dateOfBirth) {
        mapBasicTop(data);
      }

      if (data.resume?.photoUrl) {
        merged.profile_photo = merged.profile_photo || data.resume.photoUrl;
      }
      if (data.japaneseInfo?.nextJapaneseTestLevel) {
        merged.japanese_level = data.japaneseInfo.nextJapaneseTestLevel;
      } else if (data.japaneseInfo?.certificateStatus?.name) {
        merged.japanese_level = data.japaneseInfo.certificateStatus.name;
      } else if (data.certificateStatus?.name) {
        merged.japanese_level = data.certificateStatus.name;
      }
    }

    res.json({ success: true, data: merged });
  } catch (error) {
    console.error('/api/jobseekers/:id 取得エラー:', error);
    res.status(500).json({ success: false, message: '求職者詳細の取得に失敗しました' });
  }
});

// 求職者プロフィール取得API（設定ページ用）
app.get('/api/jobseekers/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { registrationType } = req.query as { registrationType?: string };
    const normalizeType = (v?: string) =>
      typeof v === 'string' && v.trim().toLowerCase() === 'general' ? 'general' : 'engineer';
    const type = normalizeType(registrationType);

    const { query } = await import('../integrations/postgres/client.js');

    // 指定タイプ優先で取得（存在しなければ404にせず最終的に最低限のユーザー情報を返す）
    const base = await query(
      `
        SELECT 
          full_name,
          first_name,
          last_name,
          phone,
          self_introduction,
          address,
          desired_job_title,
          experience_years,
          profile_photo,
          registration_type,
          updated_at
        FROM job_seekers
        WHERE user_id = $1
          AND LOWER(COALESCE(registration_type,'engineer')) = LOWER($2)
        LIMIT 1
      `,
      [userId, type]
    );

    let row = base.rows[0];

    if (!row) {
      // タイプ一致がない場合はengineer優先で1件だけ拾う（後方互換）
      const fallback = await query(
        `
          SELECT 
            full_name,
            first_name,
            last_name,
            phone,
            self_introduction,
            address,
            desired_job_title,
            experience_years,
            profile_photo,
            registration_type,
            updated_at
          FROM job_seekers
          WHERE user_id = $1
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [userId]
      );
      row = fallback.rows[0] || null;
    }

    // 顔写真が未設定の場合、該当タイプの user_documents から補完
    if (row && !row.profile_photo) {
      try {
        const doc = await query(
          `
            SELECT document_data
            FROM user_documents
            WHERE user_id = $1
              AND LOWER(COALESCE(registration_type,'engineer')) = LOWER($2)
            ORDER BY updated_at DESC
            LIMIT 1
          `,
          [userId, type]
        );
        if (doc.rows.length > 0) {
          const dd = doc.rows[0].document_data;
          const photo =
            typeof dd === 'string'
              ? (() => {
                  try {
                    const p = JSON.parse(dd);
                    return p?.resume?.photoUrl || null;
                  } catch {
                    return null;
                  }
                })()
              : dd?.resume?.photoUrl || null;
          if (photo) {
            row.profile_photo = photo;
          }
        }
      } catch {}
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'プロフィールが見つかりません',
      });
    }

    res.json({
      success: true,
      profile: row,
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'プロフィールの取得に失敗しました',
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
    const { id } = req.params; // users.id (数値)
    const { query } = await import('../integrations/postgres/client.js');
    
    console.log(`削除リクエスト受信: ID=${id}, 型=${typeof id}`);
    
    // 1. usersテーブルからユーザー情報を取得
    const userResult = await query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
      }
      
    const userId = userResult.rows[0].id;
    const fullName = userResult.rows[0].email;
    
    // 2. job_seekersテーブルから関連レコードを取得
    const jobSeekerResult = await query('SELECT id FROM job_seekers WHERE user_id = $1', [id]);
    const jobSeekerId = jobSeekerResult.rows.length > 0 ? jobSeekerResult.rows[0].id : null;
    
    console.log(`削除対象: UserID=${userId}, Name=${fullName}, JobSeekerID=${jobSeekerId}`);
    
    // トランザクション開始
    await query('BEGIN');
    
    try {
      const deletedRecords: { [key: string]: number } = {};
      
      // 3. job_seeker_status_historyテーブルから削除
      try {
        const statusHistoryResult = await query('DELETE FROM job_seeker_status_history WHERE user_id = $1', [userId]);
        deletedRecords.statusHistory = statusHistoryResult.rowCount;
        console.log(`job_seeker_status_history削除: ${statusHistoryResult.rowCount}件`);
      } catch (error) {
        console.log('job_seeker_status_historyテーブルは存在しないか、データがありません:', error.message);
        deletedRecords.statusHistory = 0;
      }
      
      // 4. temporary_registrationsテーブルから削除
      try {
        const tempRegResult = await query('DELETE FROM temporary_registrations WHERE email = $1', [fullName]);
        deletedRecords.temporaryRegistrations = tempRegResult.rowCount;
        console.log(`temporary_registrations削除: ${tempRegResult.rowCount}件`);
      } catch (error) {
        console.log('temporary_registrationsテーブルは存在しないか、データがありません:', error.message);
        deletedRecords.temporaryRegistrations = 0;
      }
      
      // 5. user_status_historyテーブルから削除
      try {
        const userStatusHistoryResult = await query('DELETE FROM user_status_history WHERE user_id = $1', [userId]);
        deletedRecords.userStatusHistory = userStatusHistoryResult.rowCount;
        console.log(`user_status_history削除: ${userStatusHistoryResult.rowCount}件`);
      } catch (error) {
        console.log('user_status_historyテーブルは存在しないか、データがありません:', error.message);
        deletedRecords.userStatusHistory = 0;
      }

      // 5.1 通知関連の削除
      try {
        const notificationsResult = await query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        deletedRecords.notifications = notificationsResult.rowCount;
        console.log(`notifications削除: ${notificationsResult.rowCount}件`);
      } catch (error) {
        console.log('notificationsテーブルは存在しないか、データがありません:', error.message);
        deletedRecords.notifications = 0;
      }
      try {
        const spotResult = await query('DELETE FROM spot_notification_history WHERE user_id = $1', [userId]);
        deletedRecords.spotNotifications = spotResult.rowCount;
        console.log(`spot_notification_history削除: ${spotResult.rowCount}件`);
      } catch (error) {
        console.log('spot_notification_historyテーブルは存在しないか、データがありません:', error.message);
        deletedRecords.spotNotifications = 0;
      }
      try {
        const workflowResult = await query('DELETE FROM workflow_notification_history WHERE user_id = $1', [userId]);
        deletedRecords.workflowNotifications = workflowResult.rowCount;
        console.log(`workflow_notification_history削除: ${workflowResult.rowCount}件`);
      } catch (error) {
        console.log('workflow_notification_historyテーブルは存在しないか、データがありません:', error.message);
        deletedRecords.workflowNotifications = 0;
      }

      // 5.2 面接関連の削除（存在すれば）
      try {
        // applicantをメールで特定
        const applicants = await query(`SELECT id FROM interview_applicants WHERE email = $1`, [fullName]);
        // user_idベースのattemptsも削除
        try {
          const attempts = await query(`DELETE FROM interview_attempts WHERE user_id = $1`, [userId]);
          deletedRecords.interviewAttempts = attempts.rowCount;
          console.log(`interview_attempts削除: ${attempts.rowCount}件`);
        } catch {}
        if (applicants.rows.length > 0) {
          const applicantId = applicants.rows[0].id;
          try { await query(`DELETE FROM interview_summaries WHERE applicant_id = $1`, [applicantId]); } catch {}
          try { await query(`DELETE FROM interview_answers WHERE applicant_id = $1`, [applicantId]); } catch {}
          try { await query(`DELETE FROM interview_sessions WHERE applicant_id = $1`, [applicantId]); } catch {}
          try { await query(`DELETE FROM interview_applicants WHERE id = $1`, [applicantId]); } catch {}
          deletedRecords.interviewApplicant = 1;
          console.log(`interview_* 関連削除: applicant_id=${applicantId}`);
        } else {
          deletedRecords.interviewApplicant = 0;
        }
      } catch (error) {
        console.log('面接関連テーブルは存在しないか、データがありません:', (error as any)?.message || error);
        deletedRecords.interviewApplicant = 0;
      }

      // 6. user_documentsテーブルから削除
      const documentsResult = await query('DELETE FROM user_documents WHERE user_id = $1', [userId]);
      deletedRecords.documents = documentsResult.rowCount;
      console.log(`user_documents削除: ${documentsResult.rowCount}件`);
      
      // 7. applicationsテーブルから削除（将来的に追加される場合）
      if (jobSeekerId) {
        try {
          const applicationsResult = await query('DELETE FROM applications WHERE job_seeker_id = $1', [jobSeekerId]);
          deletedRecords.applications = applicationsResult.rowCount;
          console.log(`applications削除: ${applicationsResult.rowCount}件`);
        } catch (error) {
          console.log('applicationsテーブルは存在しないか、データがありません:', error.message);
          deletedRecords.applications = 0;
        }
      }
      
      // 8. job_seekersテーブルから削除（存在する場合のみ）
      if (jobSeekerId) {
        const jobSeekersResult = await query('DELETE FROM job_seekers WHERE user_id = $1', [userId]);
        deletedRecords.jobSeeker = jobSeekersResult.rowCount;
        console.log(`job_seekers削除: ${jobSeekersResult.rowCount}件`);
      } else {
        deletedRecords.jobSeeker = 0;
        console.log('job_seekersレコードは存在しません');
      }
      
      // 9. usersテーブルから削除（最後に実行）
      const usersResult = await query('DELETE FROM users WHERE id = $1', [userId]);
      deletedRecords.user = usersResult.rowCount;
      console.log(`users削除: ${usersResult.rowCount}件`);
      
      // トランザクションコミット
      await query('COMMIT');
      
      console.log(`ユーザー完全削除完了: ${fullName} (UserID: ${userId})`);
      res.json({ 
        success: true, 
        message: `ユーザー「${fullName}」を完全に削除しました`,
        deletedRecords: deletedRecords
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
    const { registrationType } = req.query;
    const { query } = await import('../integrations/postgres/client.js');
    
    console.log('[DOCS][GET] userId =', userId, 'registrationType =', registrationType);

    // registrationTypeを正規化
    const normalizeRegistrationType = (value: any): 'engineer' | 'general' => {
      if (typeof value !== 'string') return 'engineer';
      const trimmed = value.trim().toLowerCase();
      return trimmed === 'general' ? 'general' : 'engineer';
    };
    const normalizedType = registrationType ? normalizeRegistrationType(registrationType) : null;

    // 複数document_typeをマージして返却（registrationTypeを考慮）
    let sql = `
      SELECT document_type, document_data, created_at, updated_at, registration_type
      FROM user_documents 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    
    if (normalizedType) {
      sql += ` AND LOWER(COALESCE(registration_type, 'engineer')) = LOWER($${params.length + 1})`;
      params.push(normalizedType);
    }
    
    sql += ` ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST`;
    
    let result = await query(sql, params);
    console.log('[DOCS][GET] 最初のクエリ結果:', result.rows.length, 'rows', 'registrationType =', normalizedType);
    
    // registrationTypeが指定されていない場合のみ、フィルタリングなしで再試行
    if (result.rows.length === 0 && !normalizedType) {
      console.log('[DOCS][GET] registrationType未指定のため、全データで再試行');
      const fallbackSql = `
        SELECT document_type, document_data, created_at, updated_at, registration_type
        FROM user_documents 
        WHERE user_id = $1
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      `;
      result = await query(fallbackSql, [userId]);
      console.log('[DOCS][GET] フォールバッククエリ結果:', result.rows.length, 'rows');
    }
    
    if (result.rows.length === 0) {
      // フォールバック: temporary_registrations の documents_data
      console.log('[DOCS][GET] user_documentsにデータなし、temporary_registrationsを確認');
      const temp = await query(`
        SELECT tr.documents_data
        FROM temporary_registrations tr
        JOIN users u ON u.email = tr.email
        WHERE u.id = $1 AND tr.status IN ('pending','documents_completed','completed')
        ORDER BY tr.updated_at DESC NULLS LAST, tr.created_at DESC NULLS LAST
        LIMIT 1
      `, [userId]);
      if (temp.rows.length > 0 && temp.rows[0].documents_data) {
        let doc = temp.rows[0].documents_data;
        try {
          doc = typeof doc === 'string' ? JSON.parse(doc) : doc;
        } catch {}
        console.log('[DOCS][GET] temporary_registrationsからデータ取得成功');
        return res.json({ success: true, data: doc, createdAt: null, updatedAt: null });
      }
      console.log('[DOCS][GET] データが見つかりません（404）');
      return res.status(404).json({ success: false, message: 'ドキュメントデータが見つかりません' });
    }
    
    // 最新の書類データを取得（registrationTypeに一致するもの）
    let merged: any = {};
    if (result.rows.length > 0) {
      // 最新の書類データを使用
      const latestRow = result.rows[0];
      try {
        const data = latestRow.document_data || {};
        if (typeof data === 'string') {
          merged = JSON.parse(data);
        } else {
          merged = data;
        }
      } catch (parseError) {
        console.warn('[DOCS][GET] JSON parse error:', parseError);
        merged = latestRow.document_data || {};
      }
    } else {
      // フォールバック: registrationTypeを指定せずに取得
      const fallbackResult = await query(`
        SELECT document_data
        FROM user_documents 
        WHERE user_id = $1 
        ORDER BY updated_at DESC
        LIMIT 1
      `, [userId]);
      
      if (fallbackResult.rows.length > 0) {
        try {
          const data = fallbackResult.rows[0].document_data || {};
          if (typeof data === 'string') {
            merged = JSON.parse(data);
          } else {
            merged = data;
          }
        } catch (parseError) {
          console.warn('[DOCS][GET] Fallback JSON parse error:', parseError);
          merged = fallbackResult.rows[0].document_data || {};
        }
      }
    }

    // temporary_registrationsのフォールバック
    if (Object.keys(merged).length === 0) {
      const temp = await query(`
        SELECT tr.documents_data
        FROM temporary_registrations tr
        JOIN users u ON u.email = tr.email
        WHERE u.id = $1 AND tr.status IN ('pending','documents_completed','completed')
        ORDER BY tr.updated_at DESC NULLS LAST, tr.created_at DESC NULLS LAST
        LIMIT 1
      `, [userId]);
      if (temp.rows.length > 0 && temp.rows[0].documents_data) {
        let doc = temp.rows[0].documents_data;
        try {
          doc = typeof doc === 'string' ? JSON.parse(doc) : doc;
        } catch {}
        merged = doc;
      }
    }

    // データが存在しない場合でも成功レスポンスを返す（空オブジェクトでもOK）
    console.log('[DOCS][GET] merged keys =', Object.keys(merged).length, 'registrationType =', normalizedType);

    res.json({ success: true, data: merged });
  } catch (error) {
    console.error('[DOCS][GET] error:', (error as any)?.message || error);
    res.status(500).json({ success: false, message: 'ドキュメント取得中にエラーが発生しました' });
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

    const userResult = await query(
      `
        SELECT id, user_type, email, status
        FROM users
        WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    const user = userResult.rows[0];

    try {
      if (user.user_type === 'job_seeker') {
        await query(
          `
            INSERT INTO job_seeker_status_history (user_id, status, withdrawal_date, reason, notes)
            VALUES ($1, 'withdrawn', NOW(), 'user_self_deleted', 'マイページからの自己削除')
          `,
          [userId]
        );
      }

      await query(
        `
          UPDATE users
          SET status = 'deleted', updated_at = NOW()
          WHERE id = $1
        `,
        [userId]
      );

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



// レート制限用のストレージ（メモリベース、本番環境ではRedisなどを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// レート制限ミドルウェア
const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // 新しいウィンドウを開始
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'リクエストが多すぎます。しばらく待ってから再度お試しください。'
      });
    }
    
    record.count++;
    next();
  };
};

// 統一ログインAPI（求職者・企業・管理者対応）
app.post('/api/login', rateLimit(5, 60000), async (req, res) => {
  try {
    const { email, password, userType, registrationType } = req.body;
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
      // フォールバック: 指定タイプで見つからなければメールのみで再検索
      if (result.rows.length === 0) {
        console.log('指定タイプでは見つからず、メールのみで再検索します');
        result = await query(`
          SELECT id, email, password_hash, user_type as role, status, created_at, updated_at
          FROM users
          WHERE email = $1
          ORDER BY CASE user_type WHEN 'admin' THEN 0 WHEN 'company' THEN 1 ELSE 2 END
          LIMIT 1
        `, [email]);
      }
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
    
    let registrationTypes: string[] = [];
    if (user.role === 'job_seeker') {
      try {
        const typesResult = await query(
          `
            SELECT COALESCE(registration_type, 'engineer') AS registration_type
            FROM job_seekers
            WHERE user_id = $1
          `,
          [user.id]
        );
        registrationTypes = Array.from(
          new Set(
            typesResult.rows.map((row: any) => (row.registration_type === 'general' ? 'general' : 'engineer'))
          )
        );
      } catch (typeError) {
        console.warn('登録タイプ取得に失敗しました:', typeError);
      }

      try {
        const docTypeResult = await query(
          `
            SELECT DISTINCT COALESCE(registration_type, 'engineer') AS registration_type
              FROM user_documents
             WHERE user_id = $1
          `,
          [user.id]
        );
        const docTypes = docTypeResult.rows.map((row: any) =>
          row.registration_type === 'general' ? 'general' : 'engineer'
        );
        registrationTypes = Array.from(new Set([...registrationTypes, ...docTypes]));
      } catch (docTypeError) {
        console.warn('書類ベースの登録タイプ取得に失敗しました:', docTypeError);
      }

      if (registrationType) {
        const normalized =
          registrationType === 'general' || registrationType === 'engineer' ? registrationType : 'engineer';
        if (registrationTypes.length > 0 && !registrationTypes.includes(normalized)) {
          return res.status(403).json({
            success: false,
            message: `このメールアドレスでは${normalized === 'general' ? '一般職' : 'エンジニア'}としての登録は完了していません`
          });
        }
      }
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
        updated_at: user.updated_at,
        registration_types: registrationTypes
      },
      registrationTypes
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
  app.get('*', (req, res, next) => {
    // APIルートは除外 -> 次のルートへ委譲（後続のAPI定義を有効にする）
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
} else {
  // 開発環境ではAPIルートのみ処理
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
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

// 管理者用：仮登録一覧取得API
app.get('/api/admin/temporary-registrations', authenticate, async (req, res) => {
  try {
    const { query } = await import('../integrations/postgres/client.js');
    const result = await query(`
      SELECT id, email, first_name, last_name, verification_token, status, expires_at, created_at, updated_at
      FROM temporary_registrations
      ORDER BY created_at DESC
    `);

    res.json({ success: true, items: result.rows });
  } catch (error: any) {
    console.error('仮登録一覧取得エラー:', error?.message || error);
    res.status(500).json({ success: false, message: '仮登録一覧の取得に失敗しました' });
  }
});

// 管理者用：仮登録削除API
app.delete('/api/admin/temporary-registrations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const email = typeof req.query.email === 'string' ? req.query.email : undefined;
    const { query } = await import('../integrations/postgres/client.js');

    // id優先、email指定時はemailでも削除できる
    let deleted = 0;
    if (id && id !== 'by-email') {
      const r = await query('DELETE FROM temporary_registrations WHERE id = $1', [id]);
      deleted = r.rowCount || 0;
    } else if (email) {
      const r = await query('DELETE FROM temporary_registrations WHERE email = $1', [email]);
      deleted = r.rowCount || 0;
    } else {
      return res.status(400).json({ success: false, message: '削除対象のidまたはemailが必要です' });
    }

    res.json({ success: true, deleted });
  } catch (error: any) {
    console.error('仮登録削除エラー:', error?.message || error);
    res.status(500).json({ success: false, message: '仮登録の削除に失敗しました' });
  }
}); 

// ... existing code ...
app.get('/api/jobseekers/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { query } = await import('../integrations/postgres/client.js');

    if (!email) return res.status(400).json({ success: false, message: 'メールは必須です' });

    const userRes = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
    }
    const userId = userRes.rows[0].id;

    // 既存の /api/jobseekers/:id と同じ統合ロジック（簡約版）
    const docs = await query(`
      SELECT document_type, document_data, created_at
      FROM user_documents
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [userId]);

    const merged: any = {}; const liftBasic = (d:any)=>{ if(!d) return; const b=d.resume?.basicInfo; if(b){ merged.lastName=merged.lastName||b.lastName; merged.firstName=merged.firstName||b.firstName; merged.kanaLastName=merged.kanaLastName||b.kanaLastName; merged.kanaFirstName=merged.kanaFirstName||b.kanaFirstName; merged.birthDate=merged.birthDate||b.dateOfBirth; merged.gender=merged.gender||b.gender; merged.nationality=merged.nationality||b.nationality; merged.liveAddress=merged.liveAddress||b.address; merged.livePhoneNumber=merged.livePhoneNumber||b.phone; merged.liveMail=merged.liveMail||b.email; }};
    for (const row of docs.rows) {
      const data = row.document_data || {};
      try {
        Object.assign(merged, data);
        liftBasic(data);
        if (data.resume) merged.resume = { ...(merged.resume || {}), ...data.resume };
        if (data.workHistory) merged.workHistory = { ...(merged.workHistory || {}), ...data.workHistory };
        if (data.skillSheet) {
          merged.skillSheet = { ...(merged.skillSheet || {}), ...data.skillSheet };
          if (data.skillSheet.skills) merged.skillSheet.skills = { ...(merged.skillSheet.skills || {}), ...data.skillSheet.skills };
        }
        if (data.certificateStatus) merged.certificateStatus = { ...(merged.certificateStatus || {}), ...data.certificateStatus };
      } catch {}
    }

    // user基本情報も付与
    const js = await query('SELECT * FROM job_seekers WHERE user_id = $1 LIMIT 1', [userId]);
    const profile = js.rows[0] || {};

    return res.json({ success: true, data: { userId, profile, ...merged } });
  } catch (error) {
    console.error('[JOBSEEKERS][BY_EMAIL] error:', (error as any)?.message || error);
    res.status(500).json({ success: false, message: '取得中にエラーが発生しました' });
  }
});
// ... existing code ...

let jobSeekerColumnsEnsured = false;
const ensureJobSeekerColumns = async (queryFn: (text: string, params?: any[]) => Promise<any>) => {
  if (jobSeekerColumnsEnsured) return;
  try {
    await queryFn(`
      ALTER TABLE job_seekers
      ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20)
    `);
    await queryFn(`
      UPDATE job_seekers
      SET registration_type = COALESCE(registration_type, 'engineer')
    `);
    await queryFn(`
      ALTER TABLE job_seekers
      ADD COLUMN IF NOT EXISTS completion_rate INTEGER DEFAULT 0
    `);
    await queryFn(`
      UPDATE job_seekers
      SET completion_rate = COALESCE(completion_rate, 0)
    `);
    await queryFn(`
      ALTER TABLE job_seekers
      ALTER COLUMN registration_type SET DEFAULT 'engineer'
    `);
  } catch (columnError) {
    console.warn('job_seekers column ensure skipped:', columnError);
  } finally {
    jobSeekerColumnsEnsured = true;
  }
};