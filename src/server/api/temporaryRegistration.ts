import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';

const router = express.Router();

// 仮登録API
router.post('/temporary', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // バリデーション
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレス、姓、名は必須です。' 
      });
    }

    // メール形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '有効なメールアドレスを入力してください。' 
      });
    }

    // 既存ユーザーチェック（activeなユーザーのみ）
    console.log('Checking existing active user for email:', email);
    const existingUser = await query(
      'SELECT id, status FROM users WHERE email = $1 AND status = $2',
      [email, 'active']
    );
    console.log('Existing active user query result:', existingUser.rows);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'このメールアドレスは既に登録されています。' 
      });
    }

    // 削除されたユーザーの関連データをクリーンアップ
    console.log('削除されたユーザーの関連データをクリーンアップ');
    const deletedUser = await query(
      'SELECT id FROM users WHERE email = $1 AND status != $2',
      [email, 'active']
    );
    
    if (deletedUser.rows.length > 0) {
      console.log('削除されたユーザーを発見、関連データをクリーンアップ:', deletedUser.rows[0].id);
      // 削除されたユーザーの関連データを完全にクリーンアップ
      await query('DELETE FROM user_documents WHERE user_id = $1', [deletedUser.rows[0].id]);
      await query('DELETE FROM job_seekers WHERE user_id = $1', [deletedUser.rows[0].id]);
      await query('DELETE FROM user_status_history WHERE user_id = $1', [deletedUser.rows[0].id]);
      await query('DELETE FROM users WHERE id = $1', [deletedUser.rows[0].id]);
      console.log('削除されたユーザーの関連データをクリーンアップ完了');
    }

    // 期限切れデータの自動クリーンアップ
    console.log('期限切れデータのクリーンアップ実行');
    await query(
      'DELETE FROM temporary_registrations WHERE expires_at < NOW() AND status != $1',
      ['completed']
    );

    // 既存の仮登録チェック
    console.log('仮登録チェック - メールアドレス:', email);
    const existingTemp = await query(
      'SELECT id, status, created_at FROM temporary_registrations WHERE email = $1 AND status != $2',
      [email, 'completed']
    );
    console.log('既存仮登録チェック結果:', existingTemp.rows);

    if (existingTemp.rows.length > 0) {
      console.log('仮登録ブロック - 既存データあり:', existingTemp.rows[0]);
      return res.status(400).json({ 
        success: false, 
        message: 'このメールアドレスは既に仮登録中です。1時間後に再度お試しください。' 
      });
    }

    // レート制限チェック（同一IPからの連続リクエスト制限）
    const clientIP = req.ip || req.connection.remoteAddress;
    const recentRequests = await query(
      'SELECT COUNT(*) FROM temporary_registrations WHERE created_at > NOW() - INTERVAL \'1 minute\' AND status != $1',
      ['completed']
    );

    if (parseInt(recentRequests.rows[0].count) >= 3) {
      return res.status(429).json({ 
        success: false, 
        message: 'リクエストが多すぎます。1分後に再度お試しください。' 
      });
    }

    // 仮登録トークン生成
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // 仮登録データ保存
    await query(
      `INSERT INTO temporary_registrations 
       (email, first_name, last_name, verification_token, expires_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [email, firstName, lastName, verificationToken, expiresAt]
    );

    // 確認メール送信
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://justjoin.jp'}/register/verify/${verificationToken}`;
    
    await emailService.sendTemporaryRegistrationConfirmation(email, firstName, lastName, verificationUrl);

    res.json({ 
      success: true, 
      message: '仮登録が完了しました。メールをご確認ください。' 
    });

  } catch (error) {
    console.error('仮登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '仮登録中にエラーが発生しました。' 
    });
  }
});

// 仮登録確認・書類入力画面表示API
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // 仮登録データ取得（pending または documents_completed を許可）
    const tempReg = await query(
      `SELECT * FROM temporary_registrations 
       WHERE verification_token = $1 AND expires_at > NOW() AND status IN ($2, $3)`,
      [token, 'pending', 'documents_completed']
    );

    if (tempReg.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '無効なトークンまたは期限切れです。' 
      });
    }

    const registration = tempReg.rows[0];

    // 保存済み書類データを展開
    const documentsData = registration.documents_data ? JSON.parse(registration.documents_data) : null;

    res.json({ 
      success: true, 
      data: {
        id: registration.id,
        email: registration.email,
        firstName: registration.first_name,
        lastName: registration.last_name,
        token: registration.verification_token,
        documentsData
      }
    });

  } catch (error) {
    console.error('仮登録確認エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '仮登録確認中にエラーが発生しました。' 
    });
  }
});

// 書類入力保存API
router.post('/documents/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const documentsData = req.body;

    // 仮登録データ取得
    const tempReg = await query(
      `SELECT * FROM temporary_registrations 
       WHERE verification_token = $1 AND expires_at > NOW() AND status = $2`,
      [token, 'pending']
    );

    if (tempReg.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '無効なトークンまたは期限切れです。' 
      });
    }

    // 必須項目チェック（既存のDocumentGeneratorと同じバリデーション）
    const requiredFields = [
      'resume.basicInfo.firstName',
      'resume.basicInfo.lastName',
      'resume.basicInfo.email',
      'resume.basicInfo.phone',
      'resume.basicInfo.dateOfBirth',
      'resume.basicInfo.address',
      'skillSheet.skills'
    ];

    const missingFields = [];
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], documentsData);
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missingFields.push(field);
      }
    }

    // 学歴、職歴、資格のチェック（ない場合はチェックボックスで完了とみなす）
    if (!documentsData.resume?.noEducation && (!documentsData.resume?.education || documentsData.resume.education.length === 0)) {
      missingFields.push('resume.education');
    }
    if (!documentsData.resume?.noWorkExperience && (!documentsData.resume?.workExperience || documentsData.resume.workExperience.length === 0)) {
      missingFields.push('resume.workExperience');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '必須項目が未入力です。',
        missingFields 
      });
    }

    // 書類データ保存
    await query(
      `UPDATE temporary_registrations 
       SET documents_data = $1, status = $2, updated_at = NOW() 
       WHERE verification_token = $3`,
      [JSON.stringify(documentsData), 'documents_completed', token]
    );

    res.json({ 
      success: true, 
      message: '書類入力が完了しました。パスワードを設定してください。' 
    });

  } catch (error) {
    console.error('書類入力保存エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '書類入力保存中にエラーが発生しました。' 
    });
  }
});

// 書類データ更新API（"次へ"ボタン押下時）
router.post('/update-documents/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { documentsData } = req.body;

    if (!documentsData) {
      return res.status(400).json({ 
        success: false, 
        message: '書類データが必要です' 
      });
    }

    // 仮登録データの存在確認
    const tempReg = await query(
      `SELECT * FROM temporary_registrations 
       WHERE verification_token = $1 AND expires_at > NOW() AND status IN ($2, $3)`,
      [token, 'pending', 'documents_completed']
    );

    if (tempReg.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '無効なトークンまたは期限切れです。' 
      });
    }

    // 書類データを更新
    await query(
      `UPDATE temporary_registrations 
       SET documents_data = $1, status = $2, updated_at = NOW() 
       WHERE verification_token = $3`,
      [JSON.stringify(documentsData), 'documents_completed', token]
    );

    res.json({ 
      success: true, 
      message: '書類データが更新されました。' 
    });

  } catch (error) {
    console.error('書類データ更新エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '書類データ更新中にエラーが発生しました。' 
    });
  }
});

// パスワード設定・本登録完了API
router.post('/complete/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // データベース接続テスト
    try {
      const testQuery = await query('SELECT 1 as test');
      console.log('データベース接続テスト成功:', testQuery.rows[0]);
      
      // テーブル存在確認
      const tableCheck = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('job_seeker_status_history', 'users', 'job_seekers')
        ORDER BY table_name
      `);
      console.log('利用可能なテーブル:', tableCheck.rows.map(row => row.table_name));
      
    } catch (dbError) {
      console.error('データベース接続テスト失敗:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'データベース接続エラー: ' + dbError.message 
      });
    }

    // バリデーション
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'パスワードは8文字以上で入力してください。' 
      });
    }

    // 英数字混合チェック
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'パスワードは英数字混合で入力してください。' 
      });
    }

    // 仮登録データ取得
    const tempReg = await query(
      `SELECT * FROM temporary_registrations 
       WHERE verification_token = $1 AND expires_at > NOW() AND status = $2`,
      [token, 'documents_completed']
    );

    if (tempReg.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '無効なトークンまたは書類入力が完了していません。' 
      });
    }

    const registration = tempReg.rows[0];

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // 既存のinactiveなユーザーがいるかチェック
    const existingInactiveUser = await query(
      'SELECT id FROM users WHERE email = $1 AND status = $2',
      [registration.email, 'inactive']
    );

    let userId: number;

    if (existingInactiveUser.rows.length > 0) {
      // 既存のinactiveなユーザーをactiveに更新
      userId = existingInactiveUser.rows[0].id;
      await query(
        `UPDATE users 
         SET password_hash = $1, status = $2, updated_at = NOW() 
         WHERE id = $3`,
        [passwordHash, 'active', userId]
      );

      // 退会履歴を記録
      await query(
        `INSERT INTO user_status_history (user_id, previous_status, new_status, reason, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'inactive', 'active', '仮登録システムによる再登録', userId]
      );
    } else {
      // 新規ユーザー作成
      const userResult = await query(
        `INSERT INTO users (email, password_hash, user_type, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
        [registration.email, passwordHash, 'job_seeker']
      );
      userId = userResult.rows[0].id;
    }

    // 求職者詳細情報作成
    await query(
      `INSERT INTO job_seekers (user_id, first_name, last_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, registration.first_name, registration.last_name]
    );

    // 求職者ステータスを'active'で初期化
    try {
      await query(
        `INSERT INTO job_seeker_status_history (user_id, status, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, 'active']
      );
      console.log('求職者ステータス初期化成功:', userId);
    } catch (statusError) {
      console.error('求職者ステータス初期化エラー:', statusError);
      // ステータス初期化に失敗しても処理を継続
      console.log('ステータス初期化をスキップして処理を継続');
    }

    // 仮登録で入力された書類データをuser_documentsテーブルに移行
    if (registration.documents_data) {
      try {
        const documentsData = JSON.parse(registration.documents_data);
        
        // 基本情報をuser_documentsに保存
        if (documentsData.resume?.basicInfo) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'basic_info', JSON.stringify(documentsData.resume.basicInfo)]
          );
        }

        // 履歴書データをuser_documentsに保存
        if (documentsData.resume) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'resume', JSON.stringify(documentsData.resume)]
          );
        }

        // 職務経歴書データをuser_documentsに保存
        if (documentsData.workHistory) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'work_history', JSON.stringify(documentsData.workHistory)]
          );
        }

        // スキルシートデータをuser_documentsに保存
        if (documentsData.skillSheet) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'skill_sheet', JSON.stringify(documentsData.skillSheet)]
          );
        }

        // その他の書類データも保存
        if (documentsData.certificateStatus) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'certificate_status', JSON.stringify(documentsData.certificateStatus)]
          );
        }

        if (documentsData.whyJapan) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'why_japan', JSON.stringify({ whyJapan: documentsData.whyJapan })]
          );
        }

        if (documentsData.whyInterestJapan) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'why_interest_japan', JSON.stringify({ whyInterestJapan: documentsData.whyInterestJapan })]
          );
        }

        if (documentsData.selfIntroduction) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'self_introduction', JSON.stringify({ selfIntroduction: documentsData.selfIntroduction })]
          );
        }

        if (documentsData.spouse !== undefined) {
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId, 'spouse_info', JSON.stringify({ spouse: documentsData.spouse, spouseSupport: documentsData.spouseSupport })]
          );
        }

        console.log('書類データ移行完了:', userId);
      } catch (documentsError) {
        console.error('書類データ移行エラー:', documentsError);
        // 書類データ移行に失敗しても処理を継続
        console.log('書類データ移行をスキップして処理を継続');
      }
    }

    // 仮登録完了
    await query(
      `UPDATE temporary_registrations 
       SET status = $1, password_hash = $2, updated_at = NOW() 
       WHERE verification_token = $3`,
      ['completed', passwordHash, token]
    );

    res.json({ 
      success: true, 
      message: '登録が完了しました。',
      data: {
        userId,
        email: registration.email,
        firstName: registration.first_name,
        lastName: registration.last_name
      }
    });

  } catch (error) {
    console.error('本登録完了エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '本登録完了中にエラーが発生しました。' 
    });
  }
});

export default router; 