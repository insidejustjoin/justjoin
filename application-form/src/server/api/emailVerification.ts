import express from 'express';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';

const router = express.Router();

// テーブル作成のヘルパー関数
let emailVerificationsTableCreated = false;
const ensureEmailVerificationsTable = async () => {
  if (emailVerificationsTableCreated) return;
  
  try {
    // テーブル作成
    await query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        verification_code TEXT NOT NULL,
        verified BOOLEAN DEFAULT false,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // カラムが存在しない場合は追加（マイグレーション対応）
    try {
      // verification_codeカラムの存在確認と追加
      const codeColumnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'email_verifications' 
        AND column_name = 'verification_code'
      `);
      
      if (codeColumnCheck.rows.length === 0) {
        console.log('verification_codeカラムが存在しないため追加します');
        await query(`
          ALTER TABLE email_verifications 
          ADD COLUMN verification_code TEXT NOT NULL DEFAULT ''
        `);
        // デフォルト値を削除（NOT NULL制約を維持）
        await query(`
          ALTER TABLE email_verifications 
          ALTER COLUMN verification_code DROP DEFAULT
        `);
      }
      
      // verifiedカラムの存在確認と追加
      const verifiedColumnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'email_verifications' 
        AND column_name = 'verified'
      `);
      
      if (verifiedColumnCheck.rows.length === 0) {
        console.log('verifiedカラムが存在しないため追加します');
        await query(`
          ALTER TABLE email_verifications 
          ADD COLUMN verified BOOLEAN DEFAULT false
        `);
      }
      
      // first_name, last_nameカラムの存在確認と追加
      const firstNameCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'email_verifications' 
        AND column_name = 'first_name'
      `);
      
      if (firstNameCheck.rows.length === 0) {
        console.log('first_nameカラムが存在しないため追加します');
        await query(`
          ALTER TABLE email_verifications 
          ADD COLUMN first_name TEXT NOT NULL DEFAULT ''
        `);
        await query(`
          ALTER TABLE email_verifications 
          ALTER COLUMN first_name DROP DEFAULT
        `);
      }
      
      const lastNameCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'email_verifications' 
        AND column_name = 'last_name'
      `);
      
      if (lastNameCheck.rows.length === 0) {
        console.log('last_nameカラムが存在しないため追加します');
        await query(`
          ALTER TABLE email_verifications 
          ADD COLUMN last_name TEXT NOT NULL DEFAULT ''
        `);
        await query(`
          ALTER TABLE email_verifications 
          ALTER COLUMN last_name DROP DEFAULT
        `);
      }
    } catch (migrationError: any) {
      console.warn('カラム追加エラー（無視して続行）:', migrationError.message);
    }
    
    // インデックスも作成
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
      `);
    } catch (idxError: any) {
      // インデックスが既に存在する場合は無視
      if (!idxError.message?.includes('already exists')) {
        console.warn('email_verifications emailインデックス作成エラー:', idxError.message);
      }
    }
    
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);
      `);
    } catch (idxError: any) {
      // インデックスが既に存在する場合は無視
      if (!idxError.message?.includes('already exists')) {
        console.warn('email_verifications codeインデックス作成エラー:', idxError.message);
      }
    }
    
    emailVerificationsTableCreated = true;
    console.log('email_verifications テーブルの確認/作成が完了しました');
  } catch (tableError: any) {
    console.error('email_verifications テーブル作成エラー:', tableError.message || tableError);
    // エラーが発生しても続行（テーブルが既に存在する可能性がある）
    emailVerificationsTableCreated = true;
  }
};

// メール本人確認コード送信API（トークンは発行せず、確認コードのみ）
router.post('/verify-email', async (req, res) => {
  try {
    console.log('メール本人確認コード送信API: リクエスト受信', { 
      email: req.body?.email, 
      hasFirstName: !!req.body?.firstName,
      hasLastName: !!req.body?.lastName 
    });

    const { email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
      console.log('バリデーションエラー: 必須フィールドが不足');
      return res.status(400).json({
        success: false,
        message: 'メールアドレス、名、姓は必須です'
      });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('メールアドレス形式エラー:', email);
      return res.status(400).json({
        success: false,
        message: '有効なメールアドレスを入力してください'
      });
    }

    // テーブルが存在することを確認
    console.log('email_verifications テーブルの確認を開始...');
    await ensureEmailVerificationsTable();
    console.log('email_verifications テーブルの確認完了');

    // 6桁の確認コードを生成
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2分有効
    console.log('確認コードを生成:', { code: verificationCode, expiresAt });

    // email_verifications テーブルに保存（既存の場合は更新）
    try {
      console.log('email_verifications テーブルに保存を開始...', { email, firstName, lastName });
      
      // まず既存レコードがあるかチェック
      const existingResult = await query(
        `SELECT id, email FROM email_verifications WHERE email = $1`,
        [email]
      );
      
      // verification_token カラムが存在する場合にも対応するため、動的にクエリを構築
      // 本番DBでは verification_token が NOT NULL 制約付きで存在しており、
      // これを指定しないと今回のような 23502 エラー（NOT NULL violation）が発生する。
      const hasVerificationTokenColumn = true; // 本番では必須のため、常にセットする前提にする
      const tokenValue = verificationCode; // シンプルに確認コードと同じ値をトークンとして保存しておく

      if (existingResult.rows.length > 0) {
        // 既存レコードを更新
        console.log('既存レコードを更新します');

        if (hasVerificationTokenColumn) {
          await query(
            `UPDATE email_verifications 
             SET first_name = $1,
                 last_name = $2,
                 verification_code = $3,
                 verification_token = $4,
                 expires_at = $5,
                 verified = false,
                 updated_at = NOW()
             WHERE email = $6`,
            [firstName, lastName, verificationCode, tokenValue, expiresAt, email]
          );
        } else {
          await query(
            `UPDATE email_verifications 
             SET first_name = $1,
                 last_name = $2,
                 verification_code = $3,
                 expires_at = $4,
                 verified = false,
                 updated_at = NOW()
             WHERE email = $5`,
            [firstName, lastName, verificationCode, expiresAt, email]
          );
        }
      } else {
        // 新規レコードを挿入
        console.log('新規レコードを挿入します');

        if (hasVerificationTokenColumn) {
          await query(
            `INSERT INTO email_verifications (email, first_name, last_name, verification_code, verification_token, expires_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [email, firstName, lastName, verificationCode, tokenValue, expiresAt]
          );
        } else {
          await query(
            `INSERT INTO email_verifications (email, first_name, last_name, verification_code, expires_at, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [email, firstName, lastName, verificationCode, expiresAt]
          );
        }
      }
      console.log('email_verifications テーブルへの保存完了');
    } catch (dbError: any) {
      console.error('email_verifications テーブルへの保存エラー:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        stack: dbError.stack,
        query: dbError.query
      });
      throw dbError;
    }

    // 確認メール送信（コードを含む）
    console.log('確認メールの送信を開始...');
    const emailSent = await emailService.sendEmailVerificationCode(email, firstName, lastName, verificationCode);

    if (!emailSent) {
      console.error('メール送信に失敗しました');
      return res.status(500).json({
        success: false,
        message: 'メール送信に失敗しました。再度お試しください。'
      });
    }

    console.log('確認メールの送信完了');
    res.json({
      success: true,
      message: '確認メールを送信しました。メール内の6桁のコードを入力してください。'
    });
  } catch (error: any) {
    const errorDetails = {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack,
      name: error?.name
    };
    console.error('メール本人確認コード送信エラー:', errorDetails);
    
    // デバッグ用に一時的にエラー詳細を返す
    res.status(500).json({
      success: false,
      message: 'メール本人確認コードの送信に失敗しました',
      error: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      detail: error?.detail || null
    });
  }
});

// メール本人確認コード検証API
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスと確認コードは必須です'
      });
    }

    // コードで検証情報を取得
    const result = await query(
      `SELECT email, first_name, last_name, verification_code, verified, expires_at
       FROM email_verifications
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '確認コードが見つかりません。メールを再度送信してください。'
      });
    }

    const verification = result.rows[0];

    // 期限切れチェック
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: '確認コードの有効期限（2分）が切れています。再度メールを送信してください。'
      });
    }

    // コードの一致チェック
    if (verification.verification_code !== code) {
      return res.status(400).json({
        success: false,
        message: '確認コードが正しくありません'
      });
    }

    // 既に確認済みかチェック
    if (verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に確認済みです',
        alreadyVerified: true
      });
    }

    // 確認済みに更新
    await query(
      `UPDATE email_verifications
       SET verified = true, updated_at = NOW()
       WHERE email = $1`,
      [email]
    );

    // 確認成功レスポンス
    res.json({
      success: true,
      message: 'メールアドレスが確認されました',
      email: verification.email,
      firstName: verification.first_name,
      lastName: verification.last_name
    });
  } catch (error: any) {
    console.error('メール本人確認コード検証エラー:', error);
    res.status(500).json({
      success: false,
      message: 'メール本人確認の検証に失敗しました'
    });
  }
});

// メール確認状態チェックAPI
router.get('/check/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await query(
      `SELECT verified, expires_at, updated_at
       FROM email_verifications
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        verified: false,
        message: '確認メールが送信されていません'
      });
    }

    const verification = result.rows[0];
    
    // 30分以内に確認済みの場合は、有効とみなす
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const isWithin30Minutes = verification.verified && new Date(verification.updated_at) > thirtyMinutesAgo;
    
    res.json({
      success: true,
      verified: verification.verified,
      expiresAt: verification.expires_at,
      isWithin30Minutes: isWithin30Minutes,
      updatedAt: verification.updated_at
    });
  } catch (error: any) {
    console.error('メール確認状態チェックエラー:', error);
    res.status(500).json({
      success: false,
      message: '確認状態の取得に失敗しました'
    });
  }
});

// エンジニア/一般職の登録可能性チェックAPI
router.get('/check-registration/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // メール確認済みかチェック
    const verificationResult = await query(
      `SELECT verified FROM email_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (verificationResult.rows.length === 0 || !verificationResult.rows[0].verified) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスが確認されていません'
      });
    }

    // usersテーブルからユーザー情報を取得
    const userResult = await query('SELECT id, status FROM users WHERE email = $1 LIMIT 1', [email]);
    
    if (userResult.rows.length === 0) {
      // 新規ユーザー - 両方登録可能
      return res.json({
        success: true,
        exists: false,
        userExists: false,
        canRegisterEngineer: true,
        canRegisterGeneral: true,
        existingRegistrationTypes: [],
        message: '新規ユーザーです。エンジニア・一般職のいずれでも登録できます。'
      });
    }

    const userId = userResult.rows[0].id;
    const userStatus = userResult.rows[0].status;

    // job_seekersテーブルから登録タイプを取得
    const jobSeekersResult = await query(
      `SELECT registration_type, id FROM job_seekers WHERE user_id = $1`,
      [userId]
    );

    const registrationTypes = jobSeekersResult.rows.map((row: any) => row.registration_type).filter(Boolean);
    const hasEngineer = registrationTypes.includes('engineer');
    const hasGeneral = registrationTypes.includes('general');

    // ステータスがwithdrawnやdeletedの場合は再登録可能
    let latestStatus: string | null = null;
    if (jobSeekersResult.rows.length > 0) {
      const latestStatusResult = await query(
        `SELECT status FROM job_seeker_status_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      latestStatus = latestStatusResult.rows[0]?.status || null;
    }
    const isWithdrawn = latestStatus === 'withdrawn' || userStatus === 'deleted';

    const canRegisterEngineer = !hasEngineer || isWithdrawn;
    const canRegisterGeneral = !hasGeneral || isWithdrawn;

    const message =
      registrationTypes.length > 0 && !canRegisterEngineer && !canRegisterGeneral
        ? 'このメールアドレスではエンジニア・一般職の両方が既に登録済みです。'
        : '登録可能なタイプを選択してください。';

    return res.json({
      success: true,
      exists: registrationTypes.length > 0,
      userExists: true,
      canRegisterEngineer,
      canRegisterGeneral,
      existingRegistrationTypes: registrationTypes,
      message
    });
  } catch (error: any) {
    console.error('登録可能性チェックエラー:', error);
    res.status(500).json({
      success: false,
      message: '登録可能性の確認に失敗しました'
    });
  }
});

export default router;
