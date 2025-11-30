import { query } from '../src/integrations/postgres/client.js';

async function updateJobSeekersFromDocuments() {
  try {
    console.log('書類データから求職者情報を更新開始...');
    
    // 書類データを取得
    const documentsResult = await query(`
      SELECT user_id, document_data, created_at 
      FROM user_documents 
      WHERE document_type = 'all'
      ORDER BY created_at DESC
    `);
    
    console.log(`書類データ: ${documentsResult.rows.length}件`);
    
    for (const doc of documentsResult.rows) {
      try {
        const documentData = doc.document_data;
        
        if (!documentData || !documentData.basicInfo) {
          console.log(`ユーザーID ${doc.user_id}: 書類データが不完全`);
          continue;
        }
        
        // 書類データから求職者情報を抽出
        const basicInfo = documentData.basicInfo;
        const additionalInfo = documentData.additionalInfo || {};
        
        // 求職者情報を更新
        const updateResult = await query(`
          UPDATE job_seekers 
          SET 
            full_name = $1,
            spouse = $2,
            spouse_support = $3,
            commuting_time = $4,
            family_number = $5,
            updated_at = NOW()
          WHERE user_id = $6
        `, [
          `${basicInfo.lastName} ${basicInfo.firstName}`,
          additionalInfo.spouse || null,
          additionalInfo.spouseSupport || null,
          additionalInfo.commutingTime || null,
          additionalInfo.familyNumber || null,
          doc.user_id
        ]);
        
        if (updateResult.rowCount > 0) {
          console.log(`ユーザーID ${doc.user_id}: 求職者情報を更新しました`);
        } else {
          console.log(`ユーザーID ${doc.user_id}: 求職者が見つかりません`);
        }
        
      } catch (error) {
        console.error(`ユーザーID ${doc.user_id} の更新エラー:`, error);
      }
    }
    
    console.log('書類データからの求職者情報更新完了');
    
  } catch (error) {
    console.error('更新エラー:', error);
  }
}

updateJobSeekersFromDocuments(); 