import { Storage } from '@google-cloud/storage';

// GCP Cloud Storage設定
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'justjoin-platform',
});

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'justjoin-platform-match-job-documents';

/**
 * 録音ファイルをCloud Storageにアップロード
 */
export const uploadRecordingToGCS = async (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string
): Promise<string> => {
  try {
    const bucket = storage.bucket(bucketName);
    
    // バケットの存在確認
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`バケット '${bucketName}' が存在しません`);
    }
    
    // 録音ファイル用のパスを生成
    const filePath = `interview-recordings/${fileName}`;
    const file = bucket.file(filePath);
    
    // ファイルをアップロード
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    
    // 公開URLを生成（署名付きURLを使用する場合）
    // または、Cloud Storageの公開URLを使用
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
    
    console.log(`✅ 録音ファイルをアップロードしました: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ 録音ファイルアップロードエラー:', error);
    throw new Error(`録音ファイルのアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 録音ファイルの署名付きURLを取得（期限付きアクセス用）
 */
export const getRecordingSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000, // デフォルト1時間
    });
    
    return url;
  } catch (error) {
    console.error('❌ 署名付きURL生成エラー:', error);
    throw new Error(`署名付きURLの生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

