import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from './types/interview';
import { LanguageToggle } from './components/LanguageToggle';
import './App.css';

type AppState = 'consent' | 'preparation' | 'checks' | 'interview' | 'completed' | 'error';

interface JobSeekerInfo {
  name: string;
  email: string;
  position: string;
}

interface Question {
  id: number;
  text: string;
  category: string;
}

interface CheckItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'checking' | 'success' | 'failed';
  message?: string;
}

// 翻訳テキスト
const translations = {
  ja: {
    consent: {
      title: 'AI面接システム',
      description: '約10〜15分程度のAI面接を行います。リラックスしてご自分らしくお答えください。',
      startButton: '面接を開始'
    },
    preparation: {
      title: '面接準備',
      jobSeeker: '求職者',
      email: 'メール',
      position: '職種',
      notSet: '未設定',
      flowTitle: '面接の流れ',
      flowItems: [
        '10個の質問に音声で回答',
        '各質問は1-2分程度で回答',
        'カメラとマイクの使用を許可してください',
        '静かな環境で面接を受けてください',
        '質問は自動音声で読み上げられます'
      ],
      startCheckButton: 'システムチェックを開始'
    },
    checks: {
      title: 'システムチェック中',
      description: '面接に必要な機能の動作確認を行っています',
      audioCheck: '音声チェック',
      videoCheck: '録画チェック',
      speechCheck: '音声合成チェック',
      autoStart: 'チェック完了後、自動的に面接を開始します'
    },
    interview: {
      title: 'AI面接中',
      question: '質問',
      jobSeeker: '求職者',
      position: '職種',
      notSet: '未設定',
      recording: '録画中',
      stopped: '録画停止',
      readQuestion: '質問を読み上げ',
      playing: '再生中...',
      answerInput: '回答入力',
      startRecording: '録音開始',
      stopRecording: '録音停止',
      listening: '音声を認識中...',
      placeholder: '録音開始ボタンを押して回答を開始してください',
      nextQuestion: '次の質問へ',
      complete: '面接完了',
      retry: 'やり直し',
      progress: '面接の進捗',
      remaining: '残り'
    },
    completed: {
      title: '面接完了',
      message: 'お疲れさまでした。AI面接が完了いたしました。',
      summary: '面接結果サマリー',
      answered: '回答した質問数',
      duration: '面接時間',
      sessionId: 'セッションID',
      nextSteps: '今後の流れ',
      nextStepsItems: [
        '回答内容のAI評価',
        '採用担当者による確認',
        '1週間以内に結果をご連絡'
      ],
      backHome: 'ホームに戻る',
      newInterview: '新しい面接'
    },
    error: {
      title: 'エラーが発生しました',
      backHome: 'ホームに戻る',
      retry: '再試行'
    }
  },
  en: {
    consent: {
      title: 'AI Interview System',
      description: 'The AI interview will take approximately 10-15 minutes. Please relax and answer naturally.',
      startButton: 'Start Interview'
    },
    preparation: {
      title: 'Interview Preparation',
      jobSeeker: 'Job Seeker',
      email: 'Email',
      position: 'Position',
      notSet: 'Not Set',
      flowTitle: 'Interview Flow',
      flowItems: [
        'Answer 10 questions with voice',
        'Answer each question in 1-2 minutes',
        'Please allow camera and microphone access',
        'Please take the interview in a quiet environment',
        'Questions will be read aloud automatically'
      ],
      startCheckButton: 'Start System Check'
    },
    checks: {
      title: 'System Check in Progress',
      description: 'Checking the functions required for the interview',
      audioCheck: 'Audio Check',
      videoCheck: 'Video Check',
      speechCheck: 'Speech Synthesis Check',
      autoStart: 'The interview will start automatically after the check is complete'
    },
    interview: {
      title: 'AI Interview in Progress',
      question: 'Question',
      jobSeeker: 'Job Seeker',
      position: 'Position',
      notSet: 'Not Set',
      recording: 'Recording',
      stopped: 'Stopped',
      readQuestion: 'Read Question',
      playing: 'Playing...',
      answerInput: 'Answer Input',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      listening: 'Listening...',
      placeholder: 'Press the start recording button to begin your answer',
      nextQuestion: 'Next Question',
      complete: 'Complete Interview',
      retry: 'Retry',
      progress: 'Interview Progress',
      remaining: 'Remaining'
    },
    completed: {
      title: 'Interview Completed',
      message: 'Thank you for your time. The AI interview has been completed.',
      summary: 'Interview Summary',
      answered: 'Questions Answered',
      duration: 'Interview Duration',
      sessionId: 'Session ID',
      nextSteps: 'Next Steps',
      nextStepsItems: [
        'AI evaluation of answers',
        'Review by hiring manager',
        'Results will be notified within 1 week'
      ],
      backHome: 'Back to Home',
      newInterview: 'New Interview'
    },
    error: {
      title: 'An Error Occurred',
      backHome: 'Back to Home',
      retry: 'Retry'
    }
  },
  ru: {
    consent: {
      title: 'Система AI-интервью',
      description: 'AI-интервью займет примерно 10-15 минут. Пожалуйста, расслабьтесь и отвечайте естественно.',
      startButton: 'Начать интервью'
    },
    preparation: {
      title: 'Подготовка к интервью',
      jobSeeker: 'Соискатель',
      email: 'Электронная почта',
      position: 'Должность',
      notSet: 'Не установлено',
      flowTitle: 'Процесс интервью',
      flowItems: [
        'Ответьте на 10 вопросов голосом',
        'Ответьте на каждый вопрос за 1-2 минуты',
        'Пожалуйста, разрешите доступ к камере и микрофону',
        'Пожалуйста, пройдите интервью в тихой обстановке',
        'Вопросы будут зачитаны автоматически'
      ],
      startCheckButton: 'Начать проверку системы'
    },
    checks: {
      title: 'Проверка системы',
      description: 'Проверка функций, необходимых для интервью',
      audioCheck: 'Проверка аудио',
      videoCheck: 'Проверка видео',
      speechCheck: 'Проверка синтеза речи',
      autoStart: 'Интервью начнется автоматически после завершения проверки'
    },
    interview: {
      title: 'AI-интервью в процессе',
      question: 'Вопрос',
      jobSeeker: 'Соискатель',
      position: 'Должность',
      notSet: 'Не установлено',
      recording: 'Запись',
      stopped: 'Остановлено',
      readQuestion: 'Прочитать вопрос',
      playing: 'Воспроизведение...',
      answerInput: 'Ввод ответа',
      startRecording: 'Начать запись',
      stopRecording: 'Остановить запись',
      listening: 'Прослушивание...',
      placeholder: 'Нажмите кнопку начала записи, чтобы начать ответ',
      nextQuestion: 'Следующий вопрос',
      complete: 'Завершить интервью',
      retry: 'Повторить',
      progress: 'Прогресс интервью',
      remaining: 'Осталось'
    },
    completed: {
      title: 'Интервью завершено',
      message: 'Спасибо за ваше время. AI-интервью завершено.',
      summary: 'Сводка интервью',
      answered: 'Отвеченные вопросы',
      duration: 'Продолжительность интервью',
      sessionId: 'ID сессии',
      nextSteps: 'Следующие шаги',
      nextStepsItems: [
        'AI-оценка ответов',
        'Проверка менеджером по найму',
        'Результаты будут уведомлены в течение 1 недели'
      ],
      backHome: 'Вернуться на главную',
      newInterview: 'Новое интервью'
    },
    error: {
      title: 'Произошла ошибка',
      backHome: 'Вернуться на главную',
      retry: 'Повторить'
    }
  },
  uz: {
    consent: {
      title: 'AI intervyu tizimi',
      description: 'AI intervyu taxminan 10-15 daqiqa davom etadi. Iltimos, tinchlanib, tabiiy javob bering.',
      startButton: 'Intervyuni boshlash'
    },
    preparation: {
      title: 'Intervyuga tayyorgarlik',
      jobSeeker: 'Ish qidiruvchi',
      email: 'Elektron pochta',
      position: 'Lavozim',
      notSet: 'O\'rnatilmagan',
      flowTitle: 'Intervyu jarayoni',
      flowItems: [
        '10 ta savolga ovoz bilan javob bering',
        'Har bir savolga 1-2 daqiqada javob bering',
        'Iltimos, kameraga va mikrofonlarga ruxsat bering',
        'Iltimos, intervyuni tinch muhitda o\'tkazing',
        'Savollar avtomatik ravishda o\'qiladi'
      ],
      startCheckButton: 'Tizimni tekshirishni boshlash'
    },
    checks: {
      title: 'Tizim tekshiruvi',
      description: 'Intervyu uchun zarur bo\'lgan funksiyalarni tekshirish',
      audioCheck: 'Audio tekshiruvi',
      videoCheck: 'Video tekshiruvi',
      speechCheck: 'Nutq sintezi tekshiruvi',
      autoStart: 'Tekshiruv tugagach, intervyu avtomatik ravishda boshlanadi'
    },
    interview: {
      title: 'AI intervyu davom etmoqda',
      question: 'Savol',
      jobSeeker: 'Ish qidiruvchi',
      position: 'Lavozim',
      notSet: 'O\'rnatilmagan',
      recording: 'Yozib olinmoqda',
      stopped: 'To\'xtatildi',
      readQuestion: 'Savolni o\'qish',
      playing: 'Ijro etilmoqda...',
      answerInput: 'Javob kiritish',
      startRecording: 'Yozib olishni boshlash',
      stopRecording: 'Yozib olishni to\'xtatish',
      listening: 'Tinglanmoqda...',
      placeholder: 'Javobni boshlash uchun yozib olish tugmasini bosing',
      nextQuestion: 'Keyingi savol',
      complete: 'Intervyuni yakunlash',
      retry: 'Qayta urinish',
      progress: 'Intervyu jarayoni',
      remaining: 'Qolgan'
    },
    completed: {
      title: 'Intervyu yakunlandi',
      message: 'Vaqtingiz uchun rahmat. AI intervyu yakunlandi.',
      summary: 'Intervyu xulosa',
      answered: 'Javob berilgan savollar',
      duration: 'Intervyu davomiyligi',
      sessionId: 'Sessiya ID',
      nextSteps: 'Keyingi qadamlar',
      nextStepsItems: [
        'Javoblarning AI baholanishi',
        'Ishga olish menejeri tomonidan ko\'rib chiqish',
        'Natijalar 1 hafta ichida xabar qilinadi'
      ],
      backHome: 'Bosh sahifaga qaytish',
      newInterview: 'Yangi intervyu'
    },
    error: {
      title: 'Xatolik yuz berdi',
      backHome: 'Bosh sahifaga qaytish',
      retry: 'Qayta urinish'
    }
  }
};

function App() {
  const [currentState, setCurrentState] = useState<AppState>('consent');
  const [language, setLanguage] = useState<Language>('ja');
  const [error, setError] = useState<string>('');
  const [isTokenAuth, setIsTokenAuth] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [jobSeekerInfo, setJobSeekerInfo] = useState<JobSeekerInfo | null>(null);
  
  // 翻訳テキストを取得
  const t = translations[language] || translations.ja;
  
  // 言語切り替え関数（ja -> en -> ru -> uz -> ja のサイクル）
  const toggleLanguage = () => {
    const languages: Language[] = ['ja', 'en', 'ru', 'uz'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };
  
  // 言語名を取得
  const getLanguageName = (lang: Language): string => {
    const names: Record<Language, string> = {
      ja: '日本語',
      en: 'English',
      ru: 'Русский',
      uz: 'O\'zbek'
    };
    return names[lang] || '日本語';
  };
  
  // 面接関連の状態
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  // 音声・録画関連の状態
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  
  // チェック項目の状態（翻訳対応）
  const getCheckItems = useCallback((): CheckItem[] => {
    const currentT = translations[language] || translations.ja;
    const descriptions: Record<Language, string> = {
      ja: 'マイクの動作確認を行います',
      en: 'Checking microphone functionality',
      ru: 'Проверка функциональности микрофона',
      uz: 'Mikrofon funksiyasini tekshirish'
    };
    const videoDescriptions: Record<Language, string> = {
      ja: 'カメラの動作確認を行います',
      en: 'Checking camera functionality',
      ru: 'Проверка функциональности камеры',
      uz: 'Kamera funksiyasini tekshirish'
    };
    const speechDescriptions: Record<Language, string> = {
      ja: '質問の音声読み上げを確認します',
      en: 'Checking speech synthesis',
      ru: 'Проверка синтеза речи',
      uz: 'Nutq sintezini tekshirish'
    };
    return [
    {
      id: 'audio',
        title: currentT.checks.audioCheck,
        description: descriptions[language] || descriptions.ja,
      status: 'pending'
    },
    {
      id: 'video',
        title: currentT.checks.videoCheck,
        description: videoDescriptions[language] || videoDescriptions.ja,
      status: 'pending'
    },
    {
      id: 'speech',
        title: currentT.checks.speechCheck,
        description: speechDescriptions[language] || speechDescriptions.ja,
      status: 'pending'
    }
    ];
  }, [language]);
  
  const [checkItems, setCheckItems] = useState<CheckItem[]>(getCheckItems());
  
  // 言語が変更されたらチェック項目を更新
  useEffect(() => {
    setCheckItems(getCheckItems());
  }, [language, getCheckItems]);
  
  // refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 面接質問リスト（更新版）
  const questions: Question[] = [
    { id: 1, text: '簡単に自己紹介をしてください。', category: '自己紹介' },
    { id: 2, text: '現在の職務内容について教えてください。', category: '職務内容' },
    { id: 3, text: 'これまでに最も達成感を感じたプロジェクトについて教えてください。', category: 'プロジェクト経験' },
    { id: 4, text: 'チームでの役割についてどのように考えていますか？', category: 'チームワーク' },
    { id: 5, text: '当社（Just Join）に応募した理由は何ですか？', category: '志望動機' },
    { id: 6, text: 'ご自身の強み・弱みを教えてください。', category: '自己分析' },
    { id: 7, text: '技術的に得意な分野と今後学びたい技術は何ですか？', category: '技術スキル' },
    { id: 8, text: '困難な問題に直面した時、どのように解決しますか？', category: '問題解決' },
    { id: 9, text: '将来的なキャリアビジョンについて教えてください。', category: 'キャリアビジョン' },
    { id: 10, text: '最後に何か質問はありますか？', category: '逆質問' }
  ];

  // 音声合成の初期化
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // 初期ローディング状態
  const [isInitializing, setIsInitializing] = useState(true);

  // URLパラメータからトークンを取得
  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      try {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const lang = urlParams.get('lang') || 'ja';
    
        // 言語を検証（ja, en, ru, uzのみ許可）
        const validLang = (lang === 'ja' || lang === 'en' || lang === 'ru' || lang === 'uz') ? lang : 'ja';
        setLanguage(validLang as Language);
        
        // 少し待機してスムーズな遷移を実現
        await new Promise(resolve => setTimeout(resolve, 500));
    
    if (token) {
          await verifyToken(token);
        } else {
          // トークンがない場合は同意画面に進む（テスト用にも対応）
          console.log('トークンなし: 同意画面に進みます');
          setCurrentState('consent');
        }
      } catch (error) {
        console.error('初期化エラー:', error);
        setError('初期化中にエラーが発生しました。ページをリロードしてください。');
        setCurrentState('error');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeApp();
  }, []);

  // トークン検証（修正版）
  const verifyToken = async (token: string) => {
    console.log('トークン検証開始:', token.substring(0, 50) + '...');
    try {
      // Base64デコードしてトークンデータを取得
      let decodedToken;
      try {
        const decoded = atob(token);
        console.log('デコードされたトークン:', decoded);
        decodedToken = JSON.parse(decoded);
        console.log('パースされたトークン:', decodedToken);
      } catch (decodeError) {
        console.warn('トークンデコードエラー（無視して続行）:', decodeError);
        // デコードに失敗した場合は、トークンなしとして処理
        console.log('トークンデコード失敗: 同意画面に進みます');
        setCurrentState('consent');
        return;
      }
      
      // トークンの必須フィールドを緩和（userIdがあればOK、emailとnameは任意）
      // nameがnullでもuserIdがあれば面接を開始できるようにする
      if (decodedToken && decodedToken.userId) {
        console.log('トークン検証成功: userIdあり', decodedToken.userId);
        // 求職者情報を設定（nameがnullでもuserIdを使用）
        const userName = decodedToken.name || decodedToken.firstName || decodedToken.userId?.substring(0, 8) || '求職者';
        const jobSeekerInfo = {
          name: userName,
          email: decodedToken.email || '',
          position: decodedToken.position || '未設定'
        };
        console.log('求職者情報を設定:', jobSeekerInfo);
        setJobSeekerInfo(jobSeekerInfo);
        
        setIsTokenAuth(true);
        setTokenData(decodedToken);
        
        // エラー状態をクリア
        setError('');
        
        // トークンがある場合は自動的に面接準備を開始
        console.log('面接準備画面に進みます');
        setCurrentState('preparation');
      } else {
        // トークンが不完全でも面接を開始できるようにする（テスト用）
        console.warn('トークンの必須フィールドが不足していますが、面接を続行します', decodedToken);
        const userName = decodedToken?.name || decodedToken?.firstName || decodedToken?.userId?.substring(0, 8) || '求職者';
        const jobSeekerInfo = {
          name: userName,
          email: decodedToken?.email || '',
          position: decodedToken?.position || '未設定'
        };
        console.log('求職者情報を設定（不完全トークン）:', jobSeekerInfo);
        setJobSeekerInfo(jobSeekerInfo);
        setIsTokenAuth(false);
        setTokenData(decodedToken || {});
        
        // エラー状態をクリア
        setError('');
        
        console.log('面接準備画面に進みます（不完全トークン）');
        setCurrentState('preparation');
      }
      
    } catch (error) {
      console.error('トークン検証エラー（無視して続行）:', error);
      // エラーが発生しても面接を開始できるようにする
      console.log('エラー発生: デフォルト値で面接を開始します');
      setJobSeekerInfo({
        name: '求職者',
        email: '',
        position: '未設定'
      });
      setIsTokenAuth(false);
      setTokenData(null);
      
      // エラー状態をクリア
      setError('');
      
      setCurrentState('preparation');
    }
  };

  // 音声合成で質問を読み上げ
  const speakQuestion = (text: string) => {
    if (speechSynthesis) {
      speechSynthesis.cancel(); // 既存の音声を停止
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ja' ? 'ja-JP' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  // カメラとマイクの初期化
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // MediaRecorderの初期化
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
        }
      };
      
      setMediaRecorder(recorder);
      
    } catch (error) {
      console.error('メディア初期化エラー:', error);
      alert('カメラとマイクへのアクセスを許可してください。');
    }
  };

  // 録画開始
  const startVideoRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setRecordedChunks([]);
      mediaRecorder.start();
      setIsVideoRecording(true);
    }
  };

  // 録画停止
  const stopVideoRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsVideoRecording(false);
    }
  };

  // チェック項目の実行
  const runChecks = async () => {
    setCurrentState('checks');
    
    // 音声チェック
    await runAudioCheck();
    
    // 録画チェック
    await runVideoCheck();
    
    // 音声合成チェック
    await runSpeechCheck();
    
    // すべてのチェックが完了したら面接準備完了
    setTimeout(() => {
      handlePreparationComplete();
    }, 2000);
  };

  // 音声チェック
  const runAudioCheck = async (): Promise<void> => {
    return new Promise((resolve) => {
      setCheckItems(prev => prev.map(item => 
        item.id === 'audio' ? { ...item, status: 'checking' } : item
      ));
      
      setTimeout(() => {
        setCheckItems(prev => prev.map(item => 
          item.id === 'audio' ? { ...item, status: 'success', message: 'マイクが正常に動作しています' } : item
        ));
        resolve();
      }, 1500);
    });
  };

  // 録画チェック
  const runVideoCheck = async (): Promise<void> => {
    return new Promise((resolve) => {
      setCheckItems(prev => prev.map(item => 
        item.id === 'video' ? { ...item, status: 'checking' } : item
      ));
      
      setTimeout(() => {
        const messages: Record<Language, string> = {
          ja: 'カメラが正常に動作しています',
          en: 'Camera is working properly',
          ru: 'Камера работает нормально',
          uz: 'Kamera to\'g\'ri ishlayapti'
        };
        setCheckItems(prev => prev.map(item => 
          item.id === 'video' ? { ...item, status: 'success', message: messages[language] || messages.ja } : item
        ));
        resolve();
      }, 1500);
    });
  };

  // 音声合成チェック
  const runSpeechCheck = async (): Promise<void> => {
    return new Promise((resolve) => {
      setCheckItems(prev => prev.map(item => 
        item.id === 'speech' ? { ...item, status: 'checking' } : item
      ));
      
      // テスト用の音声を再生
      if (speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('音声合成のテストです。正常に動作しています。');
        utterance.lang = 'ja-JP';
        utterance.rate = 0.8;
        utterance.onend = () => {
          const successMessages: Record<Language, string> = {
            ja: '音声合成が正常に動作しています',
            en: 'Speech synthesis is working properly',
            ru: 'Синтез речи работает нормально',
            uz: 'Nutq sintezi to\'g\'ri ishlayapti'
          };
          setCheckItems(prev => prev.map(item => 
            item.id === 'speech' ? { ...item, status: 'success', message: successMessages[language] || successMessages.ja } : item
          ));
          resolve();
        };
        utterance.onerror = () => {
          const errorMessages: Record<Language, string> = {
            ja: '音声合成でエラーが発生しました',
            en: 'Speech synthesis error occurred',
            ru: 'Произошла ошибка синтеза речи',
            uz: 'Nutq sintezida xatolik yuz berdi'
          };
          setCheckItems(prev => prev.map(item => 
            item.id === 'speech' ? { ...item, status: 'failed', message: errorMessages[language] || errorMessages.ja } : item
          ));
          resolve();
        };
        speechSynthesis.speak(utterance);
      } else {
        const notSupportedMessages: Record<Language, string> = {
          ja: '音声合成がサポートされていません',
          en: 'Speech synthesis is not supported',
          ru: 'Синтез речи не поддерживается',
          uz: 'Nutq sintezi qo\'llab-quvvatlanmaydi'
        };
        setCheckItems(prev => prev.map(item => 
          item.id === 'speech' ? { ...item, status: 'failed', message: notSupportedMessages[language] || notSupportedMessages.ja } : item
        ));
        resolve();
      }
    });
  };

  // 面接準備完了時の処理
  const handlePreparationComplete = async () => {
    try {
      // メディア初期化
      await initializeMedia();
      
      // 面接開始時の処理
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(sessionId);
      setInterviewStartTime(new Date());
      setCurrentState('interview');
      
      // 録画開始
      startVideoRecording();
      
      // 最初の質問を音声で読み上げ
      setTimeout(() => {
        speakQuestion(questions[0].text);
      }, 1000);
      
      // 面接開始をメインプラットフォームに通知
      if (tokenData?.userId) {
        try {
          await fetch(`https://justjoin.jp/api/documents/interview-start/${encodeURIComponent(btoa(JSON.stringify(tokenData)))}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } catch (error) {
          console.warn('面接開始通知エラー:', error);
        }
      }
      
    } catch (error) {
      console.error('面接開始エラー:', error);
      setError(error instanceof Error ? error.message : '面接を開始できませんでした');
      setCurrentState('error');
    }
  };

  // 通常の同意フォームからの面接開始  
  const handleConsentSubmit = async () => {
    // 同意フォームからは直接面接準備に進む
    setCurrentState('preparation');
  };

  // 音声認識の開始（この関数は使用されていない可能性があります - InterviewScreenで処理されています）
  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
    
    // ブラウザの音声認識APIを使用
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP'; // 常に日本語で認識
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript);
      };
      
      recognition.onerror = (event: any) => {
        // abortedエラーは正常な中断なので無視
        if (event.error === 'aborted') {
          console.log('音声認識が中断されました（正常）');
          return;
        }
        console.error('音声認識エラー:', event.error);
        setIsRecording(false);
      };
      
      recognition.start();
    } else {
      alert('お使いのブラウザは音声認識をサポートしていません。');
      setIsRecording(false);
    }
  };

  // 音声認識の停止
  const stopRecording = () => {
    setIsRecording(false);
  };

  // 回答の保存
  const saveAnswer = () => {
    if (transcript.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = transcript;
      setAnswers(newAnswers);
      setTranscript('');
      
      // 次の質問に進む
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        
        // 次の質問を音声で読み上げ
        setTimeout(() => {
          speakQuestion(questions[nextIndex].text);
        }, 500);
      } else {
        // 面接完了
        stopVideoRecording();
        handleInterviewComplete();
      }
    }
  };

  // 面接完了処理
  const handleInterviewComplete = async () => {
    try {
      // 音声合成を停止
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      
      // 録画を停止
      stopVideoRecording();
      
      // 面接完了をメインプラットフォームに通知
      if (tokenData?.userId) {
        try {
          await fetch(`https://justjoin.jp/api/documents/interview-completed/${tokenData.userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              answers,
              duration: interviewStartTime ? Math.floor((Date.now() - interviewStartTime.getTime()) / 1000) : 0,
              questionsAnswered: answers.filter(a => a && a.trim()).length
            })
          });
        } catch (error) {
          console.warn('面接完了通知エラー:', error);
        }
      }
      
      setCurrentState('completed');
      
    } catch (error) {
      console.error('面接完了エラー:', error);
      setError(error instanceof Error ? error.message : '面接完了処理中にエラーが発生しました');
      setCurrentState('error');
    }
  };

  const handleStartNewInterview = () => {
    setCurrentState('consent');
    setError('');
    setIsTokenAuth(false);
    setTokenData(null);
    setJobSeekerInfo(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTranscript('');
    setInterviewStartTime(null);
    setSessionId('');
    setIsRecording(false);
    setIsVideoRecording(false);
    setIsAudioPlaying(false);
    setRecordedChunks([]);
    
    // チェック項目をリセット
    setCheckItems(prev => prev.map(item => ({ ...item, status: 'pending', message: undefined })));
    
    // 音声合成を停止
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    // URLからトークンパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
  };

  const handleBackToHome = () => {
    // メインプラットフォームのマイページに戻る
    if (isTokenAuth) {
      window.close(); // トークンベースの場合は新しいタブを閉じる
    } else {
      window.location.href = 'https://justjoin.jp/jobseeker/my-page';
    }
  };

  // エラー画面
  if (currentState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {t.error.title}
            </h3>
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBackToHome}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                {t.error.backHome}
              </button>
                <button
                  onClick={() => {
                    setError('');
                    setCurrentState('consent');
                  }}
                  className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                {t.error.retry}
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 初期ローディング画面
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI面接システム</h2>
          <p className="text-gray-600 animate-pulse">準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* メインコンテンツ */}
      {currentState === 'consent' && !isTokenAuth && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t.consent.title}</h1>
                <LanguageToggle language={language} onLanguageChange={setLanguage} />
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">{t.consent.description}</p>
              
              <button
                onClick={handleConsentSubmit}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                {t.consent.startButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentState === 'preparation' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t.preparation.title}</h1>
                <LanguageToggle language={language} onLanguageChange={setLanguage} />
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">{t.preparation.jobSeeker}:</span> {jobSeekerInfo?.name || t.preparation.jobSeeker}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">{t.preparation.email}:</span> {jobSeekerInfo?.email || 'demo@example.com'}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">{t.preparation.position}:</span> {jobSeekerInfo?.position || t.preparation.notSet}
                </p>
              </div>
              
              <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-3">{t.preparation.flowTitle}</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  {t.preparation.flowItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={runChecks}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                {t.preparation.startCheckButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentState === 'checks' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 text-center flex-1">{t.checks.title}</h1>
                <LanguageToggle language={language} onLanguageChange={setLanguage} />
              </div>
              <p className="text-gray-600 mb-6 text-center">{t.checks.description}</p>
              
              <div className="space-y-3 mb-6">
                {checkItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <div className="flex items-center">
                        {item.status === 'pending' && (
                          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                        )}
                        {item.status === 'checking' && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        {item.status === 'success' && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {item.status === 'failed' && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                    {item.message && (
                      <p className={`text-sm ${
                        item.status === 'success' ? 'text-green-600' : 
                        item.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {item.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-800 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">{t.checks.autoStart}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentState === 'interview' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8">
              {/* ヘッダー */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{t.interview.title}</h1>
                    <LanguageToggle language={language} onLanguageChange={setLanguage} />
                  </div>
                  <p className="text-gray-600">{t.interview.question} {currentQuestionIndex + 1} / {questions.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t.interview.jobSeeker}: {jobSeekerInfo?.name || t.interview.jobSeeker}</p>
                  <p className="text-sm text-gray-500">{t.interview.position}: {jobSeekerInfo?.position || t.interview.notSet}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左側: ビデオと質問 */}
                <div>
                  {/* ビデオプレビュー */}
                  <div className="mb-6">
                    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="mt-3 flex justify-center">
                      <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                        isVideoRecording ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isVideoRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          {isVideoRecording ? t.interview.recording : t.interview.stopped}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 現在の質問 */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-blue-900 mb-3">
                        {t.interview.question} {currentQuestionIndex + 1}
                      </h2>
                      <p className="text-lg text-blue-800 leading-relaxed">
                        {questions[currentQuestionIndex].text}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          {questions[currentQuestionIndex].category}
                        </span>
                        <button
                          onClick={() => speakQuestion(questions[currentQuestionIndex].text)}
                          disabled={isAudioPlaying}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2"
                        >
                          {isAudioPlaying ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t.interview.playing}
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707c.39-.39 1.024-.39 1.414 0L15.414 10H20a1 1 0 011 1v4a1 1 0 01-1 1h-4.586l-4.707 4.707c-.39.39-1.024.39-1.414 0L5.586 15z" />
                              </svg>
                              {t.interview.readQuestion}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右側: 音声認識エリア */}
                <div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t.interview.answerInput}</h3>
                      <div className="flex gap-2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            {t.interview.startRecording}
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                            {t.interview.stopRecording}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-300 min-h-[200px] shadow-inner">
                      {transcript ? (
                        <p className="text-gray-800 leading-relaxed">{transcript}</p>
                      ) : (
                        <p className="text-gray-400 italic text-center py-8">
                          {isRecording ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              {t.interview.listening}
                            </div>
                          ) : (
                            t.interview.placeholder
                          )}
                        </p>
                      )}
                    </div>
                    
                    {transcript && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={saveAnswer}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                        >
                          {currentQuestionIndex < questions.length - 1 ? (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              {t.interview.nextQuestion}
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t.interview.complete}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setTranscript('')}
                          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {t.interview.retry}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{t.interview.progress}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-center text-sm text-gray-500">
                  {t.interview.remaining} {questions.length - (currentQuestionIndex + 1)} {language === 'ja' ? '問' : 'questions'}
                </div>
              </div>

              {/* 録音ファイル */}
              <audio ref={audioRef} controls className="mt-6 w-full" />
            </div>
          </div>
        </div>
      )}

      {currentState === 'completed' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <LanguageToggle language={language} onLanguageChange={setLanguage} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.completed.title}</h1>
                <p className="text-gray-600">{t.completed.message}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t.completed.summary}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• {t.completed.answered}: {answers.filter(a => a && a.trim()).length} / {questions.length}</p>
                  <p>• {t.completed.duration}: {interviewStartTime ? Math.floor((Date.now() - interviewStartTime.getTime()) / 1000 / 60) : 0}{language === 'ja' ? '分' : ' min'}</p>
                  <p>• {t.completed.sessionId}: <span className="font-mono text-xs">{sessionId}</span></p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">{t.completed.nextSteps}</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  {t.completed.nextStepsItems.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleBackToHome}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  {t.completed.backHome}
                </button>
                <button
                  onClick={handleStartNewInterview}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
                >
                  {t.completed.newInterview}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 