#!/usr/bin/env node

/**
 * メイン管理者アカウント作成スクリプト
 * inside.justjoin@gmail.com の管理者アカウントを作成します
 */

// dotenvを読み込んで環境変数を設定
require('dotenv').config();

async function createMainAdmin() {
  try {
    console.log('🔧 メイン管理者アカウントを作成中...');
    
    // 動的インポートを使用
    const { authRepository } = await import('../dist-server/integrations/postgres/auth.js');
    
    const adminEmail = 'inside.justjoin@gmail.com';
    const adminPassword = 'Admin2024!'; // 初期パスワード
    
    console.log(`📧 管理者メールアドレス: ${adminEmail}`);
    console.log(`🔑 初期パスワード: ${adminPassword}`);
    console.log('');
    
    // 管理者アカウントを作成
    const result = await authRepository.createAdmin(adminEmail, adminPassword);
    
    if (result) {
      console.log('✅ メイン管理者アカウントを作成しました');
      console.log('');
      console.log('📋 管理者アカウント情報:');
      console.log(`   メールアドレス: ${result.user.email}`);
      console.log(`   ユーザーID: ${result.user.id}`);
      console.log(`   ユーザータイプ: ${result.user.user_type}`);
      console.log(`   ステータス: ${result.user.status}`);
      console.log(`   作成日: ${result.user.created_at}`);
      console.log('');
      console.log('🔑 ログイン情報:');
      console.log(`   メールアドレス: ${adminEmail}`);
      console.log(`   パスワード: ${adminPassword}`);
      console.log('');
      console.log('🌐 管理者画面URL:');
      console.log('   https://justjoin.jp/admin/login');
      console.log('');
      console.log('⚠️  注意事項:');
      console.log('   • このパスワードは初期設定用です');
      console.log('   • ログイン後は必ずパスワードを変更してください');
      console.log('   • 管理者アカウントは inside.justjoin@gmail.com のみ許可されています');
    } else {
      console.log('❌ 管理者アカウントの作成に失敗しました');
    }
    
  } catch (error) {
    console.error('❌ 管理者アカウントの作成に失敗しました:');
    console.error(error.message);
    
    if (error.message.includes('既に管理者として登録されています')) {
      console.log('');
      console.log('ℹ️  管理者アカウントは既に存在しています');
      console.log('   パスワードリセットが必要な場合は、管理者画面からリセットしてください');
    }
    
    console.error(error.stack);
    process.exit(1);
  }
}

// メイン管理者アカウント作成を実行
createMainAdmin(); 