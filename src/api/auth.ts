declare const window: any;
import { authRepository } from '../integrations/postgres/auth.js';
import { logger } from '../services/logger.js';

// パスワードリセットAPI
export async function resetPasswordAPI(email: string, userType: 'job_seeker' | 'company') {
  // ブラウザ環境では実行しない
  if (typeof window !== 'undefined') {
    console.log('API functions are not available in browser environment');
    return {
      success: false,
      message: 'API functions are not available in browser environment'
    };
  }

  try {
    logger.info('パスワードリセットAPI開始', { email, userType }, undefined, 'reset_password');

    let result;
    
    if (userType === 'job_seeker') {
      result = await authRepository.resetJobSeekerPassword(email);
    } else if (userType === 'company') {
      result = await authRepository.resetCompanyPassword(email);
    } else {
      return {
        success: false,
        message: '無効なユーザータイプです'
      };
    }

    if (result.success) {
      logger.info('パスワードリセット成功', { email, userType }, undefined, 'reset_password');
    } else {
      logger.warn('パスワードリセット失敗', { email, userType, message: result.message }, undefined, 'reset_password');
    }

    return result;
  } catch (error) {
    logger.error('パスワードリセットAPIエラー', { error: error.message, email, userType }, undefined, 'reset_password');
    return {
      success: false,
      message: 'パスワードリセットに失敗しました'
    };
  }
} 