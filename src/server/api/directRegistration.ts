import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';
import { validatePhoneNumber, verifyPhoneNumberExists } from '../../utils/phoneValidation.js';

const router = express.Router();

// レート制限用のストレージ（メモリベース）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// レート制限ミドルウェア
const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'リクエストが多すぎます。しばらく待ってから再度お試しください。'
      });
    }
    
    record.count++;
    next();
  };
};

// 既存ユーザーチェックAPI（電話番号ベース）
router.post('/check', rateLimit(10, 60000), async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName } = req.body;

    // バリデーション（最低限）
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: '電話番号は必須です。' });
    }

    // 電話番号の形式を検証
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ success: false, message: phoneValidation.error });
    }

    // 電話番号の実在確認（簡易版 - 形式のみ）
    const phoneVerification = await verifyPhoneNumberExists(phoneValidation.normalized!);
    if (!phoneVerification.isValid) {
      return res.status(400).json({ success: false, message: phoneVerification.error });
    }

    const normalizedPhone = phoneValidation.normalized!;

    // 既存ユーザーチェック（job_seekersテーブルのphoneカラムでチェック）
    let existingUser: any = { rows: [] };
    try {
      existingUser = await query(
        `SELECT 
          u.id, 
          u.email, 
          u.status,
          js.id as jobseeker_id,
          js.registration_type,
          js.phone
         FROM job_seekers js
         INNER JOIN users u ON js.user_id = u.id
         WHERE js.phone = $1`,
        [normalizedPhone]
      );
    } catch (dbErr) {
      console.warn('ユーザーチェックDBエラー（継続）:', dbErr);
      // DBエラー時も新規扱いで継続
      existingUser = { rows: [] };
    }

    const rows = existingUser.rows || [];
    const registrationTypes = Array.from(
      new Set(
        rows
          .filter((row: any) => row.jobseeker_id)
          .map((row: any) => (row.registration_type === 'general' ? 'general' : 'engineer'))
      )
    );

    const userStatus = rows[0]?.status || null;
    let latestStatus: string | null = null;
    if (rows.length > 0) {
      const latestStatusResult = await query(
        `SELECT status FROM job_seeker_status_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [rows[0].id]
      );
      latestStatus = latestStatusResult.rows[0]?.status || null;
    }
    const isWithdrawn = latestStatus === 'withdrawn' || userStatus === 'deleted';

    const hasEngineer = registrationTypes.includes('engineer');
    const hasGeneral = registrationTypes.includes('general');
    const canRegisterEngineer = !hasEngineer || isWithdrawn;
    const canRegisterGeneral = !hasGeneral || isWithdrawn;
    const userInfo = rows[0]
      ? {
          id: rows[0].id,
          email: rows[0].email,
          status: rows[0].status,
        }
      : null;

    const message =
      registrationTypes.length > 0 && !canRegisterEngineer && !canRegisterGeneral
        ? 'この電話番号ではエンジニア・一般職の両方が既に登録済みです。'
        : '登録可能なタイプを選択してください。';

    return res.json({
      success: true,
      exists: registrationTypes.length > 0,
      userExists: rows.length > 0,
      existingRegistrationTypes: registrationTypes,
      canRegisterEngineer,
      canRegisterGeneral,
      user: userInfo,
      reactivationAvailable: isWithdrawn,
      phoneNumber: normalizedPhone,
      message,
    });
  } catch (error) {
    console.error('ユーザーチェックエラー:', error);
    // 500にせず新規扱いで返す（登録フローを妨げないため）
    return res.json({ success: true, exists: false, message: '新規ユーザーです。（フォールバック）' });
  }
});

// エンジニア向け本登録API（メールアドレスベースまたは電話番号ベース）
router.post('/engineer', rateLimit(3, 60000), async (req, res) => {
    try {
    const { phoneNumber, email, firstName, lastName, password, documentsData } = req.body;

    // バリデーション: メールアドレスまたは電話番号のいずれかが必要
    if ((!phoneNumber && !email) || !firstName || !lastName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレスまたは電話番号、姓、名、パスワードは必須です。' 
      });
    }

    // メールアドレスベースの登録か電話番号ベースの登録かを判定
    const isEmailBased = !!email;
    let normalizedPhone: string | null = null;

    if (isEmailBased) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: '有効なメールアドレスを入力してください。' 
        });
      }

      // メール確認済みかチェック
      const verificationResult = await query(
        `SELECT verified FROM email_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

      if (verificationResult.rows.length === 0 || !verificationResult.rows[0].verified) {
        return res.status(400).json({
          success: false,
          message: 'メールアドレスが確認されていません。先にメール確認を完了してください。'
        });
      }
    } else {
      // 電話番号の形式を検証
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ success: false, message: phoneValidation.error });
      }

      // 電話番号の実在確認（簡易版 - 形式のみ）
      const phoneVerification = await verifyPhoneNumberExists(phoneValidation.normalized!);
      if (!phoneVerification.isValid) {
        return res.status(400).json({ success: false, message: phoneVerification.error });
      }

      normalizedPhone = phoneValidation.normalized!;
    }

    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'パスワードは8文字以上で、英数字を含む必要があります。' 
      });
    }

    // 既存ユーザーチェック（メールアドレスベースまたは電話番号ベース）
    let existingUser;
    if (isEmailBased) {
      existingUser = await query(
        `SELECT 
          u.id, 
          js.id as jobseeker_id,
          js.registration_type,
          u.status,
          u.email
         FROM job_seekers js
         INNER JOIN users u ON js.user_id = u.id
         WHERE u.email = $1 AND js.registration_type = $2`,
        [email, 'engineer']
      );
    } else {
      existingUser = await query(
        `SELECT 
          u.id, 
          js.id as jobseeker_id,
          js.registration_type,
          u.status
         FROM job_seekers js
         INNER JOIN users u ON js.user_id = u.id
         WHERE js.phone = $1 AND js.registration_type = $2`,
        [normalizedPhone, 'engineer']
      );
    }

    let reactivating = false;
    let existingEngineerRow: any = null;
    let latestStatus: string | null = null;
    let existingUserStatus: string | null = null;

    if (existingUser.rows.length > 0) {
      existingEngineerRow = existingUser.rows.find((row: any) => row.jobseeker_id && row.registration_type === 'engineer');
      existingUserStatus = existingUser.rows[0]?.status || null;
      const latestStatusResult = await query(
        `SELECT status FROM job_seeker_status_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [existingUser.rows[0].id]
      );
      latestStatus = latestStatusResult.rows[0]?.status || null;
      const isWithdrawn = latestStatus === 'withdrawn' || existingUserStatus === 'deleted';

      if (existingEngineerRow) {
        if (!isWithdrawn) {
          return res.status(400).json({ 
            success: false, 
            message: 'このメールアドレスでエンジニア登録は既に完了しています。' 
          });
        }
        reactivating = true;
      }
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
        // 既存のusersレコードを再利用（まず拡張カラムありの更新を試行、失敗時は最小更新）
        userId = existingUserRecord.id;
        try {
          await query(
            `UPDATE users 
             SET password_hash = $1, user_type = $2, status = $3, updated_at = NOW() 
             WHERE id = $4`,
            [passwordHash, 'job_seeker', 'active', userId]
          );
        } catch {
          await query(
            `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [passwordHash, userId]
          );
        }
      } else {
        // 新規ユーザー作成（メールアドレスベースまたは電話番号ベース）
        if (isEmailBased) {
          // メールアドレスベースの新規ユーザー作成
          try {
            const userResult = await query(
              `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
              [email, passwordHash, 'job_seeker', 'active']
            );
            userId = userResult.rows[0].id;
          } catch (emailErr: any) {
            // emailがUNIQUE制約で失敗する可能性があるため、既存ユーザーを確認
            const existingUserByEmail = await query(
              'SELECT id FROM users WHERE email = $1',
              [email]
            );
            if (existingUserByEmail.rows.length > 0) {
              userId = existingUserByEmail.rows[0].id;
              // パスワードを更新
              await query(
                `UPDATE users SET password_hash = $1, user_type = $2, status = $3, updated_at = NOW() WHERE id = $4`,
                [passwordHash, 'job_seeker', 'active', userId]
              );
            } else {
              throw emailErr;
            }
          }
        } else {
          // 電話番号ベース - emailはoptional、phoneから生成したダミーemailを使用
          const dummyEmail = `phone_${normalizedPhone.replace(/[^0-9]/g, '')}@justjoin.local`;
          
          try {
            const userResult = await query(
              `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
              [dummyEmail, passwordHash, 'job_seeker', 'active']
            );
            userId = userResult.rows[0].id;
          } catch {
            // emailがUNIQUE制約で失敗する可能性があるため、UUIDを追加
            const uniqueEmail = `phone_${normalizedPhone.replace(/[^0-9]/g, '')}_${Date.now()}@justjoin.local`;
            const userResult = await query(
              `INSERT INTO users (email, password_hash, created_at, updated_at) 
               VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
              [uniqueEmail, passwordHash]
            );
            userId = userResult.rows[0].id;
          }
        }
      }

      // 念のため、usersに存在しなければ作成（DB初期化レース対策）
      try {
        const existsUser = await query('SELECT 1 FROM users WHERE id = $1', [userId]);
        if (existsUser.rowCount === 0) {
          if (isEmailBased) {
            // メールアドレスベースの場合は既存ユーザーを確認
            const existingUserByEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUserByEmail.rows.length > 0) {
              userId = existingUserByEmail.rows[0].id;
            } else {
              const reUser = await query(
                `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
                 VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
                [email, passwordHash]
              );
              userId = reUser.rows[0].id;
            }
          } else {
            const uniqueEmail = `phone_${normalizedPhone!.replace(/[^0-9]/g, '')}_${Date.now()}@justjoin.local`;
            const reUser = await query(
              `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
               VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
              [uniqueEmail, passwordHash]
            );
            userId = reUser.rows[0].id;
          }
        }
      } catch {}

      // 求職者情報作成（エンジニア向け）
      if (reactivating && existingEngineerRow?.jobseeker_id) {
        await query(
          `UPDATE job_seekers
           SET first_name = $2,
               last_name = $3,
               ${isEmailBased ? '' : 'phone = $4,'}
               date_of_birth = ${isEmailBased ? '$4' : '$5'},
               gender = ${isEmailBased ? '$5' : '$6'},
               nationality = ${isEmailBased ? '$6' : '$7'},
               address = ${isEmailBased ? '$7' : '$8'},
               profile_photo = ${isEmailBased ? '$8' : '$9'},
               registration_type = 'engineer',
               updated_at = NOW()
           WHERE id = $1`,
          isEmailBased ? [
            existingEngineerRow.jobseeker_id,
            firstName,
            lastName,
            documentsData?.birthDate || null,
            documentsData?.gender || null,
            documentsData?.nationality || null,
            documentsData?.liveAddress || null,
            documentsData?.resume?.photoUrl || null,
          ] : [
            existingEngineerRow.jobseeker_id,
            firstName,
            lastName,
            normalizedPhone,
            documentsData?.birthDate || null,
            documentsData?.gender || null,
            documentsData?.nationality || null,
            documentsData?.liveAddress || null,
            documentsData?.resume?.photoUrl || null,
          ]
        );
      } else {
        try {
          await query(
            `INSERT INTO job_seekers (
              user_id, first_name, last_name${isEmailBased ? '' : ', phone'}, 
              date_of_birth, gender, nationality, address,
              profile_photo, registration_type, created_at, updated_at
            ) VALUES ($1, $2, $3${isEmailBased ? '' : ', $4'}, ${isEmailBased ? '$4' : '$5'}, ${isEmailBased ? '$5' : '$6'}, ${isEmailBased ? '$6' : '$7'}, ${isEmailBased ? '$7' : '$8'}, ${isEmailBased ? '$8' : '$9'}, $9, NOW(), NOW())`,
            isEmailBased ? [
              userId,
              firstName,
              lastName,
              documentsData?.birthDate || null,
              documentsData?.gender || null,
              documentsData?.nationality || null,
              documentsData?.liveAddress || null,
              documentsData?.resume?.photoUrl || null,
              'engineer'
            ] : [
              userId,
              firstName,
              lastName,
              normalizedPhone,
              documentsData?.birthDate || null,
              documentsData?.gender || null,
              documentsData?.nationality || null,
              documentsData?.liveAddress || null,
              documentsData?.resume?.photoUrl || null,
              'engineer'
            ]
          );
        } catch (fkErr) {
          try {
            // 電話番号からダミーemailを生成して検索
            const dummyEmail = `phone_${normalizedPhone!.replace(/[^0-9]/g, '')}@justjoin.local`;
            const u = await query('SELECT id FROM users WHERE email LIKE $1 ORDER BY created_at DESC LIMIT 1', [`phone_${normalizedPhone!.replace(/[^0-9]/g, '')}%`]);
            if (u.rows.length > 0) {
              userId = u.rows[0].id;
            } else {
              const uniqueEmail = `phone_${normalizedPhone!.replace(/[^0-9]/g, '')}_${Date.now()}@justjoin.local`;
              const make = await query(
                `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
                 VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
                [uniqueEmail, passwordHash]
              );
              userId = make.rows[0].id;
            }
            await query(
              `INSERT INTO job_seekers (user_id, first_name, last_name, registration_type, created_at, updated_at)
               VALUES ($1, $2, $3, 'engineer', NOW(), NOW())`,
              [userId, firstName, lastName]
            );
          } catch {
            await query(
              `INSERT INTO job_seekers (user_id, first_name, last_name, registration_type, created_at, updated_at)
               VALUES ($1, $2, $3, $4, NOW(), NOW())`,
              [userId, firstName, lastName, 'engineer']
            );
          }
        }
      }

      if (reactivating) {
        await query(
          `INSERT INTO job_seeker_status_history (user_id, status, notes)
           VALUES ($1, 'active', '再登録によりアクティブ化')`,
          [userId]
        );
      }

      // 書類データ保存（失敗しても続行）
      try {
        if (documentsData) {
          const existingDoc = await query(
            'SELECT id FROM user_documents WHERE user_id = $1 AND document_type = $2',
            [userId.toString(), 'resume']
          );
          if (existingDoc.rows.length > 0) {
            await query(
              `UPDATE user_documents 
               SET document_data = $1, updated_at = NOW() 
               WHERE user_id = $2 AND document_type = $3`,
              [JSON.stringify(documentsData), userId.toString(), 'resume']
            );
          } else {
            await query(
              `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
               VALUES ($1, $2, $3, NOW(), NOW())`,
              [userId.toString(), 'resume', JSON.stringify(documentsData)]
            );
          }
        }
      } catch (docErr) {
        console.warn('user_documents 保存スキップ:', docErr);
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
      try {
        await query(
          'UPDATE job_seekers SET completion_rate = $1 WHERE user_id = $2',
          [completionRate, userId]
        );
      } catch {
        // completion_rateが存在しない場合は無視
      }

      await query('COMMIT');

      // JWTトークン生成
      const jwt = await import('jsonwebtoken');
      const tokenPayload: any = { 
        userId: userId, 
        role: 'job_seeker' 
      };
      if (isEmailBased) {
        tokenPayload.email = email;
      } else {
        tokenPayload.phoneNumber = normalizedPhone;
      }
      const token = jwt.default.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
        { expiresIn: '7d' }
      );

      // 登録完了処理
      try {
        const fullName = `${lastName} ${firstName}`;
        console.log('登録完了:', isEmailBased ? email : normalizedPhone);
      } catch (error) {
        console.error('登録完了処理エラー:', error);
      }

      res.json({
        success: true,
        message: '登録が完了しました。',
        token,
        user: {
          id: userId,
          ...(isEmailBased ? { email } : { phoneNumber: normalizedPhone }),
          firstName,
          lastName
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('エンジニア登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '登録中にエラーが発生しました。',
      detail: error?.message || String(error)
    });
  }
});

// 一般職向け本登録API（メールアドレスベースまたは電話番号ベース）
router.post('/general', rateLimit(3, 60000), async (req, res) => {
  try {
    const { phoneNumber, email, firstName, lastName, password, documentsData } = req.body;

    // バリデーション: メールアドレスまたは電話番号のいずれかが必要
    if ((!phoneNumber && !email) || !firstName || !lastName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'メールアドレスまたは電話番号、姓、名、パスワードは必須です。' 
      });
    }

    // メールアドレスベースの登録か電話番号ベースの登録かを判定
    const isEmailBased = !!email;
    let normalizedPhone: string | null = null;

    if (isEmailBased) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: '有効なメールアドレスを入力してください。' 
        });
      }

      // メール確認済みかチェック
      const verificationResult = await query(
        `SELECT verified FROM email_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

      if (verificationResult.rows.length === 0 || !verificationResult.rows[0].verified) {
        return res.status(400).json({
          success: false,
          message: 'メールアドレスが確認されていません。先にメール確認を完了してください。'
        });
      }
    } else {
      // 電話番号の形式を検証
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ success: false, message: phoneValidation.error });
      }

      // 電話番号の実在確認（簡易版 - 形式のみ）
      const phoneVerification = await verifyPhoneNumberExists(phoneValidation.normalized!);
      if (!phoneVerification.isValid) {
        return res.status(400).json({ success: false, message: phoneVerification.error });
      }

      normalizedPhone = phoneValidation.normalized!;
    }

    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'パスワードは8文字以上で、英数字を含む必要があります。' 
      });
    }

    // 既存ユーザーチェック（メールアドレスベースまたは電話番号ベース）
    let existingUser;
    if (isEmailBased) {
      existingUser = await query(
        `SELECT 
          u.id, 
          js.id as jobseeker_id,
          js.registration_type,
          u.status,
          u.email
         FROM job_seekers js
         INNER JOIN users u ON js.user_id = u.id
         WHERE u.email = $1 AND js.registration_type = $2`,
        [email, 'general']
      );
    } else {
      existingUser = await query(
        `SELECT 
          u.id, 
          js.id as jobseeker_id,
          js.registration_type,
          u.status
         FROM job_seekers js
         INNER JOIN users u ON js.user_id = u.id
         WHERE js.phone = $1 AND js.registration_type = $2`,
        [normalizedPhone, 'general']
      );
    }

    let reactivating = false;
    let existingGeneralRow: any = null;
    let latestStatus: string | null = null;
    let existingUserStatus: string | null = null;

    if (existingUser.rows.length > 0) {
      existingGeneralRow = existingUser.rows.find((row: any) => row.jobseeker_id && row.registration_type === 'general');
      existingUserStatus = existingUser.rows[0]?.status || null;
      const latestStatusResult = await query(
        `SELECT status FROM job_seeker_status_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [existingUser.rows[0].id]
      );
      latestStatus = latestStatusResult.rows[0]?.status || null;
      const isWithdrawn = latestStatus === 'withdrawn' || existingUserStatus === 'deleted';

      if (existingGeneralRow) {
        if (!isWithdrawn) {
          return res.status(400).json({ 
            success: false, 
            message: isEmailBased 
              ? 'このメールアドレスで一般職登録は既に完了しています。' 
              : 'この電話番号で一般職登録は既に完了しています。' 
          });
        }
        reactivating = true;
      }
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
        // 新規ユーザー作成（メールアドレスベースまたは電話番号ベース）
        if (isEmailBased) {
          // メールアドレスベースの新規ユーザー作成
          try {
            const userResult = await query(
              `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
              [email, passwordHash, 'job_seeker', 'active']
            );
            userId = userResult.rows[0].id;
          } catch (emailErr: any) {
            // emailがUNIQUE制約で失敗する可能性があるため、既存ユーザーを確認
            const existingUserByEmail = await query(
              'SELECT id FROM users WHERE email = $1',
              [email]
            );
            if (existingUserByEmail.rows.length > 0) {
              userId = existingUserByEmail.rows[0].id;
              // パスワードを更新
              await query(
                `UPDATE users SET password_hash = $1, user_type = $2, status = $3, updated_at = NOW() WHERE id = $4`,
                [passwordHash, 'job_seeker', 'active', userId]
              );
            } else {
              throw emailErr;
            }
          }
        } else {
          // 電話番号ベース - emailはoptional、phoneから生成したダミーemailを使用
          const dummyEmail = `phone_${normalizedPhone.replace(/[^0-9]/g, '')}@justjoin.local`;
          
          try {
            const userResult = await query(
              `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
              [dummyEmail, passwordHash, 'job_seeker', 'active']
            );
            userId = userResult.rows[0].id;
          } catch {
            // emailがUNIQUE制約で失敗する可能性があるため、UUIDを追加
            const uniqueEmail = `phone_${normalizedPhone.replace(/[^0-9]/g, '')}_${Date.now()}@justjoin.local`;
            const userResult = await query(
              `INSERT INTO users (email, password_hash, created_at, updated_at) 
               VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
              [uniqueEmail, passwordHash]
            );
            userId = userResult.rows[0].id;
          }
        }
      }

      // 念のため存在確認
      try {
        const existsUser = await query('SELECT 1 FROM users WHERE id = $1', [userId]);
        if (existsUser.rowCount === 0) {
          const uniqueEmail = `phone_${normalizedPhone!.replace(/[^0-9]/g, '')}_${Date.now()}@justjoin.local`;
          const reUser = await query(
            `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
             VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
            [uniqueEmail, passwordHash]
          );
          userId = reUser.rows[0].id;
        }
      } catch {}

      // 求職者情報作成（一般職向けはスキルシートなし）
      if (reactivating && existingGeneralRow?.jobseeker_id) {
        await query(
          `UPDATE job_seekers
           SET first_name = $2,
               last_name = $3,
               ${isEmailBased ? '' : 'phone = $4,'}
               date_of_birth = ${isEmailBased ? '$4' : '$5'},
               gender = ${isEmailBased ? '$5' : '$6'},
               nationality = ${isEmailBased ? '$6' : '$7'},
               address = ${isEmailBased ? '$7' : '$8'},
               profile_photo = ${isEmailBased ? '$8' : '$9'},
               registration_type = 'general',
               updated_at = NOW()
           WHERE id = $1`,
          isEmailBased ? [
            existingGeneralRow.jobseeker_id,
            firstName,
            lastName,
            documentsData?.birthDate || null,
            documentsData?.gender || null,
            documentsData?.nationality || null,
            documentsData?.liveAddress || null,
            documentsData?.resume?.photoUrl || null,
          ] : [
            existingGeneralRow.jobseeker_id,
            firstName,
            lastName,
            normalizedPhone,
            documentsData?.birthDate || null,
            documentsData?.gender || null,
            documentsData?.nationality || null,
            documentsData?.liveAddress || null,
            documentsData?.resume?.photoUrl || null,
          ]
        );
      } else {
        try {
          await query(
            `INSERT INTO job_seekers (
              user_id, first_name, last_name${isEmailBased ? '' : ', phone'}, 
              date_of_birth, gender, nationality, address,
              profile_photo, registration_type, created_at, updated_at
            ) VALUES ($1, $2, $3${isEmailBased ? '' : ', $4'}, ${isEmailBased ? '$4' : '$5'}, ${isEmailBased ? '$5' : '$6'}, ${isEmailBased ? '$6' : '$7'}, ${isEmailBased ? '$7' : '$8'}, ${isEmailBased ? '$8' : '$9'}, $9, NOW(), NOW())`,
            isEmailBased ? [
              userId,
              firstName,
              lastName,
              documentsData?.birthDate || null,
              documentsData?.gender || null,
              documentsData?.nationality || null,
              documentsData?.liveAddress || null,
              documentsData?.resume?.photoUrl || null,
              'general'
            ] : [
              userId,
              firstName,
              lastName,
              normalizedPhone,
              documentsData?.birthDate || null,
              documentsData?.gender || null,
              documentsData?.nationality || null,
              documentsData?.liveAddress || null,
              documentsData?.resume?.photoUrl || null,
              'general'
            ]
          );
        } catch (fkErr) {
          try {
            if (isEmailBased) {
              // メールアドレスベースの場合は既存ユーザーを確認
              const u = await query('SELECT id FROM users WHERE email = $1', [email]);
              if (u.rows.length > 0) {
                userId = u.rows[0].id;
              } else {
                const make = await query(
                  `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
                   VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
                  [email, passwordHash]
                );
                userId = make.rows[0].id;
              }
              await query(
                `INSERT INTO job_seekers (user_id, first_name, last_name, registration_type, created_at, updated_at)
                 VALUES ($1, $2, $3, 'general', NOW(), NOW())`,
                [userId, firstName, lastName]
              );
            } else {
              // 電話番号からダミーemailを生成して検索
              const dummyEmail = `phone_${normalizedPhone!.replace(/[^0-9]/g, '')}@justjoin.local`;
              const u = await query('SELECT id FROM users WHERE email LIKE $1 ORDER BY created_at DESC LIMIT 1', [`phone_${normalizedPhone!.replace(/[^0-9]/g, '')}%`]);
              if (u.rows.length > 0) {
                userId = u.rows[0].id;
              } else {
                const uniqueEmail = `phone_${normalizedPhone!.replace(/[^0-9]/g, '')}_${Date.now()}@justjoin.local`;
                const make = await query(
                  `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
                   VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
                  [uniqueEmail, passwordHash]
                );
                userId = make.rows[0].id;
              }
              await query(
                `INSERT INTO job_seekers (user_id, first_name, last_name, phone, registration_type, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, 'general', NOW(), NOW())`,
                [userId, firstName, lastName, normalizedPhone]
              );
            }
          } catch {
            await query(
              `INSERT INTO job_seekers (user_id, first_name, last_name${isEmailBased ? '' : ', phone'}, registration_type, created_at, updated_at)
               VALUES ($1, $2, $3${isEmailBased ? '' : ', $4'}, $4, NOW(), NOW())`,
              isEmailBased 
                ? [userId, firstName, lastName, 'general']
                : [userId, firstName, lastName, normalizedPhone, 'general']
            );
          }
        }
      }

      if (reactivating) {
        await query(
          `INSERT INTO job_seeker_status_history (user_id, status, notes)
           VALUES ($1, 'active', '再登録によりアクティブ化')`,
          [userId]
        );
      }

      // スキルシートを除外して書類データ保存（失敗しても続行）
      try {
        if (documentsData) {
          const { skillSheet, ...documentsWithoutSkillSheet } = documentsData;
          const existingDoc = await query(
            'SELECT id FROM user_documents WHERE user_id = $1 AND document_type = $2',
            [userId.toString(), 'resume']
          );
          if (existingDoc.rows.length > 0) {
            await query(
              `UPDATE user_documents 
               SET document_data = $1, updated_at = NOW() 
               WHERE user_id = $2 AND document_type = $3`,
              [JSON.stringify(documentsWithoutSkillSheet), userId.toString(), 'resume']
            );
          } else {
            await query(
              `INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at)
               VALUES ($1, $2, $3, NOW(), NOW())`,
              [userId.toString(), 'resume', JSON.stringify(documentsWithoutSkillSheet)]
            );
          }
        }
      } catch (docErr) {
        console.warn('user_documents 保存スキップ（general）:', docErr);
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
      try {
        await query(
          'UPDATE job_seekers SET completion_rate = $1 WHERE user_id = $2',
          [completionRate, userId]
        );
      } catch {
        // completion_rateが存在しない場合は無視
      }

      await query('COMMIT');

      // JWTトークン生成
      const jwt = await import('jsonwebtoken');
      const tokenPayload: any = { 
        userId: userId, 
        role: 'job_seeker' 
      };
      if (isEmailBased) {
        tokenPayload.email = email;
      } else {
        tokenPayload.phoneNumber = normalizedPhone;
      }
      const token = jwt.default.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
        { expiresIn: '7d' }
      );

      // 登録完了処理
      try {
        const fullName = `${lastName} ${firstName}`;
        console.log('登録完了:', isEmailBased ? email : normalizedPhone);
      } catch (emailError) {
        console.error('メール送信エラー:', emailError);
      }

      res.json({
        success: true,
        message: '登録が完了しました。',
        token,
        user: {
          id: userId,
          ...(isEmailBased ? { email } : { phoneNumber: normalizedPhone }),
          firstName,
          lastName
        }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('一般職登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '登録中にエラーが発生しました。',
      detail: error?.message || String(error)
    });
  }
});

export default router;

