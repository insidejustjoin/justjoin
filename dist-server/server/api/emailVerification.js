import express from 'express';
import { query } from '../../integrations/postgres/client.js';
import { emailService } from '../../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';
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
        // 確認トークンを生成
        const verificationToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間有効
        // email_verifications テーブルに保存（テーブルが存在しない場合は作成が必要）
        try {
            await query(`INSERT INTO email_verifications (email, first_name, last_name, verification_token, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (email) DO UPDATE SET
           first_name = $2,
           last_name = $3,
           verification_token = $4,
           expires_at = $5,
           verified = false,
           updated_at = NOW()`, [email, firstName, lastName, verificationToken, expiresAt]);
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
            verification_token TEXT NOT NULL UNIQUE,
            verified BOOLEAN DEFAULT false,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
                await query(`INSERT INTO email_verifications (email, first_name, last_name, verification_token, expires_at)
           VALUES ($1, $2, $3, $4, $5)`, [email, firstName, lastName, verificationToken, expiresAt]);
            }
            else {
                throw dbError;
            }
        }
        // 確認メール送信
        const verificationUrl = `${process.env.FRONTEND_URL || 'https://justjoin.jp'}/register/verify/${verificationToken}`;
        const emailSent = await emailService.sendEmailVerification(email, firstName, lastName, verificationUrl);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'メール送信に失敗しました。再度お試しください。'
            });
        }
        res.json({
            success: true,
            message: '確認メールを送信しました。メール内のリンクをクリックして本人確認を完了してください。'
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
// メール本人確認検証API
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        // トークンで検証情報を取得
        const result = await query(`SELECT email, first_name, last_name, verified, expires_at
       FROM email_verifications
       WHERE verification_token = $1`, [token]);
        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: '無効な確認リンクです'
            });
        }
        const verification = result.rows[0];
        // 期限切れチェック
        if (new Date(verification.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: '確認リンクの有効期限が切れています。再度メールを送信してください。'
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
       WHERE verification_token = $1`, [token]);
        // フロントエンドにリダイレクトまたはJSONレスポンス
        res.json({
            success: true,
            message: 'メールアドレスが確認されました',
            email: verification.email,
            firstName: verification.first_name,
            lastName: verification.last_name,
            token: token // 書類作成画面に渡すためにトークンを返す
        });
    }
    catch (error) {
        console.error('メール本人確認検証エラー:', error);
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
export default router;
