import React from 'react';
import { Helmet } from 'react-helmet-async';
import { TemporaryRegistrationForm } from '@/components/TemporaryRegistrationForm';

const JobSeekerRegister: React.FC = () => {
  const handleSuccess = () => {
    // 仮登録成功時の処理（更新: 2025-08-28 23:45 - 強制更新）
    console.log('仮登録が完了しました');
  };

  return (
    <>
      <Helmet>
        <title>求職者仮登録 - JustJoin</title>
        <meta name="description" content="JustJoinで求職者として仮登録を行い、キャリアの次のステップを始めましょう。" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              求職者仮登録 - 新システム
            </h1>
            <p className="text-gray-600">
              メールアドレスとお名前を入力して仮登録を開始してください（更新: 2025-08-28 23:45）
            </p>
          </div>
          
          <TemporaryRegistrationForm onSuccess={handleSuccess} />
          
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              既にアカウントをお持ちの方は
              <a href="/jobseeker/login" className="text-blue-600 hover:text-blue-800 underline">
                こちらからログイン
              </a>
              してください
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSeekerRegister;
