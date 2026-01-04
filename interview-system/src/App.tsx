import React, { useState, useEffect } from 'react';
import { Language } from './types/interview';
import ConsentForm from './components/ConsentForm';
import InterviewPreparation from './components/InterviewPreparation';
import InterviewScreen from './components/InterviewScreen';
import CompletionScreen from './components/CompletionScreen';
import './App.css';

type AppState = 'consent' | 'preparation' | 'interview' | 'completed' | 'error';

interface JobSeekerInfo {
  name: string;
  email: string;
  position: string;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>('consent');
  const [language, setLanguage] = useState<Language>('ja');
  const [error, setError] = useState<string>('');
  const [isTokenAuth, setIsTokenAuth] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [jobSeekerInfo, setJobSeekerInfo] = useState<JobSeekerInfo | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [consentGiven, setConsentGiven] = useState(false);
  
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
        
        // 言語を検証
        const validLang = (lang === 'ja' || lang === 'en' || lang === 'ru' || lang === 'uz') ? lang : 'ja';
        setLanguage(validLang as Language);
        
        await new Promise(resolve => setTimeout(resolve, 500));
    
        if (token) {
          await verifyToken(token);
        } else {
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

  // Base64デコードヘルパー関数（UTF-8対応）
  const decodeBase64 = (base64: string): string => {
    try {
      // ブラウザ環境でUTF-8対応のBase64デコード
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
      console.error('Base64デコードエラー:', error);
      throw error;
    }
  };

  // トークン検証
  const verifyToken = async (token: string) => {
    console.log('トークン検証開始:', token.substring(0, 50) + '...');
    try {
      let decodedToken;
      try {
        const decoded = decodeBase64(token);
        console.log('デコードされたトークン:', decoded);
        decodedToken = JSON.parse(decoded);
        console.log('パースされたトークン:', decodedToken);
      } catch (decodeError) {
        console.warn('トークンデコードエラー（無視して続行）:', decodeError);
        console.log('トークンデコード失敗: 同意画面に進みます');
        setCurrentState('consent');
        return;
      }
      
      if (decodedToken && decodedToken.userId) {
        console.log('トークン検証成功: userIdあり', decodedToken.userId);
        // 名前の取得を優先順位順に試行
        let userName = '';
        if (decodedToken.name) {
          userName = decodedToken.name;
        } else if (decodedToken.firstName && decodedToken.lastName) {
          userName = `${decodedToken.lastName} ${decodedToken.firstName}`.trim();
        } else if (decodedToken.firstName) {
          userName = decodedToken.firstName;
        } else if (decodedToken.lastName) {
          userName = decodedToken.lastName;
        } else {
          userName = decodedToken.userId?.substring(0, 8) || '求職者';
        }
        const jobSeekerInfo = {
          name: userName,
          email: decodedToken.email || '',
          position: decodedToken.position || '未設定'
        };
        console.log('求職者情報を設定:', jobSeekerInfo);
        setJobSeekerInfo(jobSeekerInfo);
        
        setIsTokenAuth(true);
        setTokenData(decodedToken);
        setError('');
        setCurrentState('preparation');
      } else {
        console.warn('トークンの必須フィールドが不足していますが、面接を続行します', decodedToken);
        // 名前の取得を優先順位順に試行
        let userName = '';
        if (decodedToken?.name) {
          userName = decodedToken.name;
        } else if (decodedToken?.firstName && decodedToken?.lastName) {
          userName = `${decodedToken.lastName} ${decodedToken.firstName}`.trim();
        } else if (decodedToken?.firstName) {
          userName = decodedToken.firstName;
        } else if (decodedToken?.lastName) {
          userName = decodedToken.lastName;
        } else {
          userName = decodedToken?.userId?.substring(0, 8) || '求職者';
        }
        const jobSeekerInfo = {
          name: userName,
          email: decodedToken?.email || '',
          position: decodedToken?.position || '未設定'
        };
        console.log('求職者情報を設定（不完全トークン）:', jobSeekerInfo);
        setJobSeekerInfo(jobSeekerInfo);
        setIsTokenAuth(false);
        setTokenData(decodedToken || {});
        setError('');
        setCurrentState('preparation');
      }
      
    } catch (error) {
      console.error('トークン検証エラー（無視して続行）:', error);
      console.log('エラー発生: デフォルト値で面接を開始します');
      setJobSeekerInfo({
        name: '求職者',
        email: '',
        position: '未設定'
      });
      setIsTokenAuth(false);
      setTokenData(null);
      setError('');
      setCurrentState('preparation');
    }
  };

  // 同意フォームからの処理
  const handleConsent = async (data: {
    consentGiven: boolean;
    email?: string;
    name?: string;
    language: Language;
    position?: string;
  }) => {
    setConsentGiven(data.consentGiven);
    setLanguage(data.language);
    if (data.name || data.email) {
      setJobSeekerInfo({
        name: data.name || '求職者',
        email: data.email || '',
        position: data.position || '未設定'
      });
    }
    setCurrentState('preparation');
  };

  // 準備完了時の処理
  const handlePreparationComplete = async (data: {
    consentGiven: boolean;
    email?: string;
    name?: string;
    language: Language;
    position?: string;
    preparationComplete: boolean;
  }) => {
    try {
      setConsentGiven(data.consentGiven);
      setLanguage(data.language);
      if (data.name || data.email) {
        setJobSeekerInfo({
          name: data.name || jobSeekerInfo?.name || '求職者',
          email: data.email || jobSeekerInfo?.email || '',
          position: data.position || jobSeekerInfo?.position || '未設定'
        });
      }

      // セッションIDを生成
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Base64エンコードヘルパー関数（UTF-8対応）
      const encodeBase64 = (str: string): string => {
        try {
          // UTF-8エンコードしてからBase64エンコード
          const bytes = new TextEncoder().encode(str);
          const binaryString = String.fromCharCode(...bytes);
          return btoa(binaryString);
        } catch (error) {
          console.error('Base64エンコードエラー:', error);
          // フォールバック: エラーが発生した場合は通常のbtoaを使用
          return btoa(unescape(encodeURIComponent(str)));
        }
      };

      // 面接開始をメインプラットフォームに通知
      if (tokenData?.userId) {
        try {
          const tokenString = encodeBase64(JSON.stringify(tokenData));
          const response = await fetch(`https://justjoin.jp/api/documents/interview-start/${encodeURIComponent(tokenString)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            const errorResult = await response.json();
            if (errorResult.error === 'INTERVIEW_ALREADY_TAKEN') {
              setError('面接は1度しかできません');
              setCurrentState('error');
              return;
            }
            throw new Error(errorResult.message || '面接を開始できませんでした');
          }
        } catch (error) {
          console.error('面接開始通知エラー:', error);
          setError(error instanceof Error ? error.message : '面接を開始できませんでした');
          setCurrentState('error');
          return;
        }
      }
      
      setCurrentState('interview');
    } catch (error) {
      console.error('面接開始エラー:', error);
      setError('面接を開始できませんでした');
      setCurrentState('error');
    }
  };

  // 面接完了時の処理
  const handleInterviewComplete = async (data?: { duration: number; questionsAnswered: number; totalQuestions: number }) => {
    try {
      if (data) {
        setInterviewDuration(data.duration);
        setQuestionsAnswered(data.questionsAnswered);
        setTotalQuestions(data.totalQuestions);
      }
      
      // 面接完了をメインプラットフォームに通知
      // 注意: 別ドメインのため、認証トークンは取得できない可能性がある
      if (tokenData?.userId) {
        try {
          // 別ドメインのため、localStorageからトークンを取得できない可能性がある
          // その場合は、サーバー側で認証を処理する必要がある
          const token = localStorage.getItem('auth_token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(`https://justjoin.jp/api/documents/interview-completed/${tokenData.userId}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sessionId,
              duration: data?.duration || interviewDuration,
              questionsAnswered: data?.questionsAnswered || questionsAnswered
            })
          });

          if (!response.ok) {
            // 401エラーなどが発生しても、面接完了処理は継続
            console.warn('面接完了通知エラー（無視して続行）:', {
              status: response.status,
              statusText: response.statusText,
              message: '面接完了通知に失敗しましたが、面接は正常に完了しています。'
            });
          } else {
            console.log('✅ 面接完了通知成功');
          }
        } catch (error) {
          // ネットワークエラーなどが発生しても、面接完了処理は継続
          console.warn('面接完了通知エラー（無視して続行）:', error);
          console.log('面接は正常に完了しています。通知エラーは無視されます。');
        }
      } else {
        console.log('トークンデータがないため、面接完了通知をスキップします。');
      }
      
      setCurrentState('completed');
    } catch (error) {
      console.error('面接完了エラー:', error);
      setError('面接完了処理中にエラーが発生しました');
      setCurrentState('error');
    }
  };

  // エラーハンドリング
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentState('error');
  };

  // 初期ローディング画面
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI面接システム</h2>
          <p className="text-gray-600 animate-pulse">準備中...</p>
        </div>
      </div>
    );
  }

  // エラー画面
  if (currentState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50 p-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="relative text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (isTokenAuth) {
                      window.close();
                    } else {
                      window.location.href = 'https://justjoin.jp/jobseeker/my-page';
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg"
                >
                  ホームに戻る
                </button>
                <button
                  onClick={() => {
                    setError('');
                    setCurrentState('consent');
                  }}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all font-semibold"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // メインコンテンツ
  return (
    <div>
      {currentState === 'consent' && (
        <ConsentForm
          onConsent={handleConsent}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {currentState === 'preparation' && (
        <InterviewPreparation
          onComplete={handlePreparationComplete}
          language={language}
          onLanguageChange={setLanguage}
          jobSeekerInfo={jobSeekerInfo || undefined}
        />
      )}

      {currentState === 'interview' && sessionId && (
        <InterviewScreen
          sessionId={sessionId}
          language={language}
          onComplete={handleInterviewComplete}
          onError={handleError}
          email={jobSeekerInfo?.email}
          name={jobSeekerInfo?.name}
          position={jobSeekerInfo?.position}
          consentGiven={consentGiven}
        />
      )}

      {currentState === 'completed' && (
        <CompletionScreen
          sessionId={sessionId}
          language={language}
          duration={interviewDuration}
          questionsAnswered={questionsAnswered}
          totalQuestions={totalQuestions}
          onRestart={() => {
            setCurrentState('consent');
            setSessionId('');
            setInterviewDuration(0);
            setQuestionsAnswered(0);
            setConsentGiven(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
