import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from 'dotenv';
import interviewRoutes from './api/interviewRoutes';

// 環境変数を読み込み（.env.localを優先）
config({ path: '.env.local' });
config(); // デフォルトの.envも読み込み

const app = express();
const PORT = process.env.PORT || 3002;

// 環境変数の確認ログ
console.log('🔧 Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

// セキュリティミドルウェア
app.use(helmet({
  contentSecurityPolicy: false, // フロントエンドで調整
  crossOriginEmbedderPolicy: false
}));

// CORS設定
app.use(cors({
  origin: [
    'http://localhost:3001', // ローカル開発用
    'https://interview.justjoin.jp', // 本番用
    /\.justjoin\.jp$/ // Just Joinのサブドメイン
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// JSONパースミドルウェア
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// IPアドレスを取得するミドルウェア
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   (req.connection as any).socket?.remoteAddress ||
                   req.ip;
  (req as any).clientIp = clientIp;
  next();
});

// ロギングミドルウェア
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// APIルートの設定
app.use('/api/interview', interviewRoutes);

// 面接トークン検証エンドポイント
app.get('/api/interview-verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Base64デコード
    let decodedToken;
    try {
      const tokenData = Buffer.from(token, 'base64').toString();
      decodedToken = JSON.parse(tokenData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: '無効なトークンです'
      });
    }
    
    // トークンの有効期限チェック
    if (decodedToken.expiresAt && Date.now() > decodedToken.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'トークンの有効期限が切れています'
      });
    }
    
    // メインプラットフォームのAPIを呼び出してトークンを検証
    const mainPlatformUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://justjoin.jp';
    
    const verifyResponse = await fetch(`${mainPlatformUrl}/api/documents/interview-verify/${token}`);
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json() as any;
      return res.status(verifyResponse.status).json({
        success: false,
        error: errorData.error || 'TOKEN_VERIFICATION_FAILED',
        message: errorData.message || 'トークンの検証に失敗しました'
      });
    }
    
    const verifyData = await verifyResponse.json() as any;
    
    res.json({
      success: true,
      data: verifyData.data
    });
    
  } catch (error) {
    console.error('面接トークン検証エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'トークンの検証に失敗しました'
    });
  }
});

// 録音ファイルの配信（音声のみ・本番/開発共通）
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 静的ファイルの配信（本番用フロントエンド）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  // SPAのルーティング対応
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
    method: req.method
  });
});

// エラーハンドリングミドルウェア
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`
🚀 Interview System Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Local: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
📋 Interview API: http://localhost:${PORT}/api/interview
  `);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app; 