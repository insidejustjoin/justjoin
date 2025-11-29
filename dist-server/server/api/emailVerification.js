import express from 'express';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';
const router = express.Router();
// メール本人確認トークン発行API
router.post('/verify-email', async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        if (!email || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'メールアドレス、名、姓は必須です'
            });
        }
        // メールアドレスの形式チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '有効なメールアドレスを入力してください'
            });
        }
        // 6桁の確認コードを生成
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分有効
        // email_verifications テーブルに保存（テーブルが存在しない場合は作成が必要）
        try {
            await query(`INSERT INTO email_verifications (email, first_name, last_name, verification_code, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (email) DO UPDATE SET
           first_name = $2,
           last_name = $3,
           verification_code = $4,
           expires_at = $5,
           verified = false,
           updated_at = NOW()`, [email, firstName, lastName, verificationCode, expiresAt]);
        }
        catch (dbError) {
            // テーブルが存在しない場合は作成
            if (dbError.message?.includes('does not exist')) {
                console.log('email_verifications テーブルを作成します...');
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
                await query(`INSERT INTO email_verifications (email, first_name, last_name, verification_code, expires_at)
           VALUES ($1, $2, $3, $4, $5)`, [email, firstName, lastName, verificationCode, expiresAt]);
            }
            else {
                throw dbError;
            }
        }
        // 確認メール送信（コードを含む）
        const emailSent = await emailService.sendEmailVerificationCode(email, firstName, lastName, verificationCode);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'メール送信に失敗しました。再度お試しください。'
            });
        }
        res.json({
            success: true,
            message: '確認メールを送信しました。メール内の6桁のコードを入力してください。'
        });
    }
    catch (error) {
        console.error('メール本人確認トークン発行エラー:', error);
        res.status(500).json({
            success: false,
            message: 'メール本人確認トークンの発行に失敗しました'
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
        const result = await query(`SELECT email, first_name, last_name, verification_code, verified, expires_at
       FROM email_verifications
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`, [email]);
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
                message: '確認コードの有効期限（5分）が切れています。再度メールを送信してください。'
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
        await query(`UPDATE email_verifications
       SET verified = true, updated_at = NOW()
       WHERE email = $1`, [email]);
        // 確認成功レスポンス
        res.json({
            success: true,
            message: 'メールアドレスが確認されました',
            email: verification.email,
            firstName: verification.first_name,
            lastName: verification.last_name
        });
    }
    catch (error) {
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
        const result = await query(`SELECT verified, expires_at
       FROM email_verifications
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`, [email]);
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                verified: false,
                message: '確認メールが送信されていません'
            });
        }
        const verification = result.rows[0];
        res.json({
            success: true,
            verified: verification.verified,
            expiresAt: verification.expires_at
        });
    }
    catch (error) {
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
        const verificationResult = await query(`SELECT verified FROM email_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`, [email]);
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
        const jobSeekersResult = await query(`SELECT registration_type, id FROM job_seekers WHERE user_id = $1`, [userId]);
        const registrationTypes = jobSeekersResult.rows.map((row) => row.registration_type).filter(Boolean);
        const hasEngineer = registrationTypes.includes('engineer');
        const hasGeneral = registrationTypes.includes('general');
        // ステータスがwithdrawnやdeletedの場合は再登録可能
        let latestStatus = null;
        if (jobSeekersResult.rows.length > 0) {
            const latestStatusResult = await query(`SELECT status FROM job_seeker_status_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
            latestStatus = latestStatusResult.rows[0]?.status || null;
        }
        const isWithdrawn = latestStatus === 'withdrawn' || userStatus === 'deleted';
        const canRegisterEngineer = !hasEngineer || isWithdrawn;
        const canRegisterGeneral = !hasGeneral || isWithdrawn;
        const message = registrationTypes.length > 0 && !canRegisterEngineer && !canRegisterGeneral
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
    }
    catch (error) {
        console.error('登録可能性チェックエラー:', error);
        res.status(500).json({
            success: false,
            message: '登録可能性の確認に失敗しました'
        });
    }
});
export default router;
