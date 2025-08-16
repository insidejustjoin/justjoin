import React, { useState, useEffect } from 'react';
import { CheckIcon, AlertTriangleIcon, UserIcon, GlobeIcon, ClockIcon, VideoIcon, MicIcon, WifiIcon, VolumeIcon, BarChart3Icon } from 'lucide-react';
import { Language } from '@/types/interview';
import TranslationService from '@/services/translationService';

interface InterviewPreparationProps {
  onComplete: (data: {
    consentGiven: boolean;
    email?: string;
    name?: string;
    language: Language;
    position?: string;
    preparationComplete: boolean;
  }) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  jobSeekerInfo?: {
    name: string;
    email: string;
    position: string;
  };
}

const InterviewPreparation: React.FC<InterviewPreparationProps> = ({ 
  onComplete, 
  language, 
  onLanguageChange,
  jobSeekerInfo
}) => {
  console.log('InterviewPreparationコンポーネント初期化:', { language, jobSeekerInfo });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [preparationData, setPreparationData] = useState({
    consentGiven: false,
    email: jobSeekerInfo?.email || '',
    name: jobSeekerInfo?.name || '',
    position: jobSeekerInfo?.position || '',
    language: language,
    preparationComplete: false
  });

  const [checkResults, setCheckResults] = useState({
    microphone: false,
    camera: false,
    internet: false,
    audio: false,
    environment: false
  });

  // 翻訳サービスの初期化
  useEffect(() => {
    const initTranslationService = async () => {
      try {
        const translationService = TranslationService.getInstance();
        console.log('翻訳サービス初期化完了');
      } catch (error) {
        console.error('翻訳サービス初期化エラー:', error);
      }
    };

    initTranslationService();
  }, []);

  // checkResultsの変更を監視
  useEffect(() => {
    console.log('checkResults変更:', checkResults);
  }, [checkResults]);

  const texts = {
    ja: {
      title: 'AI面接準備',
      subtitle: '面接開始前の確認事項',
      description: '面接を開始する前に、以下の項目を確認してください。',
      
      step1: {
        title: '基本情報確認',
        description: '面接に必要な基本情報を確認します。',
        nameLabel: 'お名前',
        emailLabel: 'メールアドレス',
        positionLabel: '応募職種',
        languageLabel: '面接言語'
      },
      
      step2: {
        title: '同意事項',
        description: '面接の録画と記録について同意してください。',
        consentRecording: '面接の録画・記録について',
        consentRecordingText: 'この面接は品質向上と評価のため録画・記録されます。データは安全に管理され、採用プロセス以外の目的では使用されません。',
        consentDataProcessing: 'データ処理について',
        consentDataProcessingText: '入力いただいた情報と面接内容は、Google Cloud Platform上で安全に処理・保存されます。データは暗号化され、適切なセキュリティ対策が講じられています。',
        consentTerms: '利用規約',
        consentTermsText: 'Just Joinの利用規約とプライバシーポリシーに同意します。'
      },
      
      step3: {
        title: '環境確認',
        description: '面接に必要な環境を確認します。',
        microphone: 'マイク確認',
        microphoneText: 'マイクが正常に動作することを確認してください。',
        camera: 'カメラ確認',
        cameraText: 'カメラが正常に動作することを確認してください。',
        internet: 'インターネット接続確認',
        internetText: '安定したインターネット接続があることを確認してください。',
        audio: '音声確認',
        audioText: '音声が正常に聞こえることを確認してください。',
        environment: '環境確認',
        environmentText: '静かな環境で面接を受けることを確認してください。'
      },
      
      step4: {
        title: '最終確認',
        description: '面接開始前の最終確認を行います。',
        duration: '面接時間: 約10〜15分',
        questions: '質問数: 10問',
        language: '面接言語: 日本語',
        oneTimeOnly: '1次面接として1回のみ受験可能',
        results: '面接結果は即座に評価されます'
      },
      
      buttons: {
        next: '次へ',
        back: '戻る',
        start: '面接を開始',
        test: 'テスト',
        retry: '再試行'
      },
      
      errors: {
        consentRequired: 'すべての同意事項にチェックを入れてください',
        emailInvalid: '有効なメールアドレスを入力してください',
        preparationIncomplete: 'すべての確認項目を完了してください'
      }
    },
    en: {
      title: 'Interview Preparation',
      subtitle: 'Pre-interview Checklist',
      description: 'Please check the following items before starting the interview.',
      
      step1: {
        title: 'Basic Information',
        description: 'Confirm basic information required for the interview.',
        nameLabel: 'Name',
        emailLabel: 'Email Address',
        positionLabel: 'Position Applied For',
        languageLabel: 'Interview Language'
      },
      
      step2: {
        title: 'Consent Items',
        description: 'Please agree to the interview recording and data processing.',
        consentRecording: 'Interview Recording',
        consentRecordingText: 'This interview will be recorded for quality improvement and evaluation purposes. Data will be managed securely and will not be used for purposes other than the recruitment process.',
        consentDataProcessing: 'Data Processing',
        consentDataProcessingText: 'The information you provide and the interview content will be securely processed and stored on Google Cloud Platform. Data is encrypted and appropriate security measures are in place.',
        consentTerms: 'Terms of Service',
        consentTermsText: 'I agree to Just Join\'s Terms of Service and Privacy Policy.'
      },
      
      step3: {
        title: 'Environment Check',
        description: 'Check the environment required for the interview.',
        microphone: 'Microphone Check',
        microphoneText: 'Please confirm that your microphone is working properly.',
        camera: 'Camera Check',
        cameraText: 'Please confirm that your camera is working properly.',
        internet: 'Internet Connection Check',
        internetText: 'Please confirm that you have a stable internet connection.',
        audio: 'Audio Check',
        audioText: 'Please confirm that you can hear audio properly.',
        environment: 'Environment Check',
        environmentText: 'Please confirm that you are in a quiet environment for the interview.'
      },
      
      step4: {
        title: 'Final Confirmation',
        description: 'Final confirmation before starting the interview.',
        duration: 'Interview Duration: About 10-15 minutes',
        questions: 'Number of Questions: 10',
        language: 'Interview Language: Japanese',
        oneTimeOnly: 'One-time interview for first screening',
        results: 'Interview results will be evaluated immediately'
      },
      
      buttons: {
        next: 'Next',
        back: 'Back',
        start: 'Start Interview',
        test: 'Test',
        retry: 'Retry'
      },
      
      errors: {
        consentRequired: 'Please check all consent items',
        emailInvalid: 'Please enter a valid email address',
        preparationIncomplete: 'Please complete all preparation items'
      }
    }
  };

  const t = texts[language];

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // 任意項目
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = () => {
    console.log(`ステップ${currentStep}から次へ進もうとしています`);
    
    if (currentStep === 1) {
      // 基本情報の検証
      console.log('ステップ1: 基本情報検証');
      if (preparationData.email && !validateEmail(preparationData.email)) {
        console.log('メールアドレスが無効です');
        return;
      }
      console.log('ステップ1完了、ステップ2へ進行');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // 同意事項の検証
      console.log('ステップ2: 同意事項検証');
      if (!preparationData.consentGiven) {
        console.log('同意事項が未チェックです');
        return;
      }
      console.log('ステップ2完了、ステップ3へ進行');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // 環境確認の検証
      console.log('ステップ3: 環境確認検証');
      const allChecksComplete = Object.values(checkResults).every(result => result);
      console.log('環境確認結果:', checkResults);
      console.log('すべての確認項目完了:', allChecksComplete);
      if (!allChecksComplete) {
        console.log('環境確認が未完了です');
        return;
      }
      console.log('ステップ3完了、ステップ4へ進行');
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartInterview = () => {
    onComplete({
      ...preparationData,
      preparationComplete: true
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setPreparationData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckResult = (check: string, result: boolean) => {
    setCheckResults(prev => ({ ...prev, [check]: result }));
  };

  const testMicrophone = async () => {
    console.log('マイクテスト開始');
    try {
      // ブラウザの制限チェック
      if (!navigator.mediaDevices) {
        console.warn('mediaDevices APIが利用できません');
        manualMicrophoneTest();
        return;
      }

      // 権限状態を確認
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('マイク権限状態:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            alert(language === 'ja' 
              ? 'マイクへのアクセスが拒否されています。ブラウザの設定でマイクの許可を有効にしてください。'
              : 'Microphone access is denied. Please enable microphone permissions in your browser settings.'
            );
            manualMicrophoneTest();
            return;
          }
        } catch (permissionError) {
          console.warn('権限確認エラー:', permissionError);
        }
      }

      // 利用可能なデバイスを確認
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        console.log('利用可能な音声デバイス:', audioDevices);
        
        if (audioDevices.length === 0) {
          alert(language === 'ja' 
            ? 'マイクデバイスが見つかりません。マイクが正しく接続されているか確認してください。'
            : 'No microphone devices found. Please check if your microphone is properly connected.'
          );
          manualMicrophoneTest();
          return;
        }
      } catch (deviceError) {
        console.warn('デバイス列挙エラー:', deviceError);
      }

      // ユーザーインタラクションを確実にする
      const userConfirmed = window.confirm(
        language === 'ja' 
          ? 'マイクへのアクセス許可を求めます。ブラウザの許可ダイアログが表示されたら「許可」をクリックしてください。\n\n続行しますか？'
          : 'We will request microphone access. When the browser permission dialog appears, please click "Allow".\n\nContinue?'
      );

      if (!userConfirmed) {
        console.log('ユーザーがマイクテストをキャンセル');
        return;
      }

      console.log('getUserMedia呼び出し開始');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('マイクアクセス成功');
      
      // ストリームの詳細情報をログ出力
      const audioTracks = stream.getAudioTracks();
      console.log('音声トラック数:', audioTracks.length);
      audioTracks.forEach((track, index) => {
        console.log(`音声トラック${index + 1}:`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });

      // ストリームを停止
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('トラック停止:', track.id);
      });
      
      handleCheckResult('microphone', true);
    } catch (error) {
      console.error('マイクテストエラー:', error);
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('エラー名:', error.name);
        console.error('エラーメッセージ:', error.message);
      }
      
      // エラータイプに応じた処理
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            alert(language === 'ja' 
              ? 'マイクへのアクセスが拒否されました。ブラウザの設定でマイクの許可を確認してください。'
              : 'Microphone access was denied. Please check microphone permissions in your browser settings.'
            );
            break;
          case 'NotFoundError':
            alert(language === 'ja' 
              ? 'マイクが見つかりません。マイクが接続されているか確認してください。'
              : 'Microphone not found. Please check if your microphone is connected.'
            );
            break;
          case 'NotSupportedError':
            alert(language === 'ja' 
              ? 'このブラウザはマイク機能をサポートしていません。'
              : 'This browser does not support microphone functionality.'
            );
            break;
          default:
            alert(language === 'ja' 
              ? `マイクテストエラー: ${error.message}`
              : `Microphone test error: ${error.message}`
            );
        }
      }
      
      manualMicrophoneTest();
    }
  };

  const testCamera = async () => {
    console.log('カメラテスト開始');
    try {
      // ブラウザの制限チェック
      if (!navigator.mediaDevices) {
        console.warn('mediaDevices APIが利用できません');
        manualCameraTest();
        return;
      }

      // 権限状態を確認
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('カメラ権限状態:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            alert(language === 'ja' 
              ? 'カメラへのアクセスが拒否されています。ブラウザの設定でカメラの許可を有効にしてください。'
              : 'Camera access is denied. Please enable camera permissions in your browser settings.'
            );
            manualCameraTest();
            return;
          }
        } catch (permissionError) {
          console.warn('権限確認エラー:', permissionError);
        }
      }

      // 利用可能なデバイスを確認
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('利用可能なビデオデバイス:', videoDevices);
        
        if (videoDevices.length === 0) {
          alert(language === 'ja' 
            ? 'カメラデバイスが見つかりません。カメラが正しく接続されているか確認してください。'
            : 'No camera devices found. Please check if your camera is properly connected.'
          );
          manualCameraTest();
          return;
        }
      } catch (deviceError) {
        console.warn('デバイス列挙エラー:', deviceError);
      }

      // ユーザーインタラクションを確実にする
      const userConfirmed = window.confirm(
        language === 'ja' 
          ? 'カメラへのアクセス許可を求めます。ブラウザの許可ダイアログが表示されたら「許可」をクリックしてください。\n\n続行しますか？'
          : 'We will request camera access. When the browser permission dialog appears, please click "Allow".\n\nContinue?'
      );

      if (!userConfirmed) {
        console.log('ユーザーがカメラテストをキャンセル');
        return;
      }

      console.log('getUserMedia呼び出し開始');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      console.log('カメラアクセス成功');
      
      // ストリームの詳細情報をログ出力
      const videoTracks = stream.getVideoTracks();
      console.log('ビデオトラック数:', videoTracks.length);
      videoTracks.forEach((track, index) => {
        console.log(`ビデオトラック${index + 1}:`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });

      // ストリームを停止
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('トラック停止:', track.id);
      });
      
      handleCheckResult('camera', true);
    } catch (error) {
      console.error('カメラテストエラー:', error);
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('エラー名:', error.name);
        console.error('エラーメッセージ:', error.message);
      }
      
      // エラータイプに応じた処理
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            alert(language === 'ja' 
              ? 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラの許可を確認してください。'
              : 'Camera access was denied. Please check camera permissions in your browser settings.'
            );
            break;
          case 'NotFoundError':
            alert(language === 'ja' 
              ? 'カメラが見つかりません。カメラが接続されているか確認してください。'
              : 'Camera not found. Please check if your camera is connected.'
            );
            break;
          case 'NotSupportedError':
            alert(language === 'ja' 
              ? 'このブラウザはカメラ機能をサポートしていません。'
              : 'This browser does not support camera functionality.'
            );
            break;
          default:
            alert(language === 'ja' 
              ? `カメラテストエラー: ${error.message}`
              : `Camera test error: ${error.message}`
            );
        }
      }
      
      manualCameraTest();
    }
  };

  const testInternet = () => {
    console.log('インターネット接続テスト開始');
    const isOnline = navigator.onLine;
    console.log('オンライン状態:', isOnline);
    handleCheckResult('internet', isOnline);
  };

  const testAudio = () => {
    // 音声テストの改善版
    console.log('音声テスト開始');
    console.log('ブラウザ情報:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });
    
    // ブラウザの制限チェック
    if (!navigator.mediaDevices) {
      console.warn('mediaDevices APIが利用できません');
      manualAudioTest();
      return;
    }
    
    // HTTPSチェック（ローカル開発環境を除く）
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.warn('HTTPSでないため、音声APIが制限される可能性があります');
    }
    
    try {
      // まず、ユーザーインタラクションが必要な場合の対応
      if (document.visibilityState === 'hidden') {
        console.log('ページが非表示状態のため、手動確認に切り替え');
        if (window.confirm('音声テストを実行します。音声が聞こえることを確認してください。音声が聞こえますか？')) {
          handleCheckResult('audio', true);
        } else {
          handleCheckResult('audio', false);
        }
        return;
      }

      // Web Audio APIの初期化
      let audioContext: AudioContext | null = null;
      
      try {
        console.log('Web Audio API初期化試行');
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Web Audio API初期化成功:', audioContext.state);
      } catch (audioContextError) {
        console.warn('Web Audio API初期化エラー:', audioContextError);
        // Web Audio APIが利用できない場合のフォールバック
        fallbackAudioTest();
        return;
      }

      // 音声コンテキストが停止状態の場合は再開
      if (audioContext.state === 'suspended') {
        console.log('音声コンテキストが停止状態、再開試行');
        audioContext.resume().then(() => {
          console.log('音声コンテキスト再開成功');
          performAudioTest(audioContext);
        }).catch((resumeError) => {
          console.error('音声コンテキスト再開エラー:', resumeError);
          fallbackAudioTest();
        });
      } else {
        console.log('音声コンテキスト状態:', audioContext.state);
        performAudioTest(audioContext);
      }

    } catch (error) {
      console.error('音声テストエラー:', error);
      fallbackAudioTest();
    }
  };

  const performAudioTest = (audioContext: AudioContext) => {
    try {
      console.log('音声テスト実行開始');
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A音
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // 音量をさらに下げる
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      console.log('音声再生開始');
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // 音声が再生されたことを確認
      setTimeout(() => {
        console.log('音声テスト完了');
        handleCheckResult('audio', true);
        audioContext.close();
      }, 400);
      
    } catch (error) {
      console.error('音声テスト実行エラー:', error);
      fallbackAudioTest();
    }
  };

  const fallbackAudioTest = () => {
    try {
      console.log('フォールバック音声テスト開始');
      // フォールバック1: シンプルなAudio要素
      const audio = new Audio();
      audio.volume = 0.2; // 音量をさらに下げる
      
      // より短い音声データ（Base64エンコードされた短い音声）
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      
      console.log('Audio要素による音声再生試行');
      audio.play().then(() => {
        console.log('Audio要素による音声再生成功');
        setTimeout(() => {
          handleCheckResult('audio', true);
        }, 500);
      }).catch((playError) => {
        console.error('Audio要素による音声再生エラー:', playError);
        // フォールバック2: 手動確認
        manualAudioTest();
      });
    } catch (error) {
      console.error('フォールバック音声テストエラー:', error);
      manualAudioTest();
    }
  };

  const manualAudioTest = () => {
    console.log('手動音声テスト開始');
    // 最終手段: 手動確認
    const errorMessage = language === 'ja' 
      ? `音声テストに失敗しました。

考えられる原因:
• ブラウザが音声再生を制限している
• 音声デバイスが無効になっている
• ブラウザの設定で音声が無効になっている

手動で音声が聞こえることを確認してください。
音声が聞こえますか？

「OK」を押すと音声確認完了、「キャンセル」を押すと再試行します。`
      : `Audio test failed.

Possible causes:
• Browser is blocking audio playback
• Audio device is disabled
• Audio is disabled in browser settings

Please manually confirm that you can hear audio.
Can you hear audio?

Press "OK" to complete audio check, "Cancel" to retry.`;

    const userConfirmed = window.confirm(errorMessage);
    
    if (userConfirmed) {
      console.log('ユーザーが音声確認を承認');
      handleCheckResult('audio', true);
    } else {
      console.log('ユーザーが音声確認を拒否、再試行オプションを提示');
      // 再試行オプション
      const retryMessage = language === 'ja'
        ? '音声確認を再試行しますか？\n\nブラウザの設定を確認してから再試行してください。'
        : 'Would you like to retry the audio test?\n\nPlease check your browser settings before retrying.';
      
      const retry = window.confirm(retryMessage);
      if (retry) {
        console.log('ユーザーが再試行を選択');
        testAudio();
      } else {
        console.log('ユーザーが再試行を拒否');
        handleCheckResult('audio', false);
      }
    }
  };

  const manualMicrophoneTest = () => {
    console.log('手動マイクテスト開始');
    const userConfirmed = window.confirm(
      language === 'ja' 
        ? 'マイクテストに失敗しました。手動でマイクが動作することを確認してください。\n\nマイクが動作しますか？\n\n「OK」を押すとマイク確認完了、「キャンセル」を押すと再試行します。'
        : 'Microphone test failed. Please manually confirm that your microphone is working.\n\nIs your microphone working?\n\nPress "OK" to complete microphone check, "Cancel" to retry.'
    );
    
    if (userConfirmed) {
      console.log('ユーザーがマイク確認を承認');
      handleCheckResult('microphone', true);
    } else {
      console.log('ユーザーがマイク確認を拒否、再試行オプションを提示');
      const retry = window.confirm(
        language === 'ja'
          ? 'マイク確認を再試行しますか？\n\nブラウザの設定を確認してから再試行してください。'
          : 'Would you like to retry the microphone test?\n\nPlease check your browser settings before retrying.'
      );
      if (retry) {
        console.log('ユーザーがマイク再試行を選択');
        testMicrophone();
      } else {
        console.log('ユーザーがマイク再試行を拒否');
        handleCheckResult('microphone', false);
      }
    }
  };

  const manualCameraTest = () => {
    console.log('手動カメラテスト開始');
    const userConfirmed = window.confirm(
      language === 'ja' 
        ? 'カメラテストに失敗しました。手動でカメラが動作することを確認してください。\n\nカメラが動作しますか？\n\n「OK」を押すとカメラ確認完了、「キャンセル」を押すと再試行します。'
        : 'Camera test failed. Please manually confirm that your camera is working.\n\nIs your camera working?\n\nPress "OK" to complete camera check, "Cancel" to retry.'
    );
    
    if (userConfirmed) {
      console.log('ユーザーがカメラ確認を承認');
      handleCheckResult('camera', true);
    } else {
      console.log('ユーザーがカメラ確認を拒否、再試行オプションを提示');
      const retry = window.confirm(
        language === 'ja'
          ? 'カメラ確認を再試行しますか？\n\nブラウザの設定を確認してから再試行してください。'
          : 'Would you like to retry the camera test?\n\nPlease check your browser settings before retrying.'
      );
      if (retry) {
        console.log('ユーザーがカメラ再試行を選択');
        testCamera();
      } else {
        console.log('ユーザーがカメラ再試行を拒否');
        handleCheckResult('camera', false);
      }
    }
  };

  const testEnvironment = () => {
    console.log('環境確認テスト開始');
    // 環境確認は手動で行う
    const userConfirmed = window.confirm(
      language === 'ja' 
        ? '環境確認を行います。\n\n以下の項目を確認してください：\n• 静かな環境である\n• 周囲に騒音がない\n• 面接に集中できる環境である\n\n環境は適切ですか？'
        : 'Environment check.\n\nPlease confirm the following:\n• Quiet environment\n• No surrounding noise\n• Environment suitable for interview\n\nIs the environment appropriate?'
    );
    
    if (userConfirmed) {
      console.log('ユーザーが環境確認を承認');
      handleCheckResult('environment', true);
    } else {
      console.log('ユーザーが環境確認を拒否');
      handleCheckResult('environment', false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.step1.title}</h3>
        <p className="text-gray-600">{t.step1.description}</p>
      </div>
      
      <div className="space-y-4">
        {/* 求職者情報の表示（読み取り専用） */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-3">
            {language === 'ja' ? '求職者情報' : 'Job Seeker Information'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                {t.step1.nameLabel}
              </label>
              <div className="text-sm text-blue-900 font-medium">
                {jobSeekerInfo?.name || '情報なし'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                {t.step1.emailLabel}
              </label>
              <div className="text-sm text-blue-900 font-medium">
                {jobSeekerInfo?.email || '情報なし'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                {t.step1.positionLabel}
              </label>
              <div className="text-sm text-blue-900 font-medium">
                {jobSeekerInfo?.position || '情報なし'}
              </div>
            </div>
          </div>
        </div>

        {/* 言語選択（準備画面では切り替え可能） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.step1.languageLabel}
          </label>
          <div className="flex items-center space-x-4 bg-gray-100 rounded-lg p-3">
            <GlobeIcon className="w-5 h-5 text-gray-500" />
            <button
              type="button"
              onClick={() => onLanguageChange('ja')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                language === 'ja'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              日本語
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              English
            </button>
            <span className="text-xs text-gray-500">面接中は日本語固定</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.step2.title}</h3>
        <p className="text-gray-600">{t.step2.description}</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="consentRecording"
            checked={preparationData.consentGiven}
            onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="consentRecording" className="block text-sm font-medium text-gray-900 mb-1">
              {t.step2.consentRecording}
            </label>
            <p className="text-sm text-gray-600">{t.step2.consentRecordingText}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="consentDataProcessing"
            checked={preparationData.consentGiven}
            onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="consentDataProcessing" className="block text-sm font-medium text-gray-900 mb-1">
              {t.step2.consentDataProcessing}
            </label>
            <p className="text-sm text-gray-600">{t.step2.consentDataProcessingText}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="consentTerms"
            checked={preparationData.consentGiven}
            onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="consentTerms" className="block text-sm font-medium text-gray-900 mb-1">
              {t.step2.consentTerms}
            </label>
            <p className="text-sm text-gray-600">{t.step2.consentTermsText}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.step3.title}</h3>
        <p className="text-gray-600">{t.step3.description}</p>
      </div>
      
      <div className="space-y-4">
        {[
          { key: 'microphone', icon: MicIcon, title: t.step3.microphone, text: t.step3.microphoneText, test: testMicrophone, color: 'blue' },
          { key: 'camera', icon: VideoIcon, title: t.step3.camera, text: t.step3.cameraText, test: testCamera, color: 'green' },
          { key: 'internet', icon: WifiIcon, title: t.step3.internet, text: t.step3.internetText, test: testInternet, color: 'purple' },
          { key: 'audio', icon: VolumeIcon, title: t.step3.audio, text: t.step3.audioText, test: testAudio, color: 'orange' },
          { key: 'environment', icon: AlertTriangleIcon, title: t.step3.environment, text: t.step3.environmentText, test: testEnvironment, color: 'red' }
        ].map(({ key, icon: Icon, title, text, test, color }) => {
          const isChecked = checkResults[key as keyof typeof checkResults];
          const colorClasses = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
            green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' },
            purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: 'text-purple-600' },
            orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' },
            red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' }
          };
          const colors = colorClasses[color as keyof typeof colorClasses];

          return (
            <div key={key} className={`flex items-center justify-between p-6 border-2 rounded-xl transition-all duration-200 ${
              isChecked 
                ? `${colors.bg} ${colors.border} border-2` 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isChecked ? colors.bg : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${isChecked ? colors.icon : 'text-gray-500'}`} />
                </div>
                <div>
                  <h4 className={`text-lg font-semibold ${isChecked ? colors.text : 'text-gray-900'}`}>
                    {title}
                  </h4>
                  <p className={`text-sm ${isChecked ? colors.text : 'text-gray-600'}`}>
                    {text}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isChecked ? (
                  <div className={`flex items-center ${colors.text} font-medium`}>
                    <CheckIcon className="w-5 h-5 mr-2" />
                    <span>確認済み</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      console.log(`${key}テストボタンクリック`);
                      // ユーザーインタラクションを確実にする
                      document.body.focus();
                      // 少し遅延させてからテストを実行
                      setTimeout(() => {
                        test();
                      }, 100);
                    }}
                    className={`px-6 py-3 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                      color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                      color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                      color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {t.buttons.test}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ヘルプ情報 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
          <AlertTriangleIcon className="w-4 h-4 mr-2" />
          トラブルシューティング
        </h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• マイク・カメラの許可が求められたら「許可」をクリックしてください</p>
          <p>• ブラウザの設定でマイク・カメラの許可を確認してください</p>
          <p>• デバイスが正しく接続されているか確認してください</p>
          <p>• 他のアプリケーションがマイク・カメラを使用していないか確認してください</p>
        </div>
      </div>

      {/* デバッグ情報 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
          <BarChart3Icon className="w-4 h-4 mr-2" />
          デバッグ情報
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• ブラウザ: {navigator.userAgent.split(' ')[0]}</p>
          <p>• HTTPS: {location.protocol === 'https:' ? '有効' : '無効'}</p>
          <p>• mediaDevices API: {navigator.mediaDevices ? '利用可能' : '利用不可'}</p>
          <p>• permissions API: {'permissions' in navigator ? '利用可能' : '利用不可'}</p>
          <p>• コンソールで詳細なログを確認できます</p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.step4.title}</h3>
        <p className="text-gray-600">{t.step4.description}</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{t.step4.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{t.step4.questions}</span>
            </div>
            <div className="flex items-center space-x-2">
              <GlobeIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{t.step4.language}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{t.step4.oneTimeOnly}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{t.step4.results}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        console.log('ステップ1進行条件: 基本情報は任意のため常にtrue');
        return true; // 基本情報は任意
      case 2:
        console.log('ステップ2進行条件:', { consentGiven: preparationData.consentGiven });
        return preparationData.consentGiven;
      case 3:
        console.log('ステップ3進行条件:', checkResults);
        const allChecksComplete = Object.values(checkResults).every(result => result);
        console.log('すべての確認項目完了:', allChecksComplete);
        return allChecksComplete;
      case 4:
        console.log('ステップ4進行条件: 最終確認は常にtrue');
        return true;
      default:
        console.log('デフォルト進行条件: false');
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <h2 className="text-lg text-blue-600 mb-4">{t.subtitle}</h2>
          <p className="text-gray-600">{t.description}</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ステップコンテンツ */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* ボタン */}
        <div className="flex justify-between">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.buttons.back}
            </button>
          )}
          
          <div className="flex-1" />
          
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t.buttons.next}
            </button>
          ) : (
            <button
              onClick={handleStartInterview}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t.buttons.start}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPreparation; 