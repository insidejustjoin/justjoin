import express from 'express';
import multer from 'multer';
import { uploadToCloudStorage } from '../../integrations/gcp/storage.js';
import { authenticate } from '../authenticate.js';

const router = express.Router();

// multerの設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB制限
  },
  fileFilter: (req, file, cb) => {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'));
    }
  },
});

// 画像アップロードエンドポイント
router.post('/upload-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    console.log('画像アップロードリクエスト開始');
    
    if (!req.file) {
      console.log('ファイルが提供されていません');
      return res.status(400).json({ error: '画像ファイルが提供されていません' });
    }

    console.log('ファイル情報:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const folder = req.body.folder || 'blog-images';
    console.log('アップロードフォルダ:', folder);
    
    // Cloud Storageにアップロード
    const imageUrl = await uploadToCloudStorage(req.file, folder);
    
    console.log('アップロード成功:', imageUrl);
    res.json({ 
      success: true, 
      imageUrl,
      message: '画像が正常にアップロードされました' 
    });
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    console.error('エラー詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: '画像のアップロードに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 