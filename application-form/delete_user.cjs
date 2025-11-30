const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:justjoin2024@/justjoin?host=/cloudsql/justjoin-platform:asia-northeast1:justjoin-enterprise'
});

async function deleteUser() {
  try {
    console.log('sonokenno25work@gmail.comのユーザーを削除中...');
    
    // まずユーザーIDを取得
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['sonokenno25work@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('ユーザーが見つかりません');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('ユーザーID:', userId);
    
    // 関連データを削除
    await pool.query('DELETE FROM user_documents WHERE user_id = $1', [userId]);
    console.log('user_documents削除完了');
    
    await pool.query('DELETE FROM job_seekers WHERE user_id = $1', [userId]);
    console.log('job_seekers削除完了');
    
    await pool.query('DELETE FROM user_status_history WHERE user_id = $1', [userId]);
    console.log('user_status_history削除完了');
    
    // 最後にユーザーを削除
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('users削除完了');
    
    console.log('ユーザー削除が完了しました');
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await pool.end();
  }
}

deleteUser();
