import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { EmailVerificationForm } from '@/components/EmailVerificationForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BetaNotice } from '@/components/BetaNotice';
import { Button } from '@/components/ui/button';
import { Briefcase, Key, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JobSeekerRegister: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
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
        <title>{t('register.title')} - JustJoin</title>
        <meta name="description" content={t('register.description')} />
      </Helmet>
      
      {/* メインコンテナ - ログイン画面と同じスタイル */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 言語切り替えボタン - ログイン画面と同じ位置 */}
          <div className="absolute top-6 right-6 z-50">
            <LanguageToggle />
          </div>

          <div className="w-full space-y-8">
            {/* タイトルセクション - ログイン画面と同じスタイル */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {t('register.title')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('register.description')}
              </p>
            </div>
          
            {/* メール本人確認フロー */}
            <EmailVerificationForm />
            
            {/* β版表記 - ログイン画面と同じ */}
            <div className="mt-6">
              <BetaNotice />
            </div>

            {/* ナビゲーションボタン */}
            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/jobseeker/login')}
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                {t('common.login') || 'ログイン / Login'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = 'https://justjoin.jp/'}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('auth.goToTopPage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSeekerRegister;
