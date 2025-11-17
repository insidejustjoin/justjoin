import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';

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

// 既存ユーザーチェックAPI
router.post('/check', rateLimit(10, 60000), async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // バリデーション（最低限）
    if (!email) {
      return res.status(400).json({ success: false, message: 'メールアドレスは必須です。' });
    }

    // 既存ユーザーチェック（job_seekersテーブルに対応するレコードがあるかもチェック）
    let existingUser: any = { rows: [] };
    try {
      existingUser = await query(
        `SELECT 
          u.id, 
          u.email, 
          u.status,
          js.id as jobseeker_id,
          js.registration_type
         FROM users u
         LEFT JOIN job_seekers js ON js.user_id = u.id
         WHERE u.email = $1`,
        [email]
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
        ? 'このメールアドレスではエンジニア・一般職の両方が既に登録済みです。'
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
      message,
    });
  } catch (error) {
    console.error('ユーザーチェックエラー:', error);
    // 500にせず新規扱いで返す（登録フローを妨げないため）
    return res.json({ success: true, exists: false, message: '新規ユーザーです。（フォールバック）' });
  }
});

// エンジニア向け本登録API
router.post('/engineer', rateLimit(3, 60000), async (req, res) => {
    try {
    const { email, firstName, lastName, password, documentsData } = req.body;

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
        js.registration_type,
        u.status
       FROM users u
       LEFT JOIN job_seekers js ON js.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

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
        // 新規ユーザー作成（まず拡張カラム付きで挿入、失敗時は最小カラムで挿入）
        try {
          const userResult = await query(
            `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
            [email, passwordHash, 'job_seeker', 'active']
          );
          userId = userResult.rows[0].id;
        } catch {
          const userResult = await query(
            `INSERT INTO users (email, password_hash, created_at, updated_at) 
             VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
            [email, passwordHash]
          );
          userId = userResult.rows[0].id;
        }
      }

      // 念のため、usersに存在しなければ作成（DB初期化レース対策）
      try {
        const existsUser = await query('SELECT 1 FROM users WHERE id = $1', [userId]);
        if (existsUser.rowCount === 0) {
          const reUser = await query(
            `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
             VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
            [email, passwordHash]
          );
          userId = reUser.rows[0].id;
        }
      } catch {}

      // 求職者情報作成（エンジニア向け）
      if (reactivating && existingEngineerRow?.jobseeker_id) {
        await query(
          `UPDATE job_seekers
           SET first_name = $2,
               last_name = $3,
               phone = $4,
               date_of_birth = $5,
               gender = $6,
               nationality = $7,
               address = $8,
               profile_photo = $9,
               registration_type = 'engineer',
               updated_at = NOW()
           WHERE id = $1`,
          [
            existingEngineerRow.jobseeker_id,
            firstName,
            lastName,
            documentsData?.livePhoneNumber || null,
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
              user_id, first_name, last_name, phone, 
              date_of_birth, gender, nationality, address,
              profile_photo, registration_type, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
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
        } catch (fkErr) {
          try {
            const u = await query('SELECT id FROM users WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
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
  } catch (error: any) {
    console.error('エンジニア登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: '登録中にエラーが発生しました。',
      detail: error?.message || String(error)
    });
  }
});

// 一般職向け本登録API
router.post('/general', rateLimit(3, 60000), async (req, res) => {
  try {
    const { email, firstName, lastName, password, documentsData } = req.body;

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

    const existingUser = await query(
      `SELECT 
        u.id, 
        js.id as jobseeker_id,
        js.registration_type,
        u.status
       FROM users u
       LEFT JOIN job_seekers js ON js.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

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
            message: 'このメールアドレスで一般職登録は既に完了しています。' 
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
        // 新規ユーザー作成
        try {
          const userResult = await query(
            `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
            [email, passwordHash, 'job_seeker', 'active']
          );
          userId = userResult.rows[0].id;
        } catch {
          const userResult = await query(
            `INSERT INTO users (email, password_hash, created_at, updated_at) 
             VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
            [email, passwordHash]
          );
          userId = userResult.rows[0].id;
        }
      }

      // 念のため存在確認
      try {
        const existsUser = await query('SELECT 1 FROM users WHERE id = $1', [userId]);
        if (existsUser.rowCount === 0) {
          const reUser = await query(
            `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
             VALUES ($1, $2, 'job_seeker', 'active', NOW(), NOW()) RETURNING id`,
            [email, passwordHash]
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
               phone = $4,
               date_of_birth = $5,
               gender = $6,
               nationality = $7,
               address = $8,
               profile_photo = $9,
               registration_type = 'general',
               updated_at = NOW()
           WHERE id = $1`,
          [
            existingGeneralRow.jobseeker_id,
            firstName,
            lastName,
            documentsData?.livePhoneNumber || null,
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
              user_id, first_name, last_name, phone, 
              date_of_birth, gender, nationality, address,
              profile_photo, registration_type, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
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
        } catch (fkErr) {
          try {
            const u = await query('SELECT id FROM users WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
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
          } catch {
            await query(
              `INSERT INTO job_seekers (user_id, first_name, last_name, registration_type, created_at, updated_at)
               VALUES ($1, $2, $3, $4, NOW(), NOW())`,
              [userId, firstName, lastName, 'general']
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

