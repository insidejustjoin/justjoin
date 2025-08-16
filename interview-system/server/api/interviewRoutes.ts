import express from 'express';
import databaseService from '../services/databaseService.js';
import { AIInterviewerService } from '../services/aiInterviewerService.js';
import { QuestionService } from '../services/questionService.js';
import { Language, InterviewStatus } from '../../src/types/interview.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const aiInterviewerService = new AIInterviewerService();
const questionService = new QuestionService();

// 録音ファイル保存用の設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sessionId = req.body.sessionId || 'unknown';
    const type = req.body.type || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${sessionId}_${type}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB制限
  }
});

const router = express.Router();

// 録音アップロードエンドポイント
router.post('/upload-recording', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE',
        message: '録音ファイルがアップロードされていません'
      });
    }

    const { sessionId, type } = req.body;
    
    if (!sessionId || !type) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'セッションIDとタイプが必要です'
      });
    }

    // ファイル情報をログ出力
    console.log('録音アップロード:', {
      sessionId,
      type,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // データベースに録音情報を保存（将来の拡張用）
    try {
      await databaseService.saveRecordingInfo({
        sessionId,
        type,
        filename: req.file.filename,
        filepath: req.file.path,
        filesize: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      });
    } catch (dbError) {
      console.error('録音情報保存エラー:', dbError);
      // データベースエラーでもファイル保存は成功とする
    }

    res.json({
      success: true,
      message: '録音ファイルが正常にアップロードされました',
      data: {
        sessionId,
        type,
        filename: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('録音アップロードエラー:', error);
    res.status(500).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: '録音ファイルのアップロードに失敗しました'
    });
  }
});

// テスト用の面接開始エンドポイント（開発環境のみ）
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

    // テスト用の応募者データを作成
    const applicant = {
      id: `test_applicant_${Date.now()}`,
      email: email || 'test@example.com',
      name: name || 'テストユーザー',
      position: position || 'ソフトウェアエンジニア',
      experienceYears: 3,
      skills: ['JavaScript', 'React', 'Node.js'],
      selfIntroduction: 'テスト用の自己紹介です。',
      nationality: 'Japanese',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('応募者データ作成:', applicant);
    
    // テスト用の面接セッションを作成
    const sessionId = `test_session_${Date.now()}`;
    const session = {
      id: sessionId,
      applicantId: applicant.id,
      status: 'in_progress' as InterviewStatus,
      language: language as Language,
      currentQuestionIndex: 0,
      startedAt: new Date(),
      completedAt: null,
      totalDuration: 0,
      consentGiven: true,
      ipAddress,
      userAgent,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('面接セッション作成:', session);

    // AI面接官による面接開始
    console.log('AI面接官サービス呼び出し開始');
    const welcomeResponse = await aiInterviewerService.startInterview(session);
    console.log('AI面接官レスポンス:', welcomeResponse);

    // 求職者プロフィール情報を設定
    const jobSeekerInfo = {
      name: applicant.name,
      position: applicant.position,
      experienceYears: applicant.experienceYears,
      skills: applicant.skills
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

    console.log('面接開始API成功レスポンス:', response);
    res.json(response);

  } catch (error) {
    console.error('面接開始エラー詳細:', error);
    if (error instanceof Error) {
      console.error('エラースタック:', error.stack);
    }
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接を開始できませんでした',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
});

// 回答送信エンドポイント
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, questionId, text, responseTime } = req.body;

    console.log('回答送信API呼び出し:', { sessionId, questionId, text, responseTime });

    // バリデーション
    if (!sessionId || !questionId || !text) {
      console.log('バリデーションエラー: 必要なパラメータが不足');
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '必要なパラメータが不足しています'
      });
    }

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

    // 回答を評価
    const evaluation = await aiInterviewerService.evaluateAnswer(text, responseTime);
    console.log('回答評価:', evaluation);

    // 次の質問を取得
    const nextQuestionResponse = await aiInterviewerService.getNextQuestionResponse(
      session,
      {
        id: `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionId,
        sessionId,
        applicantId: session.applicantId,
        text,
        responseTime: responseTime || 0,
        timestamp: new Date(),
        wordCount: text.length,
        sentimentScore: evaluation.sentimentScore
      }
    );

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
    
    const localizedQuestions = questions.map(q => ({
      ...q,
      text: q.text[language as Language]
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