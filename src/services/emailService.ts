// メール送信サービスの設定
const EMAIL_CONFIG = {
  from: 'inside.justjoin@gmail.com',
  fromName: 'JustJoin',
  subjectPrefix: '[JustJoin] ',
  // メール送信サービスの設定
  service: process.env.EMAIL_SERVICE || 'console', // 'gmail', 'sendgrid', 'resend', 'console'
  apiKey: process.env.EMAIL_API_KEY || '',
  apiUrl: process.env.EMAIL_API_URL || '',
  // Gmail SMTP設定
  gmailUser: process.env.GMAIL_USER || 'inside.justjoin@gmail.com',
  gmailPassword: process.env.GMAIL_PASSWORD || '', // アプリパスワード
  gmailHost: 'smtp.gmail.com',
  gmailPort: 587,
  gmailSecure: false // TLSを使用
};

// メールテンプレートの型定義
export interface EmailTemplate {
  subject: string;
  body: string;
  html?: string;
}

// フロントエンド環境ではemailServiceを無効化
const isServer = typeof window === 'undefined';

// メール送信サービスクラス
class EmailService {
  private fromEmail: string;
  private fromName: string;
  private subjectPrefix: string;
  private service: string;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.fromEmail = EMAIL_CONFIG.from;
    this.fromName = EMAIL_CONFIG.fromName;
    this.subjectPrefix = EMAIL_CONFIG.subjectPrefix;
    this.service = EMAIL_CONFIG.service;
    this.apiKey = EMAIL_CONFIG.apiKey;
    this.apiUrl = EMAIL_CONFIG.apiUrl;
  }

  // 仮登録確認メール（日本語・英語両方）
  async sendTemporaryRegistrationConfirmation(to: string, firstName: string, lastName: string, verificationUrl: string): Promise<boolean> {
    const fullName = `${lastName} ${firstName}`;
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}仮登録確認 - JustJoin / Temporary Registration Confirmation`,
      body: `
仮登録確認 / Temporary Registration Confirmation

${fullName} 様 / Dear ${fullName},

JustJoinへの仮登録ありがとうございます。
Thank you for your temporary registration with JustJoin.

以下のリンクをクリックして、登録手続きを完了してください。
Please click the link below to complete your registration process.

このリンクは30分間有効です。
This link is valid for 30 minutes.

登録手続きを完了する / Complete Registration:
${verificationUrl}

リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：
If the link doesn't work, please copy and paste the following URL into your browser:
${verificationUrl}

30分以内に手続きを完了しない場合、仮登録データは自動的に削除されます。
If you don't complete the process within 30 minutes, your temporary registration data will be automatically deleted.

--
${this.fromName}
${this.fromEmail}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>仮登録確認 / Temporary Registration Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">仮登録確認 / Temporary Registration Confirmation</h2>
    <p>${fullName} 様 / Dear ${fullName},</p>
    <p>JustJoinへの仮登録ありがとうございます。<br>Thank you for your temporary registration with JustJoin.</p>
    
    <p>以下のリンクをクリックして、登録手続きを完了してください。<br>Please click the link below to complete your registration process.</p>
    
    <p><strong>このリンクは30分間有効です。<br>This link is valid for 30 minutes.</strong></p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">登録手続きを完了する / Complete Registration</a>
    </div>
    
    <p>リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>If the link doesn't work, please copy and paste the following URL into your browser:</p>
    <p style="background: #f8fafc; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all;">${verificationUrl}</p>
    
    <p style="color: #dc2626; font-size: 14px;">30分以内に手続きを完了しない場合、仮登録データは自動的に削除されます。<br>If you don't complete the process within 30 minutes, your temporary registration data will be automatically deleted.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(to, template);
  }

  // 求職者登録時のパスワード送信メール（日本語・英語両方）
  async sendJobSeekerPassword(to: string, fullName: string, password: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}求職者登録完了 - パスワードのお知らせ / Job Seeker Registration Complete - Password Information`,
      body: `
${fullName} 様 / Dear ${fullName},

求職者登録が完了いたしました。
Your job seeker registration has been completed.

【ログイン情報 / Login Information】
メールアドレス / Email Address: ${to}
パスワード / Password: ${password}

以下のURLからログインしてください：
Please login from the following URL:
https://justjoin.jp/jobseeker

※パスワードは第三者に教えないようご注意ください。
※Please do not share your password with others.

--
${this.fromName}
${this.fromEmail}
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>求職者登録完了 / Job Seeker Registration Complete</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">求職者登録完了 / Job Seeker Registration Complete</h2>
    <p>${fullName} 様 / Dear ${fullName},</p>
    <p>求職者登録が完了いたしました。<br>Your job seeker registration has been completed.</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">【ログイン情報 / Login Information】</h3>
      <p><strong>メールアドレス / Email Address:</strong> ${to}</p>
      <p><strong>パスワード / Password:</strong> ${password}</p>
    </div>
    
    <p>以下のURLからログインしてください：<br>Please login from the following URL:</p>
    <p><a href="https://justjoin.jp/jobseeker" style="color: #2563eb;">https://justjoin.jp/jobseeker</a></p>
    
    <p style="color: #dc2626; font-size: 14px;">※パスワードは第三者に教えないようご注意ください。<br>※Please do not share your password with others.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
        `
    };

    return await this.sendEmail(to, template);
  }

  // 企業登録申請受付メール（日本語・英語両方）
  async sendCompanyRegistrationReceived(to: string, companyName: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}企業登録申請受付完了 / Company Registration Application Received`,
      body: `
${companyName} 様 / Dear ${companyName},

企業登録申請を受付いたしました。
Your company registration application has been received.

審査には通常3-5営業日かかります。
The review process typically takes 3-5 business days.

審査結果は担当者よりご連絡いたします。
We will contact you with the review results.

しばらくお待ちください。
Please wait for our response.

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>企業登録申請受付完了 / Company Registration Application Received</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">企業登録申請受付完了 / Company Registration Application Received</h2>
    <p>${companyName} 様 / Dear ${companyName},</p>
    <p>企業登録申請を受付いたしました。<br>Your company registration application has been received.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">審査について / Review Process</h3>
      <p>審査には通常<strong>3-5営業日</strong>かかります。<br>The review process typically takes <strong>3-5 business days</strong>.</p>
      <p>審査結果は担当者よりご連絡いたします。<br>We will contact you with the review results.</p>
    </div>
    
    <p>しばらくお待ちください。<br>Please wait for our response.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(to, template);
  }

  // 企業承認通知メール（日本語・英語両方）
  async sendCompanyApproval(to: string, companyName: string, password: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}企業登録承認完了 / Company Registration Approved`,
      body: `
${companyName} 様 / Dear ${companyName},

企業登録が承認されました。
Your company registration has been approved.

【ログイン情報 / Login Information】
メールアドレス / Email Address: ${to}
パスワード / Password: ${password}

以下のURLからログインしてください：
Please login from the following URL:
https://justjoin.jp/employer

※パスワードは第三者に教えないようご注意ください。
※Please do not share your password with others.

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>企業登録承認完了 / Company Registration Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">企業登録承認完了 / Company Registration Approved</h2>
    <p>${companyName} 様 / Dear ${companyName},</p>
    <p>企業登録が承認されました。<br>Your company registration has been approved.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">【ログイン情報 / Login Information】</h3>
      <p><strong>メールアドレス / Email Address:</strong> ${to}</p>
      <p><strong>パスワード / Password:</strong> ${password}</p>
    </div>
    
    <p>以下のURLからログインしてください：<br>Please login from the following URL:</p>
    <p><a href="https://justjoin.jp/employer" style="color: #059669;">https://justjoin.jp/employer</a></p>
    
    <p style="color: #dc2626; font-size: 14px;">※パスワードは第三者に教えないようご注意ください。<br>※Please do not share your password with others.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(to, template);
  }

  // 企業却下通知メール（日本語・英語両方）
  async sendCompanyRejection(to: string, companyName: string, reason: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}企業登録審査結果 / Company Registration Review Result`,
      body: `
${companyName} 様 / Dear ${companyName},

企業登録申請について、審査の結果、承認を見送らせていただきました。
Regarding your company registration application, after review, we have decided not to approve it at this time.

【却下理由 / Rejection Reason】
${reason}

ご不明な点がございましたら、お気軽にお問い合わせください。
If you have any questions, please feel free to contact us.

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>企業登録審査結果 / Company Registration Review Result</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">企業登録審査結果 / Company Registration Review Result</h2>
    <p>${companyName} 様 / Dear ${companyName},</p>
    <p>企業登録申請について、審査の結果、承認を見送らせていただきました。<br>Regarding your company registration application, after review, we have decided not to approve it at this time.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">【却下理由 / Rejection Reason】</h3>
      <p>${reason}</p>
    </div>
    
    <p>ご不明な点がございましたら、お気軽にお問い合わせください。<br>If you have any questions, please feel free to contact us.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(to, template);
  }

  // 管理者への企業登録申請通知メール（日本語・英語両方）
  async sendAdminCompanyRegistrationNotification(adminEmail: string, companyName: string, companyEmail: string, description: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}新規企業登録申請 / New Company Registration Application`,
      body: `
新しい企業登録申請があります。
There is a new company registration application.

【申請企業情報 / Applicant Company Information】
企業名 / Company Name: ${companyName}
メールアドレス / Email Address: ${companyEmail}
会社概要 / Company Description: ${description}

管理画面で審査を行ってください。
Please review in the admin panel.

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>新規企業登録申請 / New Company Registration Application</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">新規企業登録申請 / New Company Registration Application</h2>
    <p>新しい企業登録申請があります。<br>There is a new company registration application.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">【申請企業情報 / Applicant Company Information】</h3>
      <p><strong>企業名 / Company Name:</strong> ${companyName}</p>
      <p><strong>メールアドレス / Email Address:</strong> ${companyEmail}</p>
      <p><strong>会社概要 / Company Description:</strong> ${description}</p>
    </div>
    
    <p>管理画面で審査を行ってください。<br>Please review in the admin panel.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(adminEmail, template);
  }

  // パスワード再発行メール（日本語・英語両方）
  async sendPasswordReset(to: string, fullName: string, password: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}パスワード再発行完了 / Password Reset Complete`,
      body: `
${fullName} 様 / Dear ${fullName},

パスワード再発行が完了いたしました。
Your password reset has been completed.

【新しいログイン情報 / New Login Information】
メールアドレス / Email Address: ${to}
新しいパスワード / New Password: ${password}

以下のURLからログインしてください：
Please login from the following URL:
https://justjoin.jp/jobseeker

※新しいパスワードは第三者に教えないようご注意ください。
※Please do not share your new password with others.

※セキュリティのため、ログイン後はパスワードの変更をお勧めします。
※For security reasons, we recommend changing your password after login.

--
${this.fromName}
${this.fromEmail}
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>パスワード再発行完了 / Password Reset Complete</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">パスワード再発行完了 / Password Reset Complete</h2>
    <p>${fullName} 様 / Dear ${fullName},</p>
    <p>パスワード再発行が完了いたしました。<br>Your password reset has been completed.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">【新しいログイン情報 / New Login Information】</h3>
      <p><strong>メールアドレス / Email Address:</strong> ${to}</p>
      <p><strong>新しいパスワード / New Password:</strong> ${password}</p>
    </div>
    
    <p>以下のURLからログインしてください：<br>Please login from the following URL:</p>
    <p><a href="https://justjoin.jp/jobseeker" style="color: #dc2626;">https://justjoin.jp/jobseeker</a></p>
    
    <p style="color: #dc2626; font-size: 14px;">※新しいパスワードは第三者に教えないようご注意ください。<br>※Please do not share your new password with others.</p>
    <p style="color: #dc2626; font-size: 14px;">※セキュリティのため、ログイン後はパスワードの変更をお勧めします。<br>※For security reasons, we recommend changing your password after login.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
        `
    };

    return await this.sendEmail(to, template);
  }

  // 企業パスワード再発行メール（日本語・英語両方）
  async sendCompanyPasswordReset(to: string, companyName: string, password: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}企業アカウント パスワード再発行完了 / Company Account Password Reset Complete`,
      body: `
${companyName} 様 / Dear ${companyName},

企業アカウントのパスワード再発行が完了いたしました。
Your company account password reset has been completed.

【新しいログイン情報 / New Login Information】
メールアドレス / Email Address: ${to}
新しいパスワード / New Password: ${password}

以下のURLからログインしてください：
Please login from the following URL:
https://justjoin.jp/employer

※新しいパスワードは第三者に教えないようご注意ください。
※Please do not share your new password with others.

※セキュリティのため、ログイン後はパスワードの変更をお勧めします。
※For security reasons, we recommend changing your password after login.

--
${this.fromName}
${this.fromEmail}
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>企業アカウント パスワード再発行完了 / Company Account Password Reset Complete</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">企業アカウント パスワード再発行完了 / Company Account Password Reset Complete</h2>
    <p>${companyName} 様 / Dear ${companyName},</p>
    <p>企業アカウントのパスワード再発行が完了いたしました。<br>Your company account password reset has been completed.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">【新しいログイン情報 / New Login Information】</h3>
      <p><strong>メールアドレス / Email Address:</strong> ${to}</p>
      <p><strong>新しいパスワード / New Password:</strong> ${password}</p>
    </div>
    
    <p>以下のURLからログインしてください：<br>Please login from the following URL:</p>
    <p><a href="https://justjoin.jp/employer" style="color: #dc2626;">https://justjoin.jp/employer</a></p>
    
    <p style="color: #dc2626; font-size: 14px;">※新しいパスワードは第三者に教えないようご注意ください。<br>※Please do not share your new password with others.</p>
    <p style="color: #dc2626; font-size: 14px;">※セキュリティのため、ログイン後はパスワードの変更をお勧めします。<br>※For security reasons, we recommend changing your password after login.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
        `
    };

    return await this.sendEmail(to, template);
  }

  // パスワード変更通知メール（日本語・英語両方）
  async sendPasswordChangeNotification(to: string, fullName: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}パスワード変更完了のお知らせ / Password Change Completed`,
      body: `
${fullName} 様 / Dear ${fullName},

パスワードの変更が完了いたしました。
Your password has been successfully changed.

【変更日時 / Change Date/Time】
${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} / ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })}

【セキュリティに関する注意事項 / Security Notes】
・パスワードは第三者に教えないようご注意ください
・Please do not share your password with others

・定期的にパスワードを変更することをお勧めします
・We recommend changing your password regularly

・不審なログインがあった場合は、すぐにパスワードを変更してください
・If you notice any suspicious login activity, please change your password immediately

ログインはこちらから：
Login here:
https://justjoin.jp/jobseeker

--
${this.fromName}
${this.fromEmail}
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>パスワード変更完了 / Password Change Completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">パスワード変更完了 / Password Change Completed</h2>
    <p>${fullName} 様 / Dear ${fullName},</p>
    <p>パスワードの変更が完了いたしました。<br>Your password has been successfully changed.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="margin-top: 0; color: #059669;">【変更日時 / Change Date/Time】</h3>
      <p>${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} / ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
      <h3 style="margin-top: 0; color: #d97706;">【セキュリティに関する注意事項 / Security Notes】</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>パスワードは第三者に教えないようご注意ください / Please do not share your password with others</li>
        <li>定期的にパスワードを変更することをお勧めします / We recommend changing your password regularly</li>
        <li>不審なログインがあった場合は、すぐにパスワードを変更してください / If you notice any suspicious login activity, please change your password immediately</li>
      </ul>
    </div>
    
    <p>ログインはこちらから：<br>Login here:</p>
    <p><a href="https://justjoin.jp/jobseeker" style="color: #2563eb;">https://justjoin.jp/jobseeker</a></p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
        `
    };

    return this.sendEmail(to, template);
  }

  // エラー通知メール送信（日本語・英語両方）
  async sendErrorNotification(to: string, subject: string, message: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}システムエラー通知 / System Error Notification`,
      body: `
システムエラー通知 / System Error Notification

以下のエラーが発生しています：
The following error has occurred:

${message}

発生日時 / Occurrence Date/Time: ${new Date().toLocaleString('ja-JP')} / ${new Date().toLocaleString('en-US')}

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>システムエラー通知 / System Error Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #d32f2f;">🚨 システムエラー通知 / System Error Notification</h2>
    <p>以下のエラーが発生しています：<br>The following error has occurred:</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
      <pre style="white-space: pre-wrap; font-family: monospace;">${message}</pre>
    </div>
    
    <p style="color: #666; font-size: 12px;">
      このメールは自動送信されています。<br>This email is automatically sent.<br>
      発生日時 / Occurrence Date/Time: ${new Date().toLocaleString('ja-JP')} / ${new Date().toLocaleString('en-US')}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(to, template);
  }

  // 管理者作成通知メール（日本語・英語両方）
  async sendAdminCreationNotification(adminEmail: string, password: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}管理者アカウント作成完了 / Admin Account Creation Complete`,
      body: `
管理者アカウントが作成されました。
Admin account has been created.

【ログイン情報 / Login Information】
メールアドレス / Email Address: ${adminEmail}
パスワード / Password: ${password}

以下のURLからログインしてください：
Please login from the following URL:
https://justjoin-788053304941.asia-northeast1.run.app/admin

セキュリティのため、初回ログイン後にパスワードを変更することをお勧めします。
For security reasons, we recommend changing your password after first login.

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>管理者アカウント作成完了 / Admin Account Creation Complete</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">管理者アカウント作成完了 / Admin Account Creation Complete</h2>
    <p>管理者アカウントが作成されました。<br>Admin account has been created.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="margin-top: 0; color: #059669;">【ログイン情報 / Login Information】</h3>
      <p><strong>メールアドレス / Email Address:</strong> ${adminEmail}</p>
      <p><strong>パスワード / Password:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
    </div>
    
    <p>以下のURLからログインしてください：<br>Please login from the following URL:</p>
    <p><a href="https://justjoin-788053304941.asia-northeast1.run.app/admin" style="color: #059669; text-decoration: none;">https://justjoin-788053304941.asia-northeast1.run.app/admin</a></p>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ セキュリティのため、初回ログイン後にパスワードを変更することをお勧めします。<br>⚠️ For security reasons, we recommend changing your password after first login.</strong></p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(adminEmail, template);
  }

  // 新規登録時の管理者通知メール（日本語・英語両方）
  async sendAdminNewRegistrationNotification(adminEmail: string, userType: 'job_seeker' | 'company', userInfo: {
    email: string;
    fullName?: string;
    companyName?: string;
    description?: string;
  }): Promise<boolean> {
    const userTypeText = userType === 'job_seeker' ? '求職者' : '企業';
    const userTypeTextEn = userType === 'job_seeker' ? 'Job Seeker' : 'Company';
    const userName = userType === 'job_seeker' ? userInfo.fullName : userInfo.companyName;
    
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}新規${userTypeText}登録 / New ${userTypeTextEn} Registration`,
      body: `
新しい${userTypeText}登録がありました。
A new ${userTypeTextEn.toLowerCase()} has registered.

【登録者情報 / Registrant Information】
ユーザータイプ / User Type: ${userTypeText} / ${userTypeTextEn}
メールアドレス / Email Address: ${userInfo.email}
${userType === 'job_seeker' ? `氏名 / Full Name: ${userInfo.fullName}` : `企業名 / Company Name: ${userInfo.companyName}`}
${userType === 'company' && userInfo.description ? `会社概要 / Company Description: ${userInfo.description}` : ''}

登録日時 / Registration Date/Time: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} / ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })}

管理画面で詳細を確認してください：
Please check the details in the admin panel:
https://justjoin.jp/admin

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>新規${userTypeText}登録 / New ${userTypeTextEn} Registration</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">新規${userTypeText}登録 / New ${userTypeTextEn} Registration</h2>
    <p>新しい${userTypeText}登録がありました。<br>A new ${userTypeTextEn.toLowerCase()} has registered.</p>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <h3 style="margin-top: 0; color: #2563eb;">【登録者情報 / Registrant Information】</h3>
      <p><strong>ユーザータイプ / User Type:</strong> ${userTypeText} / ${userTypeTextEn}</p>
      <p><strong>メールアドレス / Email Address:</strong> ${userInfo.email}</p>
      ${userType === 'job_seeker' ? `<p><strong>氏名 / Full Name:</strong> ${userInfo.fullName}</p>` : `<p><strong>企業名 / Company Name:</strong> ${userInfo.companyName}</p>`}
      ${userType === 'company' && userInfo.description ? `<p><strong>会社概要 / Company Description:</strong> ${userInfo.description}</p>` : ''}
    </div>
    
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #64748b;">
      <p style="margin: 0; color: #64748b;"><strong>登録日時 / Registration Date/Time:</strong><br>${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} / ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })}</p>
    </div>
    
    <p>管理画面で詳細を確認してください：<br>Please check the details in the admin panel:</p>
    <p><a href="https://justjoin.jp/admin" style="color: #2563eb; text-decoration: none;">https://justjoin.jp/admin</a></p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(adminEmail, template);
  }

  // 管理者パスワードリセット通知メール（日本語・英語両方）
  async sendAdminPasswordResetNotification(adminEmail: string, newPassword: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `${this.subjectPrefix}管理者パスワードリセット完了 / Admin Password Reset Complete`,
      body: `
管理者パスワードがリセットされました。
Admin password has been reset.

【新しいログイン情報 / New Login Information】
メールアドレス / Email Address: ${adminEmail}
新しいパスワード / New Password: ${newPassword}

以下のURLからログインしてください：
Please login from the following URL:
https://justjoin-788053304941.asia-northeast1.run.app/admin

セキュリティのため、ログイン後にパスワードを変更することをお勧めします。
For security reasons, we recommend changing your password after login.

--
${this.fromName}
${this.fromEmail}
      `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>管理者パスワードリセット完了 / Admin Password Reset Complete</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">管理者パスワードリセット完了 / Admin Password Reset Complete</h2>
    <p>管理者パスワードがリセットされました。<br>Admin password has been reset.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #dc2626;">【新しいログイン情報 / New Login Information】</h3>
      <p><strong>メールアドレス / Email Address:</strong> ${adminEmail}</p>
      <p><strong>新しいパスワード / New Password:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${newPassword}</span></p>
    </div>
    
    <p>以下のURLからログインしてください：<br>Please login from the following URL:</p>
    <p><a href="https://justjoin-788053304941.asia-northeast1.run.app/admin" style="color: #dc2626; text-decoration: none;">https://justjoin-788053304941.asia-northeast1.run.app/admin</a></p>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ セキュリティのため、ログイン後にパスワードを変更することをお勧めします。<br>⚠️ For security reasons, we recommend changing your password after login.</strong></p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 14px; color: #6b7280;">
      ${this.fromName}<br>
      ${this.fromEmail}
    </p>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(adminEmail, template);
  }

  // 実際のメール送信処理
  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      switch (this.service) {
        case 'gmail':
          return await this.sendWithGmail(to, template);
        case 'sendgrid':
          return await this.sendWithSendGrid(to, template);
        case 'resend':
          return await this.sendWithResend(to, template);
        case 'console':
        default:
          return await this.sendToConsole(to, template);
      }
    } catch (error) {
      console.error('メール送信エラー:', error);
      return false;
    }
  }

  // Gmail SMTPでの送信
  private async sendWithGmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // 環境変数の確認
      if (!EMAIL_CONFIG.gmailUser || !EMAIL_CONFIG.gmailPassword) {
        console.error('Gmail設定が不完全です。GMAIL_USERとGMAIL_PASSWORDを設定してください。');
        return false;
      }

      const nodemailer = await import('nodemailer');
      
      // Gmail SMTP設定の改善
      const transporter = nodemailer.createTransport({
        service: 'gmail', // サービス名を指定
        host: EMAIL_CONFIG.gmailHost,
        port: EMAIL_CONFIG.gmailPort,
        secure: EMAIL_CONFIG.gmailSecure, // false for 587, true for 465
        auth: {
          user: EMAIL_CONFIG.gmailUser,
          pass: EMAIL_CONFIG.gmailPassword, // アプリパスワード
        },
        tls: {
          rejectUnauthorized: false // 証明書エラーを無視（必要に応じて）
        },
        debug: process.env.NODE_ENV === 'development', // 開発環境でのみデバッグ
        logger: process.env.NODE_ENV === 'development' // 開発環境でのみログ出力
      });

      // 接続テスト
      try {
        await transporter.verify();
        console.log('Gmail SMTP接続テスト成功');
      } catch (verifyError) {
        console.error('Gmail SMTP接続テスト失敗:', verifyError);
        return false;
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: template.subject,
        text: template.body,
        html: template.html || template.body,
        priority: 'high' as const, // 型を明示的に指定
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Gmail送信成功:', info.messageId);
      console.log('送信先:', info.accepted);
      console.log('拒否された送信先:', info.rejected);
      return true;
    } catch (error) {
      console.error('Gmail送信エラー:', error);
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
      }
      
      return false;
    }
  }

  // SendGridでの送信
  private async sendWithSendGrid(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: template.subject,
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          content: [
            {
              type: 'text/plain',
              value: template.body,
            },
            {
              type: 'text/html',
              value: template.html || template.body,
            },
          ],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('SendGrid送信エラー:', error);
      return false;
    }
  }

  // Resendでの送信
  private async sendWithResend(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [to],
          subject: template.subject,
          text: template.body,
          html: template.html || template.body,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Resend送信エラー:', error);
      return false;
    }
  }

  // コンソール出力（開発用）
  private async sendToConsole(to: string, template: EmailTemplate): Promise<boolean> {
    console.log('=== メール送信（開発環境） ===');
    console.log('From:', `${this.fromName} <${this.fromEmail}>`);
    console.log('To:', to);
    console.log('Subject:', template.subject);
    console.log('Body:', template.body);
    console.log('HTML:', template.html);
    console.log('==============================');
    return true;
  }
}

// シングルトンインスタンスをエクスポート
export const emailService = new EmailService(); 