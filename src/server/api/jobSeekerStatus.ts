import { Router } from 'express';
import { authenticate } from '../authenticate.js';
import { query } from '../../integrations/postgres/client.js';

const router = Router();

const refreshCurrentStatusView = async () => {
  try {
    await query(`REFRESH MATERIALIZED VIEW CONCURRENTLY current_job_seeker_status`);
  } catch (err) {
    try {
      await query(`REFRESH MATERIALIZED VIEW current_job_seeker_status`);
    } catch (err2) {
      await query(`
        CREATE OR REPLACE VIEW current_job_seeker_status AS
        SELECT DISTINCT ON (user_id)
          user_id,
          status,
          company_name,
          company_url,
          employment_date,
          withdrawal_date,
          reason,
          notes,
          created_at,
          updated_at
        FROM job_seeker_status_history
        ORDER BY user_id, created_at DESC
      `);
    }
  }
};

let jobSeekerStatusStructuresEnsured = false;
const ensureJobSeekerStatusStructures = async () => {
  if (jobSeekerStatusStructuresEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS job_seeker_status_history (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        company_name TEXT,
        company_url TEXT,
        employment_date DATE,
        withdrawal_date DATE,
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_job_seeker_status_history_user_id_created_at
        ON job_seeker_status_history (user_id, created_at DESC)
    `);
    await query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS current_job_seeker_status AS
      SELECT DISTINCT ON (user_id)
        user_id,
        status,
        company_name,
        company_url,
        employment_date,
        withdrawal_date,
        reason,
        notes,
        created_at,
        updated_at
      FROM job_seeker_status_history
      ORDER BY user_id, created_at DESC
    `);
    await refreshCurrentStatusView();
  } catch (error) {
    console.warn('job seeker status structure ensure failed:', error);
  } finally {
    jobSeekerStatusStructuresEnsured = true;
  }
};

// 求職者ステータス一覧取得（管理者用）
router.get('/admin/status', authenticate, async (req, res) => {
  try {
    await ensureJobSeekerStatusStructures();
    const { status } = req.query;

    const allowedStatuses = new Set(['active', 'employed', 'withdrawn']);
    const statusFilter = typeof status === 'string' && allowedStatuses.has(status) ? status : 'all';

    const params: any[] = [];
    let whereClause = '';

    if (statusFilter !== 'all') {
      params.push(statusFilter);
      whereClause = `WHERE COALESCE(latest.status, 'active') = $${params.length}`;
    }

    const result = await query(
      `
        WITH latest AS (
          SELECT DISTINCT ON (user_id)
            user_id,
            status,
            company_name,
            company_url,
            employment_date,
            withdrawal_date,
            reason,
            notes,
            updated_at
          FROM job_seeker_status_history
          ORDER BY user_id, created_at DESC
        )
        SELECT
          js.user_id as id,
          js.user_id,
          js.first_name,
          js.last_name,
          u.email,
          js.phone,
          COALESCE(js.profile_photo, doc.document_data -> 'resume' ->> 'photoUrl') AS profile_photo,
          js.created_at,
          COALESCE(latest.status, 'active') as status,
          latest.company_name,
          latest.company_url,
          latest.employment_date,
          latest.withdrawal_date,
          latest.reason,
          latest.notes,
          COALESCE(latest.updated_at, js.created_at) as status_updated_at
        FROM job_seekers js
        INNER JOIN users u ON js.user_id = u.id
        LEFT JOIN latest ON latest.user_id = js.user_id
        LEFT JOIN LATERAL (
          SELECT document_data
          FROM user_documents ud
          WHERE ud.user_id = js.user_id
          ORDER BY ud.updated_at DESC
          LIMIT 1
        ) doc ON TRUE
        ${whereClause}
        ORDER BY status_updated_at DESC, js.created_at DESC
      `,
      params
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('求職者ステータス取得エラー:', error);
    res.json({ success: true, data: [] });
  }
});

// 求職者を就職済みに変更
router.post('/admin/employ/:userId', authenticate, async (req, res) => {
  try {
    await ensureJobSeekerStatusStructures();
    const { userId } = req.params;
    const { company_name, company_url, employment_date } = req.body;
    
    console.log('就職済み変更リクエスト:', { userId, company_name, employment_date });
    
    if (!company_name || !employment_date) {
      return res.status(400).json({ success: false, error: '企業名と就職日は必須です' });
    }

    // UUIDの形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('無効なUUID形式:', userId);
      return res.status(400).json({ success: false, error: '無効なユーザーID形式です' });
    }

    // 求職者が存在するかチェック
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('ユーザーが見つかりません:', userId);
      return res.status(404).json({ success: false, error: '求職者が見つかりません' });
    }

    // ステータス履歴に就職済みレコードを追加
    const result = await query(`
      INSERT INTO job_seeker_status_history 
        (user_id, status, company_name, company_url, employment_date, notes)
      VALUES ($1, 'employed', $2, $3, $4, $5)
      RETURNING *
    `, [userId, company_name, company_url || null, employment_date, req.body.notes || null]);

    await refreshCurrentStatusView();
    res.json({
      success: true,
      data: result.rows[0],
      message: '求職者を就職済みに変更しました'
    });
  } catch (error) {
    console.error('就職済み変更エラー:', error);
    res.status(500).json({ success: false, error: '就職済みへの変更に失敗しました' });
  }
});

// 求職者を退会済みに変更
router.post('/admin/withdraw/:userId', authenticate, async (req, res) => {
  try {
    await ensureJobSeekerStatusStructures();
    const { userId } = req.params;
    const { reason, withdrawal_date } = req.body;
    
    console.log('退会済み変更リクエスト:', { userId, reason, withdrawal_date });
    
    if (!withdrawal_date) {
      return res.status(400).json({ success: false, error: '退会日は必須です' });
    }

    // UUIDの形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('無効なUUID形式:', userId);
      return res.status(400).json({ success: false, error: '無効なユーザーID形式です' });
    }

    // 求職者が存在するかチェック
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('ユーザーが見つかりません:', userId);
      return res.status(404).json({ success: false, error: '求職者が見つかりません' });
    }

    // ステータス履歴に退会済みレコードを追加
    const result = await query(`
      INSERT INTO job_seeker_status_history 
        (user_id, status, withdrawal_date, reason, notes)
      VALUES ($1, 'withdrawn', $2, $3, $4)
      RETURNING *
    `, [userId, withdrawal_date, reason || null, req.body.notes || null]);

    await refreshCurrentStatusView();
    res.json({
      success: true,
      data: result.rows[0],
      message: '求職者を退会済みに変更しました'
    });
  } catch (error) {
    console.error('退会済み変更エラー:', error);
    res.status(500).json({ success: false, error: '退会済みへの変更に失敗しました' });
  }
});

// 求職者を復帰（アクティブ）に変更
router.post('/admin/reactivate/:userId', authenticate, async (req, res) => {
  try {
    await ensureJobSeekerStatusStructures();
    const { userId } = req.params;
    const { notes } = req.body;

    console.log('復帰変更リクエスト:', { userId, notes });

    // UUIDの形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('無効なUUID形式:', userId);
      return res.status(400).json({ success: false, error: '無効なユーザーID形式です' });
    }

    // 求職者が存在するかチェック
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('ユーザーが見つかりません:', userId);
      return res.status(404).json({ success: false, error: '求職者が見つかりません' });
    }

    // ステータス履歴にアクティブレコードを追加
    const result = await query(`
      INSERT INTO job_seeker_status_history 
        (user_id, status, notes)
      VALUES ($1, 'active', $2)
      RETURNING *
    `, [userId, notes || null]);

    await refreshCurrentStatusView();
    res.json({
      success: true,
      data: result.rows[0],
      message: '求職者を復帰させました'
    });
  } catch (error) {
    console.error('復帰変更エラー:', error);
    res.status(500).json({ success: false, error: '復帰への変更に失敗しました' });
  }
});

// 求職者ステータス履歴取得
router.get('/admin/history/:userId', authenticate, async (req, res) => {
  try {
    await ensureJobSeekerStatusStructures();
    const { userId } = req.params;
    
    const result = await query(`
      SELECT 
        id,
        status,
        company_name,
        company_url,
        employment_date,
        withdrawal_date,
        reason,
        notes,
        created_at,
        updated_at
      FROM job_seeker_status_history
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('ステータス履歴取得エラー:', error);
    res.status(500).json({ success: false, error: 'ステータス履歴の取得に失敗しました' });
  }
});

// 求職者ステータス統計取得
router.get('/admin/statistics', authenticate, async (req, res) => {
  try {
    await ensureJobSeekerStatusStructures();
    const result = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM current_job_seeker_status
      GROUP BY status
      ORDER BY status
    `);

    const statistics = {
      active: 0,
      employed: 0,
      withdrawn: 0
    };

    result.rows.forEach(row => {
      statistics[row.status as keyof typeof statistics] = parseInt(row.count);
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('ステータス統計取得エラー:', error);
    res.status(500).json({ success: false, error: 'ステータス統計の取得に失敗しました' });
  }
});

export default router; 