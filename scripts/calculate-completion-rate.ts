import { query } from '../src/integrations/postgres/client.js';

// 完了率計算関数（サーバー側と同じロジック）
function calculateCompletionRate(documentData: any): number {
  const requiredFields = [
    // 基本情報
    documentData.lastName, documentData.firstName, 
    documentData.birthDate, documentData.gender, documentData.nationality,
    
    // 現住所情報
    documentData.livePostNumber, documentData.liveAddress, 
    documentData.livePhoneNumber, documentData.liveMail,
    
    // 履歴書
    documentData.resume?.selfPR,
    documentData.resume?.noEducation, documentData.resume?.noWorkExperience, documentData.resume?.noQualifications,
    
    // 職務経歴書
    documentData.workHistory?.noWorkHistory,
    
    // スキルシート（主要スキル）- 評価が設定されているかチェック
    documentData.skillSheet?.skills?.Windows?.evaluation && documentData.skillSheet?.skills?.Windows?.evaluation !== '-',
    documentData.skillSheet?.skills?.MacOS?.evaluation && documentData.skillSheet?.skills?.MacOS?.evaluation !== '-',
    documentData.skillSheet?.skills?.Linux?.evaluation && documentData.skillSheet?.skills?.Linux?.evaluation !== '-',
    
    // 日本語関連
    documentData.certificateStatus?.name, 
    documentData.whyJapan && documentData.whyJapan.length >= 300 ? true : false,
    documentData.whyInterestJapan && documentData.whyInterestJapan.length >= 300 ? true : false,
    
    // 追加情報
    documentData.selfIntroduction && documentData.selfIntroduction.length >= 300 ? true : false,
    documentData.spouse, documentData.spouseSupport
  ];

  const filledFields = requiredFields.filter((field: any) => {
    if (typeof field === 'string') {
      return field && field.trim() !== '';
    }
    if (typeof field === 'boolean') {
      return field === true;
    }
    if (Array.isArray(field)) {
      return field.length > 0;
    }
    return field;
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
}

async function updateCompletionRates() {
  try {
    console.log('完了率の計算と更新を開始します...');

    // すべての求職者を取得
    const result = await query(`
      SELECT u.id as user_id, u.email, js.first_name, js.last_name, js.completion_rate
      FROM users u
      JOIN job_seekers js ON js.user_id = u.id
      WHERE u.user_type = 'job_seeker' AND u.status = 'active'
      ORDER BY u.id
    `);

    console.log(`対象ユーザー数: ${result.rows.length}`);

    for (const row of result.rows) {
      try {
        const { user_id, email, first_name, last_name, completion_rate } = row;
        console.log(`\nユーザー ${first_name} ${last_name} (${email}) の完了率を計算中...`);

        // ユーザーの書類データを取得
        const documentsResult = await query(
          'SELECT document_type, document_data FROM user_documents WHERE user_id = $1',
          [user_id]
        );

        if (documentsResult.rows.length === 0) {
          console.log('  📝 書類データなし - 完了率: 0%');
          await query(
            'UPDATE job_seekers SET completion_rate = 0, updated_at = NOW() WHERE user_id = $1',
            [user_id]
          );
          continue;
        }

        // 書類データを統合
        const integratedData: any = {};
        for (const doc of documentsResult.rows) {
          try {
            const data = JSON.parse(doc.document_data);
            if (doc.document_type === 'basic_info') {
              Object.assign(integratedData, data);
            } else if (doc.document_type === 'resume') {
              integratedData.resume = data;
            } else if (doc.document_type === 'work_history') {
              integratedData.workHistory = data;
            } else if (doc.document_type === 'skill_sheet') {
              integratedData.skillSheet = data;
            } else if (doc.document_type === 'certificate_status') {
              integratedData.certificateStatus = data;
            } else if (doc.document_type === 'why_japan') {
              integratedData.whyJapan = data.whyJapan;
            } else if (doc.document_type === 'why_interest_japan') {
              integratedData.whyInterestJapan = data.whyInterestJapan;
            } else if (doc.document_type === 'self_introduction') {
              integratedData.selfIntroduction = data.selfIntroduction;
            } else if (doc.document_type === 'spouse_info') {
              integratedData.spouse = data.spouse;
              integratedData.spouseSupport = data.spouseSupport;
            }
          } catch (parseError) {
            console.log(`  ⚠️  ${doc.document_type}のパースエラー:`, parseError.message);
          }
        }

        // 完了率を計算
        const newCompletionRate = calculateCompletionRate(integratedData);
        console.log(`  📊 現在の完了率: ${completion_rate}% → 新しい完了率: ${newCompletionRate}%`);

        // 完了率を更新
        await query(
          'UPDATE job_seekers SET completion_rate = $1, updated_at = NOW() WHERE user_id = $1',
          [newCompletionRate, user_id]
        );

        console.log(`  ✅ 完了率を更新しました`);

      } catch (userError) {
        console.error(`❌ ユーザー ${row.email} の完了率計算に失敗:`, userError);
      }
    }

    console.log('\n🎉 完了率の計算と更新が完了しました！');

  } catch (error) {
    console.error('完了率更新エラー:', error);
  } finally {
    process.exit(0);
  }
}

updateCompletionRates(); 