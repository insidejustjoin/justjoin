import 'dotenv/config';
import { query } from '../src/integrations/postgres';
import { hashPassword, generateRandomPassword } from '../src/utils/auth';

async function updateAdminEmail() {
  console.log('🔄 Updating admin email address...');
  
  try {
    const oldAdminEmail = 'admin@justjoin.jp';
    const newAdminEmail = 'whoami.inc.inside@gmail.com';

    // 既存の管理者アカウントを確認
    const existingAdmin = await query(`
      SELECT id, email, user_type, status, password_hash
      FROM users 
      WHERE email = $1
    `, [oldAdminEmail]);

    if (existingAdmin.rows.length === 0) {
      console.log('❌ Old admin account not found');
      return;
    }

    const admin = existingAdmin.rows[0];
    console.log(`✅ Found existing admin: ${admin.email}`);

    // 新しいメールアドレスが既に存在するかチェック
    const newEmailExists = await query(`
      SELECT id FROM users WHERE email = $1
    `, [newAdminEmail]);

    if (newEmailExists.rows.length > 0) {
      console.log(`⚠️  New email already exists: ${newAdminEmail}`);
      console.log('Updating existing account to admin type...');
      
      // 既存のアカウントを管理者に変更
      await query(`
        UPDATE users 
        SET user_type = 'admin', status = 'active'
        WHERE email = $1
      `, [newAdminEmail]);

      console.log(`✅ Updated existing account to admin: ${newAdminEmail}`);
    } else {
      // メールアドレスを更新
      await query(`
        UPDATE users 
        SET email = $1, updated_at = NOW()
        WHERE email = $2
      `, [newAdminEmail, oldAdminEmail]);

      console.log(`✅ Updated admin email from ${oldAdminEmail} to ${newAdminEmail}`);
    }

    // 新しい管理者アカウントの確認
    const updatedAdmin = await query(`
      SELECT id, email, user_type, status, created_at
      FROM users 
      WHERE email = $1
    `, [newAdminEmail]);

    if (updatedAdmin.rows.length > 0) {
      const admin = updatedAdmin.rows[0];
      console.log('\n✅ Admin account updated successfully:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   User Type: ${admin.user_type}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   ID: ${admin.id}`);
    }

    // 管理者アカウントのパスワードをリセット（必要に応じて）
    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);
    
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2
    `, [passwordHash, newAdminEmail]);

    console.log(`\n🔑 New admin password: ${password}`);
    console.log('\n📝 Admin login instructions:');
    console.log(`Email: ${newAdminEmail}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error updating admin email:', error);
    process.exit(1);
  }
}

updateAdminEmail(); 