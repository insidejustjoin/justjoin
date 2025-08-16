import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
// 通知履歴テーブルを作成
export async function createNotificationHistoryTables() {
    const client = await pool.connect();
    try {
        // 通知テーブル
        await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `);
        // スポット通知履歴テーブル
        await client.query(`
      CREATE TABLE IF NOT EXISTS spot_notification_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        target_users VARCHAR(20) NOT NULL CHECK (target_users IN ('all', 'selected', 'filtered')),
        selected_user_ids UUID[],
        notification_ids UUID[],
        status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent')),
        recipient_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        sent_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_spot_notification_created_at ON spot_notification_history(created_at);
    `);
        // ワークフロー通知履歴テーブル
        await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_notification_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        last_sent_at TIMESTAMP,
        total_sent_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_workflow_notification_created_at ON workflow_notification_history(created_at);
    `);
        console.log('通知履歴テーブルが作成されました');
    }
    catch (error) {
        console.error('通知履歴テーブル作成エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 通知を作成
export async function createNotification(data) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.user_id, data.title, data.message, data.type || 'info']);
        return result.rows[0];
    }
    catch (error) {
        console.error('通知作成エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// ユーザーの通知一覧を取得
export async function getNotificationsByUserId(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
        return result.rows;
    }
    catch (error) {
        console.error('通知取得エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 未読通知数を取得
export async function getUnreadNotificationCount(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);
        return parseInt(result.rows[0].count);
    }
    catch (error) {
        console.error('未読通知数取得エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 通知を既読にする
export async function markNotificationAsRead(notificationId) {
    const client = await pool.connect();
    try {
        await client.query(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE id = $1
    `, [notificationId]);
    }
    catch (error) {
        console.error('通知既読化エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// すべての通知を既読にする
export async function markAllNotificationsAsRead(userId) {
    const client = await pool.connect();
    try {
        await client.query(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);
    }
    catch (error) {
        console.error('全通知既読化エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 通知を削除
export async function deleteNotification(notificationId) {
    const client = await pool.connect();
    try {
        await client.query(`
      DELETE FROM notifications 
      WHERE id = $1
    `, [notificationId]);
    }
    catch (error) {
        console.error('通知削除エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 管理者用：すべての通知を取得
export async function getAllNotifications() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT n.*, u.email as user_email 
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);
        return result.rows;
    }
    catch (error) {
        console.error('全通知取得エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 管理者用：特定のユーザーに通知を送信
export async function sendNotificationToUser(userId, title, message, type = 'info') {
    return createNotification({
        user_id: userId,
        title,
        message,
        type
    });
}
// 管理者用：全ユーザーに通知を送信
export async function sendNotificationToAllUsers(title, message, type = 'info') {
    const client = await pool.connect();
    try {
        // すべてのユーザーIDを取得
        const usersResult = await client.query(`
      SELECT id FROM users WHERE user_type = 'job_seeker'
    `);
        // 各ユーザーに通知を作成
        for (const user of usersResult.rows) {
            await createNotification({
                user_id: user.id,
                title,
                message,
                type
            });
        }
    }
    catch (error) {
        console.error('全ユーザー通知送信エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 自動通知：プロフィール完成度100%の通知
export async function sendProfileCompletionNotification(userId, userName) {
    await createNotification({
        user_id: userId,
        title: 'プロフィール完成！ / Profile Complete!',
        message: `${userName}様、プロフィールが100%完成しました！書類作成を開始できます。\n${userName}, your profile is 100% complete! You can now start creating documents.`,
        type: 'success'
    });
}
// 自動通知：書類作成100%の通知
export async function sendDocumentCompletionNotification(userId, userName) {
    await createNotification({
        user_id: userId,
        title: '書類作成完了！ / Documents Complete!',
        message: `${userName}様、書類作成が100%完成しました！AI面接を受験できます。\n${userName}, your documents are 100% complete! You can now take the AI interview.`,
        type: 'success'
    });
}
// スポット通知履歴を保存
export async function saveSpotNotificationHistory(data) {
    const client = await pool.connect();
    try {
        await client.query(`
      INSERT INTO spot_notification_history (title, message, type, target_users, selected_user_ids, notification_ids, recipient_count, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [data.title, data.message, data.type, data.targetUsers, data.selectedUserIds || null, data.notificationIds || null, data.recipientCount]);
    }
    catch (error) {
        console.error('スポット通知履歴保存エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// スポット通知履歴を取得
export async function getSpotNotificationHistory() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT * FROM spot_notification_history 
      ORDER BY created_at DESC
    `);
        return result.rows;
    }
    catch (error) {
        console.error('スポット通知履歴取得エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// ワークフロー通知履歴を保存
export async function saveWorkflowNotificationHistory(data) {
    const client = await pool.connect();
    try {
        await client.query(`
      INSERT INTO workflow_notification_history (name, description, trigger, enabled, title, message, type, last_sent_at, total_sent_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        last_sent_at = EXCLUDED.last_sent_at,
        total_sent_count = EXCLUDED.total_sent_count,
        updated_at = NOW()
    `, [data.name, data.description, data.trigger, data.enabled, data.title, data.message, data.type, data.lastSentAt, data.totalSentCount]);
    }
    catch (error) {
        console.error('ワークフロー通知履歴保存エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// ワークフロー通知履歴を取得
export async function getWorkflowNotificationHistory() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT * FROM workflow_notification_history 
      ORDER BY created_at DESC
    `);
        return result.rows;
    }
    catch (error) {
        console.error('ワークフロー通知履歴取得エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// スポット通知履歴を削除
export async function deleteSpotNotificationHistory(notificationId) {
    const client = await pool.connect();
    try {
        await client.query(`
      DELETE FROM spot_notification_history WHERE id = $1
    `, [notificationId]);
    }
    catch (error) {
        console.error('スポット通知履歴削除エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// スポット通知履歴を更新
export async function updateSpotNotificationHistory(notificationId, data) {
    const client = await pool.connect();
    try {
        await client.query(`
      UPDATE spot_notification_history 
      SET title = $1, message = $2, type = $3, updated_at = NOW()
      WHERE id = $4
    `, [data.title, data.message, data.type, notificationId]);
    }
    catch (error) {
        console.error('スポット通知履歴更新エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 履歴IDに基づいて求職者の通知を更新
export async function updateUserNotificationsByHistoryId(historyId, data) {
    const client = await pool.connect();
    try {
        // 履歴から通知IDを取得して通知を更新
        const historyResult = await client.query(`
      SELECT notification_ids FROM spot_notification_history WHERE id = $1
    `, [historyId]);
        if (historyResult.rows.length > 0 && historyResult.rows[0].notification_ids) {
            const notificationIds = historyResult.rows[0].notification_ids;
            await client.query(`
        UPDATE notifications 
        SET title = $1, message = $2, type = $3, updated_at = NOW()
        WHERE id = ANY($4)
      `, [data.title, data.message, data.type, notificationIds]);
        }
    }
    catch (error) {
        console.error('求職者通知更新エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// 履歴IDに基づいて求職者の通知を削除
export async function deleteUserNotificationsByHistoryId(historyId) {
    const client = await pool.connect();
    try {
        // 履歴から通知IDを取得して通知を削除
        const historyResult = await client.query(`
      SELECT notification_ids FROM spot_notification_history WHERE id = $1
    `, [historyId]);
        if (historyResult.rows.length > 0 && historyResult.rows[0].notification_ids) {
            const notificationIds = historyResult.rows[0].notification_ids;
            await client.query(`
        DELETE FROM notifications 
        WHERE id = ANY($1)
      `, [notificationIds]);
        }
    }
    catch (error) {
        console.error('求職者通知削除エラー:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
