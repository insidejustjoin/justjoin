import { Storage } from '@google-cloud/storage';

// GCP Cloud Storage設定
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  // Cloud Run環境ではサービスアカウントを使用（認証ファイルは完全に無効化）
  keyFilename: null,
  // 認証を完全に無効化
  credentials: null,
  // 認証を完全に無効化
  scopes: [],
  // 認証を完全に無効化
  retryOptions: {
    maxRetries: 0
  }
});
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'match-job-documents';

// 環境変数の確認
console.log('Cloud Storage設定確認:', {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  bucketName,
  hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
  nodeEnv: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  keyFilename: null,
  credentials: null,
  scopes: []
});

export interface DocumentData {
  userId: string;
  documentType: string;
  documentData: any;
  timestamp: string;
}

/**
 * 書類データをCloud Storageに保存
 */
export const saveDocumentToGCS = async (documentData: DocumentData): Promise<string> => {
  try {
    const bucket = storage.bucket(bucketName);
    const fileName = `documents/${documentData.userId}/${documentData.documentType}.json`;
    const file = bucket.file(fileName);

    // メタデータ付きで保存
    await file.save(JSON.stringify(documentData), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          userId: documentData.userId,
          documentType: documentData.documentType,
          timestamp: documentData.timestamp,
        },
      },
    });

    console.log(`✅ 書類データを保存しました: gs://${bucketName}/${fileName}`);
    return `gs://${bucketName}/${fileName}`;
  } catch (error) {
    console.error('❌ Cloud Storage保存エラー:', error);
    throw new Error('書類データの保存に失敗しました');
  }
};

/**
 * Cloud Storageから書類データを読み込み
 */
export const loadDocumentFromGCS = async (userId: string, documentType: string = 'all'): Promise<any> => {
  try {
    const bucket = storage.bucket(bucketName);
    const fileName = `documents/${userId}/${documentType}.json`;
    const file = bucket.file(fileName);

    // ファイルの存在確認
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`📄 ファイルが見つかりません: ${fileName}`);
      return null;
    }

    // ファイルのダウンロード
    const [data] = await file.download();
    const documentData = JSON.parse(data.toString());
    
    console.log(`✅ 書類データを読み込みました: ${fileName}`);
    return documentData;
  } catch (error) {
    console.error('❌ Cloud Storage読み込みエラー:', error);
    return null;
  }
};

/**
 * ユーザーの全書類データを削除
 */
export const deleteUserDocumentsFromGCS = async (userId: string): Promise<boolean> => {
  try {
    const bucket = storage.bucket(bucketName);
    const prefix = `documents/${userId}/`;

    // ユーザーの全ファイルを取得
    const [files] = await bucket.getFiles({ prefix });

    if (files.length === 0) {
      console.log(`📄 削除対象ファイルが見つかりません: ${prefix}`);
      return true;
    }

    // 全ファイルを削除
    await Promise.all(files.map(file => file.delete()));
    
    console.log(`✅ ユーザーの書類データを削除しました: ${userId} (${files.length}ファイル)`);
    return true;
  } catch (error) {
    console.error('❌ Cloud Storage削除エラー:', error);
    return false;
  }
};

/**
 * 画像をCloud Storageにアップロード
 */
export const uploadToCloudStorage = async (file: Express.Multer.File, folder: string = 'blog-images'): Promise<string> => {
  try {
    console.log('Cloud Storage設定:', {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      bucketName,
      folder,
      nodeEnv: process.env.NODE_ENV
    });

    const bucket = storage.bucket(bucketName);
    console.log('✅ Storage クライアントの初期化成功');
    
    // バケットの存在確認
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`バケット '${bucketName}' が存在しません`);
    }
    
    console.log(`✅ バケット '${bucketName}' が存在します`);

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    console.log('アップロード開始:', fileName);

    // ファイルをアップロード
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // 公開URLを生成
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    
    console.log(`✅ 画像をアップロードしました: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ 画像アップロードエラー:', error);
    console.error('エラー詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * バケットの統計情報を取得
 */
export const getBucketStats = async (): Promise<any> => {
  try {
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles();
    
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      users: new Set(),
      documentTypes: new Set(),
    };

    files.forEach(file => {
      const metadata = file.metadata;
      if (metadata) {
        stats.totalSize += parseInt(String(metadata.size || '0'));
        if (metadata.metadata?.userId) {
          stats.users.add(metadata.metadata.userId);
        }
        if (metadata.metadata?.documentType) {
          stats.documentTypes.add(metadata.metadata.documentType);
        }
      }
    });

    return {
      totalFiles: stats.totalFiles,
      totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
      uniqueUsers: stats.users.size,
      documentTypes: Array.from(stats.documentTypes),
    };
  } catch (error) {
    console.error('❌ バケット統計取得エラー:', error);
    return null;
  }
}; 