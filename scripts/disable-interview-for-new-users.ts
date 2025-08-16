import { Pool } from 'pg';

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:justjoin2024@localhost:5432/justjoin',
});

async function disableInterviewForNewUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 面接システムが有効になっている求職者を確認中...');
    
    // 面接システムが有効になっている求職者を確認
    const checkResult = await client.query(`
      SELECT 
        js.id,
        js.full_name,
        js.interview_enabled,
        js.created_at
      FROM job_seekers js
      WHERE js.interview_enabled = true
      ORDER BY js.created_at DESC
    `);
    
    console.log(`📊 面接システムが有効な求職者数: ${checkResult.rows.length}`);
    
    if (checkResult.rows.length > 0) {
      console.log('📋 面接システムが有効な求職者一覧:');
      checkResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.full_name} (ID: ${row.id}) - 作成日: ${row.created_at}`);
      });
      
      console.log('\n🔄 面接システムを無効にしています...');
      
      // 面接システムを無効にする
      const updateResult = await client.query(`
        UPDATE job_seekers 
        SET interview_enabled = false 
        WHERE interview_enabled = true
      `);
      
      console.log(`✅ ${updateResult.rowCount}件の求職者の面接システムを無効にしました`);
      
      // 更新後の確認
      const verifyResult = await client.query(`
        SELECT 
          js.id,
          js.full_name,
          js.interview_enabled,
          js.created_at
        FROM job_seekers js
        ORDER BY js.created_at DESC
        LIMIT 10
      `);
      
      console.log('\n📋 更新後の求職者一覧（最新10件）:');
      verifyResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.full_name} (ID: ${row.id}) - 面接: ${row.interview_enabled ? '有効' : '無効'} - 作成日: ${row.created_at}`);
      });
      
    } else {
      console.log('✅ 面接システムが有効な求職者は見つかりませんでした');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// スクリプト実行
disableInterviewForNewUsers().catch(console.error); 