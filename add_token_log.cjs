const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// トークン生成後にログを追加
content = content.replace(
  `    // 仮登録トークン生成
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後`,
  `    // 仮登録トークン生成
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後
    console.log('生成されたトークン:', verificationToken);`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('トークンログを追加完了');
