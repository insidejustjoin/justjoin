import { verifyJWT } from '../utils/auth.js';
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '認証トークンがありません'
        });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = verifyJWT(token);
        if (!payload || !payload.userId) {
            return res.status(401).json({
                success: false,
                message: '認証トークンが無効です'
            });
        }
        // ログイン時間をチェック（8時間以内かどうか）
        if (payload.loginTime) {
            const loginTime = new Date(payload.loginTime);
            const now = new Date();
            const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 8) {
                return res.status(401).json({
                    success: false,
                    message: 'セッションが期限切れです。再度ログインしてください'
                });
            }
        }
        // req.userにpayloadをセット
        req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            loginTime: payload.loginTime
        };
        next();
    }
    catch (error) {
        console.error('JWT認証エラー:', error);
        return res.status(401).json({
            success: false,
            message: '認証トークンが無効です'
        });
    }
}
