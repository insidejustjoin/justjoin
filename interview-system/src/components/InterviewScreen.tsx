import React, { useState, useEffect, useRef } from 'react';
import { 
  MicIcon, 
  MicOffIcon, 
  ClockIcon, 
  BarChart3Icon,
  XIcon,
  MessageCircleIcon,
  Volume2Icon,
  VolumeXIcon,
  GlobeIcon
} from 'lucide-react';
import { Language, Question } from '@/types/interview';

// SpeechRecognitionの型定義
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// SpeechRecognitionイベントの型定義
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
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
  const [aiMessage, setAiMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 10, percentage: 0 });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [canStartRecording, setCanStartRecording] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language);
  
  // languageプロップが変更されたらdisplayLanguageも更新
  useEffect(() => {
    setDisplayLanguage(language);
  }, [language]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  
  // 面接品質向上のための状態
  const [recordingQuality, setRecordingQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [networkStatus, setNetworkStatus] = useState<'good' | 'fair' | 'poor'>('good');
  const [showQualityIndicator, setShowQualityIndicator] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<Array<{
    questionId: string;
    question: string;
    answer: string;
    responseTime: number;
    timestamp: Date;
  }>>([]);
  
  // エラーハンドリングの改善
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  const texts = {
    ja: {
      loading: '面接を準備しています...',
      startRecording: '録音開始',
      stopRecording: '録音停止',
      listening: '音声を聞いています...',
      thinking: 'AI面接官が回答を考えています...',
      timeElapsed: '経過時間',
      progress: '進捗',
      endInterview: '面接を終了',
      confirmEnd: '面接を終了してもよろしいですか？',
      aiInterviewer: 'AI面接官',
      mute: '音声をミュート',
      unmute: '音声を有効化',
      speakNow: '今すぐ話してください',
      processing: '音声を処理中...',
      noAudio: '音声が検出されませんでした',
      retry: '再試行',
      recordingTime: '録音時間',
      nextQuestion: '次の質問へ',
      recordingInProgress: '録音中...',
      clickToStart: 'クリックして録音開始',
      clickToStop: 'クリックして録音停止',
      autoNext: '自動で次の質問に進みます',
      videoRecording: '録画中...',
      startVideoRecording: '録画開始',
      stopVideoRecording: '録画停止',
      audioRecording: '音声録音中...',
      recordingComplete: '録音完了',
      answerInJapanese: '回答は日本語でお願いします',
      languageToggle: '言語切り替え',
      japanese: '日本語',
      english: 'English'
    },
    en: {
      loading: 'Preparing interview...',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      listening: 'Listening to your voice...',
      thinking: 'AI interviewer is thinking...',
      timeElapsed: 'Time Elapsed',
      progress: 'Progress',
      endInterview: 'End Interview',
      confirmEnd: 'Are you sure you want to end the interview?',
      aiInterviewer: 'AI Interviewer',
      mute: 'Mute Audio',
      unmute: 'Unmute Audio',
      speakNow: 'Please speak now',
      processing: 'Processing audio...',
      noAudio: 'No audio detected',
      retry: 'Retry',
      recordingTime: 'Recording Time',
      nextQuestion: 'Next Question',
      recordingInProgress: 'Recording...',
      clickToStart: 'Click to start recording',
      clickToStop: 'Click to stop recording',
      autoNext: 'Automatically proceeding to next question',
      videoRecording: 'Recording...',
      startVideoRecording: 'Start Recording',
      stopVideoRecording: 'Stop Recording',
      audioRecording: 'Audio recording...',
      recordingComplete: 'Recording complete',
      answerInJapanese: 'Please answer in Japanese',
      languageToggle: 'Language Toggle',
      japanese: '日本語',
      english: 'English'
    },
    ru: {
      loading: 'Подготовка интервью...',
      startRecording: 'Начать запись',
      stopRecording: 'Остановить запись',
      listening: 'Прослушивание вашего голоса...',
      thinking: 'AI-интервьюер думает...',
      timeElapsed: 'Прошедшее время',
      progress: 'Прогресс',
      endInterview: 'Завершить интервью',
      confirmEnd: 'Вы уверены, что хотите завершить интервью?',
      aiInterviewer: 'AI-интервьюер',
      mute: 'Отключить звук',
      unmute: 'Включить звук',
      speakNow: 'Пожалуйста, говорите сейчас',
      processing: 'Обработка аудио...',
      noAudio: 'Аудио не обнаружено',
      retry: 'Повторить',
      recordingTime: 'Время записи',
      nextQuestion: 'Следующий вопрос',
      recordingInProgress: 'Запись...',
      clickToStart: 'Нажмите, чтобы начать запись',
      clickToStop: 'Нажмите, чтобы остановить запись',
      autoNext: 'Автоматический переход к следующему вопросу',
      videoRecording: 'Запись...',
      startVideoRecording: 'Начать запись',
      stopVideoRecording: 'Остановить запись',
      audioRecording: 'Аудио запись...',
      recordingComplete: 'Запись завершена',
      answerInJapanese: 'Пожалуйста, отвечайте на японском языке',
      languageToggle: 'Переключение языка',
      japanese: '日本語',
      english: 'English'
    },
    uz: {
      loading: 'Intervyu tayyorlanmoqda...',
      startRecording: 'Yozib olishni boshlash',
      stopRecording: 'Yozib olishni to\'xtatish',
      listening: 'Ovozingiz tinglanmoqda...',
      thinking: 'AI intervyu beruvchi o\'ylamoqda...',
      timeElapsed: 'O\'tgan vaqt',
      progress: 'Jarayon',
      endInterview: 'Intervyuni yakunlash',
      confirmEnd: 'Intervyuni yakunlashni xohlaysizmi?',
      aiInterviewer: 'AI intervyu beruvchi',
      mute: 'Ovozni o\'chirish',
      unmute: 'Ovozni yoqish',
      speakNow: 'Iltimos, hozir gapiring',
      processing: 'Audio qayta ishlanmoqda...',
      noAudio: 'Audio aniqlanmadi',
      retry: 'Qayta urinish',
      recordingTime: 'Yozib olish vaqti',
      nextQuestion: 'Keyingi savol',
      recordingInProgress: 'Yozib olinmoqda...',
      clickToStart: 'Yozib olishni boshlash uchun bosing',
      clickToStop: 'Yozib olishni to\'xtatish uchun bosing',
      autoNext: 'Keyingi savolga avtomatik o\'tish',
      videoRecording: 'Yozib olinmoqda...',
      startVideoRecording: 'Yozib olishni boshlash',
      stopVideoRecording: 'Yozib olishni to\'xtatish',
      audioRecording: 'Audio yozib olinmoqda...',
      recordingComplete: 'Yozib olish yakunlandi',
      answerInJapanese: 'Iltimos, yapon tilida javob bering',
      languageToggle: 'Tilni o\'zgartirish',
      japanese: '日本語',
      english: 'English'
    }
  };

  const t = texts[language] || texts.ja;

  // 質問の状態をデバッグ
  useEffect(() => {
    console.log('質問状態更新:', {
      currentQuestion: currentQuestion,
      progress: progress,
      isRecording: isRecording,
      isPlaying: isPlaying,
      canStartRecording: canStartRecording,
      transcript: transcript
    });
  }, [currentQuestion, progress, isRecording, isPlaying, canStartRecording, transcript]);

  // 音声認識の初期化
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP'; // 日本語固定
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // 暫定結果を表示（音声認識中であることを示す）
        if (interimTranscript) {
          setIsListening(true);
          setTranscript(interimTranscript);
        }
        
        // 最終結果がある場合は処理
        if (finalTranscript.trim()) {
          const finalText = finalTranscript.trim();
          console.log('音声認識最終結果:', finalText);
          setIsListening(false);
          setTranscript(finalText);
          
          // 録音を停止してから回答を処理
          setTimeout(() => {
            stopRecording();
            // 少し待ってから回答を送信（録音停止処理が完了するまで）
            setTimeout(() => {
              handleVoiceAnswer(finalText);
            }, 300);
          }, 100);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        if (event.error === 'aborted') {
          console.log('音声認識が中断されました（正常）');
        } else if (event.error === 'no-speech') {
          console.log('音声が検出されませんでした');
          setIsRecording(false);
          isRecordingRef.current = false;
          setCanStartRecording(true);
        } else {
          console.error('音声認識エラー:', event.error);
          setIsRecording(false);
          isRecordingRef.current = false;
          setCanStartRecording(true);
        }
      };
      
      recognition.onend = () => {
        console.log('音声認識終了、isRecordingRef:', isRecordingRef.current);
        // 録音中に自動的に終了した場合は再開を試みる（ただし、手動で停止した場合は再開しない）
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            // 少し待ってから再開（ブラウザの制限を回避）
            setTimeout(() => {
              // 再度状態を確認
              if (isRecordingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('音声認識再開');
                } catch (error: any) {
                  if (error.name !== 'InvalidStateError') {
                    console.log('音声認識再開失敗:', error);
                  }
                }
              }
            }, 500);
          } catch (error) {
            console.log('音声認識再開失敗（正常終了の可能性）');
          }
        }
      };
      
      recognitionRef.current = recognition;
      console.log('音声認識初期化完了');
    } else {
      console.warn('音声認識APIが利用できません');
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // 既に停止している場合は無視
        }
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  // タイマー管理
  useEffect(() => {
    if (startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  // 録音時間の管理（簡素化版）
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // セッション情報を取得
  useEffect(() => {
    fetchSessionInfo();
  }, [sessionId]);

  // 面接品質監視（音声のみ）
  useEffect(() => {
    const checkQuality = () => {
      // ネットワーク品質チェック
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          const downlink = connection.downlink;
          
          if (effectiveType === '4g' && downlink > 10) {
            setNetworkStatus('good');
          } else if (effectiveType === '4g' || effectiveType === '3g') {
            setNetworkStatus('fair');
          } else {
            setNetworkStatus('poor');
          }
        }
      }

      // 音声品質チェック（サンプルレートのみ簡易チェック）
      if (audioRecorder && audioRecorder.state === 'recording') {
        const stream = audioRecorder.stream;
        const audioTrack = stream.getAudioTracks()[0];

        if (audioTrack) {
          const audioSettings = audioTrack.getSettings();

          if (audioSettings.sampleRate && audioSettings.sampleRate >= 44100) {
            setRecordingQuality('high');
          } else if (audioSettings.sampleRate && audioSettings.sampleRate >= 22050) {
            setRecordingQuality('medium');
          } else {
            setRecordingQuality('low');
          }
        }
      }
    };

    const qualityInterval = setInterval(checkQuality, 5000);
    return () => clearInterval(qualityInterval);
  }, [audioRecorder]);

  // 音声録音の開始
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      setMediaStream(stream);
      setAudioChunks([]); // チャンクをリセット

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('音声録音完了、サイズ:', blob.size);
        if (blob.size > 0) {
          uploadRecording(blob, 'audio');
        }
        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorderエラー:', event);
      };

      setAudioRecorder(recorder);
      recorder.start(1000); // 1秒ごとにデータを取得
      console.log('音声録音開始');
    } catch (error) {
      console.error('音声録音開始エラー:', error);
      setIsRecording(false);
      setCanStartRecording(true);
    }
  };

  // 録音データのアップロード
  const uploadRecording = async (blob: Blob, type: 'video' | 'audio') => {
    try {
      const formData = new FormData();
      formData.append('file', blob, `${sessionId}_${type}_${Date.now()}.webm`);
      formData.append('sessionId', sessionId);
      formData.append('type', type);

      const response = await fetch('/api/interview/upload-recording', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log(`${type}録音アップロード成功`);
      } else {
        console.error(`${type}録音アップロード失敗`);
      }
    } catch (error) {
      console.error(`${type}録音アップロードエラー:`, error);
    }
  };

  // 録音の停止（音声のみ）
  const stopAudioRecording = () => {
    if (audioRecorder) {
      if (audioRecorder.state === 'recording') {
        audioRecorder.stop();
        console.log('音声録音停止');
      }
      setAudioRecorder(null);
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };

  const fetchSessionInfo = async () => {
    try {
      const response = await fetch(`/api/interview/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        await startOrContinueInterview();
      } else {
        onError(data.error || 'Failed to load session');
      }
    } catch (error) {
      console.error('Failed to fetch session info:', error);
      onError('Failed to connect to server');
    }
  };

  const startOrContinueInterview = async () => {
    try {
      setIsLoading(true);
      console.log('面接開始API呼び出し:', {
        email: email || 'test@example.com',
        name: name || 'テストユーザー',
        language: 'ja',
        position: position || 'ソフトウェアエンジニア',
        consentGiven
      });

      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email || 'test@example.com',
          name: name || 'テストユーザー',
          language: language, // languageプロップを使用
          position: position || 'ソフトウェアエンジニア',
          consentGiven
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('面接開始成功:', data);
        console.log('質問設定:', data.nextQuestion);
        console.log('質問ID:', data.nextQuestion?.id);
        console.log('質問テキスト:', data.nextQuestion?.text);
        
        setAiMessage(data.message);
        setCurrentQuestion(data.nextQuestion);
        setProgress(data.progress);
        setQuestionStartTime(new Date());
        setStartTime(new Date());
        setIsLoading(false);
        
        // AIのメッセージを音声で再生（1回のみ）
        console.log('面接開始音声再生開始');
        playAIMessage(data.message);
      } else {
        console.error('面接開始失敗:', data.error);
        onError(data.error || 'Failed to start interview');
      }
    } catch (error) {
      console.error('面接開始エラー:', error);
      onError('Failed to connect to server');
    }
  };

  const playAIMessage = async (message: string) => {
    if (isMuted) {
      setCanStartRecording(true);
      return;
    }
    
    try {
      setIsPlaying(true);
      setCanStartRecording(false); // 音声再生中は録音開始を無効化
      
      // より自然な音声合成の設定
      if ('speechSynthesis' in window) {
        // 既存の音声を停止
        speechSynthesis.cancel();
        
        // 音声リストが読み込まれるまで待機
        const loadVoices = () => {
          return new Promise<void>((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              resolve();
            } else {
              speechSynthesis.onvoiceschanged = () => resolve();
            }
          });
        };
        
        await loadVoices();
        
        // メッセージと質問テキストを結合して読み上げ（日本語版を使用）
        let textToSpeak = message;
        if (currentQuestion && currentQuestion.text) {
          // 質問テキストを追加（日本語版を使用 - 回答は日本語で行うため）
          const questionText = typeof currentQuestion.text === 'string' 
            ? currentQuestion.text 
            : currentQuestion.text.ja || currentQuestion.text.en || '';
          if (questionText && !textToSpeak.includes(questionText)) {
            textToSpeak += '\n\n' + questionText;
          }
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // 音声は日本語固定（回答は日本語で行うため）
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9; // 聞き取りやすい速度（0.85より少し速く）
        utterance.pitch = 1.05; // 少し高めのピッチでより自然に
        utterance.volume = 1.0; // 最大音量
        
        // より自然な日本語音声を選択（優先順位: Google女性 > Google男性 > Microsoft > その他）
        const voices = speechSynthesis.getVoices();
        let japaneseVoice = voices.find(voice => 
          voice.lang.includes('ja') && 
          (voice.name.includes('Google') || voice.name.includes('google')) &&
          (voice.name.includes('Female') || voice.name.includes('女性') || voice.name.includes('Kyoko') || voice.name.includes('Sayaka'))
        );
        if (!japaneseVoice) {
          japaneseVoice = voices.find(voice => 
            voice.lang.includes('ja') && 
            (voice.name.includes('Google') || voice.name.includes('google'))
          );
        }
        if (!japaneseVoice) {
          japaneseVoice = voices.find(voice => 
            voice.lang.includes('ja') && 
            (voice.name.includes('Microsoft') || voice.name.includes('Microsoft'))
          );
        }
        if (!japaneseVoice) {
          japaneseVoice = voices.find(voice => 
            voice.lang.includes('ja') && 
            (voice.name.includes('女性') || voice.name.includes('Female') || voice.name.includes('Kyoko') || voice.name.includes('Sayaka'))
          );
        }
        if (!japaneseVoice) {
          japaneseVoice = voices.find(voice => voice.lang.includes('ja'));
        }
        if (japaneseVoice) {
          utterance.voice = japaneseVoice;
          console.log('選択された音声:', japaneseVoice.name, japaneseVoice.lang);
        } else {
          console.warn('日本語音声が見つかりませんでした。デフォルト音声を使用します。');
        }
        
        utterance.onend = () => {
          console.log('音声再生完了、録音開始可能');
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        
        utterance.onerror = (event) => {
          console.error('音声合成エラー:', event);
          setIsPlaying(false);
          setCanStartRecording(true);
        };
        
        // 音声再生を開始
        console.log('音声再生開始:', textToSpeak.substring(0, 100));
        speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
        setCanStartRecording(true);
      }
    } catch (error) {
      console.error('Failed to play AI message:', error);
      setIsPlaying(false);
      setCanStartRecording(true);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    console.log('録音開始処理:', {
      isRecording: isRecording,
      isPlaying: isPlaying,
      canStartRecording: canStartRecording,
      currentQuestion: currentQuestion
    });

    if (isRecording || isPlaying || !canStartRecording || !currentQuestion) {
      console.log('録音開始条件不満足:', {
        isRecording,
        isPlaying,
        canStartRecording,
        hasQuestion: !!currentQuestion
      });
      return;
    }

    try {
      console.log('録音開始');
      setIsRecording(true);
      setIsListening(true);
      isRecordingRef.current = true;
      setTranscript('');
      
      // 音声録画開始
      startAudioRecording();
      
      // 音声認識開始
      if (recognitionRef.current) {
        try {
          if (recognitionRef.current.state === 'stopped' || recognitionRef.current.state === 'idle') {
            recognitionRef.current.start();
            console.log('音声認識開始');
          }
        } catch (error: any) {
          if (error.name === 'InvalidStateError') {
            console.log('音声認識は既に開始されています');
          } else {
            console.error('音声認識開始エラー:', error);
          }
        }
      }
    } catch (error) {
      console.error('録音開始エラー:', error);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    console.log('録音停止処理:', {
      isRecording: isRecording,
      isListening: isListening
    });

    if (!isRecording) {
      console.log('録音中ではないため停止処理をスキップ');
      return;
    }

    try {
      console.log('録音停止開始');
      
      // 状態を先に更新
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsListening(false);
      
      // 音声認識を停止（これにより最終結果が生成される可能性がある）
      if (recognitionRef.current) {
        try {
          if (recognitionRef.current.state === 'listening' || recognitionRef.current.state === 'starting') {
            recognitionRef.current.stop();
            console.log('音声認識停止');
          }
        } catch (error) {
          console.error('音声認識停止エラー:', error);
        }
      }
      
      // 音声録音停止
      stopAudioRecording();
      
      console.log('録音停止完了');
    } catch (error) {
      console.error('録音停止エラー:', error);
      setIsRecording(false);
      setIsListening(false);
    }
  };

  const handleVoiceAnswer = async (voiceTranscript: string) => {
    console.log('音声回答処理開始:', {
      transcript: voiceTranscript,
      currentQuestion: currentQuestion,
      isSubmitting: isSubmitting,
      sessionId: sessionId,
      progress: progress
    });

    if (!voiceTranscript.trim()) {
      console.log('音声認識結果が空のため処理をスキップ');
      setCanStartRecording(true);
      return;
    }

    if (!currentQuestion) {
      console.log('現在の質問が設定されていないため処理をスキップ');
      setCanStartRecording(true);
      return;
    }

    if (isSubmitting) {
      console.log('既に送信中のため処理をスキップ');
      return;
    }

    console.log('音声回答処理実行:', {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      transcript: voiceTranscript
    });

    const responseTime = questionStartTime 
      ? Math.floor((Date.now() - questionStartTime.getTime()) / 1000)
      : 0;

    setIsSubmitting(true);

    try {
      const requestBody = {
        sessionId,
        questionId: currentQuestion.id,
        text: voiceTranscript.trim(),
        responseTime
      };

      console.log('回答送信リクエスト:', requestBody);

      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('回答送信レスポンス:', data);

        if (data.success) {
        console.log('回答送信成功、次の質問へ:', data);
        setAiMessage(data.message || '');
        if (data.progress) {
          setProgress(data.progress);
        }
        
        if (data.isComplete) {
          console.log('面接完了');
          stopAudioRecording();
          // 音声認識を完全に停止
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              // 既に停止している場合は無視
            }
          }
          onComplete();
        } else {
          console.log('次の質問を設定:', data.nextQuestion);
          if (data.nextQuestion) {
            setCurrentQuestion(data.nextQuestion);
            setQuestionStartTime(new Date());
            setHasPlayedAudio(false); // 次の質問用にリセット
            setTranscript(''); // トランスクリプトをリセット
            setCanStartRecording(false); // 音声再生まで録音を無効化
            
            // 次のAIメッセージを音声で再生（1回のみ）
            console.log('次の質問の音声再生開始');
            playAIMessage(data.message || '');
          } else {
            console.error('次の質問が取得できませんでした');
            onError('次の質問を取得できませんでした');
          }
        }
      } else {
        console.error('回答送信エラー:', data.error);
        setCanStartRecording(true); // エラー時は録音を再開可能に
        onError(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      onError('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const endInterview = async () => {
    if (window.confirm(t.confirmEnd)) {
      stopAudioRecording();
      try {
        const response = await fetch('/api/interview/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, reason: 'user_terminated' })
        });

        const data = await response.json();
        if (data.success) {
          onComplete();
        } else {
          onError(data.error || 'Failed to end interview');
        }
      } catch (error) {
        console.error('Failed to end interview:', error);
        onError('Failed to end interview');
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      speechSynthesis.resume();
    } else {
      speechSynthesis.pause();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircleIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-lg">{t.aiInterviewer}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span className="font-medium">{formatTime(elapsedTime)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <BarChart3Icon className="h-4 w-4" />
                  <span className="font-medium">{progress.current}/{progress.total} ({progress.percentage}%)</span>
                </div>
                {/* 録音品質インジケーター */}
                {/* 面接品質インジケーター */}
                <div className="flex items-center space-x-3 ml-4">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      networkStatus === 'good' ? 'bg-green-500' : 
                      networkStatus === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-500">ネット</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      recordingQuality === 'high' ? 'bg-green-500' : 
                      recordingQuality === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-500">品質</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* 言語切り替えボタン（ヘッダー） */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <GlobeIcon className="h-4 w-4 text-gray-600" />
                <button
                  onClick={() => {
                    const languages: Language[] = ['ja', 'en', 'ru', 'uz'];
                    const currentIndex = languages.indexOf(displayLanguage);
                    const nextIndex = (currentIndex + 1) % languages.length;
                    setDisplayLanguage(languages[nextIndex]);
                  }}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700"
                  title="言語を切り替え"
                >
                  {displayLanguage === 'ja' ? '日本語' : 
                   displayLanguage === 'en' ? 'English' :
                   displayLanguage === 'ru' ? 'Русский' : 'O\'zbek'}
                </button>
              </div>
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? t.unmute : t.mute}
              >
                {isMuted ? <VolumeXIcon className="h-5 w-5" /> : <Volume2Icon className="h-5 w-5" />}
              </button>
              <button
                onClick={endInterview}
                className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200"
                title={t.endInterview}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          {/* AI面接官のメッセージ */}
          <div className="mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {/* アバター画像 */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg relative">
                  {!avatarError ? (
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'interviewer')}&backgroundColor=b6e3ff&clothingColor=262e33&mouth=smile&eyes=happy`}
                      alt="AI面接官"
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error('アバター画像の読み込みに失敗');
                        setAvatarError(true);
                      }}
                      onLoad={() => {
                        console.log('アバター画像の読み込み成功');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <MessageCircleIcon className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <p className="text-gray-800 whitespace-pre-wrap text-lg leading-relaxed">
                    {displayLanguage === 'ja' ? aiMessage : aiMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 現在の質問 */}
          {currentQuestion && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-r-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-yellow-800 text-lg">
                    {displayLanguage === 'ja' ? '質問:' : 'Question:'}
                  </h3>
                  {/* 言語切り替えボタン */}
                  <div className="flex items-center space-x-2">
                    <GlobeIcon className="h-4 w-4 text-yellow-600" />
                    <button
                      onClick={() => {
                        const languages: Language[] = ['ja', 'en', 'ru', 'uz'];
                        const currentIndex = languages.indexOf(displayLanguage);
                        const nextIndex = (currentIndex + 1) % languages.length;
                        setDisplayLanguage(languages[nextIndex]);
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        displayLanguage === 'ja' 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {displayLanguage === 'ja' ? '日本語' : 
                       displayLanguage === 'en' ? 'English' :
                       displayLanguage === 'ru' ? 'Русский' : 'O\'zbek'}
                    </button>
                  </div>
                </div>
                <p className="text-yellow-700 text-lg leading-relaxed mb-3">
                  {typeof currentQuestion.text === 'string' 
                    ? currentQuestion.text
                    : currentQuestion.text[displayLanguage] || currentQuestion.text.ja || currentQuestion.text.en || ''}
                </p>
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                  <p className="text-sm text-yellow-800 font-medium">
                    {displayLanguage === 'ja' 
                      ? '※回答は日本語でお願いします' 
                      : displayLanguage === 'en'
                      ? '※Please answer in Japanese'
                      : displayLanguage === 'ru'
                      ? '※Пожалуйста, отвечайте на японском языке'
                      : '※Iltimos, yapon tilida javob bering'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 録音エリア */}
          <div className="text-center">
            {isPlaying ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <Volume2Icon className="h-12 w-12 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-lg font-medium">{t.thinking}</p>
              </div>
            ) : isSubmitting ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-gray-600 text-lg font-medium">{t.processing}</p>
              </div>
            ) : isRecording ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <button
                    onClick={toggleRecording}
                    className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all duration-200 shadow-lg animate-pulse"
                  >
                    <MicOffIcon className="h-12 w-12 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-red-600 text-lg font-medium">{t.recordingInProgress}</p>
                  <p className="text-gray-500">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-gray-600">{t.clickToStop}</p>
                </div>
                {transcript && (
                  <div className="bg-gray-50 rounded-xl p-4 max-w-2xl mx-auto space-y-3">
                    <p className="text-sm text-gray-700">{transcript}</p>
                    <button
                      onClick={() => {
                        if (transcript.trim()) {
                          stopRecording();
                          setTimeout(() => {
                            handleVoiceAnswer(transcript.trim());
                          }, 300);
                        }
                      }}
                      disabled={isSubmitting || !transcript.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? t.processing : (displayLanguage === 'ja' ? '回答を送信' : 'Submit Answer')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={toggleRecording}
                  disabled={!canStartRecording || isSubmitting || isPlaying}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    canStartRecording && !isSubmitting && !isPlaying
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  <MicIcon className="h-12 w-12" />
                </button>
                <div className="space-y-2">
                  <p className="text-gray-600 text-lg font-medium">
                    {isPlaying 
                      ? (displayLanguage === 'ja' ? '音声再生中...' : displayLanguage === 'en' ? 'Playing audio...' : displayLanguage === 'ru' ? 'Воспроизведение аудио...' : 'Audio ijro etilmoqda...')
                      : isListening 
                        ? (displayLanguage === 'ja' ? '音声認識中...' : displayLanguage === 'en' ? 'Listening...' : displayLanguage === 'ru' ? 'Распознавание речи...' : 'Ovozni tanib olish...')
                        : isRecording
                          ? (displayLanguage === 'ja' ? '録音中...' : displayLanguage === 'en' ? 'Recording...' : displayLanguage === 'ru' ? 'Запись...' : 'Yozib olinmoqda...')
                          : canStartRecording 
                            ? t.speakNow 
                            : t.thinking}
                  </p>
                  {isListening && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                  {canStartRecording && !isPlaying && !isRecording && !isListening && (
                    <p className="text-sm text-gray-500">{t.clickToStart}</p>
                  )}
                  {isPlaying && (
                    <p className="text-sm text-blue-600">
                      {displayLanguage === 'ja' ? '問題文の読み上げが終わるまでお待ちください' :
                       displayLanguage === 'en' ? 'Please wait for the question to finish reading' :
                       displayLanguage === 'ru' ? 'Пожалуйста, дождитесь окончания чтения вопроса' :
                       'Savol o\'qilishi tugaguncha kuting'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 録音に関する注意表示（カメラは使用しない） */}
        <div className="mt-4 text-center text-xs text-gray-500">
          {displayLanguage === 'ja' 
            ? 'この面接ではカメラ映像は保存されず、音声のみが録音されます。回答は日本語でお願いします。'
            : displayLanguage === 'en'
            ? 'Only audio is recorded in this interview, not video. Please answer in Japanese.'
            : displayLanguage === 'ru'
            ? 'В этом собеседовании записывается только аудио, не видео. Пожалуйста, отвечайте на японском языке.'
            : 'Ushbu intervyuda faqat audio yoziladi, video emas. Iltimos, yapon tilida javob bering.'}
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen; 