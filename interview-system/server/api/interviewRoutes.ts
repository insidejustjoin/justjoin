import express from 'express';
import databaseService from '../services/databaseService.js';
import { AIInterviewerService } from '../services/aiInterviewerService.js';
import { QuestionService } from '../services/questionService.js';
import textToSpeechService from '../services/textToSpeechService.js';
import openaiTtsService from '../services/openaiTtsService.js';
import voicevoxService from '../services/voicevoxService.js';
import { uploadRecordingToGCS } from '../services/storageService.js';
import { Language, InterviewStatus, Answer } from '../../src/types/interview.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const aiInterviewerService = new AIInterviewerService();
const questionService = new QuestionService();

// 録音ファイル保存用の設定
// Cloud Runでは一時的なファイルシステムを使用するため、メモリに保存
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB制限（Cloud Runの制限を考慮）
  }
});

const router = express.Router();

// テキストを音声に変換するエンドポイント（VOICEVOX優先）
router.post('/synthesize-speech', async (req, res) => {
  try {
    const { text, languageCode = 'ja' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TEXT',
        message: 'テキストが必要です'
      });
    }

    let audioBase64: string | null = null;
    let audioFormat = 'mp3';

    // コスト削減のため、OpenAI TTSを優先使用（使用量ベースで安い）
    // 1. まずOpenAI TTS APIを試す（高品質で使用量ベース）
    console.log('Using OpenAI TTS for speech synthesis (cost-effective)...');
    audioBase64 = await openaiTtsService.synthesizeSpeechAsBase64(text, languageCode);
    audioFormat = 'mp3';

    // 2. OpenAI TTSが失敗した場合、Google Cloud TTSを試す（無料枠あり）
    if (!audioBase64) {
      console.log('OpenAI TTS failed, trying Google Cloud TTS...');
      audioBase64 = await textToSpeechService.synthesizeSpeechAsBase64(text, 'ja-JP');
      audioFormat = 'mp3';
    }

    // 3. ローカル開発時のみVOICEVOXを使用（本番では使用しない）
    if (!audioBase64) {
      const voicevoxUrl = process.env.VOICEVOX_URL;
      if (voicevoxUrl === 'http://localhost:50021') {
        // ローカル開発時のみVOICEVOXを使用
        const isVoicevoxAvailable = await voicevoxService.isAvailable();
        if (isVoicevoxAvailable) {
          console.log('Using VOICEVOX for speech synthesis (local development only)...');
          const speakerId = await voicevoxService.getBestSpeakerId();
          audioBase64 = await voicevoxService.synthesizeSpeechAsBase64(text, speakerId);
          audioFormat = 'wav';
        }
      }
    }

    if (audioBase64) {
      res.json({
        success: true,
        audio: audioBase64,
        format: audioFormat
      });
    } else {
      // フォールバック: クライアント側でWeb Speech APIを使用
      res.json({
        success: false,
        fallback: true,
        message: 'Text-to-Speech service unavailable, please use browser speech synthesis'
      });
    }
  } catch (error) {
    console.error('Text-to-Speech synthesis error:', error);
    res.status(500).json({
      success: false,
      error: 'SYNTHESIS_ERROR',
      message: '音声合成に失敗しました',
      fallback: true
    });
  }
});

// 録音アップロードエンドポイント
router.post('/upload-recording', upload.single('file'), async (req, res) => {
  console.log('録音アップロードリクエスト受信:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    file: req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : null
  });

  try {
    if (!req.file) {
      console.error('録音アップロードエラー: ファイルが存在しません');
      return res.status(400).json({
        success: false,
        error: 'NO_FILE',
        message: '録音ファイルがアップロードされていません'
      });
    }

    const { sessionId, type, questionId, transcriptionText, email, userId } = req.body;
    
    if (!sessionId || !type) {
      console.error('録音アップロードエラー: パラメータ不足', { sessionId, type });
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'セッションIDとタイプが必要です'
      });
    }

    // ファイル情報をログ出力
    const filename = questionId 
      ? `${sessionId}_${questionId}_${type}_${Date.now()}.webm`
      : `${sessionId}_${type}_${Date.now()}.webm`;
    console.log('録音アップロード処理開始:', {
      sessionId,
      type,
      questionId,
      filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferSize: req.file.buffer?.length || 0
    });

    // Cloud Storageに録音ファイルをアップロード
    let recordingUrl = '';
    let storagePath = '';
    try {
      if (!req.file.buffer) {
        throw new Error('ファイルバッファが存在しません');
      }
      const gcsUrl = await uploadRecordingToGCS(
        req.file.buffer,
        filename,
        req.file.mimetype
      );
      storagePath = gcsUrl;
      recordingUrl = gcsUrl;
      console.log('✅ 録音ファイルをCloud Storageにアップロードしました:', gcsUrl);
    } catch (storageError) {
      console.error('❌ Cloud Storageアップロードエラー:', storageError);
      // Cloud Storageへの保存に失敗した場合、エラーを返す
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: '録音ファイルの保存に失敗しました',
        details: storageError instanceof Error ? storageError.message : 'Unknown error'
      });
    }

      // データベースに録音情報を保存（質問IDと文字起こしテキストも含む）
      try {
        console.log('録音情報をデータベースに保存中...', {
          sessionId,
          questionId,
          hasTranscription: !!transcriptionText,
          storagePath
        });
        await databaseService.saveRecordingInfo({
          sessionId,
          type,
          filename: filename,
          filepath: storagePath, // Cloud StorageのURLを使用
          filesize: req.file.size,
          mimetype: req.file.mimetype,
          uploadedAt: new Date(),
          questionId: questionId || undefined,
          transcriptionText: transcriptionText || undefined,
          email: email || undefined, // セッションが見つからない場合のフォールバック用
          userId: userId || undefined // セッションが見つからない場合のフォールバック用
        });
        console.log('✅ 録音情報のデータベース保存成功');
    } catch (dbError) {
      console.error('❌ 録音情報保存エラー:', dbError);
      // データベースエラーでもファイル保存は成功とする
      // ただし、エラーの詳細をログに記録
      if (dbError instanceof Error) {
        console.error('エラー詳細:', {
          name: dbError.name,
          message: dbError.message,
          stack: dbError.stack
        });
      }
    }

    console.log('✅ 録音アップロード成功');
    res.json({
      success: true,
      message: '録音ファイルが正常にアップロードされました',
      data: {
        sessionId,
        type,
        filename: filename,
        size: req.file.size,
        recordingUrl: recordingUrl
      }
    });

  } catch (error) {
    console.error('❌ 録音アップロードエラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: '録音ファイルのアップロードに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 面接開始エンドポイント（本番用）
router.post('/start', async (req, res) => {
  try {
    console.log('面接開始API呼び出し:', req.body);
    
    const { 
      email, 
      name, 
      language = 'ja', 
      position, 
      consentGiven = false 
    } = req.body;

    console.log('リクエストパラメータ:', { email, name, language, position, consentGiven });

    // 同意確認
    if (!consentGiven) {
      console.log('同意確認エラー: consentGiven = false');
      return res.status(400).json({
        success: false,
        error: 'CONSENT_REQUIRED',
        message: '面接の録画と記録に対する同意が必要です'
      });
    }

    // IPアドレスとユーザーエージェントを取得
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    console.log('クライアント情報:', { ipAddress, userAgent });

    // データベース接続テスト
    try {
      const isConnected = await databaseService.testConnection();
      console.log('データベース接続状態:', isConnected);
      
      if (!isConnected) {
        throw new Error('データベース接続に失敗しました');
      }
    } catch (dbError) {
      console.error('データベース接続エラー:', dbError);
      return res.status(500).json({
        success: false,
        error: 'DATABASE_CONNECTION_ERROR',
        message: 'データベース接続に失敗しました'
      });
    }

    // 応募者情報をデータベースから取得または作成
    let applicant;
    try {
      // emailとnameが空の場合はデフォルト値を使用（テスト用）
      const applicantEmail = email || `interview_${Date.now()}@temp.local`;
      const applicantName = name || 'Anonymous User';
      const applicantPosition = position || 'Unknown Position';
      
      applicant = await databaseService.createOrGetApplicantFromJobSeeker(
        applicantEmail, 
        applicantName, 
        applicantPosition
      );
      console.log('✅ 応募者情報を取得/作成:', {
        id: applicant.id,
        email: applicant.email,
        name: applicant.name,
        position: applicant.position
      });
    } catch (applicantError) {
      console.error('❌ 応募者情報の取得/作成エラー:', applicantError);
      if (applicantError instanceof Error) {
        console.error('エラー詳細:', {
          message: applicantError.message,
          stack: applicantError.stack
        });
      }
      return res.status(500).json({
        success: false,
        error: 'APPLICANT_CREATION_ERROR',
        message: '応募者情報の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' && applicantError instanceof Error ? applicantError.message : undefined
      });
    }

    // データベースに面接セッションを作成
    let session;
    try {
      console.log('面接セッション作成開始:', {
        applicantId: applicant.id,
        language,
        consentGiven,
        ipAddress,
        userAgent
      });
      
      session = await databaseService.createInterviewSession(
        applicant.id,
        language as Language,
        consentGiven,
        ipAddress,
        userAgent
      );
      console.log('✅ 面接セッションをデータベースに作成:', session.id);
    } catch (sessionError) {
      console.error('❌ 面接セッション作成エラー:', sessionError);
      if (sessionError instanceof Error) {
        console.error('エラー詳細:', {
          message: sessionError.message,
          stack: sessionError.stack
        });
      }
      return res.status(500).json({
        success: false,
        error: 'SESSION_CREATION_ERROR',
        message: '面接セッションの作成に失敗しました',
        details: process.env.NODE_ENV === 'development' && sessionError instanceof Error ? sessionError.message : undefined
      });
    }

    // AI面接官による面接開始
    console.log('AI面接官サービス呼び出し開始');
    const welcomeResponse = await aiInterviewerService.startInterview(session);
    console.log('AI面接官レスポンス:', welcomeResponse);

    // 求職者プロフィール情報を設定
    const jobSeekerInfo = {
      name: applicant.name,
      position: applicant.position || position || '未設定',
      experienceYears: applicant.experienceYears || 0,
      skills: applicant.skills || []
    };

    const response = {
      success: true,
      sessionId: session.id,
      applicantId: applicant.id,
      message: welcomeResponse.message,
      nextQuestion: welcomeResponse.nextQuestion,
      progress: {
        current: 0,
        total: questionService.getTotalQuestionCount(),
        percentage: 0
      },
      jobSeekerInfo: jobSeekerInfo
    };

    console.log('✅ 面接開始API成功レスポンス:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ 面接開始エラー詳細:', error);
    if (error instanceof Error) {
      console.error('エラースタック:', error.stack);
      // PostgreSQLエラーの場合、詳細情報をログに記録
      if ((error as any).code) {
        console.error('PostgreSQLエラーコード:', (error as any).code);
        console.error('PostgreSQLエラー詳細:', (error as any).detail);
        console.error('PostgreSQLエラーメッセージ:', (error as any).message);
      }
    }
    
    // エラーメッセージを構築
    let errorMessage = '面接を開始できませんでした';
    let errorCode = 'INTERNAL_ERROR';
    
    if (error instanceof Error) {
      // データベース接続エラーの場合
      if (error.message.includes('DATABASE') || error.message.includes('connection')) {
        errorCode = 'DATABASE_ERROR';
        errorMessage = 'データベース接続エラーが発生しました';
      }
      // セッション作成エラーの場合
      else if (error.message.includes('SESSION') || error.message.includes('session')) {
        errorCode = 'SESSION_ERROR';
        errorMessage = 'セッション作成エラーが発生しました';
      }
      // 応募者作成エラーの場合
      else if (error.message.includes('APPLICANT') || error.message.includes('applicant')) {
        errorCode = 'APPLICANT_ERROR';
        errorMessage = '応募者情報の取得に失敗しました';
      }
      // PostgreSQLエラーの場合
      else if ((error as any).code) {
        errorCode = 'DATABASE_ERROR';
        errorMessage = `データベースエラー: ${(error as any).code}`;
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorCode,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
});

// 回答送信エンドポイント
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, questionId, text, responseTime } = req.body;

    console.log('回答送信API呼び出し:', { sessionId, questionId, text, responseTime });

    // バリデーション（textは空文字列でも許可）
    if (!sessionId || !questionId || text === undefined || text === null) {
      console.log('バリデーションエラー: 必要なパラメータが不足');
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '必要なパラメータが不足しています'
      });
    }
    
    // textが空文字列の場合、デフォルト値を設定
    const answerText = (text || '').trim() || '(音声が認識されませんでした)';

    // 現在の質問の順序を取得
    const currentQuestion = questionService.getQuestionById(questionId);
    if (!currentQuestion) {
      console.log('質問が見つかりません:', questionId);
      return res.status(400).json({
        success: false,
        error: 'QUESTION_NOT_FOUND',
        message: '質問が見つかりません'
      });
    }

    console.log('現在の質問:', currentQuestion);

    // 次の質問を取得
    const nextQuestion = questionService.getNextQuestion(questionId);
    console.log('次の質問:', nextQuestion);

    // テスト用のセッション情報（質問の進行を反映）
    const session = {
      id: sessionId,
      applicantId: `test_applicant_${Date.now()}`,
      status: 'in_progress' as InterviewStatus,
      language: 'ja' as Language,
      currentQuestionIndex: currentQuestion.order - 1, // 0ベースのインデックス
      startedAt: new Date(),
      completedAt: null,
      totalDuration: 0,
      consentGiven: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('セッション情報:', session);

    // 回答オブジェクトを作成
    const answer: Answer = {
        id: `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionId,
        sessionId,
        applicantId: session.applicantId,
      text: answerText,
        responseTime: responseTime || 0,
        timestamp: new Date(),
      wordCount: answerText.split(/\s+/).filter((w: string) => w.length > 0).length || 0
    };

    // 回答を評価（空文字列の場合も処理）
    let evaluation;
    try {
      evaluation = aiInterviewerService.evaluateAnswer(answer, currentQuestion);
      answer.sentimentScore = evaluation.sentimentScore;
      console.log('回答評価:', evaluation);
    } catch (evalError) {
      console.error('回答評価エラー:', evalError);
      // 評価に失敗した場合でもデフォルト値を設定
      evaluation = {
        wordCount: answer.wordCount,
        sentimentScore: 0,
        completeness: 0
      };
      answer.sentimentScore = 0;
    }

    // 次の質問を取得
    let nextQuestionResponse;
    try {
      nextQuestionResponse = await aiInterviewerService.getNextQuestionResponse(
        session,
        answer
      );
      console.log('次の質問レスポンス:', nextQuestionResponse);
    } catch (nextError) {
      console.error('次の質問取得エラー:', nextError);
      // エラーが発生した場合でも次の質問を取得
      const nextQuestion = questionService.getNextQuestion(questionId);
      const progress = {
        current: nextQuestion ? nextQuestion.order - 1 : session.currentQuestionIndex + 1,
        total: questionService.getTotalQuestionCount(),
        percentage: Math.round(((nextQuestion ? nextQuestion.order - 1 : session.currentQuestionIndex + 1) / questionService.getTotalQuestionCount()) * 100)
      };
      
      const language = session.language;
      return res.json({
        success: true,
        message: language === 'ja' ? 'ありがとうございます。次の質問に移ります。' :
                 language === 'en' ? 'Thank you. Let me move on to the next question.' :
                 language === 'ru' ? 'Спасибо. Перейдем к следующему вопросу.' :
                 'Rahmat. Keyingi savolga o\'tamiz.',
        nextQuestion: nextQuestion,
        isComplete: !nextQuestion,
        progress: progress
      });
    }

    console.log('次の質問レスポンス:', nextQuestionResponse);

    // 面接完了チェック
    if (nextQuestionResponse.isComplete) {
      console.log('面接完了');
      // 面接終了処理
      const endTime = new Date();
      const totalDuration = session.startedAt 
        ? Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000)
        : 0;

      return res.json({
        success: true,
        message: nextQuestionResponse.message,
        isComplete: true,
        sessionId,
        summary: {
          totalDuration,
          questionsAnswered: session.currentQuestionIndex + 1,
          completionRate: ((session.currentQuestionIndex + 1) / questionService.getTotalQuestionCount()) * 100
        }
      });
    }

    // 次の質問の進行状況を計算
    const nextQuestionIndex = nextQuestion ? nextQuestion.order - 1 : session.currentQuestionIndex + 1;
    const progress = {
      current: nextQuestionIndex,
      total: questionService.getTotalQuestionCount(),
      percentage: Math.round((nextQuestionIndex / questionService.getTotalQuestionCount()) * 100)
    };

    console.log('進行状況:', progress);

    res.json({
      success: true,
      message: nextQuestionResponse.message,
      nextQuestion: nextQuestionResponse.nextQuestion,
      isComplete: false,
      progress: progress
    });

  } catch (error) {
    console.error('回答処理エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '回答を処理できませんでした'
    });
  }
});

// セッション情報取得エンドポイント
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // テスト用のセッション情報
    const session = {
      id: sessionId,
      applicantId: `test_applicant_${Date.now()}`,
      status: 'in_progress' as InterviewStatus,
      language: 'ja' as Language,
      currentQuestionIndex: 0,
      startedAt: new Date(),
      completedAt: null,
      totalDuration: 0,
      consentGiven: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 求職者プロフィール情報も含めて返す
    const jobSeekerInfo = {
      name: 'テストユーザー',
      email: 'test@example.com',
      position: 'ソフトウェアエンジニア',
      experienceYears: 3,
      skills: ['JavaScript', 'React', 'Node.js'],
      selfIntroduction: 'テスト用の自己紹介です。'
    };

    res.json({
      success: true,
      session: {
        ...session,
        jobSeekerInfo
      }
    });

  } catch (error) {
    console.error('セッション取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'セッション情報を取得できませんでした'
    });
  }
});

// 面接強制終了エンドポイント
router.post('/end', async (req, res) => {
  try {
    const { sessionId, reason } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'セッションIDが必要です'
      });
    }

    // セッション終了処理
    const endTime = new Date();
    const totalDuration = 600; // 10分

    res.json({
      success: true,
      message: '面接を終了しました',
      sessionId,
      totalDuration
    });

  } catch (error) {
    console.error('面接終了エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接を終了できませんでした'
    });
  }
});

// 質問一覧取得エンドポイント（デバッグ用）
router.get('/questions', async (req, res) => {
  try {
    const { language = 'ja' } = req.query;
    const questions = questionService.getAllQuestions();
    const lang = (language as Language) || 'ja';
    
    const localizedQuestions = questions.map(q => ({
      ...q,
      text: q.text[lang] || (lang === 'ru' || lang === 'uz' ? q.text.en : q.text.ja)
    }));

    res.json({
      success: true,
      questions: localizedQuestions,
      total: questions.length
    });

  } catch (error) {
    console.error('質問取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '質問を取得できませんでした'
    });
  }
});

// ヘルスチェックエンドポイント
router.get('/health', async (req, res) => {
  try {
    const dbConnected = await databaseService.testConnection();
    
    res.json({
      success: true,
      status: 'healthy',
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        aiInterviewer: 'active',
        questionService: 'active'
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 