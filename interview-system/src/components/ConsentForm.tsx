import React, { useState } from 'react';
import { Check, Shield, Globe, Radio } from 'lucide-react';
import { Language } from '@/types/interview';

interface ConsentFormProps {
  onConsent: (data: {
    consentGiven: boolean;
    email?: string;
    name?: string;
    language: Language;
    position?: string;
  }) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const ConsentForm: React.FC<ConsentFormProps> = ({ 
  onConsent, 
  language, 
  onLanguageChange 
}) => {
  const [formData, setFormData] = useState({
    consentRecording: false,
    consentDataProcessing: false,
    consentTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const texts = {
    ja: {
      title: 'AI面接システム',
      subtitle: 'Just Join オンライン一次面接',
      description: '約10〜15分程度のAI面接を行います。リラックスしてご自分らしくお答えください。',
      consentTitle: '同意事項',
      consentRecording: '面接の録画・記録について',
      consentRecordingText: 'この面接は品質向上と評価のため録画・記録されます。データは安全に管理され、採用プロセス以外の目的では使用されません。',
      consentDataProcessing: 'データ処理について',
      consentDataProcessingText: '入力いただいた情報と面接内容は、Google Cloud Platform上で安全に処理・保存されます。データは暗号化され、適切なセキュリティ対策が講じられています。',
      consentTerms: '利用規約',
      consentTermsText: 'Just Joinの利用規約とプライバシーポリシーに同意します。',
      languageLabel: '面接言語',
      agreeCheckbox: '上記に同意する',
      startButton: '面接を開始',
      errors: {
        consentRequired: 'すべての同意事項にチェックを入れてください'
      }
    },
    en: {
      title: 'AI Interview System',
      subtitle: 'Just Join Online Primary Interview',
      description: 'We will conduct an AI interview for about 10-15 minutes. Please relax and answer naturally.',
      consentTitle: 'Consent Items',
      consentRecording: 'Interview Recording',
      consentRecordingText: 'This interview will be recorded for quality improvement and evaluation purposes. Data will be managed securely and will not be used for purposes other than the recruitment process.',
      consentDataProcessing: 'Data Processing',
      consentDataProcessingText: 'The information you provide and the interview content will be securely processed and stored on Google Cloud Platform. Data is encrypted and appropriate security measures are in place.',
      consentTerms: 'Terms of Service',
      consentTermsText: 'I agree to Just Join\'s Terms of Service and Privacy Policy.',
      languageLabel: 'Interview Language',
      agreeCheckbox: 'I agree to the above',
      startButton: 'Start Interview',
      errors: {
        consentRequired: 'Please check all consent items'
      }
    }
  };

  const t = texts[language];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.consentRecording || !formData.consentDataProcessing || !formData.consentTerms) {
      newErrors.consent = t.errors.consentRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onConsent({
      consentGiven: true,
      language,
      email: '',
      name: '',
      position: ''
    });
  };

  const handleInputChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors.consent) {
      setErrors(prev => ({ ...prev, consent: '' }));
    }
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'uz', name: 'O\'zbek' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full animate-fade-in">
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 overflow-hidden">
          {/* 装飾的な背景要素 */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-100/50 to-pink-100/50 rounded-full blur-3xl -ml-48 -mb-48"></div>
          
          <div className="relative">
            {/* ヘッダー */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <Radio className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{t.title}</h1>
              <p className="text-xl text-blue-600 font-semibold mb-4">{t.subtitle}</p>
              <p className="text-gray-600 leading-relaxed text-lg">{t.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 言語選択 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  <Globe className="inline-block w-5 h-5 mr-2" />
                  {t.languageLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => onLanguageChange(lang.code)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        language === lang.code
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 同意事項 */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-6 h-6 text-blue-600 mr-3" />
                  {t.consentTitle}
                </h2>
                
                <div className="space-y-4">
                  {/* 録画・記録の同意 */}
                  <div className="relative bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-300 transition-all">
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          id="consentRecording"
                          checked={formData.consentRecording}
                          onChange={(e) => handleInputChange('consentRecording', e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                        {formData.consentRecording && (
                          <Check className="absolute top-0 left-0 w-5 h-5 text-blue-600 pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label htmlFor="consentRecording" className="block text-base font-semibold text-blue-900 mb-2 cursor-pointer">
                          {t.consentRecording}
                        </label>
                        <p className="text-sm text-blue-800 leading-relaxed">{t.consentRecordingText}</p>
                      </div>
                    </div>
                  </div>

                  {/* データ処理の同意 */}
                  <div className="relative bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 transition-all">
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          id="consentDataProcessing"
                          checked={formData.consentDataProcessing}
                          onChange={(e) => handleInputChange('consentDataProcessing', e.target.checked)}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                        />
                        {formData.consentDataProcessing && (
                          <Check className="absolute top-0 left-0 w-5 h-5 text-green-600 pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label htmlFor="consentDataProcessing" className="block text-base font-semibold text-green-900 mb-2 cursor-pointer">
                          {t.consentDataProcessing}
                        </label>
                        <p className="text-sm text-green-800 leading-relaxed">{t.consentDataProcessingText}</p>
                      </div>
                    </div>
                  </div>

                  {/* 利用規約の同意 */}
                  <div className="relative bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-300 transition-all">
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          id="consentTerms"
                          checked={formData.consentTerms}
                          onChange={(e) => handleInputChange('consentTerms', e.target.checked)}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                        />
                        {formData.consentTerms && (
                          <Check className="absolute top-0 left-0 w-5 h-5 text-purple-600 pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label htmlFor="consentTerms" className="block text-base font-semibold text-purple-900 mb-2 cursor-pointer">
                          {t.consentTerms}
                        </label>
                        <p className="text-sm text-purple-800 leading-relaxed">{t.consentTermsText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* エラーメッセージ */}
              {errors.consent && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-slide-in-up">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-sm text-red-700 font-medium">{errors.consent}</p>
                  </div>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  {t.startButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm;
