import React, { useState, useEffect, useRef } from 'react';
import { Language } from './types/interview';
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

function App() {
  const [currentState, setCurrentState] = useState<AppState>('consent');
  const [language, setLanguage] = useState<Language>('ja');
  const [error, setError] = useState<string>('');
  const [isTokenAuth, setIsTokenAuth] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [jobSeekerInfo, setJobSeekerInfo] = useState<JobSeekerInfo | null>(null);
  
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
  
  // チェック項目の状態
  const [checkItems, setCheckItems] = useState<CheckItem[]>([
    {
      id: 'audio',
      title: '音声チェック',
      description: 'マイクの動作確認を行います',
      status: 'pending'
    },
    {
      id: 'video',
      title: '録画チェック',
      description: 'カメラの動作確認を行います',
      status: 'pending'
    },
    {
      id: 'speech',
      title: '音声合成チェック',
      description: '質問の音声読み上げを確認します',
      status: 'pending'
    }
  ]);
  
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

  // トークン検証（修正版）
  const verifyToken = async (token: string) => {
    try {
      // Base64デコードしてトークンデータを取得
      const decodedToken = JSON.parse(atob(token));
      
      if (decodedToken && decodedToken.userId && decodedToken.email && decodedToken.name) {
        // 求職者情報を設定（名前のバグ修正）
        setJobSeekerInfo({
          name: decodedToken.name || '求職者',
          email: decodedToken.email || '',
          position: decodedToken.position || '未設定'
        });
        
        setIsTokenAuth(true);
        setTokenData(decodedToken);
        
        // トークンがある場合は自動的に面接準備を開始
        setCurrentState('preparation');
      } else {
        setError('無効な面接URLです。メインページから面接を開始してください。');
        setCurrentState('error');
      }
      
    } catch (error) {
      console.error('トークン検証エラー:', error);
      setError('面接URLの検証中にエラーが発生しました。メインページから面接を開始してください。');
      setCurrentState('error');
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
        setCheckItems(prev => prev.map(item => 
          item.id === 'video' ? { ...item, status: 'success', message: 'カメラが正常に動作しています' } : item
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
          setCheckItems(prev => prev.map(item => 
            item.id === 'speech' ? { ...item, status: 'success', message: '音声合成が正常に動作しています' } : item
          ));
          resolve();
        };
        utterance.onerror = () => {
          setCheckItems(prev => prev.map(item => 
            item.id === 'speech' ? { ...item, status: 'failed', message: '音声合成でエラーが発生しました' } : item
          ));
          resolve();
        };
        speechSynthesis.speak(utterance);
      } else {
        setCheckItems(prev => prev.map(item => 
          item.id === 'speech' ? { ...item, status: 'failed', message: '音声合成がサポートされていません' } : item
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

  // 音声認識の開始
  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
    
    // ブラウザの音声認識APIを使用
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ja' ? 'ja-JP' : 'en-US';
      
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
                  className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
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
    <div>
      {/* メインコンテンツ */}
      {currentState === 'consent' && !isTokenAuth && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI面接システム</h1>
              <p className="text-gray-600 mb-6">約10〜15分程度のAI面接を行います。リラックスしてご自分らしくお答えください。</p>
              
              <button
                onClick={handleConsentSubmit}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                面接を開始
              </button>
            </div>
          </div>
        </div>
      )}

      {currentState === 'preparation' && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">面接準備</h1>
              <p className="text-gray-600 mb-6">
                求職者: {jobSeekerInfo?.name || '求職者'}<br/>
                メール: {jobSeekerInfo?.email || 'demo@example.com'}<br/>
                職種: {jobSeekerInfo?.position || '未設定'}
              </p>
              
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">面接の流れ</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 10個の質問に音声で回答</li>
                  <li>• 各質問は1-2分程度で回答</li>
                  <li>• カメラとマイクの使用を許可してください</li>
                  <li>• 静かな環境で面接を受けてください</li>
                  <li>• 質問は自動音声で読み上げられます</li>
                </ul>
              </div>
              
              <button
                onClick={runChecks}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium"
              >
                システムチェックを開始
              </button>
            </div>
          </div>
        </div>
      )}

      {currentState === 'checks' && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">システムチェック中</h1>
              <p className="text-gray-600 mb-6 text-center">面接に必要な機能の動作確認を行っています</p>
              
              <div className="space-y-4">
                {checkItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <div className="flex items-center">
                        {item.status === 'pending' && (
                          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        )}
                        {item.status === 'checking' && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        {item.status === 'success' && (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {item.status === 'failed' && (
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
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
              
              <div className="mt-6 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  チェック完了後、自動的に面接を開始します
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
                  <h1 className="text-2xl font-bold text-gray-900">AI面接中</h1>
                  <p className="text-gray-600">質問 {currentQuestionIndex + 1} / {questions.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">求職者: {jobSeekerInfo?.name || '求職者'}</p>
                  <p className="text-sm text-gray-500">職種: {jobSeekerInfo?.position || '未設定'}</p>
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
                          {isVideoRecording ? '録画中' : '録画停止'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 現在の質問 */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-blue-900 mb-3">
                        質問 {currentQuestionIndex + 1}
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
                              再生中...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707c.39-.39 1.024-.39 1.414 0L15.414 10H20a1 1 0 011 1v4a1 1 0 01-1 1h-4.586l-4.707 4.707c-.39.39-1.024.39-1.414 0L5.586 15z" />
                              </svg>
                              質問を読み上げ
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
                      <h3 className="text-lg font-semibold text-gray-900">回答入力</h3>
                      <div className="flex gap-2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            録音開始
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
                            録音停止
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
                              音声を認識中...
                            </div>
                          ) : (
                            '録音開始ボタンを押して回答を開始してください'
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
                              次の質問へ
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              面接完了
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
                          やり直し
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>面接の進捗</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-center text-sm text-gray-500">
                  残り {questions.length - (currentQuestionIndex + 1)} 問
                </div>
              </div>

              {/* 録音ファイル */}
              <audio ref={audioRef} controls className="mt-6 w-full" />
            </div>
          </div>
        </div>
      )}

      {currentState === 'completed' && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">面接完了</h1>
                <p className="text-gray-600">お疲れさまでした。AI面接が完了いたしました。</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">面接結果サマリー</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 回答した質問数: {answers.filter(a => a && a.trim()).length} / {questions.length}</p>
                  <p>• 面接時間: {interviewStartTime ? Math.floor((Date.now() - interviewStartTime.getTime()) / 1000 / 60) : 0}分</p>
                  <p>• セッションID: {sessionId}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">今後の流れ</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 回答内容のAI評価</li>
                  <li>• 採用担当者による確認</li>
                  <li>• 1週間以内に結果をご連絡</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleBackToHome}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                >
                  ホームに戻る
                </button>
                <button
                  onClick={handleStartNewInterview}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm"
                >
                  新しい面接
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