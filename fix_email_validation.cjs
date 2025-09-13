const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// メール正規表現チェックを完全に削除
content = content.replace(
  `    // メール形式チェック
    const emailRegex = /^[^\\[\\[\\completed, token\\]\\]@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '有効なメールアドレスを入力してください。' 
      });
    }`,
  `    // メール形式チェック（削除済み）`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('メール正規表現チェックを削除完了');
