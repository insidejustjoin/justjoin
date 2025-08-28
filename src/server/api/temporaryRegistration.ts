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

    // 既存ユーザーチェック
    console.log('Checking existing user for email:', email);
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    console.log('Existing user query result:', existingUser.rows);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'このメールアドレスは既に登録されています。' 
      });
    }

    // 既存の仮登録チェック
    const existingTemp = await query(
      'SELECT id FROM temporary_registrations WHERE email = $1 AND status != $2',
      [email, 'completed']
    );

    if (existingTemp.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'このメールアドレスは既に仮登録中です。30分後に再度お試しください。' 
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
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分後

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

    const registration = tempReg.rows[0];

    res.json({ 
      success: true, 
      data: {
        id: registration.id,
        email: registration.email,
        firstName: registration.first_name,
        lastName: registration.last_name,
        token: registration.verification_token
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

// パスワード設定・本登録完了API
router.post('/complete/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

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

    // ユーザー作成
    const userResult = await query(
      `INSERT INTO users (email, password_hash, role, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [registration.email, passwordHash, 'jobseeker']
    );

    const userId = userResult.rows[0].id;

    // 求職者詳細情報作成
    await query(
      `INSERT INTO job_seekers (user_id, first_name, last_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, registration.first_name, registration.last_name]
    );

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