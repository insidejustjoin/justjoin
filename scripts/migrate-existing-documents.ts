import { query } from '../src/integrations/postgres/client.js';

async function migrateExistingDocuments() {
  try {
    console.log('既存ユーザーの書類データ移行を開始します...');

    // 本登録完了済みで、書類データがtemporary_registrationsに残っているユーザーを取得
    const result = await query(`
      SELECT tr.email, tr.documents_data, u.id as user_id, js.first_name, js.last_name
      FROM temporary_registrations tr
      JOIN users u ON u.email = tr.email
      JOIN job_seekers js ON js.user_id = u.id
      WHERE tr.status = 'completed' 
        AND tr.documents_data IS NOT NULL
        AND u.status = 'active'
    `);

    console.log(`移行対象ユーザー数: ${result.rows.length}`);

    for (const row of result.rows) {
      try {
        const { email, documents_data, user_id, first_name, last_name } = row;
        console.log(`\nユーザー ${first_name} ${last_name} (${email}) の書類データを移行中...`);

        const documentsData = JSON.parse(documents_data);

        // 既存のuser_documentsをチェック
        const existingDocs = await query(
          'SELECT document_type FROM user_documents WHERE user_id = $1',
          [user_id]
        );

        const existingTypes = existingDocs.rows.map(doc => doc.document_type);
        console.log('既存の書類タイプ:', existingTypes);

        // 基本情報をuser_documentsに保存
        if (documentsData.resume?.basicInfo && !existingTypes.includes('basic_info')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'basic_info', JSON.stringify(documentsData.resume.basicInfo)]
          );
          console.log('✅ 基本情報を移行しました');
        }

        // 履歴書データをuser_documentsに保存
        if (documentsData.resume && !existingTypes.includes('resume')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'resume', JSON.stringify(documentsData.resume)]
          );
          console.log('✅ 履歴書データを移行しました');
        }

        // 職務経歴書データをuser_documentsに保存
        if (documentsData.workHistory && !existingTypes.includes('work_history')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'work_history', JSON.stringify(documentsData.workHistory)]
          );
          console.log('✅ 職務経歴書データを移行しました');
        }

        // スキルシートデータをuser_documentsに保存
        if (documentsData.skillSheet && !existingTypes.includes('skill_sheet')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'skill_sheet', JSON.stringify(documentsData.skillSheet)]
          );
          console.log('✅ スキルシートデータを移行しました');
        }

        // その他の書類データも保存
        if (documentsData.certificateStatus && !existingTypes.includes('certificate_status')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'certificate_status', JSON.stringify(documentsData.certificateStatus)]
          );
          console.log('✅ 資格情報を移行しました');
        }

        if (documentsData.whyJapan && !existingTypes.includes('why_japan')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'why_japan', JSON.stringify({ whyJapan: documentsData.whyJapan })]
          );
          console.log('✅ 日本に来た理由を移行しました');
        }

        if (documentsData.whyInterestJapan && !existingTypes.includes('why_interest_japan')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'why_interest_japan', JSON.stringify({ whyInterestJapan: documentsData.whyInterestJapan })]
          );
          console.log('✅ 日本に興味を持った理由を移行しました');
        }

        if (documentsData.selfIntroduction && !existingTypes.includes('self_introduction')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'self_introduction', JSON.stringify({ selfIntroduction: documentsData.selfIntroduction })]
          );
          console.log('✅ 自己紹介を移行しました');
        }

        if (documentsData.spouse !== undefined && !existingTypes.includes('spouse_info')) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [user_id, 'spouse_info', JSON.stringify({ spouse: documentsData.spouse, spouseSupport: documentsData.spouseSupport })]
          );
          console.log('✅ 配偶者情報を移行しました');
        }

        console.log(`✅ ユーザー ${first_name} ${last_name} の書類データ移行が完了しました`);

      } catch (userError) {
        console.error(`❌ ユーザー ${row.email} の書類データ移行に失敗:`, userError);
      }
    }

    console.log('\n🎉 書類データ移行が完了しました！');

  } catch (error) {
    console.error('書類データ移行エラー:', error);
  } finally {
    process.exit(0);
  }
}

migrateExistingDocuments(); 