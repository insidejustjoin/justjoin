import { Router } from 'express';
import { authenticate } from '../authenticate.js';
import { query } from '../../integrations/postgres/client.js';

const router = Router();

// 求職者ステータス一覧取得（管理者用）
router.get('/admin/status', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    let sqlQuery = `
      SELECT 
        js.id,
        js.user_id,
        js.first_name,
        js.last_name,
        js.email,
        js.phone,
        js.profile_photo,
        js.created_at,
        jsh.status,
        jsh.company_name,
        jsh.company_url,
        jsh.employment_date,
        jsh.withdrawal_date,
        jsh.reason,
        jsh.notes,
        jsh.updated_at as status_updated_at
      FROM job_seekers js
      LEFT JOIN current_job_seeker_status jsh ON js.user_id = jsh.user_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status && status !== 'all') {
      sqlQuery += ` AND jsh.status = $${params.length + 1}`;
      params.push(status);
    }
    
    sqlQuery += ` ORDER BY jsh.updated_at DESC NULLS LAST, js.created_at DESC`;
    
    const result = await query(sqlQuery, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('求職者ステータス取得エラー:', error);
    res.status(500).json({ success: false, error: '求職者ステータスの取得に失敗しました' });
  }
});

// 求職者を就職済みに変更
router.post('/admin/employ/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { company_name, company_url, employment_date } = req.body;
    
    if (!company_name || !employment_date) {
      return res.status(400).json({ success: false, error: '企業名と就職日は必須です' });
    }

    // 求職者が存在するかチェック
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: '求職者が見つかりません' });
    }

    // ステータス履歴に就職済みレコードを追加
    const result = await query(`
      INSERT INTO job_seeker_status_history 
        (user_id, status, company_name, company_url, employment_date, notes)
      VALUES ($1, 'employed', $2, $3, $4, $5)
      RETURNING *
    `, [userId, company_name, company_url || null, employment_date, req.body.notes || null]);

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
    const { userId } = req.params;
    const { reason, withdrawal_date } = req.body;
    
    if (!withdrawal_date) {
      return res.status(400).json({ success: false, error: '退会日は必須です' });
    }

    // 求職者が存在するかチェック
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: '求職者が見つかりません' });
    }

    // ステータス履歴に退会済みレコードを追加
    const result = await query(`
      INSERT INTO job_seeker_status_history 
        (user_id, status, withdrawal_date, reason, notes)
      VALUES ($1, 'withdrawn', $2, $3, $4)
      RETURNING *
    `, [userId, withdrawal_date, reason || null, req.body.notes || null]);

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
    const { userId } = req.params;
    const { notes } = req.body;

    // 求職者が存在するかチェック
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: '求職者が見つかりません' });
    }

    // ステータス履歴にアクティブレコードを追加
    const result = await query(`
      INSERT INTO job_seeker_status_history 
        (user_id, status, notes)
      VALUES ($1, 'active', $2)
      RETURNING *
    `, [userId, notes || null]);

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