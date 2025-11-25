/**
 * 電話番号検証ユーティリティ
 * 国際電話番号形式（+から始まる）をサポート
 */

/**
 * 電話番号の形式を検証
 * @param phoneNumber 検証する電話番号
 * @returns 検証結果
 */
export function validatePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return {
      isValid: false,
      error: '電話番号を入力してください'
    };
  }

  // 空白を削除
  const cleaned = phoneNumber.trim().replace(/\s+/g, '');

  // +から始まる国際形式をチェック
  if (!cleaned.startsWith('+')) {
    return {
      isValid: false,
      error: '電話番号は+から始まる国際形式で入力してください（例: +81312345678, +998901234567）'
    };
  }

  // +の後の部分が数字のみかチェック
  const numberPart = cleaned.substring(1);
  if (!/^\d{7,15}$/.test(numberPart)) {
    return {
      isValid: false,
      error: '電話番号は+の後に7〜15桁の数字を入力してください'
    };
  }

  // 正規化された形式を返す
  return {
    isValid: true,
    normalized: cleaned
  };
}

/**
 * 電話番号が実在するか検証（簡易版）
 * 実際の検証APIを使用する場合は、この関数を拡張してください
 * @param phoneNumber 検証する電話番号
 * @returns 検証結果
 */
export async function verifyPhoneNumberExists(phoneNumber: string): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // 形式検証を先に行う
  const formatValidation = validatePhoneNumber(phoneNumber);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // TODO: 実在確認API（例: Twilio, Vonage等）を統合する場合はここに追加
  // 現在は形式検証のみ実施

  return {
    isValid: true
  };
}

/**
 * 電話番号を表示用にフォーマット
 * @param phoneNumber 電話番号
 * @returns フォーマットされた電話番号
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // +を含む場合はそのまま返す
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // 日本国内番号の場合はフォーマット
  if (phoneNumber.startsWith('0')) {
    // 090-1234-5678 形式
    if (phoneNumber.length === 11 && phoneNumber.startsWith('090') || phoneNumber.startsWith('080') || phoneNumber.startsWith('070')) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
    }
    // 03-1234-5678 形式
    if (phoneNumber.length === 10) {
      return `${phoneNumber.slice(0, 2)}-${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`;
    }
  }
  
  return phoneNumber;
}

