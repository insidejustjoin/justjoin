import { Pool } from 'pg';

async function sendExistingUserNotifications() {
  try {
    console.log('既存ユーザーへの通知送信中...');

    const pool = new Pool({
      connectionString: 'postgresql://postgres:justjoin2024@localhost:5433/justjoin',
      ssl: false
    });

    const client = await pool.connect();

    try {
      // 登録済みの求職者を取得
      const registeredUsers = await client.query(`
        SELECT id, email FROM users 
        WHERE user_type = 'job_seeker' 
        AND status = 'active'
      `);

      console.log(`登録済み求職者数: ${registeredUsers.rows.length}人`);

      // 登録完了通知を送信
      for (const user of registeredUsers.rows) {
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, $2, $3, $4)
        `, [
          user.id,
          '登録完了のお知らせ',
          'JustJoinへのご登録ありがとうございます！プロフィールの入力を完了して、次のステップに進みましょう。',
          'success'
        ]);
      }

      // 資料入力率100%のユーザーを特定（job_seekersテーブルの情報から推測）
      const completedUsers = await client.query(`
        SELECT u.id, u.email 
        FROM users u
        JOIN job_seekers js ON u.id = js.user_id
        WHERE u.user_type = 'job_seeker' 
        AND u.status = 'active'
        AND js.first_name IS NOT NULL 
        AND js.last_name IS NOT NULL
        AND js.phone IS NOT NULL
      `);

      console.log(`資料入力完了ユーザー数: ${completedUsers.rows.length}人`);

      // 資料入力完了通知を送信
      for (const user of completedUsers.rows) {
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, $2, $3, $4)
        `, [
          user.id,
          '資料入力完了のお知らせ',
          'おめでとうございます！資料入力が100%完了しました。AI面接を受験して次のステップに進みましょう。',
          'success'
        ]);
      }

      // ワークフロー通知履歴を更新
      await client.query(`
        UPDATE workflow_notification_history 
        SET total_sent_count = total_sent_count + $1, last_sent_at = NOW()
        WHERE name = '登録完了通知'
      `, [registeredUsers.rows.length]);

      await client.query(`
        UPDATE workflow_notification_history 
        SET total_sent_count = total_sent_count + $1, last_sent_at = NOW()
        WHERE name = '資料入力完了通知'
      `, [completedUsers.rows.length]);

      console.log('既存ユーザーへの通知送信が完了しました');

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('既存ユーザー通知送信エラー:', error);
  }
}

sendExistingUserNotifications(); 