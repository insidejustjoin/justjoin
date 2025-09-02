const fs = require('fs');

// RegistrationVerification.tsxの修正
const filePath = 'src/components/RegistrationVerification.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// handleDocumentsComplete関数を簡素化
const oldFunction = `  const handleDocumentsComplete = async (documentsData: any) => {
    try {
      const response = await fetch(\`/api/register/documents/\${token}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentsData),
      });

      const data = await response.json();

      if (data.success) {
        setStep('password');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('書類データの保存中にエラーが発生しました。');
    }
  };`;

const newFunction = `  const handleDocumentsComplete = async (documentsData: any) => {
    // 書類データの保存はDocumentGeneratorの"次へ"ボタンで既に実行されているため、
    // ここでは単純に次のステップに進む
    setStep('password');
  };`;

content = content.replace(oldFunction, newFunction);
fs.writeFileSync(filePath, content);

console.log('RegistrationVerification.tsx を修正しました');
