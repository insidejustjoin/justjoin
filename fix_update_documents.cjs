const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// update-documentsエンドポイントのSQLクエリを修正
content = content.replace(
  `    await query(
      \`UPDATE temporary_registrations 
       SET documents_data = $1, status = $2, updated_at = NOW() 
       WHERE verification_token = $2\`,
      [JSON.stringify(documentsData), 'documents_completed', token]
    );`,
  `    await query(
      \`UPDATE temporary_registrations 
       SET documents_data = $1, status = $2, updated_at = NOW() 
       WHERE verification_token = $3\`,
      [JSON.stringify(documentsData), 'documents_completed', token]
    );`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('update-documentsエンドポイントのSQLクエリを修正完了');
