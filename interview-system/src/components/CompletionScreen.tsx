import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  MessageCircleIcon,
  MailIcon,
  HomeIcon,
  StarIcon,
  BarChart3Icon,
  CalendarIcon,
  UserCheckIcon,
  AwardIcon
} from 'lucide-react';
import { Language } from '@/types/interview';

interface CompletionScreenProps {
  sessionId: string;
  language: Language;
  duration?: number;
  questionsAnswered?: number;
  totalQuestions?: number;
  onRestart?: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  sessionId,
  language,
  duration = 0,
  questionsAnswered = 0,
  totalQuestions = 10,
  onRestart
}) => {
  const texts = {
    ja: {
      title: '面接完了',
      subtitle: 'お疲れさまでした',
      description: 'AI面接が完了いたしました。貴重なお時間をいただき、ありがとうございました。',
      
      statistics: '面接統計',
      duration: '所要時間',
      questionsAnswered: '回答した質問数',
      completionRate: '完了率',
      
      nextSteps: '今後の流れ',
      step1Title: '結果の評価',
      step1Description: 'いただいた回答を基に、AI システムが評価を行います。',
      step2Title: '担当者による確認',
      step2Description: '評価結果は採用担当者が確認し、総合的に判断いたします。',
      step3Title: '結果のご連絡',
      step3Description: '面接結果については、1週間以内にメールでご連絡いたします。',
      
      sessionInfo: 'セッション情報',
      sessionId: 'セッションID',
      
      actions: 'その他のアクション',
      goHome: 'ホームページに戻る',
      newInterview: '新しい面接を開始',
      contactUs: 'お問い合わせ',
      
      feedback: 'フィードバック',
      feedbackDescription: '面接システムの改善のため、ご意見・ご感想をお聞かせください。',
      
      thankYou: 'ありがとうございました',
      finalMessage: 'Just Join でのキャリア機会をお探しいただき、ありがとうございます。今後ともよろしくお願いいたします。'
    },
    en: {
      title: 'Interview Completed',
      subtitle: 'Thank you for your time',
      description: 'The AI interview has been completed. Thank you for your valuable time.',
      
      statistics: 'Interview Statistics',
      duration: 'Duration',
      questionsAnswered: 'Questions Answered',
      completionRate: 'Completion Rate',
      
      nextSteps: 'Next Steps',
      step1Title: 'Result Evaluation',
      step1Description: 'Our AI system will evaluate your responses.',
      step2Title: 'Review by Recruiter',
      step2Description: 'The evaluation results will be reviewed by our recruitment team for comprehensive assessment.',
      step3Title: 'Result Notification',
      step3Description: 'You will receive the interview results via email within one week.',
      
      sessionInfo: 'Session Information',
      sessionId: 'Session ID',
      
      actions: 'Other Actions',
      goHome: 'Go to Homepage',
      newInterview: 'Start New Interview',
      contactUs: 'Contact Us',
      
      feedback: 'Feedback',
      feedbackDescription: 'Please share your opinions and feedback to help us improve our interview system.',
      
      thankYou: 'Thank You',
      finalMessage: 'Thank you for exploring career opportunities with Just Join. We look forward to working with you.'
    }
  };

  const t = texts[language];

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationEn = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleGoHome = () => {
    window.location.href = 'https://justjoin.jp/jobseeker/my-page';
  };

  const handleContactUs = () => {
    window.location.href = 'mailto:support@justjoin.jp';
  };

  const completionRate = Math.round((questionsAnswered / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <CheckCircleIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{t.subtitle}</p>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 統計とセッション情報 */}
          <div className="space-y-8">
            {/* 面接統計 */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3Icon className="w-6 h-6 text-blue-600 mr-3" />
                {t.statistics}
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-gray-700">{t.duration}</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {language === 'ja' ? formatDuration(duration) : formatDurationEn(duration)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <MessageCircleIcon className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-gray-700">{t.questionsAnswered}</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {questionsAnswered}/{totalQuestions}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <AwardIcon className="w-6 h-6 text-purple-600" />
                    <span className="font-medium text-gray-700">{t.completionRate}</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {completionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* セッション情報 */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserCheckIcon className="w-5 h-5 text-gray-600 mr-3" />
                {t.sessionInfo}
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{t.sessionId}</span>
                  <span className="text-sm font-mono text-gray-800">{sessionId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: 今後の流れとアクション */}
          <div className="space-y-8">
            {/* 今後の流れ */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <CalendarIcon className="w-6 h-6 text-orange-600 mr-3" />
                {t.nextSteps}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t.step1Title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{t.step1Description}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t.step2Title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{t.step2Description}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t.step3Title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{t.step3Description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.actions}</h2>
              <div className="space-y-4">
                <button
                  onClick={handleGoHome}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-3"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>{t.goHome}</span>
                </button>
                
                {onRestart && (
                  <button
                    onClick={onRestart}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <StarIcon className="w-5 h-5" />
                    <span>{t.newInterview}</span>
                  </button>
                )}
                
                <button
                  onClick={handleContactUs}
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-3"
                >
                  <MailIcon className="w-5 h-5" />
                  <span>{t.contactUs}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t.thankYou}</h3>
            <p className="text-gray-600 leading-relaxed">{t.finalMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen; 