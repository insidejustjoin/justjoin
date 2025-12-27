import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  MessageCircle,
  Mail,
  Home,
  Star,
  BarChart3,
  Calendar,
  Award,
  Sparkles
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
      closeWindow: 'このウィンドウを閉じる',
      contactUs: 'お問い合わせ',
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
      closeWindow: 'Close this window',
      contactUs: 'Contact Us',
      thankYou: 'Thank You',
      finalMessage: 'Thank you for exploring career opportunities with Just Join. We look forward to working with you.'
    },
    ru: {
      title: 'Интервью завершено',
      subtitle: 'Спасибо за ваше время',
      description: 'AI-интервью завершено. Спасибо за ваше ценное время.',
      statistics: 'Статистика интервью',
      duration: 'Продолжительность',
      questionsAnswered: 'Отвеченных вопросов',
      completionRate: 'Процент завершения',
      nextSteps: 'Следующие шаги',
      step1Title: 'Оценка результатов',
      step1Description: 'Наша AI-система оценит ваши ответы.',
      step2Title: 'Проверка рекрутером',
      step2Description: 'Результаты оценки будут проверены нашей командой по подбору персонала для комплексной оценки.',
      step3Title: 'Уведомление о результатах',
      step3Description: 'Вы получите результаты интервью по электронной почте в течение одной недели.',
      sessionInfo: 'Информация о сессии',
      sessionId: 'ID сессии',
      actions: 'Другие действия',
      closeWindow: 'Закрыть это окно',
      contactUs: 'Связаться с нами',
      thankYou: 'Спасибо',
      finalMessage: 'Спасибо за изучение карьерных возможностей в Just Join. Мы с нетерпением ждем сотрудничества с вами.'
    },
    uz: {
      title: 'Intervyu yakunlandi',
      subtitle: 'Vaqtingiz uchun rahmat',
      description: 'AI intervyu yakunlandi. Qimmatli vaqtingiz uchun rahmat.',
      statistics: 'Intervyu statistikasi',
      duration: 'Davomiyligi',
      questionsAnswered: 'Javob berilgan savollar',
      completionRate: 'Yakunlanish foizi',
      nextSteps: 'Keyingi qadamlar',
      step1Title: 'Natijalarni baholash',
      step1Description: 'Bizning AI tizimimiz javoblaringizni baholaydi.',
      step2Title: 'Ishga qabul qiluvchi tomonidan tekshirish',
      step2Description: 'Baholash natijalari bizning ishga qabul qilish jamoamiz tomonidan kompleks baholash uchun ko\'rib chiqiladi.',
      step3Title: 'Natija xabari',
      step3Description: 'Siz intervyu natijalarini bir hafta ichida elektron pochta orqali olasiz.',
      sessionInfo: 'Sessiya ma\'lumotlari',
      sessionId: 'Sessiya ID',
      actions: 'Boshqa harakatlar',
      closeWindow: 'Ushbu oynani yoping',
      contactUs: 'Biz bilan bog\'lanish',
      thankYou: 'Rahmat',
      finalMessage: 'Just Join bilan martaba imkoniyatlarini o\'rganganingiz uchun rahmat. Siz bilan ishlashni kutamiz.'
    }
  };

  const t = texts[language] || texts.ja;

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

  const handleCloseWindow = () => {
    window.close();
    // ウィンドウが閉じられない場合（ポップアップでない場合）はホームページにリダイレクト
    if (!window.closed) {
    window.location.href = 'https://justjoin.jp/jobseeker/my-page';
    }
  };

  const handleContactUs = () => {
    window.location.href = 'mailto:inside.justjoin@gmail.com?subject=面接システムに関するお問い合わせ';
  };

  const completionRate = Math.round((questionsAnswered / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-2xl text-emerald-600 font-semibold mb-6">{t.subtitle}</p>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto text-lg">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 左側: 統計とセッション情報 */}
          <div className="space-y-8 animate-slide-in-up">
            {/* 面接統計 */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
                  {t.statistics}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold text-gray-700">{t.duration}</span>
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {language === 'ja' ? formatDuration(duration) : formatDurationEn(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold text-gray-700">{t.questionsAnswered}</span>
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {questionsAnswered}/{totalQuestions}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold text-gray-700">{t.completionRate}</span>
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* セッション情報 */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100/50 to-pink-100/50 rounded-full blur-3xl -ml-32 -mb-32"></div>
              
              <div className="relative">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 text-purple-600 mr-3" />
                  {t.sessionInfo}
                </h2>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t.sessionId}</span>
                    <span className="text-sm font-mono text-gray-800 font-semibold">{sessionId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: 今後の流れとアクション */}
          <div className="space-y-8 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            {/* 今後の流れ */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-orange-100/50 to-yellow-100/50 rounded-full blur-3xl -ml-32 -mt-32"></div>
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-6 h-6 text-orange-600 mr-3" />
                  {t.nextSteps}
                </h2>
                <div className="space-y-6">
                  {[
                    { num: 1, title: t.step1Title, desc: t.step1Description, color: 'blue' },
                    { num: 2, title: t.step2Title, desc: t.step2Description, color: 'green' },
                    { num: 3, title: t.step3Title, desc: t.step3Description, color: 'purple' }
                  ].map((step, idx) => {
                    const colorClasses = {
                      blue: 'from-blue-500 to-blue-600',
                      green: 'from-green-500 to-green-600',
                      purple: 'from-purple-500 to-purple-600'
                    };
                    const bgColors = {
                      blue: 'from-blue-50 to-blue-100/50 border-blue-200',
                      green: 'from-green-50 to-green-100/50 border-green-200',
                      purple: 'from-purple-50 to-purple-100/50 border-purple-200'
                    };
                    
                    return (
                      <div key={idx} className={`flex items-start space-x-4 p-5 bg-gradient-to-r ${bgColors[step.color as keyof typeof bgColors]} rounded-2xl border`}>
                        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[step.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <span className="text-white font-bold">{step.num}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-pink-100/50 to-red-100/50 rounded-full blur-3xl -mr-32 -mb-32"></div>
              
              <div className="relative">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t.actions}</h2>
                <div className="space-y-4">
                  <button
                    onClick={handleCloseWindow}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Home className="w-5 h-5" />
                    <span>{t.closeWindow}</span>
                  </button>
                  
                  <button
                    onClick={handleContactUs}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Mail className="w-5 h-5" />
                    <span>{t.contactUs}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-10 max-w-3xl mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-100/30 via-emerald-100/30 to-blue-100/30"></div>
            
            <div className="relative">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.thankYou}</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{t.finalMessage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;
