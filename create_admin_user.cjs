const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:justjoin2024@34.84.123.45:5432/justjoin_enterprise'
});

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // 管理者ユーザーを作成
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, user_type, status) VALUES ($1, $2, $3, $4) RETURNING id',
      ['admin@justjoin.jp', hashedPassword, 'admin', 'active']
    );
    
    console.log('管理者ユーザーを作成しました:', result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      console.log('管理者ユーザーは既に存在します');
    } else {
      console.error('エラー:', error);
    }
  } finally {
    await pool.end();
  }
}

createAdminUser();
