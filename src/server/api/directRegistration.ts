import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';

const router = express.Router();

// 既存ユーザーチェックAPI
router.post('/check', async (req, res) => {
  try {
    const { email, firstName, lastName, recaptchaToken } = req.body;

    // reCAPTCHA 検証（RECAPTCHA_SECRET_KEY が設定されている場合のみ有効化）
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'reCAPTCHA 検証が必要です' 
        });
      }
      try {
        const params = new URLSearchParams();
        params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
        params.append('response', recaptchaToken);
        if (req.ip) params.append('remoteip', req.ip);
        const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const verifyJson = await verifyResp.json();
        if (!verifyJson.success) {
          return res.status(403).json({ 
            success: false, 
            message: 'reCAPTCHA 検証に失敗しました' 
          });
        }
        // reCAPTCHA v3スコアチェック（0.0〜1.0、通常0.5以上で合格）
        if (verifyJson.score !== undefined && verifyJson.score < 0.5) {
          console.warn(`reCAPTCHA v3スコアが低い: ${verifyJson.score}`);
          return res.status(403).json({ 
            success: false, 
            message: 'reCAPTCHA 検証に失敗しました（スコア不足）' 
          });
        }
      } catch (e) {
        console.error('reCAPTCHA 検証エラー:', e);
        return res.status(500).json({ 
          success: false, 
          message: 'reCAPTCHA 検証エラー' 
        });
      }
    }

    // バリデーション
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレス、姓、名は必須です。' 
      });
    }

    // 既存ユーザーチェック（job_seekersテーブルに対応するレコードがあるかもチェック）
    const existingUser = await query(
      `SELECT 
        u.id, 
        u.email, 
        u.status,
        js.id as jobseeker_id
       FROM users u
       LEFT JOIN job_seekers js ON js.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      // job_seekersテーブルに対応するレコードがある場合のみ「既に登録されています」と表示
      if (user.jobseeker_id) {
        return res.json({
          success: true,
          exists: true,
          message: 'このメールアドレスは既に登録されています。',
          user: {
            id: user.id,
            email: user.email,
            status: user.status
          }
        });
      } else {
        // usersテーブルには存在するが、job_seekersテーブルに対応するレコードがない場合
        // （不完全な登録データなど）は新規登録として扱う
        console.warn(`ユーザー${user.id}（${email}）はusersテーブルに存在しますが、job_seekersテーブルに対応するレコードがありません。新規登録として処理します。`);
      }
    }

    res.json({
      success: true,
      exists: false,
      message: '新規ユーザーです。'
    });
  } catch (error) {
    console.error('ユーザーチェックエラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'ユーザーチェック中にエラーが発生しました。' 
    });
  }
});

// エンジニア向け本登録API
router.post('/engineer', async (req, res) => {
    try {
    const { email, firstName, lastName, password, documentsData, recaptchaToken } = req.body;

    // reCAPTCHA 検証（RECAPTCHA_SECRET_KEY が設定されている場合のみ有効化）
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'reCAPTCHA 検証が必要です' 
        });
      }
      try {
        const params = new URLSearchParams();
        params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
        params.append('response', recaptchaToken);
        if (req.ip) params.append('remoteip', req.ip);
        const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const verifyJson = await verifyResp.json();
        if (!verifyJson.success) {
          return res.status(403).json({ 
            success: false, 
            message: 'reCAPTCHA 検証に失敗しました' 
          });
        }
        // reCAPTCHA v3スコアチェック（0.0〜1.0、通常0.5以上で合格）
        if (verifyJson.score !== undefined && verifyJson.score < 0.5) {
          console.warn(`reCAPTCHA v3スコアが低い: ${verifyJson.score}`);
          return res.status(403).json({ 
            success: false, 
            message: 'reCAPTCHA 検証に失敗しました（スコア不足）' 
          });
        }
      } catch (e) {
        console.error('reCAPTCHA 検証エラー:', e);
        return res.status(500).json({ 
          success: false, 
          message: 'reCAPTCHA 検証エラー' 
        });
      }
    }

    // バリデーション
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレス、姓、名、パスワードは必須です。' 
      });
    }

    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'パスワードは8文字以上で、英数字を含む必要があります。' 
      });
    }

    // 既存ユーザーチェック（同じメールアドレスで最大2つまで登録可能：エンジニアと一般職）
    const existingUser = await query(
      `SELECT 
        u.id, 
        js.id as jobseeker_id,
        js.registration_type
       FROM users u
       LEFT JOIN job_seekers js ON js.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      // 同じregistration_type（エンジニア）が既に存在する場合はエラー
      const existingRegistrations = existingUser.rows.filter((row: any) => row.jobseeker_id && row.registration_type === 'engineer');
      if (existingRegistrations.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'このメールアドレスでエンジニア登録は既に完了しています。' 
        });
      }
      // usersテーブルにのみ存在する場合、または一般職登録のみの場合は、既存のuser_idを再利用
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // トランザクション開始
    await query('BEGIN');

    try {
      let userId: string;
      
      // 既存のusersレコードがある場合は再利用（一般職登録のみの場合も含む）
      const existingUserRecord = existingUser.rows.find((row: any) => row.id);
      if (existingUserRecord && existingUserRecord.id) {
        // 既存のusersレコードを再利用（パスワードとステータスを更新）
        userId = existingUserRecord.id;
        await query(
          `UPDATE users 
           SET password_hash = $1, user_type = $2, status = $3, updated_at = NOW() 
           WHERE id = $4`,
          [passwordHash, 'job_seeker', 'active', userId]
        );
      } else {
        // 新規ユーザー作成
        const userResult = await query(
          `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          [email, passwordHash, 'job_seeker', 'active']
        );
        userId = userResult.rows[0].id;
      }

      // 求職者情報作成（エンジニア向け）
      const jobSeekerResult = await query(
        `INSERT INTO job_seekers (
          user_id, first_name, last_name, phone, 
          date_of_birth, gender, nationality, address,
          profile_photo, registration_type, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING id`,
        [
          userId,
          firstName,
          lastName,
          documentsData?.livePhoneNumber || null,
          documentsData?.birthDate || null,
          documentsData?.gender || null,
          documentsData?.nationality || null,
          documentsData?.liveAddress || null,
          documentsData?.resume?.photoUrl || null,
          'engineer'
        ]
      );

      // 書類データ保存
      if (documentsData) {
        // 既存データをチェック
        const existingDoc = await query(
          'SELECT id FROM user_documents WHERE user_id = $1 AND document_type = $2',
          [userId.toString(), 'resume']
        );
        
        if (existingDoc.rows.length > 0) {
          // 更新
          await query(
            `UPDATE user_documents 
             SET document_data = $1, updated_at = NOW() 
             WHERE user_id = $2 AND document_type = $3`,
            [JSON.stringify(documentsData), userId.toString(), 'resume']
          );
        } else {
          // 新規作成
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId.toString(), 'resume', JSON.stringify(documentsData)]
          );
        }
      }

      // 入力率計算
      let completionRate = 0;
      if (documentsData) {
        // 簡易的な入力率計算（必須項目ベース）
        const requiredFields = [
          'lastName', 'firstName', 'liveMail', 'livePhoneNumber', 
          'birthDate', 'liveAddress', 'gender'
        ];
        const filledFields = requiredFields.filter(field => 
          documentsData[field] || (documentsData.resume && documentsData.resume[field])
        ).length;
        completionRate = Math.round((filledFields / requiredFields.length) * 100);
      }

      // completion_rateを更新
      await query(
        'UPDATE job_seekers SET completion_rate = $1 WHERE user_id = $2',
        [completionRate, userId]
      );

      await query('COMMIT');

      // JWTトークン生成
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        { 
          userId: userId, 
          email, 
          role: 'job_seeker' 
        },
        process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
        { expiresIn: '7d' }
      );

      // 登録完了メール送信（オプショナル）
      try {
        const fullName = `${lastName} ${firstName}`;
        // 簡易的な登録完了メール（後で専用メソッドを追加可能）
        console.log('登録完了メール送信（オプショナル）:', email);
      } catch (emailError) {
        console.error('メール送信エラー:', emailError);
        // メール送信失敗は登録を止めない
      }

      res.json({
        success: true,
        message: '登録が完了しました。',
        token,
        user: {
          id: userId,
          email,
          firstName,
          lastName
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('エンジニア登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '登録中にエラーが発生しました。' 
    });
  }
});

// 一般職向け本登録API
router.post('/general', async (req, res) => {
  try {
    const { email, firstName, lastName, password, documentsData, recaptchaToken } = req.body;

    // reCAPTCHA 検証（RECAPTCHA_SECRET_KEY が設定されている場合のみ有効化）
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'reCAPTCHA 検証が必要です' 
        });
      }
      try {
        const params = new URLSearchParams();
        params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
        params.append('response', recaptchaToken);
        if (req.ip) params.append('remoteip', req.ip);
        const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const verifyJson = await verifyResp.json();
        if (!verifyJson.success) {
          return res.status(403).json({ 
            success: false, 
            message: 'reCAPTCHA 検証に失敗しました' 
          });
        }
        // reCAPTCHA v3スコアチェック（0.0〜1.0、通常0.5以上で合格）
        if (verifyJson.score !== undefined && verifyJson.score < 0.5) {
          console.warn(`reCAPTCHA v3スコアが低い: ${verifyJson.score}`);
          return res.status(403).json({ 
            success: false, 
            message: 'reCAPTCHA 検証に失敗しました（スコア不足）' 
          });
        }
      } catch (e) {
        console.error('reCAPTCHA 検証エラー:', e);
        return res.status(500).json({ 
          success: false, 
          message: 'reCAPTCHA 検証エラー' 
        });
      }
    }

    // バリデーション
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレス、姓、名、パスワードは必須です。' 
      });
    }

    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'パスワードは8文字以上で、英数字を含む必要があります。' 
      });
    }

    // 既存ユーザーチェック（同じメールアドレスで最大2つまで登録可能：エンジニアと一般職）
    const existingUser = await query(
      `SELECT 
        u.id, 
        js.id as jobseeker_id,
        js.registration_type
       FROM users u
       LEFT JOIN job_seekers js ON js.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      // 同じregistration_typeが既に存在する場合はエラー
      const existingRegistrations = existingUser.rows.filter((row: any) => row.jobseeker_id && row.registration_type === 'general');
      if (existingRegistrations.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'このメールアドレスで一般職登録は既に完了しています。' 
        });
      }
      // usersテーブルにのみ存在する場合は、既存のuser_idを再利用
      // （後続の処理でINSERT INTO usersではなく、既存のuser_idを使用）
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // トランザクション開始
    await query('BEGIN');

    try {
      let userId: string;
      
      // 既存のusersレコードがある場合は再利用（一般職登録のみの場合も含む）
      const existingUserRecord = existingUser.rows.find((row: any) => row.id);
      if (existingUserRecord && existingUserRecord.id) {
        // 既存のusersレコードを再利用（パスワードとステータスを更新）
        userId = existingUserRecord.id;
        await query(
          `UPDATE users 
           SET password_hash = $1, user_type = $2, status = $3, updated_at = NOW() 
           WHERE id = $4`,
          [passwordHash, 'job_seeker', 'active', userId]
        );
      } else {
        // 新規ユーザー作成
        const userResult = await query(
          `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          [email, passwordHash, 'job_seeker', 'active']
        );
        userId = userResult.rows[0].id;
      }

      // 求職者情報作成（一般職向けはスキルシートなし）
      const jobSeekerResult = await query(
        `INSERT INTO job_seekers (
          user_id, first_name, last_name, phone, 
          date_of_birth, gender, nationality, address,
          profile_photo, registration_type, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING id`,
        [
          userId,
          firstName,
          lastName,
          documentsData?.livePhoneNumber || null,
          documentsData?.birthDate || null,
          documentsData?.gender || null,
          documentsData?.nationality || null,
          documentsData?.liveAddress || null,
          documentsData?.resume?.photoUrl || null,
          'general'
        ]
      );

      // スキルシートを除外して書類データ保存
      if (documentsData) {
        const { skillSheet, ...documentsWithoutSkillSheet } = documentsData;
        
        // 既存データをチェック
        const existingDoc = await query(
          'SELECT id FROM user_documents WHERE user_id = $1 AND document_type = $2',
          [userId.toString(), 'resume']
        );
        
        if (existingDoc.rows.length > 0) {
          // 更新
          await query(
            `UPDATE user_documents 
             SET document_data = $1, updated_at = NOW() 
             WHERE user_id = $2 AND document_type = $3`,
            [JSON.stringify(documentsWithoutSkillSheet), userId.toString(), 'resume']
          );
        } else {
          // 新規作成
          await query(
            `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userId.toString(), 'resume', JSON.stringify(documentsWithoutSkillSheet)]
          );
        }
      }

      // 入力率計算（一般職向けはスキルシートを除外）
      let completionRate = 0;
      if (documentsData) {
        const requiredFields = [
          'lastName', 'firstName', 'liveMail', 'livePhoneNumber', 
          'birthDate', 'liveAddress', 'gender'
        ];
        const filledFields = requiredFields.filter(field => 
          documentsData[field] || (documentsData.resume && documentsData.resume[field])
        ).length;
        completionRate = Math.round((filledFields / requiredFields.length) * 100);
      }

      // completion_rateを更新
      await query(
        'UPDATE job_seekers SET completion_rate = $1 WHERE user_id = $2',
        [completionRate, userId]
      );

      await query('COMMIT');

      // JWTトークン生成
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        { 
          userId: userId, 
          email, 
          role: 'job_seeker' 
        },
        process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
        { expiresIn: '7d' }
      );

      // 登録完了メール送信（オプショナル）
      try {
        const fullName = `${lastName} ${firstName}`;
        // 簡易的な登録完了メール（後で専用メソッドを追加可能）
        console.log('登録完了メール送信（オプショナル）:', email);
      } catch (emailError) {
        console.error('メール送信エラー:', emailError);
      }

      res.json({
        success: true,
        message: '登録が完了しました。',
        token,
        user: {
          id: userId,
          email,
          firstName,
          lastName
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('一般職登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '登録中にエラーが発生しました。' 
    });
  }
});

export default router;

