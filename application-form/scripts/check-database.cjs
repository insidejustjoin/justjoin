const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  try {
    console.log('🔍 データベース接続テスト中...');
    
    // 接続テスト
    const client = await pool.connect();
    console.log('✅ データベース接続成功');
    
    // テーブル一覧を確認
    console.log('\n📋 テーブル一覧:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // job_seekersテーブルの構造を確認
    console.log('\n👥 job_seekersテーブル構造:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'job_seekers'
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // job_seekersテーブルのデータ数を確認
    console.log('\n📊 job_seekersテーブルのデータ数:');
    const countResult = await client.query('SELECT COUNT(*) as count FROM job_seekers');
    console.log(`  総レコード数: ${countResult.rows[0].count}`);
    
    // サンプルデータを確認
    console.log('\n📄 サンプルデータ:');
    const sampleResult = await client.query('SELECT * FROM job_seekers LIMIT 3');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  レコード ${index + 1}:`);
      console.log(`    ID: ${row.id}`);
      console.log(`    ユーザーID: ${row.user_id}`);
      console.log(`    氏名: ${row.full_name || '未設定'}`);
      console.log(`    メール: ${row.email || '未設定'}`);
      console.log(`    スキル: ${row.skills ? (typeof row.skills === 'string' ? row.skills : JSON.stringify(row.skills)) : '未設定'}`);
      console.log(`    作成日: ${row.created_at}`);
    });
    
    // usersテーブルのデータ数を確認
    console.log('\n👤 usersテーブルのデータ数:');
    const usersCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`  総ユーザー数: ${usersCountResult.rows[0].count}`);
    
    // job_seekerタイプのユーザー数を確認
    const jobSeekerCountResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE user_type = 'job_seeker'
    `);
    console.log(`  求職者ユーザー数: ${jobSeekerCountResult.rows[0].count}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ データベース確認エラー:', error);
  } finally {
    await pool.end();
  }
}

// サンプルデータを追加する関数
async function addSampleData() {
  try {
    console.log('\n➕ サンプルデータを追加中...');
    
    const client = await pool.connect();
    
    // サンプルユーザーを作成
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id
    `, ['sample@example.com', '$2b$10$dummyhash', 'job_seeker', 'active']);
    
    const userId = userResult.rows[0].id;
    console.log(`✅ サンプルユーザー作成: ${userId}`);
    
    // サンプル求職者データを作成
    const jobSeekerResult = await client.query(`
      INSERT INTO job_seekers (
        user_id, full_name, date_of_birth, gender, email, phone, address,
        desired_job_title, experience_years, skills, self_introduction,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `, [
      userId,
      'サンプル 太郎',
      '1990-01-01',
      'male',
      'sample@example.com',
      '090-1234-5678',
      '東京都渋谷区',
      'フロントエンドエンジニア',
      5,
      JSON.stringify(['React', 'TypeScript', 'JavaScript']),
      'Webアプリケーション開発の経験があります'
    ]);
    
    console.log(`✅ サンプル求職者データ作成: ${jobSeekerResult.rows[0].id}`);
    
    client.release();
    console.log('✅ サンプルデータ追加完了');
    
  } catch (error) {
    console.error('❌ サンプルデータ追加エラー:', error);
  } finally {
    await pool.end();
  }
}

// メイン実行
async function main() {
  await checkDatabase();
  
  // データが0件の場合はサンプルデータを追加
  const client = await pool.connect();
  const countResult = await client.query('SELECT COUNT(*) as count FROM job_seekers');
  client.release();
  
  if (parseInt(countResult.rows[0].count) === 0) {
    console.log('\n⚠️  job_seekersテーブルにデータがありません。サンプルデータを追加しますか？');
    console.log('    node scripts/check-database.js --add-sample-data を実行してください。');
  }
}

if (process.argv.includes('--add-sample-data')) {
  addSampleData();
} else {
  main();
} 