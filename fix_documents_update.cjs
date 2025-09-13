const fs = require('fs');

// ファイルを読み込み
let content = fs.readFileSync('src/server/api/temporaryRegistration.ts', 'utf8');

// 書類データ保存のSQLクエリを修正
content = content.replace(
  `    // 書類データ保存
    await query(
      \`UPDATE temporary_registrations 
       SET documents_data = $1, status = $2, updated_at = NOW() 
       WHERE verification_token = $2\`,
      [JSON.stringify(documentsData), 'documents_completed', token]
    );`,
  `    // 書類データ保存
    await query(
      \`UPDATE temporary_registrations 
       SET documents_data = $1, status = $2, updated_at = NOW() 
       WHERE verification_token = $3\`,
      [JSON.stringify(documentsData), 'documents_completed', token]
    );`
);

// ファイルに書き戻し
fs.writeFileSync('src/server/api/temporaryRegistration.ts', content);

console.log('書類データ保存のSQLクエリを修正完了');
