import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ConsentForm from './components/ConsentForm';
import InterviewPreparation from './components/InterviewPreparation';
import InterviewScreen from './components/InterviewScreen';
import CompletionScreen from './components/CompletionScreen';
import { Language } from './types/interview';
import './App.css';

type AppState = 'consent' | 'preparation' | 'interview' | 'completed' | 'error';

interface SessionData {
  sessionId: string;
  applicantId: string;
  jobSeekerInfo?: {
    name: string;
    position: string;
    experienceYears: number;
    skills: string[];
  };
}

interface CompletionData {
  sessionId: string;
  summary: {
    totalDuration: number;
    questionsAnswered: number;
    completionRate: number;
  };
}

interface JobSeekerInfo {
  name: string;
  email: string;
  position: string;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>('consent');
  const [language, setLanguage] = useState<Language>('ja');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [error, setError] = useState<string>('');
  const [isTokenAuth, setIsTokenAuth] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [jobSeekerInfo, setJobSeekerInfo] = useState<JobSeekerInfo | null>(null);

  // URLパラメータからトークンを取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const lang = urlParams.get('lang') || 'ja';
    
    setLanguage(lang as Language);
    
    if (token) {
      verifyToken(token);
    }
  }, []);

  // トークン検証
  const verifyToken = async (token: string) => {
    try {
      // 面接システムのバックエンドでトークンを検証
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3002' 
        : 'https://interview.justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/interview-verify/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'TOKEN_EXPIRED') {
          setError('面接URLの有効期限が切れています。再度メインページから面接を開始してください。');
        } else if (errorData.error === 'INTERVIEW_ALREADY_TAKEN') {
          setError('1次面接は既に受験済みです。');
        } else if (errorData.error === 'ACCESS_DENIED') {
          setError('求職者ユーザーのみアクセス可能です。');
        } else {
          setError('無効な面接URLです。メインページから面接を開始してください。');
        }
        setCurrentState('error');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        const tokenData = result.data;
        
        // 求職者情報を設定
        setJobSeekerInfo({
          name: tokenData.name,
          email: tokenData.email,
          position: tokenData.position
        });
        
        setIsTokenAuth(true);
        setTokenData(tokenData);
        
        // トークンがある場合は自動的に面接準備を開始
        setCurrentState('preparation');
      } else {
        setError('トークンの検証に失敗しました。メインページから面接を開始してください。');
        setCurrentState('error');
      }
      
    } catch (error) {
      console.error('トークン検証エラー:', error);
      setError('面接URLの検証中にエラーが発生しました。メインページから面接を開始してください。');
      setCurrentState('error');
    }
  };

  // 面接準備完了時の処理
  const handlePreparationComplete = async (data: {
    consentGiven: boolean;
    email?: string;
    name?: string;
    language: Language;
    position?: string;
    preparationComplete: boolean;
  }) => {
    try {
      // 求職者情報を優先的に使用
      const finalEmail = jobSeekerInfo?.email || data.email || tokenData?.email;
      const finalName = jobSeekerInfo?.name || data.name || tokenData?.name;
      const finalPosition = jobSeekerInfo?.position || data.position || tokenData?.position;

      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: finalEmail,
          name: finalName,
          language: data.language,
          consentGiven: data.consentGiven,
          position: finalPosition
        }),
      });

      if (!response.ok) {
        throw new Error('面接開始に失敗しました');
      }

      const result = await response.json();
      
      if (result.success) {
        setSessionData({
          sessionId: result.sessionId,
          applicantId: result.applicantId,
          jobSeekerInfo: result.jobSeekerInfo
        });
        setCurrentState('interview');
      } else {
        throw new Error(result.message || '面接開始に失敗しました');
      }
    } catch (error) {
      console.error('面接開始エラー:', error);
      setError(error instanceof Error ? error.message : '面接を開始できませんでした');
      setCurrentState('error');
    }
  };

  // 通常の同意フォームからの面接開始  
  const handleConsentSubmit = async (data: {
    consentGiven: boolean;
    email?: string;
    name?: string;
    language: Language;
    position?: string;
  }) => {
    // 同意フォームからは直接面接準備に進む
    setCurrentState('preparation');
  };

  const handleInterviewComplete = () => {
    setCurrentState('completed');
  };

  const handleStartNewInterview = () => {
    setCurrentState('consent');
    setSessionData(null);
    setCompletionData(null);
    setError('');
    setIsTokenAuth(false);
    setTokenData(null);
    setJobSeekerInfo(null);
    
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
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              エラーが発生しました
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBackToHome}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                ホームに戻る
              </button>
              {!isTokenAuth && (
                <button
                  onClick={() => {
                    setError('');
                    setCurrentState('consent');
                  }}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  再試行
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>registration form for job seeker</title>
        <meta name="description" content="registration form for job seeker" />
        <meta name="keywords" content="registration form for job seeker" />
        <meta property="og:title" content="registration form for job seeker" />
        <meta property="og:description" content="registration form for job seeker" />
        <meta name="twitter:title" content="registration form for job seeker" />
        <meta name="twitter:description" content="registration form for job seeker" />
      </Helmet>
      
      {/* 言語選択（トークンベースの場合は非表示、通常時も非表示） */}
      {/* 言語切り替えは準備画面でのみ可能で、面接中は日本語固定 */}

      {/* メインコンテンツ */}
      {currentState === 'consent' && !isTokenAuth && (
        <ConsentForm
          language={language}
          onConsent={handleConsentSubmit}
          onLanguageChange={setLanguage}
        />
      )}

      {currentState === 'preparation' && (
        <InterviewPreparation
          language={language}
          onComplete={handlePreparationComplete}
          onLanguageChange={setLanguage}
          jobSeekerInfo={jobSeekerInfo || (tokenData ? {
            name: tokenData.name,
            email: tokenData.email,
            position: tokenData.position
          } : undefined)}
        />
      )}

      {currentState === 'interview' && sessionData && (
        <InterviewScreen
          sessionId={sessionData.sessionId}
          language={language}
          onComplete={handleInterviewComplete}
          onError={(error: string) => {
            setError(error);
            setCurrentState('error');
          }}
          email={jobSeekerInfo?.email || tokenData?.email}
          name={jobSeekerInfo?.name || tokenData?.name}
          position={jobSeekerInfo?.position || tokenData?.position}
          consentGiven={true}
        />
      )}

      {currentState === 'completed' && sessionData && (
        <CompletionScreen
          language={language}
          sessionId={sessionData.sessionId}
          onRestart={handleStartNewInterview}
        />
      )}
    </>
  );
}

export default App; 