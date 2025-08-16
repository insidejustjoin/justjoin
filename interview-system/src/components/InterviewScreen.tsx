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
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  VideoIcon,
  VideoOffIcon
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
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      recordingComplete: '録音完了'
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
      recordingComplete: 'Recording complete'
    }
  };

  const t = texts[language];

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

  // SpeechRecognitionの初期化
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('SpeechRecognition API not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'ja-JP';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('音声認識開始');
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log('音声認識結果:', transcript);
      console.log('現在の質問:', currentQuestion);
      setTranscript(transcript);
      setIsListening(false);
      
      // 音声認識結果を即座に処理
      console.log('音声認識結果を処理:', transcript);
      handleVoiceAnswer(transcript);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('音声認識エラー:', event.error);
      setIsListening(false);
      setIsRecording(false);
      
      if (event.error === 'no-speech') {
        console.log('音声が検出されませんでした');
        setCanStartRecording(true);
      } else {
        console.error('音声認識エラー:', event.error);
        setCanStartRecording(true);
      }
    };

    recognitionRef.current.onend = () => {
      console.log('音声認識終了');
      setIsListening(false);
      
      // 音声認識が終了しても、結果が処理されていない場合は再録音を許可
      if (!transcript.trim()) {
        console.log('音声認識結果がないため、再録音を許可');
        setCanStartRecording(true);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]); // transcriptを依存配列に追加

  // 録画録音の初期化
  useEffect(() => {
    startVideoRecording();
    startAudioRecording();
  }, []);

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

  // 録音時間の管理
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

  // 面接品質監視
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

      // 録画品質チェック
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        const stream = mediaRecorder.stream;
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack && audioTrack) {
          const videoSettings = videoTrack.getSettings();
          const audioSettings = audioTrack.getSettings();
          
          if (videoSettings.width && videoSettings.width >= 1280 && 
              audioSettings.sampleRate && audioSettings.sampleRate >= 44100) {
            setRecordingQuality('high');
          } else if (videoSettings.width && videoSettings.width >= 640 && 
                     audioSettings.sampleRate && audioSettings.sampleRate >= 22050) {
            setRecordingQuality('medium');
          } else {
            setRecordingQuality('low');
          }
        }
      }
    };

    const qualityInterval = setInterval(checkQuality, 5000);
    return () => clearInterval(qualityInterval);
  }, [mediaRecorder]);

  // 録画録音の開始
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

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
        console.log('録画完了:', url);
        // ここで録画データをサーバーに送信
        uploadRecording(blob, 'video');
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsVideoRecording(true);
      console.log('録画録音開始');
    } catch (error) {
      console.error('録画録音開始エラー:', error);
    }
  };

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

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('音声録音完了');
        uploadRecording(blob, 'audio');
      };

      setAudioRecorder(recorder);
      recorder.start();
      console.log('音声録音開始');
    } catch (error) {
      console.error('音声録音開始エラー:', error);
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

  // 録画録音の停止
  const stopVideoRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsVideoRecording(false);
      console.log('録画録音停止');
    }
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.stop();
      console.log('音声録音停止');
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
          language: 'ja', // 日本語固定
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
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9; // 少し遅く
        utterance.pitch = 1.05; // 少し高め
        utterance.volume = 0.95; // 音量調整
        
        // より自然な音声を選択
        const voices = speechSynthesis.getVoices();
        const japaneseVoice = voices.find(voice => 
          voice.lang.includes('ja') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        );
        if (japaneseVoice) {
          utterance.voice = japaneseVoice;
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
        console.log('音声再生開始');
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
      setTranscript('');
      
      // 動画録画開始
      startVideoRecording();
      
      // 音声録画開始
      startAudioRecording();
      
      // 音声認識開始
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('録音開始エラー:', error);
      setIsRecording(false);
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
      setIsRecording(false);
      setIsListening(false);
      
      // 動画録画停止
      stopVideoRecording();
      
      // 音声認識停止
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      console.log('録音停止完了、音声認識結果を待機中');
    } catch (error) {
      console.error('録音停止エラー:', error);
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
        setAiMessage(data.message);
        setProgress(data.progress);
        
        if (data.isComplete) {
          console.log('面接完了');
          stopVideoRecording();
          onComplete();
        } else {
          console.log('次の質問を設定:', data.nextQuestion);
          setCurrentQuestion(data.nextQuestion);
          setQuestionStartTime(new Date());
          setHasPlayedAudio(false); // 次の質問用にリセット
          setTranscript(''); // トランスクリプトをリセット
          
          // 次のAIメッセージを音声で再生（1回のみ）
          console.log('次の質問の音声再生開始');
          playAIMessage(data.message);
        }
      } else {
        console.error('回答送信エラー:', data.error);
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
      stopVideoRecording();
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
                <div className="flex items-center space-x-2 text-gray-600">
                  {isVideoRecording ? (
                    <div className="flex items-center space-x-1 text-red-600">
                      <VideoIcon className="h-4 w-4" />
                      <span className="text-xs">{t.videoRecording}</span>
                    </div>
                  ) : null}
                </div>
                
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
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <p className="text-gray-800 whitespace-pre-wrap text-lg leading-relaxed">{aiMessage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 現在の質問 */}
          {currentQuestion && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-r-2xl">
                <h3 className="font-semibold text-yellow-800 mb-3 text-lg">
                  質問:
                </h3>
                <p className="text-yellow-700 text-lg leading-relaxed">
                  {currentQuestion.text.ja}
                </p>
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
                  <div className="bg-gray-50 rounded-xl p-4 max-w-2xl mx-auto">
                    <p className="text-sm text-gray-700">{transcript}</p>
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
                    {isPlaying ? '音声再生中...' : canStartRecording ? t.speakNow : t.thinking}
                  </p>
                  {canStartRecording && !isPlaying && (
                    <p className="text-sm text-gray-500">{t.clickToStart}</p>
                  )}
                  {isPlaying && (
                    <p className="text-sm text-blue-600">問題文の読み上げが終わるまでお待ちください</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 録画プレビュー（小さく表示） */}
        <div className="bg-white rounded-xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">録画プレビュー</h3>
            <div className="flex items-center space-x-2">
              {isVideoRecording ? (
                <div className="flex items-center space-x-1 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm">{t.videoRecording}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-32 object-cover rounded-lg bg-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen; 