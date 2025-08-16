import express from 'express';
import { Pool } from 'pg';
const router = express.Router();
// データベース接続設定
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
// 面接統計データ取得
router.get('/analytics', async (req, res) => {
    try {
        // 認証チェック
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: '認証が必要です' });
        }
        // 管理者権限チェック（簡易版）
        // 実際の実装ではJWTトークンの検証が必要
        // 統計データを取得
        const statsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'in_progress' THEN s.id END) as in_progress_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) as cancelled_sessions,
        AVG(s.total_duration) as average_duration,
        AVG(sm.overall_score) as average_score,
        COUNT(DISTINCT CASE WHEN sm.recommendation IN ('strong_yes', 'yes') THEN sm.session_id END) as positive_recommendations,
        COUNT(DISTINCT ia.id) as total_applicants
      FROM interview_sessions s
      LEFT JOIN interview_summaries sm ON s.id = sm.session_id
      LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
    `;
        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];
        // 最近のセッションを取得
        const recentSessionsQuery = `
      SELECT 
        s.*,
        ia.name as applicant_name,
        ia.email as applicant_email
      FROM interview_sessions s
      LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `;
        const recentSessionsResult = await pool.query(recentSessionsQuery);
        // トップパフォーマーを取得
        const topPerformersQuery = `
      SELECT 
        sm.*,
        s.applicant_id,
        ia.name as applicant_name,
        ia.email as applicant_email
      FROM interview_summaries sm
      LEFT JOIN interview_sessions s ON sm.session_id = s.id
      LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
      WHERE sm.overall_score IS NOT NULL
      ORDER BY sm.overall_score DESC
      LIMIT 10
    `;
        const topPerformersResult = await pool.query(topPerformersQuery);
        // 最近の回答を取得
        const recentAnswersQuery = `
      SELECT 
        ia.*,
        s.session_id,
        s.question_id,
        s.text,
        s.response_time,
        s.word_count,
        s.sentiment_score
      FROM interview_answers ia
      LEFT JOIN interview_sessions s ON ia.session_id = s.id
      ORDER BY ia.created_at DESC
      LIMIT 20
    `;
        const recentAnswersResult = await pool.query(recentAnswersQuery);
        res.json({
            success: true,
            data: {
                totalSessions: parseInt(stats.total_sessions) || 0,
                completedSessions: parseInt(stats.completed_sessions) || 0,
                inProgressSessions: parseInt(stats.in_progress_sessions) || 0,
                cancelledSessions: parseInt(stats.cancelled_sessions) || 0,
                averageDuration: parseFloat(stats.average_duration) || 0,
                averageScore: parseFloat(stats.average_score) || 0,
                positiveRecommendations: parseInt(stats.positive_recommendations) || 0,
                totalApplicants: parseInt(stats.total_applicants) || 0,
                recentSessions: recentSessionsResult.rows,
                topPerformers: topPerformersResult.rows,
                recentAnswers: recentAnswersResult.rows
            }
        });
    }
    catch (error) {
        console.error('面接統計データ取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '面接統計データの取得中にエラーが発生しました'
        });
    }
});
// 面接セッション一覧取得
router.get('/sessions', async (req, res) => {
    try {
        // 認証チェック
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: '認証が必要です' });
        }
        const { status, dateRange, search } = req.query;
        let query = `
      SELECT 
        s.*,
        ia.name as applicant_name,
        ia.email as applicant_email,
        sm.overall_score,
        sm.recommendation
      FROM interview_sessions s
      LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
      LEFT JOIN interview_summaries sm ON s.id = sm.session_id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        // ステータスフィルター
        if (status && status !== 'all') {
            query += ` AND s.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        // 日付範囲フィルター
        if (dateRange && dateRange !== 'all') {
            const days = parseInt(dateRange);
            if (!isNaN(days)) {
                query += ` AND s.created_at >= NOW() - INTERVAL '${days} days'`;
            }
        }
        // 検索フィルター
        if (search) {
            query += ` AND (s.id ILIKE $${paramIndex} OR ia.name ILIKE $${paramIndex} OR ia.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        query += ` ORDER BY s.created_at DESC`;
        const result = await pool.query(query, params);
        res.json({
            success: true,
            sessions: result.rows
        });
    }
    catch (error) {
        console.error('面接セッション取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '面接セッションの取得中にエラーが発生しました'
        });
    }
});
// 面接サマリー一覧取得
router.get('/summaries', async (req, res) => {
    try {
        // 認証チェック
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: '認証が必要です' });
        }
        const { recommendation, dateRange, search } = req.query;
        let query = `
      SELECT 
        sm.*,
        s.applicant_id,
        s.status as session_status,
        s.started_at,
        s.completed_at,
        ia.name as applicant_name,
        ia.email as applicant_email
      FROM interview_summaries sm
      LEFT JOIN interview_sessions s ON sm.session_id = s.id
      LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        // 推奨レベルフィルター
        if (recommendation && recommendation !== 'all') {
            query += ` AND sm.recommendation = $${paramIndex}`;
            params.push(recommendation);
            paramIndex++;
        }
        // 日付範囲フィルター
        if (dateRange && dateRange !== 'all') {
            const days = parseInt(dateRange);
            if (!isNaN(days)) {
                query += ` AND sm.created_at >= NOW() - INTERVAL '${days} days'`;
            }
        }
        // 検索フィルター
        if (search) {
            query += ` AND (sm.session_id ILIKE $${paramIndex} OR ia.name ILIKE $${paramIndex} OR ia.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        query += ` ORDER BY sm.created_at DESC`;
        const result = await pool.query(query, params);
        res.json({
            success: true,
            summaries: result.rows
        });
    }
    catch (error) {
        console.error('面接サマリー取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '面接サマリーの取得中にエラーが発生しました'
        });
    }
});
// 面接詳細取得
router.get('/sessions/:sessionId', async (req, res) => {
    try {
        // 認証チェック
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: '認証が必要です' });
        }
        const { sessionId } = req.params;
        // セッション情報取得
        const sessionQuery = `
      SELECT 
        s.*,
        ia.name as applicant_name,
        ia.email as applicant_email,
        ia.position,
        ia.experience_years
      FROM interview_sessions s
      LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
      WHERE s.id = $1
    `;
        const sessionResult = await pool.query(sessionQuery, [sessionId]);
        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '面接セッションが見つかりません'
            });
        }
        const session = sessionResult.rows[0];
        // サマリー情報取得
        const summaryQuery = `
      SELECT * FROM interview_summaries 
      WHERE session_id = $1
    `;
        const summaryResult = await pool.query(summaryQuery, [sessionId]);
        const summary = summaryResult.rows[0] || null;
        // 回答情報取得
        const answersQuery = `
      SELECT * FROM interview_answers 
      WHERE session_id = $1 
      ORDER BY question_id
    `;
        const answersResult = await pool.query(answersQuery, [sessionId]);
        res.json({
            success: true,
            data: {
                session,
                summary,
                answers: answersResult.rows
            }
        });
    }
    catch (error) {
        console.error('面接詳細取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '面接詳細の取得中にエラーが発生しました'
        });
    }
});
// 面接データエクスポート
router.get('/export/:type', async (req, res) => {
    try {
        // 認証チェック
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: '認証が必要です' });
        }
        const { type } = req.params;
        const { format = 'csv' } = req.query;
        let query = '';
        let filename = '';
        switch (type) {
            case 'sessions':
                query = `
          SELECT 
            s.id as session_id,
            s.status,
            s.language,
            s.started_at,
            s.completed_at,
            s.total_duration,
            ia.name as applicant_name,
            ia.email as applicant_email,
            ia.position,
            sm.overall_score,
            sm.recommendation
          FROM interview_sessions s
          LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
          LEFT JOIN interview_summaries sm ON s.id = sm.session_id
          ORDER BY s.created_at DESC
        `;
                filename = 'interview_sessions';
                break;
            case 'summaries':
                query = `
          SELECT 
            sm.session_id,
            sm.total_questions,
            sm.answered_questions,
            sm.total_duration,
            sm.average_response_time,
            sm.completion_rate,
            sm.overall_score,
            sm.recommendation,
            sm.notes,
            ia.name as applicant_name,
            ia.email as applicant_email,
            ia.position
          FROM interview_summaries sm
          LEFT JOIN interview_sessions s ON sm.session_id = s.id
          LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
          ORDER BY sm.created_at DESC
        `;
                filename = 'interview_summaries';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: '無効なエクスポートタイプです'
                });
        }
        const result = await pool.query(query);
        if (format === 'csv') {
            // CSV形式でエクスポート
            const csvHeaders = Object.keys(result.rows[0] || {}).join(',');
            const csvData = result.rows.map(row => Object.values(row).map(value => typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value).join(',')).join('\n');
            const csvContent = `${csvHeaders}\n${csvData}`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        }
        else {
            // JSON形式でエクスポート
            res.json({
                success: true,
                data: result.rows
            });
        }
    }
    catch (error) {
        console.error('面接データエクスポートエラー:', error);
        res.status(500).json({
            success: false,
            message: '面接データのエクスポート中にエラーが発生しました'
        });
    }
});
export default router;
