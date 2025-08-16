import 'dotenv/config';
import { authRepository } from '../src/integrations/postgres/auth';
import { emailService } from '../src/services/emailService';

// コマンドライン引数からメールアドレスと氏名を取得
const email = process.argv[2];
const fullName = process.argv[3];

if (!email || !fullName) {
  console.error('使用方法: npx tsx scripts/register-jobseeker-server.ts <email> <fullName>');
  process.exit(1);
}

async function registerJobSeekerOnServer() {
  console.log('=== サーバーサイド求職者登録 ===');
  console.log(`📧 メールアドレス: ${email}`);
  console.log(`👤 氏名: ${fullName}`);
  
  try {
    // 既存ユーザーの確認
    const existingUser = await authRepository.getUserByEmail(email);
    if (existingUser) {
      console.log('❌ このメールアドレスはすでに使われています');
      process.exit(1);
    }

    // 求職者登録（サーバーサイドで実行）
    console.log('📝 求職者登録中...');
    const result = await authRepository.registerJobSeeker({ email, fullName });
    
    console.log('✅ 求職者登録成功');
    console.log('   ユーザーID:', result.user.id);
    console.log('   メールアドレス:', result.user.email);
    console.log('   ユーザータイプ:', result.user.user_type);
    console.log('   ステータス:', result.user.status);
    console.log('   パスワード:', result.password);
    
    // メール送信（サーバーサイドで実行）
    console.log('\n📧 メール送信中...');
    const emailSent = await emailService.sendJobSeekerPassword(email, fullName, result.password);
    
    if (emailSent) {
      console.log('✅ メール送信成功');
      console.log('   送信先:', email);
      console.log('   パスワード:', result.password);
    } else {
      console.log('❌ メール送信失敗');
    }
    
    console.log('\n🎉 登録完了');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
registerJobSeekerOnServer(); 