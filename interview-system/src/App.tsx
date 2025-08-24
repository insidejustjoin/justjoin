import React, { useState, useEffect, useRef } from 'react';
import { Language } from './types/interview';
import './App.css';

type AppState = 'consent' | 'preparation' | 'interview' | 'completed' | 'error';

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
  const [recognition, setRecognition] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // 面接開始前の確認事項
  const [preparationChecks, setPreparationChecks] = useState({
    microphone: false,
    audio: false,
    recording: false,
    internet: false
  });

  // 確認事項のチェック
  const checkMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPreparationChecks(prev => ({ ...prev, microphone: true }));
      return true;
    } catch (error) {
      console.error('マイクチェックエラー:', error);
      return false;
    }
  };

  const checkAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('音声テストです。この音声が聞こえますか？');
      utterance.lang = 'ja-JP';
      utterance.onend = () => {
        setPreparationChecks(prev => ({ ...prev, audio: true }));
      };
      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  };

  const checkRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPreparationChecks(prev => ({ ...prev, recording: true }));
      return true;
    } catch (error) {
      console.error('録画チェックエラー:', error);
      return false;
    }
  };

  const checkInternet = async () => {
    try {
      const response = await fetch('https://www.google.com', { mode: 'no-cors' });
      setPreparationChecks(prev => ({ ...prev, internet: true }));
      return true;
    } catch (error) {
      console.error('インターネットチェックエラー:', error);
      return false;
    }
  };

  // 全チェック実行
  const runAllChecks = async () => {
    await checkMicrophone();
    checkAudio();
    await checkRecording();
    await checkInternet();
  };

  // 全チェック完了確認
  const allChecksCompleted = Object.values(preparationChecks).every(check => check);
  
  // refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // 面接質問リスト（更新版）
  const questions: Question[] = [
    { id: 1, text: '簡単に自己紹介をしてください。', category: '自己紹介' },
    { id: 2, text: '現在の職務内容について教えてください。', category: '職務内容' },
    { id: 3, text: 'これまでに最も達成感を感じたプロジェクトについて教えてください。', category: 'プロジェクト経験' },
    { id: 4, text: 'チームでの役割についてどのように考えていますか？', category: 'チームワーク' },
    { id: 5, text: '日本で働きたいと思った理由は何ですか？', category: '志望動機' },
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

  // 音声合成で質問を読み上げ（精度向上版）
  const speakQuestion = (text: string) => {
    if (speechSynthesis) {
      speechSynthesis.cancel(); // 既存の音声を停止
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ja' ? 'ja-JP' : 'en-US';
      utterance.rate = 0.85; // より自然な速度
      utterance.pitch = 1.05; // 自然なピッチ
      utterance.volume = 1;
      
      // 日本語の場合は女性の声を優先
      if (language === 'ja') {
        const voices = speechSynthesis.getVoices();
        // より自然な日本語音声を優先選択
        const japaneseVoice = voices.find(voice => 
          voice.lang.includes('ja') && (voice.name.includes('Female') || voice.name.includes('女'))
        ) || voices.find(voice => 
          voice.lang.includes('ja') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.includes('ja'));
        
        if (japaneseVoice) {
          utterance.voice = japaneseVoice;
        }
      }
      
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
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // 音声レベル監視の設定
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      // 音声レベル監視
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      if (isRecording) {
        updateAudioLevel();
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

  // 音声認識の開始（改善版）
  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
    
    // ブラウザの音声認識APIを使用
    if ('webkitSpeechRecognition' in window) {
      const newRecognition = new (window as any).webkitSpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = language === 'ja' ? 'ja-JP' : 'en-US';
      newRecognition.maxAlternatives = 3;
      
      newRecognition.onstart = () => {
        console.log('音声認識開始');
        setIsRecording(true);
      };
      
      newRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      newRecognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        setIsRecording(false);
        
        // エラーに応じた処理
        if (event.error === 'no-speech') {
          alert('音声が検出されませんでした。もう一度お試しください。');
        } else if (event.error === 'audio-capture') {
          alert('マイクへのアクセスに問題があります。マイクの設定を確認してください。');
        } else if (event.error === 'not-allowed') {
          alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
        }
      };
      
      newRecognition.onend = () => {
        console.log('音声認識終了');
        setIsRecording(false);
      };
      
      setRecognition(newRecognition);
      newRecognition.start();
      
    } else {
      alert('お使いのブラウザは音声認識をサポートしていません。ChromeまたはEdgeをご利用ください。');
      setIsRecording(false);
    }
  };

  // 音声認識の停止
  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsRecording(false);
  };

  // 回答の保存
  const saveAnswer = () => {
    if (transcript.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = transcript;
      setAnswers(newAnswers);
      setTranscript('');
      
      // 音声認識を停止
      stopRecording();
      
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
      
      // 音声認識を停止
      stopRecording();
      
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
    setAudioLevel(0);
    
    // 音声合成を停止
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    // 音声認識を停止
    if (recognition) {
      recognition.stop();
      setRecognition(null);
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
          <div className="max-w-2xl w-full mx-4">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">面接準備</h1>
              
              {/* 求職者情報 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">求職者情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-700">氏名</label>
                    <p className="text-blue-900 font-medium">{jobSeekerInfo?.name || '名前未設定'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">メールアドレス</label>
                    <p className="text-blue-900 font-medium">{jobSeekerInfo?.email || 'メール未設定'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">職種</label>
                    <p className="text-blue-900 font-medium">{jobSeekerInfo?.position || '未設定'}</p>
                  </div>
                </div>
              </div>

              {/* 面接の流れ */}
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

              {/* 確認事項チェック */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">確認事項</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      preparationChecks.microphone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {preparationChecks.microphone ? '✓' : '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">マイクチェック</p>
                      <p className="text-sm text-gray-500">マイクへのアクセス許可</p>
                    </div>
                    <button
                      onClick={checkMicrophone}
                      disabled={preparationChecks.microphone}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {preparationChecks.microphone ? '完了' : 'チェック'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      preparationChecks.audio ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {preparationChecks.audio ? '✓' : '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">音声チェック</p>
                      <p className="text-sm text-gray-500">音声が聞こえるか確認</p>
                    </div>
                    <button
                      onClick={checkAudio}
                      disabled={preparationChecks.audio}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {preparationChecks.audio ? '完了' : 'チェック'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      preparationChecks.recording ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {preparationChecks.recording ? '✓' : '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">録画チェック</p>
                      <p className="text-sm text-gray-500">カメラ・マイクの録画確認</p>
                    </div>
                    <button
                      onClick={checkRecording}
                      disabled={preparationChecks.recording}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {preparationChecks.recording ? '完了' : 'チェック'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      preparationChecks.internet ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {preparationChecks.internet ? '✓' : '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">インターネット</p>
                      <p className="text-sm text-gray-500">接続状態の確認</p>
                    </div>
                    <button
                      onClick={checkInternet}
                      disabled={preparationChecks.internet}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {preparationChecks.internet ? '完了' : 'チェック'}
                    </button>
                  </div>
                </div>

                {/* 全チェック実行ボタン */}
                <div className="mt-4 text-center">
                  <button
                    onClick={runAllChecks}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200"
                  >
                    全チェック実行
                  </button>
                </div>
              </div>

              {/* 面接開始ボタン */}
              <div className="text-center">
                <button
                  onClick={handlePreparationComplete}
                  disabled={!allChecksCompleted}
                  className={`px-8 py-3 text-lg font-medium rounded-md ${
                    allChecksCompleted 
                      ? 'bg-green-600 text-white hover:bg-green-700 transition-colors duration-200' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {allChecksCompleted ? '面接を開始' : '確認事項を完了してください'}
                </button>
                
                {!allChecksCompleted && (
                  <p className="text-sm text-gray-500 mt-2">
                    上記の確認事項を完了してから面接を開始してください
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentState === 'interview' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-6">
              {/* ヘッダー */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI面接中</h1>
                  <p className="text-gray-600">質問 {currentQuestionIndex + 1} / {questions.length}</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">求職者情報</p>
                    <p className="text-sm text-blue-800 font-medium">{jobSeekerInfo?.name || '求職者'}</p>
                    <p className="text-xs text-blue-600">{jobSeekerInfo?.email || 'メール未設定'}</p>
                    <p className="text-xs text-blue-600">職種: {jobSeekerInfo?.position || '未設定'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 左側: ビデオ */}
                <div className="xl:col-span-1">
                  <div className="bg-gray-900 rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    {/* 録画状態オーバーレイ */}
                    {isVideoRecording && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        録画中
                      </div>
                    )}
                    {/* 録画時間表示 */}
                    {isVideoRecording && (
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        REC
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isVideoRecording ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isVideoRecording ? '録画中' : '録画停止'}
                    </div>
                  </div>
                  
                  {/* 録画ファイルプレビュー */}
                  {recordedChunks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">録画ファイル</h4>
                      <audio ref={audioRef} controls className="w-full" />
                      <p className="text-xs text-gray-500 mt-1">
                        録画時間: {Math.round(recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1000)}秒
                      </p>
                    </div>
                  )}
                </div>

                {/* 中央: 質問 */}
                <div className="xl:col-span-1">
                  <div className="bg-blue-50 p-6 rounded-lg h-full">
                    <h2 className="text-xl font-semibold text-blue-900 mb-4">
                      質問 {currentQuestionIndex + 1}
                    </h2>
                    <p className="text-lg text-blue-800 mb-4 leading-relaxed">
                      {questions[currentQuestionIndex].text}
                    </p>
                    <p className="text-sm text-blue-600 mb-4">
                      カテゴリ: {questions[currentQuestionIndex].category}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakQuestion(questions[currentQuestionIndex].text)}
                        disabled={isAudioPlaying}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        {isAudioPlaying ? '再生中...' : '質問を読み上げ'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 右側: 音声認識エリア */}
                <div className="xl:col-span-1">
                  <div className="bg-gray-50 p-6 rounded-lg h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">回答</h3>
                      <div className="flex gap-2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            録音開始
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                            録音停止
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* 音声レベルインジケーター */}
                    {isRecording && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-gray-600">音声レベル</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-100"
                            style={{ width: `${(audioLevel / 255) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white p-4 rounded border min-h-[200px] max-h-[300px] overflow-y-auto">
                      {transcript ? (
                        <p className="text-gray-800 leading-relaxed">{transcript}</p>
                      ) : (
                        <p className="text-gray-400 italic">
                          {isRecording ? '音声を認識中...' : '録音開始ボタンを押して回答を開始してください'}
                        </p>
                      )}
                    </div>
                    
                    {transcript && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={saveAnswer}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {currentQuestionIndex < questions.length - 1 ? '次の質問へ' : '面接完了'}
                        </button>
                        <button
                          onClick={() => setTranscript('')}
                          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
                        >
                          やり直し
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>進捗</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 録音ファイル */}
              <audio ref={audioRef} controls className="mt-4 w-full" />
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
                <h3 className="font-semibold text-gray-900 mb-2">面接結果</h3>
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
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  ホームに戻る
                </button>
                <button
                  onClick={handleStartNewInterview}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
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