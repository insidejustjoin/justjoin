import { query } from './client.js';
import { hashPassword, verifyPassword, generateRandomPassword, generateJWT } from '../../utils/auth.js';
import { emailService } from '../../services/emailService.js';
// サーバーサイド判定
const isServer = typeof window === 'undefined';
// モックデータ（開発用）
const mockUsers = [];
export const authRepository = {
    // ユーザー登録（求職者）
    async registerJobSeeker(data) {
        if (!isServer) {
            // フロントエンドでは実際のAPIを呼び出す
            try {
                const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
                const response = await fetch(`${apiUrl}/api/register-jobseeker`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                if (result.success && result.user && result.password) {
                    return { user: result.user, password: result.password };
                }
                throw new Error(result.message || '登録に失敗しました');
            }
            catch (error) {
                console.error('Register API error:', error);
                throw error;
            }
        }
        const password = generateRandomPassword();
        const passwordHash = await hashPassword(password);
        // トランザクションを使用してusersテーブルとjob_seekersテーブルの両方に保存
        const { transaction } = await import('./client.js');
        const result = await transaction(async (client) => {
            // 1. usersテーブルにユーザー情報を保存
            const userResult = await client.query(`
        INSERT INTO users (email, password_hash, user_type, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, user_type, status, created_at, updated_at
      `, [data.email, passwordHash, 'job_seeker', 'active']);
            const user = userResult.rows[0];
            // 2. job_seekersテーブルにプロフィール情報を保存
            const fullName = `${data.lastName} ${data.firstName}`;
            console.log('🔍 プロフィール情報保存:', {
                userId: user.id,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName
            });
            const profileResult = await client.query(`
        INSERT INTO job_seekers (user_id, first_name, last_name, full_name, interview_enabled)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, first_name, last_name, full_name, interview_enabled
      `, [user.id, data.firstName, data.lastName, fullName, false]);
            console.log('✅ プロフィール情報保存完了:', profileResult.rows[0]);
            return user;
        });
        // サーバーサイドでのみメール送信を実行
        // try {
        //   console.log('📧 サーバーサイド: 求職者登録メール送信中...');
        //   const emailSent = await emailService.sendJobSeekerPassword(data.email, data.fullName, password);
        //   if (emailSent) {
        //     console.log('✅ サーバーサイド: 求職者登録メール送信成功');
        //   }
        // } catch (error) {
        //   console.error('❌ サーバーサイド: 求職者登録メール送信失敗', error);
        // }
        return { user: result, password };
    },
    // ユーザー登録（企業）
    async registerCompany(data) {
        if (!isServer) {
            // フロントエンドでは実際のAPIを呼び出す
            try {
                const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
                const response = await fetch(`${apiUrl}/api/register-company`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                if (result.success && result.user) {
                    return result.user;
                }
                throw new Error(result.message || '登録に失敗しました');
            }
            catch (error) {
                console.error('Company register API error:', error);
                throw error;
            }
        }
        // トランザクションを使用してusersテーブルとcompaniesテーブルの両方に保存
        const { transaction } = await import('./client.js');
        const result = await transaction(async (client) => {
            // 1. usersテーブルにユーザー情報を保存
            const userResult = await client.query(`
        INSERT INTO users (email, user_type, status)
        VALUES ($1, $2, $3)
        RETURNING id, email, user_type, status, created_at, updated_at
      `, [data.email, 'company', 'pending']);
            const user = userResult.rows[0];
            // 2. companiesテーブルに企業情報を保存
            await client.query(`
        INSERT INTO companies (user_id, company_name, description, email)
        VALUES ($1, $2, $3, $4)
      `, [user.id, data.companyName, data.description, data.email]);
            return user;
        });
        // 登録成功後にメール送信
        try {
            console.log('📧 企業登録メール送信中...');
            // 1. 企業への申請受付メール
            const emailSent = await emailService.sendCompanyRegistrationReceived(data.email, data.companyName);
            if (emailSent) {
                console.log('✅ 企業申請受付メール送信成功');
            }
            else {
                console.error('❌ 企業申請受付メール送信失敗');
            }
            // 2. 管理者への通知メール
            const adminEmail = process.env.ADMIN_EMAIL || 'inside.justjoin@gmail.com';
            const adminNotificationSent = await emailService.sendAdminCompanyRegistrationNotification(adminEmail, data.companyName, data.email, data.description);
            if (adminNotificationSent) {
                console.log('✅ 管理者通知メール送信成功');
            }
            else {
                console.error('❌ 管理者通知メール送信失敗');
            }
        }
        catch (error) {
            console.error('❌ メール送信エラー:', error);
            // メール送信に失敗しても登録処理は成功とする
        }
        return result;
    },
    // ログイン
    async login(credentials) {
        if (!isServer) {
            // フロントエンドでは実際のAPIを呼び出す
            try {
                const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
                const response = await fetch(`${apiUrl}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials)
                });
                if (!response.ok) {
                    return null;
                }
                const result = await response.json();
                if (result.success && result.user && result.token) {
                    return { user: result.user, token: result.token };
                }
                return null;
            }
            catch (error) {
                console.error('Login API error:', error);
                return null;
            }
        }
        console.log('🔍 ログイン処理開始:', { email: credentials.email });
        const result = await query(`
      SELECT id, email, password_hash, user_type, status, created_at, updated_at
      FROM users
      WHERE email = $1
    `, [credentials.email]);
        console.log('📊 データベース検索結果:', {
            found: result.rows.length > 0,
            user: result.rows[0] ? {
                id: result.rows[0].id,
                email: result.rows[0].email,
                user_type: result.rows[0].user_type,
                status: result.rows[0].status,
                hasPassword: !!result.rows[0].password_hash
            } : null
        });
        if (result.rows.length === 0) {
            console.log('❌ ユーザーが見つかりません');
            return null;
        }
        const user = result.rows[0];
        // パスワード検証
        if (user.password_hash) {
            console.log('🔐 パスワード検証開始');
            const isValid = await verifyPassword(credentials.password, user.password_hash);
            console.log('🔐 パスワード検証結果:', { isValid, providedPassword: credentials.password });
            if (!isValid) {
                console.log('❌ パスワードが一致しません');
                return null;
            }
        }
        else {
            console.log('❌ パスワードが設定されていません');
            return null;
        }
        const token = generateJWT({ userId: user.id, email: user.email });
        console.log('✅ ログイン成功:', { userId: user.id, email: user.email });
        return { user, token };
    },
    // ユーザー取得（ID）
    async getUserById(userId) {
        if (!isServer) {
            return mockUsers.find(u => u.id === userId) || null;
        }
        const result = await query(`
      SELECT id, email, user_type, status, created_at, updated_at
      FROM users
      WHERE id = $1
    `, [userId]);
        return result.rows[0] || null;
    },
    // ユーザー取得（メール）
    async getUserByEmail(email) {
        if (!isServer) {
            return mockUsers.find(u => u.email === email) || null;
        }
        const result = await query(`
      SELECT id, email, user_type, status, created_at, updated_at
      FROM users
      WHERE email = $1
    `, [email]);
        return result.rows[0] || null;
    },
    // 企業承認
    async approveCompany(userId) {
        if (!isServer) {
            const mockUser = mockUsers.find(u => u.id === userId);
            if (!mockUser)
                throw new Error('User not found');
            mockUser.status = 'active';
            const password = generateRandomPassword();
            // 開発環境ではコンソールにメール送信ログを出力
            console.log('=== 企業承認メール送信（開発環境） ===');
            console.log('To:', mockUser.email);
            console.log('Subject: [Whoami Inc.] 企業登録承認完了');
            console.log('Password:', password);
            console.log('==========================================');
            return { user: mockUser, password };
        }
        const password = generateRandomPassword();
        const passwordHash = await hashPassword(password);
        const result = await query(`
      UPDATE users 
      SET status = 'active', password_hash = $2, updated_at = NOW()
      WHERE id = $1 AND user_type = 'company'
      RETURNING id, email, user_type, status, created_at, updated_at
    `, [userId, passwordHash]);
        if (result.rows.length === 0) {
            throw new Error('User not found or not a company');
        }
        // 承認成功後にメール送信
        try {
            console.log('📧 企業承認メール送信中...');
            // 企業情報を取得
            const companyResult = await query(`
        SELECT company_name
        FROM companies
        WHERE user_id = $1
      `, [userId]);
            const companyName = companyResult.rows[0]?.company_name || '企業';
            const emailSent = await emailService.sendCompanyApproval(result.rows[0].email, companyName, password);
            if (emailSent) {
                console.log('✅ 企業承認メール送信成功');
            }
            else {
                console.error('❌ 企業承認メール送信失敗');
            }
        }
        catch (error) {
            console.error('❌ メール送信エラー:', error);
            // メール送信に失敗しても承認処理は成功とする
        }
        return { user: result.rows[0], password };
    },
    // 企業却下
    async rejectCompany(userId, reason = '審査基準を満たしていませんでした') {
        if (!isServer) {
            const mockUser = mockUsers.find(u => u.id === userId);
            if (!mockUser)
                throw new Error('User not found');
            mockUser.status = 'rejected';
            // 開発環境ではコンソールにメール送信ログを出力
            console.log('=== 企業却下メール送信（開発環境） ===');
            console.log('To:', mockUser.email);
            console.log('Subject: [Whoami Inc.] 企業登録審査結果');
            console.log('Reason:', reason);
            console.log('==========================================');
            return mockUser;
        }
        const result = await query(`
      UPDATE users 
      SET status = 'rejected', updated_at = NOW()
      WHERE id = $1 AND user_type = 'company'
      RETURNING id, email, user_type, status, created_at, updated_at
    `, [userId]);
        if (result.rows.length === 0) {
            throw new Error('User not found or not a company');
        }
        // 却下後にメール送信
        try {
            console.log('📧 企業却下メール送信中...');
            // 企業情報を取得
            const companyResult = await query(`
        SELECT company_name
        FROM companies
        WHERE user_id = $1
      `, [userId]);
            const companyName = companyResult.rows[0]?.company_name || '企業';
            const emailSent = await emailService.sendCompanyRejection(result.rows[0].email, companyName, reason);
            if (emailSent) {
                console.log('✅ 企業却下メール送信成功');
            }
            else {
                console.error('❌ 企業却下メール送信失敗');
            }
        }
        catch (error) {
            console.error('❌ メール送信エラー:', error);
            // メール送信に失敗しても却下処理は成功とする
        }
        return result.rows[0];
    },
    // パスワード更新
    async updatePassword(userId, newPassword) {
        if (!isServer) {
            return; // モックでは何もしない
        }
        const passwordHash = await hashPassword(newPassword);
        await query(`
      UPDATE users 
      SET password_hash = $2, updated_at = NOW()
      WHERE id = $1
    `, [userId, passwordHash]);
    },
    // 承認待ち企業一覧取得
    async getPendingCompanies() {
        if (!isServer) {
            return mockUsers.filter(u => u.user_type === 'company' && u.status === 'pending');
        }
        const result = await query(`
      SELECT id, email, user_type, status, created_at, updated_at
      FROM users
      WHERE user_type = 'company' AND status = 'pending'
      ORDER BY created_at DESC
    `);
        return result.rows;
    },
    // パスワード再発行（求職者）
    async resetJobSeekerPassword(email, language = 'ja') {
        if (!isServer) {
            const mockUser = mockUsers.find(u => u.email === email && u.user_type === 'job_seeker');
            if (!mockUser) {
                return { success: false, message: 'このメールアドレスで登録された求職者アカウントが見つかりません' };
            }
            return { success: true, message: 'パスワード再発行メールを送信しました' };
        }
        try {
            const result = await query(`
        SELECT id, email, user_type, status
        FROM users
        WHERE email = $1 AND user_type = 'job_seeker'
      `, [email]);
            if (result.rows.length === 0) {
                return { success: false, message: 'このメールアドレスで登録された求職者アカウントが見つかりません' };
            }
            const user = result.rows[0];
            if (user.status !== 'active') {
                return { success: false, message: 'アカウントが無効です' };
            }
            // 新しいパスワードを生成
            const newPassword = generateRandomPassword();
            const hashedPassword = await hashPassword(newPassword);
            // パスワードを更新
            await query(`
        UPDATE users
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `, [hashedPassword, user.id]);
            // プロフィール情報を取得
            const profileResult = await query(`
        SELECT full_name
        FROM job_seekers
        WHERE user_id = $1
      `, [user.id]);
            const fullName = profileResult.rows[0]?.full_name || 'ユーザー';
            // メール送信
            const emailSent = await emailService.sendPasswordReset(email, fullName, newPassword);
            if (emailSent) {
                return { success: true, message: 'パスワード再発行メールを送信しました' };
            }
            else {
                return { success: false, message: 'メール送信に失敗しました' };
            }
        }
        catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: 'パスワード再発行に失敗しました' };
        }
    },
    // パスワード再発行（企業）
    async resetCompanyPassword(email, language = 'ja') {
        if (!isServer) {
            const mockUser = mockUsers.find(u => u.email === email && u.user_type === 'company');
            if (!mockUser) {
                return { success: false, message: '該当する企業が見つかりません' };
            }
            return { success: true, message: 'パスワード再発行メールを送信しました' };
        }
        try {
            // ユーザー存在確認
            const userResult = await query('SELECT id, email FROM users WHERE email = $1 AND user_type = $2', [email, 'company']);
            if (userResult.rows.length === 0) {
                return { success: false, message: '該当する企業が見つかりません' };
            }
            const user = userResult.rows[0];
            // 新しいパスワード生成
            const newPassword = generateRandomPassword();
            // パスワードハッシュ化
            const hashedPassword = await hashPassword(newPassword);
            // パスワード更新
            await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, user.id]);
            // 企業名取得
            const companyResult = await query('SELECT company_name FROM companies WHERE user_id = $1', [user.id]);
            const companyName = companyResult.rows[0]?.company_name || '企業';
            // メール送信
            const emailSent = await emailService.sendCompanyPasswordReset(email, companyName, newPassword);
            if (emailSent) {
                return { success: true, message: 'パスワード再発行メールを送信しました' };
            }
            else {
                return { success: false, message: 'メール送信に失敗しました' };
            }
        }
        catch (error) {
            console.error('企業パスワード再発行エラー:', error);
            return { success: false, message: 'パスワード再発行に失敗しました' };
        }
    },
    // パスワード変更
    async changePassword(userId, currentPassword, newPassword, language = 'ja') {
        if (!isServer) {
            const mockUser = mockUsers.find(u => u.id === userId);
            if (!mockUser) {
                return { success: false, message: 'ユーザーが見つかりません' };
            }
            // モック環境では簡単な文字列比較
            if (currentPassword !== 'password123') {
                return { success: false, message: '現在のパスワードが正しくありません' };
            }
            return { success: true, message: 'パスワードを変更しました' };
        }
        try {
            // ユーザー存在確認と現在のパスワード確認
            const userResult = await query('SELECT id, password_hash, email FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return { success: false, message: 'ユーザーが見つかりません' };
            }
            const user = userResult.rows[0];
            // 現在のパスワード確認
            const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                return { success: false, message: '現在のパスワードが正しくありません' };
            }
            // 新しいパスワードハッシュ化
            const hashedNewPassword = await hashPassword(newPassword);
            // パスワード更新
            await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, userId]);
            // ユーザー名を取得（求職者の場合）
            let fullName = '';
            try {
                const jobSeekerResult = await query('SELECT first_name, last_name FROM job_seekers WHERE user_id = $1', [userId]);
                if (jobSeekerResult.rows.length > 0) {
                    const jobSeeker = jobSeekerResult.rows[0];
                    fullName = `${jobSeeker.first_name} ${jobSeeker.last_name}`.trim();
                }
            }
            catch (error) {
                console.error('求職者情報取得エラー:', error);
            }
            // 企業名を取得（企業の場合）
            if (!fullName) {
                try {
                    const companyResult = await query('SELECT company_name FROM companies WHERE user_id = $1', [userId]);
                    if (companyResult.rows.length > 0) {
                        fullName = companyResult.rows[0].company_name;
                    }
                }
                catch (error) {
                    console.error('企業情報取得エラー:', error);
                }
            }
            // メール通知送信
            try {
                const { emailService } = await import('../../services/emailService.js');
                await emailService.sendPasswordChangeNotification(user.email, fullName || 'ユーザー');
            }
            catch (error) {
                console.error('パスワード変更通知メール送信エラー:', error);
                // メール送信エラーでもパスワード変更は成功とする
            }
            return { success: true, message: 'パスワードを変更しました' };
        }
        catch (error) {
            console.error('パスワード変更エラー:', error);
            return { success: false, message: 'パスワード変更に失敗しました' };
        }
    },
    // プロフィール更新
    async updateProfile(userId, profileData) {
        if (!isServer) {
            // ブラウザ環境ではAPIを呼び出す
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    return { success: false, message: '認証トークンが見つかりません' };
                }
                const response = await fetch('/match-job/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId,
                        profileData: profileData
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    return { success: false, message: data.message || 'プロフィール更新に失敗しました' };
                }
                return {
                    success: true,
                    message: 'プロフィールを更新しました',
                    profile: data.profile
                };
            }
            catch (error) {
                console.error('Profile update error:', error);
                return { success: false, message: 'プロフィール更新に失敗しました' };
            }
        }
        try {
            // ユーザー情報を取得してユーザータイプを確認
            const userResult = await query(`
        SELECT user_type
        FROM users
        WHERE id = $1
      `, [userId]);
            if (userResult.rows.length === 0) {
                return { success: false, message: 'ユーザーが見つかりません' };
            }
            const userType = userResult.rows[0].user_type;
            if (userType === 'job_seeker') {
                // 求職者のプロフィールが存在するかチェック
                const existingProfile = await query(`
          SELECT id FROM job_seekers WHERE user_id = $1
        `, [userId]);
                if (existingProfile.rows.length === 0) {
                    // プロフィールが存在しない場合は作成
                    await query(`
            INSERT INTO job_seekers (
              user_id, full_name, phone, address, desired_job_title, 
              experience_years, skills, self_introduction, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          `, [
                        userId,
                        profileData.full_name,
                        profileData.phone,
                        profileData.address,
                        profileData.desired_job_title,
                        profileData.experience_years,
                        profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0 ? JSON.stringify(profileData.skills) : null,
                        profileData.self_introduction
                    ]);
                }
                else {
                    // プロフィールが存在する場合は更新
                    await query(`
            UPDATE job_seekers
            SET 
              full_name = COALESCE($2, full_name),
              phone = COALESCE($3, phone),
              address = COALESCE($4, address),
              desired_job_title = COALESCE($5, desired_job_title),
              experience_years = COALESCE($6, experience_years),
              skills = COALESCE($7, skills),
              self_introduction = COALESCE($8, self_introduction),
              updated_at = NOW()
            WHERE user_id = $1
          `, [
                        userId,
                        profileData.full_name,
                        profileData.phone,
                        profileData.address,
                        profileData.desired_job_title,
                        profileData.experience_years,
                        profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0 ? JSON.stringify(profileData.skills) : null,
                        profileData.self_introduction
                    ]);
                }
                // 更新されたプロフィールを取得
                const profileResult = await query(`
          SELECT 
            id,
            full_name,
            phone,
            address,
            desired_job_title,
            experience_years,
            skills,
            self_introduction,
            created_at,
            updated_at
          FROM job_seekers
          WHERE user_id = $1
        `, [userId]);
                const profile = profileResult.rows[0];
                // skillsがJSON文字列の場合は配列に変換
                if (profile.skills && typeof profile.skills === 'string') {
                    try {
                        profile.skills = JSON.parse(profile.skills);
                    }
                    catch (e) {
                        profile.skills = [];
                    }
                }
                return {
                    success: true,
                    message: 'プロフィールを更新しました',
                    profile: profile
                };
            }
            else if (userType === 'company') {
                // 企業のプロフィールが存在するかチェック
                const existingProfile = await query(`
          SELECT id FROM companies WHERE user_id = $1
        `, [userId]);
                if (existingProfile.rows.length === 0) {
                    // プロフィールが存在しない場合は作成
                    await query(`
            INSERT INTO companies (
              user_id, company_name, phone, address, description, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `, [
                        userId,
                        profileData.company_name,
                        profileData.phone,
                        profileData.address,
                        profileData.description
                    ]);
                }
                else {
                    // プロフィールが存在する場合は更新
                    await query(`
            UPDATE companies
            SET 
              company_name = COALESCE($2, company_name),
              phone = COALESCE($3, phone),
              address = COALESCE($4, address),
              description = COALESCE($5, description),
              updated_at = NOW()
            WHERE user_id = $1
          `, [
                        userId,
                        profileData.company_name,
                        profileData.phone,
                        profileData.address,
                        profileData.description
                    ]);
                }
                // 更新されたプロフィールを取得
                const profileResult = await query(`
          SELECT 
            id,
            company_name,
            phone,
            address,
            description,
            created_at,
            updated_at
          FROM companies
          WHERE user_id = $1
        `, [userId]);
                return {
                    success: true,
                    message: 'プロフィールを更新しました',
                    profile: profileResult.rows[0]
                };
            }
            else {
                return { success: false, message: '無効なユーザータイプです' };
            }
        }
        catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'プロフィール更新に失敗しました' };
        }
    },
    // プロフィール取得
    async getProfile(userId) {
        if (!isServer) {
            // ブラウザ環境ではAPIを呼び出す
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    return { success: false, message: '認証トークンが見つかりません' };
                }
                const response = await fetch(`/match-job/api/profile/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    return { success: false, message: 'プロフィールの取得に失敗しました' };
                }
                const data = await response.json();
                return {
                    success: true,
                    profile: data.profile
                };
            }
            catch (error) {
                console.error('Profile get error:', error);
                return { success: false, message: 'プロフィールの取得に失敗しました' };
            }
        }
        try {
            // ユーザー情報を取得してユーザータイプを確認
            const userResult = await query(`
        SELECT user_type
        FROM users
        WHERE id = $1
      `, [userId]);
            if (userResult.rows.length === 0) {
                return { success: false, message: 'ユーザーが見つかりません' };
            }
            const userType = userResult.rows[0].user_type;
            if (userType === 'job_seeker') {
                // 求職者のプロフィール取得
                const profileResult = await query(`
          SELECT 
            id,
            full_name,
            phone,
            address,
            desired_job_title,
            experience_years,
            skills,
            self_introduction,
            created_at,
            updated_at
          FROM job_seekers
          WHERE user_id = $1
        `, [userId]);
                if (profileResult.rows.length === 0) {
                    return { success: false, message: 'プロフィールが見つかりません' };
                }
                const profile = profileResult.rows[0];
                // skillsがJSON文字列の場合は配列に変換
                if (profile.skills && typeof profile.skills === 'string') {
                    try {
                        profile.skills = JSON.parse(profile.skills);
                    }
                    catch (e) {
                        profile.skills = [];
                    }
                }
                return { success: true, profile };
            }
            else if (userType === 'company') {
                // 企業のプロフィール取得
                const profileResult = await query(`
          SELECT 
            id,
            company_name,
            phone,
            address,
            description,
            created_at,
            updated_at
          FROM companies
          WHERE user_id = $1
        `, [userId]);
                if (profileResult.rows.length === 0) {
                    return { success: false, message: 'プロフィールが見つかりません' };
                }
                return { success: true, profile: profileResult.rows[0] };
            }
            else {
                return { success: false, message: '無効なユーザータイプです' };
            }
        }
        catch (error) {
            console.error('Profile get error:', error);
            return { success: false, message: 'プロフィール取得に失敗しました' };
        }
    },
    // ユーザー削除（メールアドレス指定）
    async deleteUserByEmail(email) {
        if (!isServer) {
            const index = mockUsers.findIndex(u => u.email === email);
            if (index !== -1) {
                mockUsers.splice(index, 1);
                return true;
            }
            return false;
        }
        try {
            // トランザクションを使用して関連テーブルからも削除
            const { transaction } = await import('./client.js');
            const result = await transaction(async (client) => {
                // まずユーザー情報を取得
                const userResult = await client.query(`
          SELECT id, user_type
          FROM users
          WHERE email = $1
        `, [email]);
                if (userResult.rows.length === 0) {
                    return false;
                }
                const user = userResult.rows[0];
                // ユーザータイプに応じて関連テーブルから削除
                if (user.user_type === 'job_seeker') {
                    await client.query(`
            DELETE FROM job_seekers
            WHERE user_id = $1
          `, [user.id]);
                }
                else if (user.user_type === 'company') {
                    await client.query(`
            DELETE FROM companies
            WHERE user_id = $1
          `, [user.id]);
                }
                // 最後にusersテーブルから削除
                await client.query(`
          DELETE FROM users
          WHERE id = $1
        `, [user.id]);
                return true;
            });
            return result;
        }
        catch (error) {
            console.error('User deletion error:', error);
            return false;
        }
    },
    // 管理者作成（制限付き）
    async createAdmin(email, password) {
        // 管理者アカウントは inside.justjoin@gmail.com のみ許可
        const allowedAdminEmail = 'inside.justjoin@gmail.com';
        if (email !== allowedAdminEmail) {
            throw new Error(`管理者アカウントは ${allowedAdminEmail} のみ許可されています`);
        }
        if (!isServer) {
            const mockUser = {
                id: `admin_${Date.now()}`,
                email: email,
                user_type: 'admin',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            mockUsers.push(mockUser);
            const generatedPassword = password || generateRandomPassword();
            // 開発環境ではコンソールにメール送信ログを出力
            console.log('=== 管理者作成メール送信（開発環境） ===');
            console.log('To:', email);
            console.log('Subject: [Whoami Inc.] 管理者アカウント作成完了');
            console.log('Password:', generatedPassword);
            console.log('==========================================');
            return { user: mockUser, password: generatedPassword };
        }
        const generatedPassword = password || generateRandomPassword();
        const passwordHash = await hashPassword(generatedPassword);
        // 既存ユーザーを確認
        const existingUser = await query(`
      SELECT id, email, user_type, status
      FROM users
      WHERE email = $1
    `, [email]);
        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            // 既存ユーザーが管理者でない場合は管理者に変更
            if (user.user_type !== 'admin') {
                const result = await query(`
          UPDATE users 
          SET user_type = 'admin', status = 'active', password_hash = $2, updated_at = NOW()
          WHERE id = $1
          RETURNING id, email, user_type, status, created_at, updated_at
        `, [user.id, passwordHash]);
                const updatedUser = result.rows[0];
                // 管理者作成通知メールを送信
                try {
                    await emailService.sendAdminCreationNotification(email, generatedPassword);
                }
                catch (error) {
                    console.error('管理者作成通知メール送信エラー:', error);
                }
                return { user: updatedUser, password: generatedPassword };
            }
            else {
                throw new Error('このメールアドレスは既に管理者として登録されています');
            }
        }
        // 新規管理者ユーザーを作成
        const result = await query(`
      INSERT INTO users (email, user_type, status, password_hash)
      VALUES ($1, 'admin', 'active', $2)
      RETURNING id, email, user_type, status, created_at, updated_at
    `, [email, passwordHash]);
        const user = result.rows[0];
        // 管理者作成通知メールを送信
        try {
            await emailService.sendAdminCreationNotification(email, generatedPassword);
        }
        catch (error) {
            console.error('管理者作成通知メール送信エラー:', error);
        }
        return { user, password: generatedPassword };
    },
    // 管理者一覧取得（制限付き）
    async getAdmins() {
        if (!isServer) {
            return mockUsers.filter(u => u.user_type === 'admin');
        }
        const result = await query(`
      SELECT id, email, user_type, status, created_at, updated_at
      FROM users
      WHERE user_type = 'admin'
      ORDER BY created_at DESC
    `);
        return result.rows;
    },
    // 管理者削除（制限付き）
    async deleteAdmin(adminId) {
        if (!isServer) {
            const index = mockUsers.findIndex(u => u.id === adminId && u.user_type === 'admin');
            if (index !== -1) {
                const user = mockUsers[index];
                // inside.justjoin@gmail.com は削除不可
                if (user.email === 'inside.justjoin@gmail.com') {
                    throw new Error('メイン管理者アカウントは削除できません');
                }
                mockUsers.splice(index, 1);
                return true;
            }
            return false;
        }
        // 削除前にユーザー情報を取得
        const userResult = await query(`
      SELECT email FROM users WHERE id = $1 AND user_type = 'admin'
    `, [adminId]);
        if (userResult.rows.length === 0) {
            throw new Error('管理者が見つかりません');
        }
        const user = userResult.rows[0];
        // inside.justjoin@gmail.com は削除不可
        if (user.email === 'inside.justjoin@gmail.com') {
            throw new Error('メイン管理者アカウントは削除できません');
        }
        // 管理者を削除
        const result = await query(`
      DELETE FROM users WHERE id = $1 AND user_type = 'admin'
    `, [adminId]);
        return result.rowCount > 0;
    },
    // 管理者パスワードリセット
    async resetAdminPassword(adminId) {
        if (!isServer) {
            const mockUser = mockUsers.find(u => u.id === adminId && u.user_type === 'admin');
            if (!mockUser)
                throw new Error('Admin not found');
            const password = generateRandomPassword();
            // 開発環境ではコンソールにメール送信ログを出力
            console.log('=== 管理者パスワードリセットメール送信（開発環境） ===');
            console.log('To:', mockUser.email);
            console.log('Subject: [Whoami Inc.] 管理者パスワードリセット完了');
            console.log('New Password:', password);
            console.log('==========================================');
            return { user: mockUser, password };
        }
        const password = generateRandomPassword();
        const passwordHash = await hashPassword(password);
        const result = await query(`
      UPDATE users 
      SET password_hash = $2, updated_at = NOW()
      WHERE id = $1 AND user_type = 'admin'
      RETURNING id, email, user_type, status, created_at, updated_at
    `, [adminId, passwordHash]);
        if (result.rows.length === 0) {
            throw new Error('Admin not found');
        }
        const user = result.rows[0];
        // パスワードリセット通知メールを送信
        try {
            await emailService.sendAdminPasswordResetNotification(user.email, password);
        }
        catch (error) {
            console.error('管理者パスワードリセット通知メール送信エラー:', error);
        }
        return { user, password };
    },
};
