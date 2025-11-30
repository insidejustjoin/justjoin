import { Pool } from 'pg';

async function createWorkflowNotifications() {
  try {
    console.log('ワークフロー通知の初期データを作成中...');

    const pool = new Pool({
      connectionString: 'postgresql://postgres:justjoin2024@localhost:5433/justjoin',
      ssl: false
    });

    const client = await pool.connect();

    try {
      // 既存のワークフロー通知を削除
      await client.query('DELETE FROM workflow_notification_history');

      // 1. 登録完了時のワークフロー通知
      await client.query(`
        INSERT INTO workflow_notification_history (name, description, trigger, enabled, title, message, type, total_sent_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        '登録完了通知',
        '新規ユーザー登録完了時に自動送信される通知',
        'registration_complete',
        true,
        '登録ありがとうございます！',
        'JustJoinへのご登録ありがとうございます！プロフィールの入力を完了して、次のステップに進みましょう。',
        'success',
        0
      ]);

      // 2. 資料作成100%未満時のワークフロー通知
      await client.query(`
        INSERT INTO workflow_notification_history (name, description, trigger, enabled, title, message, type, total_sent_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        '資料作成未完了通知',
        '資料作成が100%に満たない時に送信される通知',
        'document_incomplete',
        true,
        '採用担当者にアピールできません！',
        '資料作成が完了していません。プロフィールを100%完成させて、採用担当者にアピールしましょう！',
        'warning',
        0
      ]);

      // 3. 資料作成100%完了時のワークフロー通知
      await client.query(`
        INSERT INTO workflow_notification_history (name, description, trigger, enabled, title, message, type, total_sent_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        '資料作成完了通知',
        '資料作成が100%になった時に自動送信される通知',
        'document_complete',
        true,
        'おめでとうございます！',
        'おめでとうございます！資料作成が100%完了しました。AI面接を受験して次のステップに進みましょう。',
        'success',
        0
      ]);

      // 4. AI面接開始時のワークフロー通知
      await client.query(`
        INSERT INTO workflow_notification_history (name, description, trigger, enabled, title, message, type, total_sent_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'AI面接開始通知',
        'AI面接が割り当てられた時に自動送信される通知',
        'ai_interview_assigned',
        true,
        'AI面接が開始しました！',
        'AI面接が開始しました！面接を受験して、採用担当者にあなたの魅力をアピールしましょう。',
        'info',
        0
      ]);

      console.log('ワークフロー通知の初期データを作成しました');

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('ワークフロー通知作成エラー:', error);
  }
}

createWorkflowNotifications(); 