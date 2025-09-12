const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// 修正: メール正規表現をシンプルなバリデーションに変更
content = content.replace(
  '    // メール形式チェック\n    const emailRegex = /^[^\\[\\[\\completed, token\\]\\]@]+@[^\\s@]+\\.[^\\s@]+$/;\n    if (!emailRegex.test(email)) {\n      return res.status(400).json({ \n        success: false, \n        message: \'有効なメールアドレスを入力してください。\' \n      });\n    }',
  '    // メール形式チェック（シンプルなバリデーション）\n    if (!email || !email.includes(\'@\') || !email.includes(\'.\')) {\n      return res.status(400).json({ \n        success: false, \n        message: \'有効なメールアドレスを入力してください。\' \n      });\n    }'
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('メール正規表現をシンプルなバリデーションに変更完了');
