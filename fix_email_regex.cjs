const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// 修正: メール正規表現を修正
content = content.replace(
  'const emailRegex = /^[^\\[\\[\\completed, token\\]\\]@]+@[^\\s@]+\\.[^\\s@]+$/;',
  'const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;'
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('メール正規表現修正完了');
