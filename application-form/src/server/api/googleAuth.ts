import express from 'express';

const router = express.Router();

// Google OAuth 2.0設定
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api/auth/google/callback' 
    : 'https://justjoin.jp/api/auth/google/callback');

// Google認証URL生成
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuthが設定されていません'
    });
  }

  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const scope = 'openid email profile';
  
  // stateをセッションまたはクッキーに保存（簡易版ではstateパラメータで返す）
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}&` +
    `access_type=online&` +
    `prompt=select_account`;

  res.json({
    success: true,
    authUrl,
    state
  });
});

// Google OAuthコールバック処理
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`/?error=${encodeURIComponent('Google認証に失敗しました')}`);
    }

    if (!code) {
      return res.redirect(`/?error=${encodeURIComponent('認証コードが取得できませんでした')}`);
    }

    // トークン交換
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return res.redirect(`/?error=${encodeURIComponent('トークン交換に失敗しました')}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // ユーザー情報取得
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('User info fetch error:', await userInfoResponse.text());
      return res.redirect(`/?error=${encodeURIComponent('ユーザー情報の取得に失敗しました')}`);
    }

    const googleUserInfo = await userInfoResponse.json();
    const { email, name, picture } = googleUserInfo;

    if (!email) {
      return res.redirect(`/?error=${encodeURIComponent('メールアドレスが取得できませんでした')}`);
    }

    // データベースからユーザーを検索または作成
    const { query, transaction } = await import('../../integrations/postgres/client.js');
    
    // 既存ユーザーを検索
    let userResult = await query(`
      SELECT id, email, user_type, status, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `, [email]);

    let userId: string;
    let userType: string;
    let isNewUser = false;

    if (userResult.rows.length > 0) {
      // 既存ユーザー
      const user = userResult.rows[0];
      userId = user.id;
      userType = user.user_type;
      console.log('既存ユーザーでログイン:', { userId, email, userType });
    } else {
      // 新規ユーザー登録（求職者として登録）
      isNewUser = true;
      console.log('新規ユーザー登録:', { email });

      const result = await transaction(async (client) => {
        // usersテーブルにユーザーを作成（パスワードなし）
        const userInsertResult = await client.query(`
          INSERT INTO users (email, password_hash, user_type, status)
          VALUES ($1, NULL, $2, $3)
          RETURNING id, email, user_type, status, created_at, updated_at
        `, [email, 'job_seeker', 'active']);

        const newUser = userInsertResult.rows[0];
        userId = newUser.id;

        // 名前を分割（Googleから取得したnameをfirst_name/last_nameに分割）
        let firstName = '';
        let lastName = '';
        if (name) {
          const nameParts = name.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            lastName = nameParts[0];
            firstName = nameParts.slice(1).join(' ');
          } else {
            firstName = name;
          }
        }

        // job_seekersテーブルにプロフィールを作成（既存チェック付き）
        const existingJobSeeker = await client.query(
          'SELECT id FROM job_seekers WHERE user_id = $1 LIMIT 1',
          [userId]
        );
        
        if (existingJobSeeker.rows.length === 0) {
          await client.query(`
            INSERT INTO job_seekers (user_id, first_name, last_name, full_name, interview_enabled)
            VALUES ($1, $2, $3, $4, $5)
          `, [userId, firstName, lastName, name || email, false]);
        }

        return newUser;
      });

      userType = result.user_type;
      console.log('新規ユーザー登録完了:', { userId, email, userType });
    }

    // 登録タイプを取得（求職者の場合）
    let registrationTypes: string[] = [];
    let firstName = '';
    let lastName = '';
    if (userType === 'job_seeker') {
      try {
        const jobSeekerResult = await query(
          `
            SELECT COALESCE(registration_type, 'engineer') AS registration_type,
                   first_name, last_name
            FROM job_seekers
            WHERE user_id = $1
            LIMIT 1
          `,
          [userId]
        );
        if (jobSeekerResult.rows.length > 0) {
          const row = jobSeekerResult.rows[0];
          registrationTypes = Array.from(
            new Set(
              jobSeekerResult.rows.map((r: any) => (r.registration_type === 'general' ? 'general' : 'engineer'))
            )
          );
          firstName = row.first_name || '';
          lastName = row.last_name || '';
        }
      } catch (typeError) {
        console.warn('登録タイプ取得に失敗しました:', typeError);
      }
    }

    // ユーザー情報を取得
    const userInfoResult = await query(`
      SELECT id, email, user_type, status, created_at, updated_at
      FROM users
      WHERE id = $1
    `, [userId]);

    const dbUserInfo = userInfoResult.rows[0];

    // JWTトークン生成
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      {
        userId,
        email,
        role: userType,
        loginTime: new Date().toISOString()
      },
      process.env.JWT_SECRET || 'justjoin-jwt-secret-2024',
      { expiresIn: '8h' }
    );

    // フロントエンドにリダイレクト（ユーザー情報をクエリパラメータで渡す）
    // セキュリティのため、実際にはHTTP-onlyクッキーに保存することを推奨
    const frontendUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:5173'
      : 'https://justjoin.jp';

    const userData = {
      id: dbUserInfo.id,
      email: dbUserInfo.email,
      user_type: dbUserInfo.user_type,
      status: dbUserInfo.status,
      created_at: dbUserInfo.created_at,
      updated_at: dbUserInfo.updated_at,
      registration_types: registrationTypes,
      first_name: firstName || '',
      last_name: lastName || ''
    };
    
    console.log('Google OAuth callback - userData:', JSON.stringify(userData, null, 2));
    console.log('Google OAuth callback - isNewUser:', isNewUser);

    res.redirect(`${frontendUrl}/auth/google/success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}&isNewUser=${isNewUser}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`/?error=${encodeURIComponent('認証処理中にエラーが発生しました')}`);
  }
});

export default router;

