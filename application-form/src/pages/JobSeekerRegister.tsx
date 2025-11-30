import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { EmailVerificationForm } from '@/components/EmailVerificationForm';

const JobSeekerRegister: React.FC = () => {
  // HubSpotコードを埋め込み
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'hs-script-loader';
    script.async = true;
    script.defer = true;
    script.src = '//js-na2.hs-scripts.com/244488087.js';
    
    // 既存のスクリプトがあれば削除
    const existingScript = document.getElementById('hs-script-loader');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.body.appendChild(script);
    
    return () => {
      // クリーンアップ時にスクリプトを削除
      const scriptToRemove = document.getElementById('hs-script-loader');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>求職者登録 - JustJoin</title>
        <meta name="description" content="JustJoinで求職者として登録を行い、キャリアの次のステップを始めましょう。" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              求職者新規登録 / Job Seeker Registration
            </h1>
            <p className="text-gray-600">
              メールアドレスとお名前を入力して登録を開始してください
            </p>
          </div>
          
          {/* メール本人確認フロー */}
          <EmailVerificationForm />
        </div>
      </div>
    </>
  );
};

export default JobSeekerRegister;
