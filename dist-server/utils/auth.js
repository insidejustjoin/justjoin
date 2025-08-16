import bcrypt from 'bcryptjs';
// パスワードハッシュ化
export async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}
// パスワード検証
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
// ランダムパスワード生成
export function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
// JWTトークン生成（簡易版）
export function generateJWT(payload) {
    // 本番環境ではjsonwebtokenライブラリを使用
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa('dummy-signature'); // 実際はHMAC-SHA256で署名
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}
// JWTトークン検証（簡易版）
export function verifyJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    }
    catch (error) {
        return null;
    }
}
