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
  userId?: string;
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
  consentGiven = true,
  userId
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
  const [error, setError] = useState<string>('');
  const [hasRecorded, setHasRecorded] = useState(false); // 録音済みフラグ
  const [retryCount, setRetryCount] = useState(0); // 再録音回数（最大1回）
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
      speakInJapanese: '日本語で話してください',
      recording: '録音中',
      stop: '停止',
      submit: '送信',
      thinking: 'AIが考えています...',
      processing: '処理中...',
      listening: '音声を認識中...',
      recognizing: '音声を認識しています',
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
      speakInJapanese: 'Please speak in Japanese',
      recording: 'Recording',
      stop: 'Stop',
      submit: 'Submit',
      thinking: 'AI is thinking...',
      processing: 'Processing...',
      listening: 'Listening...',
      recognizing: 'Recognizing speech',
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
      speakInJapanese: 'Пожалуйста, говорите на японском языке',
      recording: 'Запись',
      stop: 'Стоп',
      submit: 'Отправить',
      thinking: 'AI думает...',
      processing: 'Обработка...',
      listening: 'Слушаю...',
      recognizing: 'Распознавание речи',
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
      speakInJapanese: 'Iltimos, yapon tilida gapiring',
      recording: 'Yozilmoqda',
      stop: 'To\'xtatish',
      submit: 'Yuborish',
      thinking: 'AI o\'ylayapti...',
      processing: 'Qayta ishlanmoqda...',
      listening: 'Tinglanmoqda...',
      recognizing: 'Nutqni tanib olish',
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

  // APIベースURLを取得（環境に応じて）
  const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3002';
    }
    // 本番環境では現在のドメインを使用
    return window.location.origin;
  };

  // 面接開始
  useEffect(() => {
    const startInterview = async () => {
      try {
        setIsLoading(true);
        setStartTime(new Date());

        // サーバー側のテスト用開始APIを呼び出し
        const apiBaseUrl = getApiBaseUrl();
        console.log('面接開始API呼び出し:', {
          url: `${apiBaseUrl}/api/interview/start`,
          body: {
            email,
            name,
            position,
            language: displayLanguage,
            consentGiven: consentGiven ?? true,
          }
        });

        const response = await fetch(`${apiBaseUrl}/api/interview/start`, {
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

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('レスポンスのパースエラー:', responseText);
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
          console.error('面接開始APIエラー:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            message: data.message,
            details: data.details
          });
          throw new Error(data.message || data.error || `面接開始に失敗しました (${response.status})`);
        }

        if (data.success && (data.nextQuestion || data.question)) {
          // サーバー側セッションIDを優先的に利用
          if (data.sessionId) {
            console.log('セッションIDを設定:', data.sessionId);
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
        } else {
          console.error('面接開始レスポンスが不正:', data);
          throw new Error('面接開始レスポンスが不正です');
        }
      } catch (error) {
        console.error('面接開始エラー:', error);
        const errorMessage = error instanceof Error ? error.message : '面接を開始できませんでした';
        setError(errorMessage);
        onError(errorMessage);
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
      
      const apiBaseUrl = getApiBaseUrl();
      // 音声は必ず日本語で生成（質問内容の表示言語とは独立）
      const response = await fetch(`${apiBaseUrl}/api/interview/synthesize-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, languageCode: 'ja' })  // 常に日本語で音声を生成
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

      // サーバー側TTSが利用できない場合はブラウザの音声合成にフォールバック
      // 音声は必ず日本語で生成（質問内容の表示言語とは独立）
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ja-JP';  // 常に日本語で音声を生成
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        window.speechSynthesis.speak(utterance);
        return;
      }

      setIsPlaying(false);
      setCanStartRecording(true);
    } catch (error) {
      console.error('音声再生エラー:', error);
      // エラー時もブラウザ側の音声合成を試す
      // 音声は必ず日本語で生成（質問内容の表示言語とは独立）
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ja-JP';  // 常に日本語で音声を生成
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
        setCanStartRecording(true);
      }
    }
  };

  // 録音開始
  const startRecording = async () => {
    if (!canStartRecording || isPlaying) return;

    setIsRecording(true);
    setRecordingTime(0);
    setTranscript('');
    setAudioChunks([]);

    try {
      // MediaRecorderで音声ファイルを録音
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioChunks(chunks);
        
        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());
        
        // 録音ファイルをアップロード（質問ごとに個別保存）
        // アップロードが完了するまで待つためにPromiseを使用
        const uploadPromise = (async () => {
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, `recording_${Date.now()}.webm`);
            formData.append('sessionId', activeSessionId);
            formData.append('type', 'audio');
            // 現在の質問IDを追加
            if (currentQuestion?.id) {
              formData.append('questionId', currentQuestion.id);
            }
            // 文字起こしテキストを追加
            const trimmedTranscript = transcript.trim();
            if (trimmedTranscript) {
              formData.append('transcriptionText', trimmedTranscript);
            }
            // emailとuserIdを追加（セッションが見つからない場合のフォールバック用）
            if (email) {
              formData.append('email', email);
            }
            if (userId) {
              formData.append('userId', userId);
            }

            const apiBaseUrl = process.env.NODE_ENV === 'development' 
              ? 'http://localhost:3002' 
              : window.location.origin;
            
            console.log('録音ファイルアップロード開始:', {
              apiBaseUrl,
              sessionId: activeSessionId,
              questionId: currentQuestion?.id,
              fileSize: audioBlob.size,
              fileType: audioBlob.type,
              hasTranscription: !!trimmedTranscript
            });

            const uploadResponse = await fetch(`${apiBaseUrl}/api/interview/upload-recording`, {
              method: 'POST',
              body: formData
            });

            console.log('録音ファイルアップロードレスポンス:', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              ok: uploadResponse.ok
            });

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              console.log('✅ 録音ファイルアップロード成功:', uploadResult);
              return true;
            } else {
              const errorText = await uploadResponse.text();
              console.error('❌ 録音ファイルアップロード失敗:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                errorText: errorText
              });
              // エラーをユーザーに表示しない（面接を継続できるように）
              return false;
            }
          } catch (uploadError) {
            console.error('❌ 録音ファイルアップロードエラー:', uploadError);
            if (uploadError instanceof Error) {
              console.error('エラー詳細:', {
                name: uploadError.name,
                message: uploadError.message,
                stack: uploadError.stack
              });
            }
            // エラーをユーザーに表示しない（面接を継続できるように）
            return false;
          }
        })();
        
        // 録音アップロードを保存して、後で待機できるようにする
        (window as any).lastRecordingUpload = uploadPromise;
      };

      recorder.start(1000); // 1秒ごとにデータを取得
      setAudioRecorder(recorder);
    } catch (error) {
      console.error('MediaRecorder初期化エラー:', error);
      // MediaRecorderが使えない場合でも音声認識は続行
    }

    // 音声認識（テキスト取得用）
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // finalとinterimを結合して表示（常に更新）
        const combined = (finalTranscript + interimTranscript).trim();
        setTranscript(combined);
        console.log('音声認識結果:', { finalTranscript, interimTranscript, combined });
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          console.error('音声認識エラー:', event.error);
          setIsRecording(false);
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
        }
      };

      recognition.onend = () => {
        // 音声認識が終了した場合の処理
        if (isRecording) {
          console.log('音声認識が終了しました（自動停止）');
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
  const stopRecording = async () => {
    setIsRecording(false);
    
    // MediaRecorderを停止
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.stop();
      setAudioRecorder(null);
    }
    
    // 音声認識を停止
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // 録音ファイルのアップロードが完了するまで少し待つ（最大2秒）
    try {
      const uploadPromise = (window as any).lastRecordingUpload;
      if (uploadPromise) {
        await Promise.race([
          uploadPromise,
          new Promise(resolve => setTimeout(resolve, 2000)) // 最大2秒待つ
        ]);
        delete (window as any).lastRecordingUpload;
      }
    } catch (error) {
      console.warn('録音アップロード待機中にエラー:', error);
      // エラーが発生しても続行
    }
    
    // 録音停止後、transcriptがあれば自動的に送信
    const trimmedTranscript = transcript.trim();
    if (trimmedTranscript) {
      setHasRecorded(true); // 録音済みフラグを設定
      setTimeout(() => {
        handleSubmit();
      }, 300);
    } else {
      // transcriptが空の場合、再録音を許可（最大1回）
      if (retryCount < 1) {
        setRetryCount(prev => prev + 1);
        setError(displayLanguage === 'ja' ? '音声が認識されませんでした。もう一度録音してください。' :
                 displayLanguage === 'en' ? 'No speech was recognized. Please record again.' :
                 displayLanguage === 'ru' ? 'Речь не распознана. Пожалуйста, запишите снова.' :
                 'Nutq tanib olinmadi. Iltimos, qayta yozing.');
        setTimeout(() => setError(''), 3000);
        // 再録音を許可するため、hasRecordedは設定しない
      } else {
        // 再録音回数が上限に達した場合、空のtranscriptで送信
        setHasRecorded(true);
        setTimeout(() => {
          handleSubmit();
        }, 300);
      }
    }
  };

  // 回答送信
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // transcriptが空の場合でも送信を許可（再録音回数が上限に達した場合）
    const trimmedTranscript = transcript.trim();
    if (!trimmedTranscript && retryCount < 1) {
      return; // 再録音可能な場合は送信しない
    }

    setIsSubmitting(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          questionId: currentQuestion?.id,
          text: transcript.trim(),
          responseTime: recordingTime,
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('レスポンスのパースエラー:', responseText);
        throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('回答送信APIエラー:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          message: data.message,
          details: data.details
        });
        throw new Error(data.message || data.error || `回答送信に失敗しました (${response.status})`);
      }
      
      if (data.success) {
        if (data.nextQuestion) {
          // 次の質問に進む前に状態をリセット
          setHasRecorded(false);
          setRetryCount(0); // 再録音回数もリセット
          setTranscript('');
          setRecordingTime(0);
          setCurrentQuestion(data.nextQuestion);
          setProgress({
            current: data.progress.current,
            total: data.progress.total,
            percentage: data.progress.percentage
          });
          
          setTimeout(() => {
            // 音声は必ず日本語で生成（質問内容の表示言語とは独立）
            const questionText = typeof data.nextQuestion.text === 'string' 
              ? data.nextQuestion.text 
              : data.nextQuestion.text.ja || '';  // 常に日本語テキストを使用
            playAIMessage(questionText);
          }, 500);
        } else {
          // 面接完了
          // 最後の録音アップロードが完了するまで少し待つ
          try {
            const uploadPromise = (window as any).lastRecordingUpload;
            if (uploadPromise) {
              await Promise.race([
                uploadPromise,
                new Promise(resolve => setTimeout(resolve, 2000)) // 最大2秒待つ
              ]);
              delete (window as any).lastRecordingUpload;
            }
          } catch (error) {
            console.warn('最後の録音アップロード待機中にエラー:', error);
            // エラーが発生しても続行
          }
          
          const finalDuration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
          console.log('面接完了:', {
            duration: finalDuration,
            questionsAnswered: progress.current + 1,
            totalQuestions: progress.total
          });
          onComplete({
            duration: finalDuration,
            questionsAnswered: progress.current + 1,
            totalQuestions: progress.total
          });
        }
      } else {
        throw new Error(data.message || '回答の送信に失敗しました');
      }
    } catch (error) {
      console.error('回答送信エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '回答の送信に失敗しました';
      // UIにエラーを表示（alertではなく）
      setError(errorMessage);
      setIsSubmitting(false);
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(''), 5000);
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* モダンなヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
                  {progress.current + 1}/{progress.total}
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
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
        {/* 進捗バー */}
        <div className="mb-4 animate-slide-in-up">
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
          <div className="mb-4 animate-slide-in-up">
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 overflow-hidden">
              {/* 装飾的な背景要素 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl border-4 border-white/30">
                          {progress.current + 1}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t.question} {progress.current + 1}</h2>
                        <p className="text-sm text-gray-500 font-medium">{progress.total}問中 / {progress.percentage}%</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
                      <p className="text-lg text-gray-800 leading-relaxed font-medium">
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
                      className="ml-4 p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex-shrink-0"
                    >
                      <Play className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 animate-slide-in-up">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-red-800 font-medium flex-1 text-sm">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 録音エリア */}
        <div className="animate-slide-in-up">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 overflow-hidden">
            {/* 装飾的な背景要素 */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100/50 to-pink-100/50 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative">
              {isPlaying ? (
                <div className="text-center py-8">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <Volume2 className="h-10 w-10 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">{t.thinking}</p>
                </div>
              ) : isSubmitting ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">{t.processing}</p>
                </div>
              ) : hasRecorded && transcript ? (
                <div className="text-center">
                  {/* 録音停止後、送信待ち状態 */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-left border-2 border-blue-300 shadow-lg">
                    <p className="text-gray-900 leading-relaxed text-lg mb-4 font-medium whitespace-pre-wrap break-words">
                      {transcript}
                    </p>
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                      <p className="text-gray-600 text-sm">{t.processing}</p>
                    </div>
                  </div>
                </div>
              ) : isRecording ? (
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-40 animate-ping"></div>
                    <button
                      onClick={stopRecording}
                      className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl hover:shadow-red-500/50 transition-all hover:scale-105"
                    >
                      <Mic className="h-16 w-16 text-white" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <p className="text-xl font-bold text-red-600">{t.recording}</p>
                    </div>
                    <p className="text-4xl font-mono text-gray-800 font-bold tracking-wider">{formatTime(recordingTime)}</p>
                  </div>
                  {/* 録音中のテキスト表示エリア */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-left border-2 border-blue-300 shadow-lg">
                    <p className="text-sm font-medium text-blue-600 mb-3">{t.speakInJapanese}</p>
                    {transcript ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">{t.recognizing}</span>
                        </div>
                        <p className="text-lg text-gray-900 leading-relaxed font-medium whitespace-pre-wrap break-words min-h-[80px]">
                          {transcript}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-[80px]">
                        <div className="text-center">
                          <div className="relative inline-block mb-2">
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <div className="relative w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <p className="text-gray-500 text-sm">{t.listening}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={stopRecording}
                      className="w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-md mt-4"
                    >
                      {t.stop}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={toggleRecording}
                    disabled={!canStartRecording || isPlaying || (hasRecorded && retryCount >= 1)}
                    className={`relative w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl transition-all ${
                      canStartRecording && !isPlaying && !(hasRecorded && retryCount >= 1)
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 hover:shadow-blue-500/50'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Mic className="h-16 w-16" />
                  </button>
                  <p className="text-xl font-bold text-gray-700 mb-2">
                    {canStartRecording && !(hasRecorded && retryCount >= 1) ? t.speakNow : t.thinking}
                  </p>
                  {retryCount > 0 && !hasRecorded && (
                    <p className="text-sm text-orange-600 font-medium mb-2">
                      {displayLanguage === 'ja' ? '再録音可能（残り1回）' :
                       displayLanguage === 'en' ? 'Retry available (1 remaining)' :
                       displayLanguage === 'ru' ? 'Повторная запись доступна (осталось 1)' :
                       'Qayta yozish mumkin (1 qoldi)'}
                    </p>
                  )}
                  <p className="text-sm text-blue-600 font-medium mb-2">{t.speakInJapanese}</p>
                  <p className="text-sm text-gray-500">
                    {displayLanguage === 'ja' ? 'ボタンを押して録音を開始' : 
                     displayLanguage === 'en' ? 'Press button to start recording' :
                     displayLanguage === 'ru' ? 'Нажмите кнопку, чтобы начать запись' :
                     'Boshlash uchun tugmani bosing'}
                  </p>
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
