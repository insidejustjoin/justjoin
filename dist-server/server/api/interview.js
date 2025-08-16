import express from 'express';
import { authenticate } from '../authenticate.js';
const router = express.Router();
// 面接データ取得
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        // ここで面接データベースから情報を取得
        // 実際の実装では、interview-systemのデータベースに接続
        // サンプルデータ（実際の実装では削除）
        const mockInterviewData = {
            session: {
                id: `session-${userId}`,
                applicant_id: userId,
                status: 'completed',
                language: 'ja',
                current_question_index: 10,
                started_at: new Date(Date.now() - 3600000).toISOString(),
                completed_at: new Date().toISOString(),
                total_duration: 3600,
                consent_given: true,
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0...',
                metadata: {},
                created_at: new Date(Date.now() - 7200000).toISOString(),
                updated_at: new Date().toISOString()
            },
            summary: {
                id: 1,
                session_id: `session-${userId}`,
                applicant_id: userId,
                total_questions: 10,
                answered_questions: 10,
                total_duration: 3600,
                average_response_time: 45.5,
                completion_rate: 1.0,
                key_insights: ['技術力が高い', 'コミュニケーション能力が優秀'],
                overall_score: 85,
                strengths: ['プログラミングスキル', '問題解決能力'],
                areas_for_improvement: ['プレゼンテーション力'],
                recommendation: 'yes',
                notes: '優秀な候補者です',
                created_at: new Date().toISOString()
            },
            applicant: {
                id: userId,
                email: 'test@example.com',
                name: 'テストユーザー',
                position: 'ソフトウェアエンジニア',
                experience_years: 5,
                created_at: new Date(Date.now() - 86400000).toISOString(),
                updated_at: new Date(Date.now() - 86400000).toISOString()
            }
        };
        res.json({
            success: true,
            data: mockInterviewData
        });
    }
    catch (error) {
        console.error('面接データ取得エラー:', error);
        res.status(500).json({
            success: false,
            error: '面接データの取得に失敗しました'
        });
    }
});
// 面接表示設定更新
router.put('/:userId/visibility', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const { visible } = req.body;
        // ここで面接表示設定を更新
        console.log(`面接表示設定更新: ${userId} - ${visible}`);
        res.json({
            success: true,
            message: '面接表示設定を更新しました'
        });
    }
    catch (error) {
        console.error('面接表示設定更新エラー:', error);
        res.status(500).json({
            success: false,
            error: '面接表示設定の更新に失敗しました'
        });
    }
});
// 通知設定更新
router.put('/:userId/notifications', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const { enabled, type } = req.body;
        // ここで通知設定を更新
        console.log(`通知設定更新: ${userId} - ${enabled} (${type})`);
        res.json({
            success: true,
            message: '通知設定を更新しました'
        });
    }
    catch (error) {
        console.error('通知設定更新エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知設定の更新に失敗しました'
        });
    }
});
// 一括資料作成
router.post('/bulk-documents', authenticate, async (req, res) => {
    try {
        const { jobSeekerIds } = req.body;
        // ここで一括資料作成処理を実行
        console.log(`一括資料作成開始: ${jobSeekerIds.length}人`);
        // 実際の実装では、各求職者の資料を生成
        const results = jobSeekerIds.map((id) => ({
            id,
            status: 'processing',
            message: '資料生成中'
        }));
        res.json({
            success: true,
            message: '一括資料作成を開始しました',
            data: results
        });
    }
    catch (error) {
        console.error('一括資料作成エラー:', error);
        res.status(500).json({
            success: false,
            error: '一括資料作成に失敗しました'
        });
    }
});
// 面接結果ダウンロード
router.get('/:userId/download', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        // ここで面接結果のPDFやExcelファイルを生成
        console.log(`面接結果ダウンロード: ${userId}`);
        // 実際の実装では、ファイルを生成してダウンロード
        res.json({
            success: true,
            message: '面接結果のダウンロードを開始しました',
            downloadUrl: `/api/interview/${userId}/file`
        });
    }
    catch (error) {
        console.error('面接結果ダウンロードエラー:', error);
        res.status(500).json({
            success: false,
            error: '面接結果のダウンロードに失敗しました'
        });
    }
});
export default router;
