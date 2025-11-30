const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// 既存ユーザーチェックの部分を修正して、削除されたユーザーも強制的にクリーンアップ
content = content.replace(
  `    // 既存ユーザーチェック（activeなユーザーのみ）
    console.log('Checking existing active user for email:', email);
    const existingUser = await query(
      'SELECT id, status FROM users WHERE email = $1 AND status = $2',
      [email, 'active']
    );
    console.log('Existing active user query result:', existingUser.rows);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'このメールアドレスは既に登録されています。' 
      });
    }`,
  `    // 既存ユーザーチェック（すべてのユーザーを確認）
    console.log('Checking existing user for email:', email);
    const existingUser = await query(
      'SELECT id, status FROM users WHERE email = $1',
      [email]
    );
    console.log('Existing user query result:', existingUser.rows);

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log('既存ユーザーを発見:', user);
      
      // 削除されたユーザーの関連データを強制的にクリーンアップ
      console.log('関連データを強制的にクリーンアップ中...');
      await query('DELETE FROM user_documents WHERE user_id = $1', [user.id]);
      await query('DELETE FROM job_seekers WHERE user_id = $1', [user.id]);
      await query('DELETE FROM user_status_history WHERE user_id = $1', [user.id]);
      await query('DELETE FROM users WHERE id = $1', [user.id]);
      console.log('ユーザーと関連データを削除完了');
    }`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('強制クリーンアップ機能を追加完了');
