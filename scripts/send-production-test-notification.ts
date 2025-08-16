import { Pool } from 'pg';

async function sendProductionTestNotification() {
  try {
    console.log('本番環境にテスト通知を送信中...');

    // Cloud SQL Proxyを使用して本番環境のデータベースに接続
    const pool = new Pool({
      connectionString: 'postgresql://postgres:justjoin2024@localhost:5433/justjoin',
      ssl: false
    });

    const client = await pool.connect();

    try {
      // テスト用のスポット通知履歴を保存
      await client.query(`
        INSERT INTO spot_notification_history (title, message, type, target_users, selected_user_ids, recipient_count, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        '本番環境通知履歴テスト',
        'これは本番環境の通知履歴機能のテスト用通知です。管理者画面で履歴が表示されることを確認してください。',
        'info',
        'all',
        null,
        15
      ]);

      console.log('本番環境にテスト通知を送信しました');

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('本番環境テスト通知送信エラー:', error);
  }
}

sendProductionTestNotification(); 