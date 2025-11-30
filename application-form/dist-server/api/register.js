import { emailService } from '../services/emailService.js';
import { logger } from '../services/logger.js';
import { sendNotificationToUser } from '../integrations/postgres/notifications.js';
// 求職者登録API
export async function registerJobSeekerAPI(email, firstName, lastName, language = 'ja') {
    // ブラウザ環境では実行しない
    if (typeof window !== 'undefined') {
        console.log('API functions are not available in browser environment');
        return {
            success: false,
            message: 'API functions are not available in browser environment'
        };
    }
    try {
        logger.info('求職者登録API開始', { email, firstName, lastName }, undefined, 'register_jobseeker');
        // 動的インポートでサーバーサイドのモジュールを読み込み
        const { authRepository } = await import('../integrations/postgres/auth.js');
        // 既存ユーザーの確認
        const existingUser = await authRepository.getUserByEmail(email);
        if (existingUser) {
            logger.warn('重複メールアドレスでの登録試行', { email }, undefined, 'register_jobseeker');
            return {
                success: false,
                message: 'このメールアドレスはすでに使われています'
            };
        }
        // 求職者登録（サーバーサイドで実行）
        const result = await authRepository.registerJobSeeker({ email, firstName, lastName });
        const { user: authUser, password } = result;
        logger.info('求職者登録成功', { userId: authUser.id, email }, authUser.id, 'register_jobseeker');
        // 登録完了通知を送信
        try {
            await sendNotificationToUser(authUser.id, '登録完了のお知らせ', 'JustJoinへのご登録ありがとうございます！プロフィールの入力を完了して、次のステップに進みましょう。', 'success');
            logger.info('登録完了通知送信成功', { userId: authUser.id }, authUser.id, 'register_jobseeker');
        }
        catch (notificationError) {
            logger.error('登録完了通知送信失敗', { error: notificationError.message, userId: authUser.id }, authUser.id, 'register_jobseeker');
        }
        // パスワード送信メール（サーバーサイドで実行）
        const fullName = `${lastName} ${firstName}`;
        const emailSent = await emailService.sendJobSeekerPassword(email, fullName, password);
        // 管理者への新規登録通知メール送信
        try {
            const adminEmailSent = await emailService.sendAdminNewRegistrationNotification('inside.justjoin@gmail.com', 'job_seeker', {
                email: email,
                fullName: fullName
            });
            if (adminEmailSent) {
                logger.info('管理者新規登録通知メール送信成功', { email, fullName }, authUser.id, 'register_jobseeker');
            }
            else {
                logger.error('管理者新規登録通知メール送信失敗', { email, fullName }, authUser.id, 'register_jobseeker');
            }
        }
        catch (adminNotificationError) {
            logger.error('管理者新規登録通知メール送信エラー', {
                error: adminNotificationError.message,
                email,
                fullName
            }, authUser.id, 'register_jobseeker');
        }
        if (emailSent) {
            logger.info('求職者登録メール送信成功', { email }, authUser.id, 'register_jobseeker');
            return {
                success: true,
                message: '求職者として登録しました。パスワードがメールで送信されます。',
                user: authUser
            };
        }
        else {
            logger.error('求職者登録メール送信失敗', { email }, authUser.id, 'register_jobseeker');
            return {
                success: false,
                message: '登録は完了しましたが、メール送信に失敗しました。'
            };
        }
    }
    catch (error) {
        logger.error('求職者登録APIエラー', { error: error.message, email }, undefined, 'register_jobseeker');
        return {
            success: false,
            message: '登録に失敗しました'
        };
    }
}
