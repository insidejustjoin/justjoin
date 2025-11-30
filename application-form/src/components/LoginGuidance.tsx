import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoginGuidanceProps {
  onClose: () => void;
  onTabChange: (tab: 'login' | 'register') => void;
  currentTab: 'login' | 'register';
}

export function LoginGuidance({ onClose, onTabChange, currentTab }: LoginGuidanceProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [step, setStep] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // 10秒後に自動的に消去
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    setStep(currentTab);
  }, [currentTab]);

  if (!isVisible) {
    return null;
  }

  const handleNext = () => {
    if (step === 'login') {
      setStep('register');
      onTabChange('register');
    } else {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* 言語切り替えボタン */}
        <button
          onClick={handleLanguageToggle}
          className="absolute top-2 left-2 p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1"
          title={language === 'ja' ? t('loginGuidance.switchToEnglish') : t('loginGuidance.switchToJapanese')}
        >
          <Globe className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-500">
            {language === 'ja' ? 'EN' : 'JA'}
          </span>
        </button>

        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* ガイダンス内容 */}
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step === 'login' ? t('loginGuidance.loginTitle') : t('loginGuidance.registerTitle')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {step === 'login' ? t('loginGuidance.loginDescription') : t('loginGuidance.registerDescription')}
            </p>
            
            {/* 言語切り替えヒント */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                💡 {t('loginGuidance.languageHint')}
              </p>
            </div>
            
            {/* タブハイライト表示 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-4">
                <div className={`text-center ${step === 'login' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded flex items-center justify-center mx-auto mb-2 ${step === 'login' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t('auth.loginTab')}</span>
                </div>
                <div className={`text-center ${step === 'register' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded flex items-center justify-center mx-auto mb-2 ${step === 'register' ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t('auth.jobSeekerTab')}</span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <Button 
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {step === 'login' ? (
                <>
                  {t('loginGuidance.nextButton')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                t('loginGuidance.proceedButton')
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            {t('loginGuidance.autoClose')}
          </p>
        </div>
      </div>
    </div>
  );
} 