import bcrypt from 'bcryptjs';

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// パスワード検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ランダムパスワード生成
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// JWTトークン生成（簡易版）
export function generateJWT(payload: any): string {
  // 本番環境ではjsonwebtokenライブラリを使用
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa('dummy-signature'); // 実際はHMAC-SHA256で署名
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// JWTトークン検証
export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'justjoin-jwt-secret-2024';
    
    const payload = jwt.default.verify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT検証エラー:', error);
    return null;
  }
} 