import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Clock, 
  CheckCircle2,
  Play,
  Volume2,
  VolumeX
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
  onComplete: () => void;
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
        
        // 最初の質問を取得
        const response = await fetch(`/api/interview/${sessionId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('面接開始に失敗しました');

        const data = await response.json();
        if (data.success && data.question) {
          setCurrentQuestion(data.question);
          setProgress({ current: 1, total: data.total || 10, percentage: 10 });
          setCanStartRecording(true);
          
          // 質問を自動再生
          setTimeout(() => {
            playAIMessage(data.question.text);
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
        // フォーマットに応じてMIMEタイプを設定
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
      
      // フォールバック
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

    // 音声認識
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

    // 録音時間の更新
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
      const response = await fetch(`/api/interview/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion?.id,
          answer: transcript.trim()
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
          
          // 次の質問を再生
          setTimeout(() => {
            playAIMessage(data.nextQuestion.text);
          }, 500);
        } else {
          // 面接完了
          onComplete();
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* シンプルなヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">AI面接</p>
                  <p className="text-xs text-gray-500">{name || email || '求職者'}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(elapsedTime)}</span>
                </div>
                <div className="px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium">
                  {progress.current}/{progress.total}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle language={displayLanguage} onLanguageChange={setDisplayLanguage} />
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
            <span>{t.progress}</span>
            <span className="font-semibold">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 質問カード */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {progress.current}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t.question} {progress.current}</h2>
                    <p className="text-sm text-gray-500">{progress.total}問中</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-600">
                  <p className="text-lg text-gray-800 leading-relaxed">
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
                  className="ml-4 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Play className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 録音エリア */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {isPlaying ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Volume2 className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">{t.thinking}</p>
            </div>
          ) : isSubmitting ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">{t.processing}</p>
            </div>
          ) : isRecording ? (
            <div className="text-center">
              <button
                onClick={toggleRecording}
                className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:bg-red-700 transition-colors"
              >
                <MicOff className="h-16 w-16 text-white" />
              </button>
              <div className="mb-6">
                <p className="text-xl font-bold text-red-600 mb-2">{t.recording}</p>
                <p className="text-4xl font-mono text-gray-800 font-bold">{formatTime(recordingTime)}</p>
              </div>
              {transcript && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                  <p className="text-gray-800 leading-relaxed mb-4">{transcript}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                      {t.submit}
                    </button>
                    <button
                      onClick={stopRecording}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
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
                className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-all ${
                  canStartRecording && !isPlaying
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Mic className="h-16 w-16" />
              </button>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {canStartRecording ? t.speakNow : t.thinking}
              </p>
              <p className="text-sm text-gray-500">ボタンを押して録音を開始</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewScreen;
