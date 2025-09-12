const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// メール正規表現チェックの残骸を削除
content = content.replace(
  `    }

      });
    }`,
  `    }`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('メール正規表現チェックの残骸を削除完了');
