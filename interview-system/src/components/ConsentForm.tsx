import React, { useState } from 'react';
import { CheckIcon, AlertTriangleIcon, UserIcon, GlobeIcon, ShieldIcon, FileTextIcon, VideoIcon } from 'lucide-react';
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
    
    // エラーをクリア
    if (errors.consent) {
      setErrors(prev => ({ ...prev, consent: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <VideoIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{t.subtitle}</p>
            <p className="text-gray-600 leading-relaxed">{t.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 言語選択 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.languageLabel}
              </label>
              <div className="flex items-center space-x-4 bg-gray-50 rounded-xl p-4">
                <GlobeIcon className="w-6 h-6 text-gray-500" />
                <button
                  type="button"
                  onClick={() => onLanguageChange('ja')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    language === 'ja'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  日本語
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    language === 'en'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* 同意事項 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <ShieldIcon className="w-6 h-6 text-blue-600 mr-3" />
                {t.consentTitle}
              </h2>
              
              <div className="space-y-6">
                {/* 録画・記録の同意 */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      id="consentRecording"
                      checked={formData.consentRecording}
                      onChange={(e) => handleInputChange('consentRecording', e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="consentRecording" className="block text-sm font-semibold text-blue-900 mb-2">
                        {t.consentRecording}
                      </label>
                      <p className="text-sm text-blue-700 leading-relaxed">{t.consentRecordingText}</p>
                    </div>
                  </div>
                </div>

                {/* データ処理の同意 */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      id="consentDataProcessing"
                      checked={formData.consentDataProcessing}
                      onChange={(e) => handleInputChange('consentDataProcessing', e.target.checked)}
                      className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="consentDataProcessing" className="block text-sm font-semibold text-green-900 mb-2">
                        {t.consentDataProcessing}
                      </label>
                      <p className="text-sm text-green-700 leading-relaxed">{t.consentDataProcessingText}</p>
                    </div>
                  </div>
                </div>

                {/* 利用規約の同意 */}
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      id="consentTerms"
                      checked={formData.consentTerms}
                      onChange={(e) => handleInputChange('consentTerms', e.target.checked)}
                      className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="consentTerms" className="block text-sm font-semibold text-purple-900 mb-2">
                        {t.consentTerms}
                      </label>
                      <p className="text-sm text-purple-700 leading-relaxed">{t.consentTermsText}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* エラーメッセージ */}
            {errors.consent && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700">{errors.consent}</p>
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t.startButton}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm; 