const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// 仮登録APIの開始部分にログを追加
content = content.replace(
  `app.post('/api/register/temporary', async (req, res) => {`,
  `app.post('/api/register/temporary', async (req, res) => {
    console.log('=== 仮登録API開始 ===');
    console.log('リクエストボディ:', req.body);`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('デバッグログを追加完了');
