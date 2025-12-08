import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { EmailVerificationForm } from '@/components/EmailVerificationForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Link } from 'react-router-dom';

const JobSeekerRegister: React.FC = () => {
  const { t } = useLanguage();
  
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
      
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">justjoin</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                to="/jobseeker" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('common.login')}
              </Link>
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('register.title')}
            </h1>
            <p className="text-gray-600">
              {t('register.description')}
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
