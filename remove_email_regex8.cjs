const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// 修正: メール正規表現チェックを完全に削除
content = content.replace(
  '    // メール形式チェック\n    const emailRegex = /^[^\\[\\[\\completed, token\\]\\]@]+@[^\\s@]+\\.[^\\s@]+$/;\n    if (!emailRegex.test(email)) {\n      return res.status(400).json({ \n        success: false, \n        message: \'有効なメールアドレスを入力してください。\' \n      });\n    }',
  '    // メール形式チェック（削除）'
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('メール正規表現チェックを削除完了');
