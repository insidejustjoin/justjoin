import express from 'express';
import { authenticate } from '../authenticate.js';
import { getNotificationsByUserId, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getAllNotifications, sendNotificationToUser, sendNotificationToAllUsers, createNotificationHistoryTables, getSpotNotificationHistory, getWorkflowNotificationHistory, saveSpotNotificationHistory, saveWorkflowNotificationHistory, deleteSpotNotificationHistory, updateSpotNotificationHistory, updateUserNotificationsByHistoryId, deleteUserNotificationsByHistoryId } from '../../integrations/postgres/notifications.js';
const router = express.Router();
// 通知履歴テーブルを初期化
createNotificationHistoryTables().catch(console.error);
// ユーザーの通知一覧を取得
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await getNotificationsByUserId(userId);
        res.json({
            success: true,
            data: notifications
        });
    }
    catch (error) {
        console.error('通知取得エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の取得に失敗しました'
        });
    }
});
// 未読通知数を取得
router.get('/unread-count/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await getUnreadNotificationCount(userId);
        res.json({
            success: true,
            data: { count }
        });
    }
    catch (error) {
        console.error('未読通知数取得エラー:', error);
        res.status(500).json({
            success: false,
            error: '未読通知数の取得に失敗しました'
        });
    }
});
// 通知を既読にする
router.put('/mark-read/:notificationId', authenticate, async (req, res) => {
    try {
        const { notificationId } = req.params;
        await markNotificationAsRead(notificationId);
        res.json({
            success: true,
            message: '通知を既読にしました'
        });
    }
    catch (error) {
        console.error('通知既読化エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の既読化に失敗しました'
        });
    }
});
// すべての通知を既読にする
router.put('/mark-all-read/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        await markAllNotificationsAsRead(userId);
        res.json({
            success: true,
            message: 'すべての通知を既読にしました'
        });
    }
    catch (error) {
        console.error('全通知既読化エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の既読化に失敗しました'
        });
    }
});
// 通知を削除
router.delete('/:notificationId', authenticate, async (req, res) => {
    try {
        const { notificationId } = req.params;
        await deleteNotification(notificationId);
        res.json({
            success: true,
            message: '通知を削除しました'
        });
    }
    catch (error) {
        console.error('通知削除エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の削除に失敗しました'
        });
    }
});
// 管理者用：すべての通知を取得
router.get('/admin/all', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const notifications = await getAllNotifications();
        res.json({
            success: true,
            data: notifications
        });
    }
    catch (error) {
        console.error('全通知取得エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の取得に失敗しました'
        });
    }
});
// 管理者用：特定のユーザーに通知を送信
router.post('/admin/send-to-user', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { userId, title, message, type = 'info' } = req.body;
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                error: '必要なパラメータが不足しています'
            });
        }
        const notification = await sendNotificationToUser(userId, title, message, type);
        res.json({
            success: true,
            data: notification,
            message: '通知を送信しました'
        });
    }
    catch (error) {
        console.error('通知送信エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の送信に失敗しました'
        });
    }
});
// 管理者用：全ユーザーに通知を送信
router.post('/admin/send-to-all', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { title, message, type = 'info' } = req.body;
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: '必要なパラメータが不足しています'
            });
        }
        await sendNotificationToAllUsers(title, message, type);
        res.json({
            success: true,
            message: 'すべてのユーザーに通知を送信しました'
        });
    }
    catch (error) {
        console.error('全ユーザー通知送信エラー:', error);
        res.status(500).json({
            success: false,
            error: '通知の送信に失敗しました'
        });
    }
});
// 管理者用：ワークフロー通知設定の保存
router.post('/admin/workflow', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { id, name, description, trigger, enabled, title, message, type, sendToExisting } = req.body;
        if (!id || !name || !title || !message) {
            return res.status(400).json({
                success: false,
                error: '必要なパラメータが不足しています'
            });
        }
        let totalSentCount = 0;
        // 既存ユーザーにも送信する場合
        if (sendToExisting && enabled) {
            try {
                // 条件に合致する既存ユーザーを取得して通知を送信
                if (trigger === 'registration_complete') {
                    // 登録完了済みの全ユーザーに通知
                    await sendNotificationToAllUsers(title, message, type);
                    // 全ユーザー数を取得
                    const { Pool } = await import('pg');
                    const pool = new Pool({
                        connectionString: process.env.DATABASE_URL,
                    });
                    const client = await pool.connect();
                    try {
                        const result = await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'job_seeker\'');
                        totalSentCount = parseInt(result.rows[0].count);
                    }
                    finally {
                        client.release();
                        await pool.end();
                    }
                }
                else if (trigger === 'document_complete') {
                    // 書類完成済みのユーザーに通知（実装は後で追加）
                    // 現在は全ユーザーに送信
                    await sendNotificationToAllUsers(title, message, type);
                    // 全ユーザー数を取得
                    const { Pool } = await import('pg');
                    const pool = new Pool({
                        connectionString: process.env.DATABASE_URL,
                    });
                    const client = await pool.connect();
                    try {
                        const result = await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'job_seeker\'');
                        totalSentCount = parseInt(result.rows[0].count);
                    }
                    finally {
                        client.release();
                        await pool.end();
                    }
                }
            }
            catch (error) {
                console.error('既存ユーザーへの通知送信エラー:', error);
            }
        }
        // ワークフロー通知履歴を保存
        await saveWorkflowNotificationHistory({
            name,
            description,
            trigger,
            enabled,
            title,
            message,
            type,
            lastSentAt: new Date(),
            totalSentCount
        });
        res.json({
            success: true,
            message: 'ワークフロー通知設定を保存しました'
        });
    }
    catch (error) {
        console.error('ワークフロー通知設定保存エラー:', error);
        res.status(500).json({
            success: false,
            error: 'ワークフロー通知設定の保存に失敗しました'
        });
    }
});
// 管理者用：スポット通知の送信
router.post('/admin/send-spot', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { title, message, type = 'info', targetUsers, selectedUserIds } = req.body;
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: '必要なパラメータが不足しています'
            });
        }
        let recipientCount = 0;
        let notificationIds = [];
        if (targetUsers === 'selected' && selectedUserIds && selectedUserIds.length > 0) {
            // 選択されたユーザーに通知を送信
            for (const userId of selectedUserIds) {
                const notification = await sendNotificationToUser(userId, title, message, type);
                notificationIds.push(notification.id);
            }
            recipientCount = selectedUserIds.length;
        }
        else if (targetUsers === 'all') {
            // 全ユーザーに通知を送信
            await sendNotificationToAllUsers(title, message, type);
            // 全ユーザー数を取得
            const { Pool } = await import('pg');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
            });
            const client = await pool.connect();
            try {
                const result = await client.query('SELECT COUNT(*) as count FROM users WHERE user_type = \'job_seeker\'');
                recipientCount = parseInt(result.rows[0].count);
            }
            finally {
                client.release();
                await pool.end();
            }
        }
        else {
            return res.status(400).json({
                success: false,
                error: '無効な送信対象が指定されています'
            });
        }
        // スポット通知履歴を保存
        await saveSpotNotificationHistory({
            title,
            message,
            type,
            targetUsers,
            selectedUserIds,
            notificationIds,
            recipientCount
        });
        res.json({
            success: true,
            message: 'スポット通知を送信しました'
        });
    }
    catch (error) {
        console.error('スポット通知送信エラー:', error);
        res.status(500).json({
            success: false,
            error: 'スポット通知の送信に失敗しました'
        });
    }
});
// 管理者用：スポット通知履歴の取得
router.get('/admin/spot-history', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        // スポット通知履歴をデータベースから取得
        const spotHistory = await getSpotNotificationHistory();
        // フロントエンドの期待する形式に変換
        const formattedHistory = spotHistory.map(item => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type,
            targetUsers: item.target_users,
            status: item.status,
            createdAt: item.created_at,
            recipientCount: item.recipient_count
        }));
        res.json({
            success: true,
            data: formattedHistory
        });
    }
    catch (error) {
        console.error('スポット通知履歴取得エラー:', error);
        res.status(500).json({
            success: false,
            error: 'スポット通知履歴の取得に失敗しました'
        });
    }
});
// 管理者用：ワークフロー通知履歴の取得
router.get('/admin/workflow-history', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        // ワークフロー通知履歴をデータベースから取得
        const workflowHistory = await getWorkflowNotificationHistory();
        // フロントエンドの期待する形式に変換
        const formattedHistory = workflowHistory.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            trigger: item.trigger,
            enabled: item.enabled,
            title: item.title,
            message: item.message,
            type: item.type,
            lastSentAt: item.last_sent_at,
            totalSentCount: item.total_sent_count
        }));
        res.json({
            success: true,
            data: formattedHistory
        });
    }
    catch (error) {
        console.error('ワークフロー通知履歴取得エラー:', error);
        res.status(500).json({
            success: false,
            error: 'ワークフロー通知履歴の取得に失敗しました'
        });
    }
});
// 管理者用：スポット通知の更新
router.put('/admin/spot/:notificationId', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { notificationId } = req.params;
        const { title, message, type } = req.body;
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: '通知IDが必要です'
            });
        }
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'タイトルとメッセージが必要です'
            });
        }
        // スポット通知履歴をデータベースから更新
        await updateSpotNotificationHistory(notificationId, { title, message, type });
        // 求職者側の通知も更新
        await updateUserNotificationsByHistoryId(notificationId, { title, message, type });
        res.json({
            success: true,
            message: 'スポット通知と求職者通知を更新しました'
        });
    }
    catch (error) {
        console.error('スポット通知更新エラー:', error);
        res.status(500).json({
            success: false,
            error: 'スポット通知の更新に失敗しました'
        });
    }
});
// 管理者用：求職者通知の更新
router.put('/admin/update-user-notifications/:notificationId', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { notificationId } = req.params;
        const { title, message, type } = req.body;
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: '通知IDが必要です'
            });
        }
        // 求職者の通知を更新
        await updateUserNotificationsByHistoryId(notificationId, { title, message, type });
        res.json({
            success: true,
            message: '求職者通知を更新しました'
        });
    }
    catch (error) {
        console.error('求職者通知更新エラー:', error);
        res.status(500).json({
            success: false,
            error: '求職者通知の更新に失敗しました'
        });
    }
});
// 管理者用：スポット通知の削除
router.delete('/admin/spot/:notificationId', authenticate, async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: '管理者権限が必要です'
            });
        }
        const { notificationId } = req.params;
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: '通知IDが必要です'
            });
        }
        // スポット通知履歴をデータベースから削除
        await deleteSpotNotificationHistory(notificationId);
        // 求職者側の通知も削除
        await deleteUserNotificationsByHistoryId(notificationId);
        res.json({
            success: true,
            message: 'スポット通知と求職者通知を削除しました'
        });
    }
    catch (error) {
        console.error('スポット通知削除エラー:', error);
        res.status(500).json({
            success: false,
            error: 'スポット通知の削除に失敗しました'
        });
    }
});
export default router;
