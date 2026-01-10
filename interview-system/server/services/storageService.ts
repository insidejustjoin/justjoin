import { Storage } from '@google-cloud/storage';

// GCP Cloud Storage設定
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'justjoin-platform';
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'justjoin-platform-match-job-documents';

console.log('🔧 Storage Service初期化:');
console.log('  Project ID:', projectId);
console.log('  Bucket Name:', bucketName);

// Cloud Runではサービスアカウントの認証情報が自動的に使用される
const storage = new Storage({
  projectId,
  // Cloud Runでは認証情報は自動的に取得される
  // ローカル開発時のみGOOGLE_APPLICATION_CREDENTIALSが必要
});

/**
 * 録音ファイルをCloud Storageにアップロード
 */
export const uploadRecordingToGCS = async (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string
): Promise<string> => {
  try {
    console.log(`📤 Cloud Storageアップロード開始: ${fileName} (${fileBuffer.length} bytes)`);
    console.log(`   Bucket: ${bucketName}`);
    
    const bucket = storage.bucket(bucketName);
    
    // バケットの存在確認
    console.log('🔍 バケットの存在確認中...');
    const [exists] = await bucket.exists();
    if (!exists) {
      const error = new Error(`バケット '${bucketName}' が存在しません`);
      console.error('❌ バケットが見つかりません:', bucketName);
      throw error;
    }
    console.log('✅ バケットが存在します');
    
    // 録音ファイル用のパスを生成
    const filePath = `interview-recordings/${fileName}`;
    console.log(`📁 ファイルパス: ${filePath}`);
    const file = bucket.file(filePath);
    
    // ファイルをアップロード
    console.log('⬆️ ファイルアップロード中...');
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    console.log('✅ ファイルアップロード完了');
    
    // 公開URLを生成（署名付きURLを使用する場合）
    // または、Cloud Storageの公開URLを使用
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
    
    console.log(`✅ 録音ファイルをアップロードしました: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ 録音ファイルアップロードエラー:', error);
    if (error instanceof Error) {
      console.error('   エラー名:', error.name);
      console.error('   エラーメッセージ:', error.message);
      console.error('   スタックトレース:', error.stack);
      // GCP APIエラーの詳細を確認
      if ('code' in error) {
        console.error('   エラーコード:', (error as any).code);
      }
      if ('response' in error) {
        console.error('   レスポンス:', JSON.stringify((error as any).response, null, 2));
      }
    }
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

/**
 * 古い録画ファイルをCloud Storageから削除
 */
export const deleteOldRecordings = async (email: string): Promise<number> => {
  try {
    console.log(`🗑️  古い録画ファイルの削除開始: ${email}`);
    
    const bucket = storage.bucket(bucketName);
    
    // 録音ファイルのプレフィックスを生成（emailを含むファイルを探す）
    // ファイル名からemailを抽出するのは難しいため、全ての録音ファイルを取得してフィルタリング
    const prefix = 'interview-recordings/';
    const [files] = await bucket.getFiles({ prefix });
    
    // emailを含むファイルをフィルタリング
    // ファイル名にemailが含まれている可能性があるため、全てのファイルをチェック
    // ただし、セキュリティ上の理由から、全ての録音ファイルを削除するのではなく、
    // データベースの情報と照合して削除する方が安全
    
    console.log(`📋 録画ファイル数: ${files.length}`);
    
    // ファイル名からemailを抽出してマッチング
    // ファイル名の形式: interview_<timestamp>_<sessionId>_<questionId>_<type>_<timestamp>.webm
    // emailが含まれている場合は削除対象とする
    
    let deletedCount = 0;
    
    for (const file of files) {
      try {
        // ファイル名にemailが含まれているか確認（セキュリティのため、完全一致のみ）
        // 実際の実装では、データベースから削除対象のファイルパスを取得する方が安全
        const fileName = file.name;
        
        // ファイルのメタデータを確認してemailが含まれているかチェック
        const [metadata] = await file.getMetadata();
        const fileEmail = metadata.metadata?.email;
        
        if (fileEmail === email) {
          await file.delete();
          console.log(`  ✅ 削除: ${fileName}`);
          deletedCount++;
        }
      } catch (fileError) {
        console.warn(`  ⚠️  ファイル削除エラー: ${file.name}`, fileError);
      }
    }
    
    console.log(`✅ 古い録画ファイル削除完了: ${deletedCount}件`);
    return deletedCount;
  } catch (error) {
    console.error('❌ 古い録画ファイル削除エラー:', error);
    throw new Error(`古い録画ファイルの削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 特定の応募者の古い録画ファイルを削除（データベースから取得したファイルパスを使用）
 */
export const deleteOldRecordingsByApplicant = async (applicantId: string, databaseService: any): Promise<number> => {
  try {
    console.log(`🗑️  応募者の古い録画ファイル削除開始: ${applicantId}`);
    
    const bucket = storage.bucket(bucketName);
    
    // データベースから削除対象の録画情報を取得
    const recordings = await databaseService.getApplicantRecordings(applicantId);
    
    if (recordings.length === 0) {
      console.log('  📋 削除対象の録画がありません');
      return 0;
    }
    
    console.log(`  📋 削除対象の録画数: ${recordings.length}`);
    
    let deletedCount = 0;
    
    for (const recording of recordings) {
      try {
        const storagePath = recording.storage_path || recording.recording_url;
        if (!storagePath) {
          console.warn(`  ⚠️  ストレージパスがありません: ${recording.id}`);
          continue;
        }
        
        // storage_pathからファイルパスを抽出
        // 形式: interview-recordings/<filename> または full URL
        let filePath = storagePath;
        if (storagePath.includes('storage.googleapis.com')) {
          // URLからパスを抽出
          const match = storagePath.match(/interview-recordings\/[^?]+/);
          if (match) {
            filePath = match[0];
          } else {
            console.warn(`  ⚠️  パス抽出失敗: ${storagePath}`);
            continue;
          }
        }
        
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          await file.delete();
          console.log(`  ✅ 削除: ${filePath}`);
          deletedCount++;
        } else {
          console.log(`  ℹ️  ファイルが存在しません: ${filePath}`);
        }
      } catch (fileError) {
        console.warn(`  ⚠️  ファイル削除エラー: ${recording.id}`, fileError);
      }
    }
    
    console.log(`✅ 古い録画ファイル削除完了: ${deletedCount}件`);
    return deletedCount;
  } catch (error) {
    console.error('❌ 古い録画ファイル削除エラー:', error);
    // エラーが発生しても面接開始を継続できるようにする
    return 0;
  }
};

