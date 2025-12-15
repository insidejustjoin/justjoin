import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Clock, 
  Play,
  Volume2,
  VolumeX,
  CheckCircle2,
  Loader2,
  Radio
} from 'lucide-react';
import { Language, Question } from '@/types/interview';
import { LanguageToggle } from './LanguageToggle';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InterviewScreenProps {
  sessionId: string;
  language: Language;
  onComplete: (data?: { duration: number; questionsAnswered: number; totalQuestions: number }) => void;
  onError: (error: string) => void;
  email?: string;
  name?: string;
  position?: string;
  consentGiven?: boolean;
}

interface Progress {
  current: number;
  total: number;
  percentage: number;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({
  sessionId,
  language,
  onComplete,
  onError,
  email,
  name,
  position,
  consentGiven = true
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 10, percentage: 0 });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [canStartRecording, setCanStartRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language);
  // 実際にAPIで使用するセッションID（サーバー側の値を優先）
  const [activeSessionId, setActiveSessionId] = useState<string>(sessionId);
  
  useEffect(() => {
    setDisplayLanguage(language);
  }, [language]);

  const recognitionRef = useRef<any>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const texts = {
    ja: {
      question: '質問',
      progress: '進捗',
      speakNow: '話してください',
      recording: '録音中',
      stop: '停止',
      submit: '送信',
      thinking: 'AIが考えています...',
      processing: '処理中...',
      timeElapsed: '経過時間',
      mute: 'ミュート',
      unmute: 'ミュート解除',
      playQuestion: '質問を再生',
      endInterview: '面接を終了'
    },
    en: {
      question: 'Question',
      progress: 'Progress',
      speakNow: 'Speak now',
      recording: 'Recording',
      stop: 'Stop',
      submit: 'Submit',
      thinking: 'AI is thinking...',
      processing: 'Processing...',
      timeElapsed: 'Time elapsed',
      mute: 'Mute',
      unmute: 'Unmute',
      playQuestion: 'Play question',
      endInterview: 'End interview'
    },
    ru: {
      question: 'Вопрос',
      progress: 'Прогресс',
      speakNow: 'Говорите',
      recording: 'Запись',
      stop: 'Стоп',
      submit: 'Отправить',
      thinking: 'AI думает...',
      processing: 'Обработка...',
      timeElapsed: 'Прошло времени',
      mute: 'Отключить звук',
      unmute: 'Включить звук',
      playQuestion: 'Воспроизвести вопрос',
      endInterview: 'Завершить интервью'
    },
    uz: {
      question: 'Savol',
      progress: 'Jarayon',
      speakNow: 'Gapiring',
      recording: 'Yozilmoqda',
      stop: 'To\'xtatish',
      submit: 'Yuborish',
      thinking: 'AI o\'ylayapti...',
      processing: 'Qayta ishlanmoqda...',
      timeElapsed: 'O\'tgan vaqt',
      mute: 'Ovozni o\'chirish',
      unmute: 'Ovozni yoqish',
      playQuestion: 'Savolni ijro etish',
      endInterview: 'Intervyuni yakunlash'
    }
  };

  const t = texts[displayLanguage] || texts.ja;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 面接開始
  useEffect(() => {
    const startInterview = async () => {
      try {
        setIsLoading(true);
        setStartTime(new Date());

        // サーバー側のテスト用開始APIを呼び出し
        const response = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            position,
            language: displayLanguage,
            consentGiven: consentGiven ?? true,
          }),
        });

        if (!response.ok) throw new Error('面接開始に失敗しました');

        const data = await response.json();
        if (data.success && (data.nextQuestion || data.question)) {
          // サーバー側セッションIDを優先的に利用
          if (data.sessionId) {
            setActiveSessionId(data.sessionId);
          }

          const firstQuestion = data.nextQuestion || data.question;
          const initialProgress = data.progress || {
            current: 0,
            total: 10,
            percentage: 0,
          };

          setCurrentQuestion(firstQuestion);
          setProgress({
            current: initialProgress.current ?? 0,
            total: initialProgress.total ?? 10,
            percentage: initialProgress.percentage ?? 0,
          });
          setCanStartRecording(true);
          
          setTimeout(() => {
            playAIMessage(
              typeof firstQuestion.text === 'string'
                ? firstQuestion.text
                : firstQuestion.text?.ja || ''
            );
          }, 1000);
        }
      } catch (error) {
        console.error('面接開始エラー:', error);
        onError('面接を開始できませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      startInterview();
    }
  }, [sessionId]);

  // 経過時間の更新
  useEffect(() => {
    if (startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  // 音声再生
  const playAIMessage = async (message: string) => {
    if (isMuted) {
      setCanStartRecording(true);
      return;
    }
    
    try {
      setIsPlaying(true);
      setCanStartRecording(false);
      
      const response = await fetch('/api/interview/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, languageCode: 'ja' })
      });

      const data = await response.json();

      if (data.success && data.audio) {
        const mimeType = data.format === 'wav' ? 'audio/wav' : 'audio/mp3';
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))
        ], { type: mimeType });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        
        await audio.play();
        return;
      }
      
      setIsPlaying(false);
      setCanStartRecording(true);
    } catch (error) {
      console.error('音声再生エラー:', error);
      setIsPlaying(false);
      setCanStartRecording(true);
    }
  };

  // 録音開始
  const startRecording = () => {
    if (!canStartRecording || isPlaying) return;

    setIsRecording(true);
    setRecordingTime(0);
    setTranscript('');

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interimTranscript += event.results[i][0].transcript;
        }
        setTranscript(interimTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          console.error('音声認識エラー:', event.error);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    }

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // 録音停止
  const stopRecording = () => {
    setIsRecording(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  // 回答送信
  const handleSubmit = async () => {
    if (!transcript.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          questionId: currentQuestion?.id,
          text: transcript.trim(),
          responseTime: recordingTime,
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
          setProgress({
            current: data.progress.current,
            total: data.progress.total,
            percentage: data.progress.percentage
          });
          setTranscript('');
          setRecordingTime(0);
          
          setTimeout(() => {
            playAIMessage(data.nextQuestion.text);
          }, 500);
        } else {
          // 面接完了
          const finalDuration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
          onComplete({
            duration: finalDuration,
            questionsAnswered: progress.current,
            totalQuestions: progress.total
          });
        }
      }
    } catch (error) {
      console.error('回答送信エラー:', error);
      onError('回答の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto relative z-10" />
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* モダンなヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-50"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Radio className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">AI面接</p>
                  <p className="text-xs text-gray-500">{name || email || '求職者'}</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{formatTime(elapsedTime)}</span>
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold shadow-md">
                  {progress.current}/{progress.total}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle language={displayLanguage} onLanguageChange={setDisplayLanguage} />
              <button
                onClick={toggleMute}
                className={`p-2.5 rounded-xl transition-all ${
                  isMuted 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 進捗バー */}
        <div className="mb-8 animate-slide-in-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">{t.progress}</span>
            <span className="text-sm font-bold text-gray-900">{progress.percentage}%</span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progress.percentage}%` }}
            />
            <div 
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 質問カード */}
        {currentQuestion && (
          <div className="mb-8 animate-slide-in-up">
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 sm:p-10 overflow-hidden">
              {/* 装飾的な背景要素 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-50"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                          {progress.current}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{t.question} {progress.current}</h2>
                        <p className="text-sm text-gray-500 mt-1">{progress.total}問中</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-l-4 border-blue-500 shadow-sm">
                      <p className="text-xl text-gray-800 leading-relaxed font-medium">
                        {typeof currentQuestion.text === 'string' 
                          ? currentQuestion.text
                          : currentQuestion.text[displayLanguage] || currentQuestion.text.ja || ''}
                      </p>
                    </div>
                  </div>
                  {!isPlaying && (
                    <button
                      onClick={() => {
                        const questionText = typeof currentQuestion.text === 'string' 
                          ? currentQuestion.text 
                          : currentQuestion.text.ja || '';
                        playAIMessage(questionText);
                      }}
                      className="ml-4 p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Play className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 録音エリア */}
        <div className="animate-slide-in-up">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 sm:p-12 overflow-hidden">
            {/* 装飾的な背景要素 */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100/50 to-pink-100/50 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative">
              {isPlaying ? (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <Volume2 className="h-12 w-12 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium text-lg">{t.thinking}</p>
                </div>
              ) : isSubmitting ? (
                <div className="text-center py-16">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium text-lg">{t.processing}</p>
                </div>
              ) : isRecording ? (
                <div className="text-center">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-40 animate-ping"></div>
                    <button
                      onClick={toggleRecording}
                      className="relative w-40 h-40 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl hover:shadow-red-500/50 transition-all hover:scale-105"
                    >
                      <MicOff className="h-20 w-20 text-white" />
                    </button>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <p className="text-2xl font-bold text-red-600">{t.recording}</p>
                    </div>
                    <p className="text-6xl font-mono text-gray-800 font-bold tracking-wider">{formatTime(recordingTime)}</p>
                  </div>
                  {transcript && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-6 text-left border border-gray-200 shadow-inner">
                      <p className="text-gray-800 leading-relaxed text-lg mb-6 min-h-[100px]">{transcript}</p>
                      <div className="flex gap-4">
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-none"
                        >
                          {t.submit}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold text-lg"
                        >
                          {t.stop}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={toggleRecording}
                    disabled={!canStartRecording || isPlaying}
                    className={`relative w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all ${
                      canStartRecording && !isPlaying
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 hover:shadow-blue-500/50'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Mic className="h-20 w-20" />
                  </button>
                  <p className="text-2xl font-bold text-gray-700 mb-2">
                    {canStartRecording ? t.speakNow : t.thinking}
                  </p>
                  <p className="text-gray-500">ボタンを押して録音を開始</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewScreen;
