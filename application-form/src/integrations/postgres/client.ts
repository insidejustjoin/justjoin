// ブラウザ環境では実行しない
const isServer = typeof window === 'undefined';

// 環境変数から接続情報を取得（サーバーサイドのみ）
const getDbConfig = () => {
  if (!isServer) {
    return null;
  }
  
  // DATABASE_URLが設定されている場合はそれを使用
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // 先頭の/を除去
        ssl: url.searchParams.get('sslmode') === 'require'
      };
    } catch (error) {
      console.error('DATABASE_URLの解析に失敗しました:', error);
      console.log('DATABASE_URL:', process.env.DATABASE_URL);
      
      // Cloud SQL Proxy形式の場合は特別な処理
      if (process.env.DATABASE_URL.includes('/cloudsql/')) {
        console.log('Cloud SQL接続文字列を解析中:', process.env.DATABASE_URL);
        
        // 正規表現でCloud SQL接続文字列を解析
        const cloudSqlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^?]+)\?host=\/cloudsql\/(.+)/;
        const match = process.env.DATABASE_URL.match(cloudSqlPattern);
        
        if (match) {
          console.log('Cloud SQL接続情報を解析しました:', {
            user: match[1],
            database: match[3],
            host: '/cloudsql/' + match[4]
          });
          
                  return {
          host: '/cloudsql/' + match[4],
          port: 5432,
          user: match[1],
          password: match[2],
          database: match[3].replace(/^\//, ''), // 先頭の/を除去
          ssl: false
        };
        } else {
          console.log('Cloud SQL接続文字列の解析に失敗しました');
        }
      }
      
      throw new Error('Invalid DATABASE_URL format');
    }
  }
  
  // 個別設定のフォールバック
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres'
  };
};

// 接続プールを作成（サーバーサイドのみ）
let pool: any = null;

const createPool = async () => {
  if (!isServer) {
    console.log('Database pool creation is not available in browser environment');
    return null;
  }

  const { Pool } = await import('pg');
  const fs = await import('fs');
  const path = await import('path');
  const config = getDbConfig();
  
  if (!config) {
    throw new Error('Database configuration not available');
  }

  // SSL証明書ファイルのパス
  const sslDir = path.join(process.cwd(), 'ssl');
  const serverCaPath = path.join(sslDir, 'server-ca.pem');
  const clientCertPath = path.join(sslDir, 'client-cert.pem');
  const clientKeyPath = path.join(sslDir, 'client-key.pem');

  console.log('Database connection config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    ssl: config.ssl ? 'SSL有効' : 'SSL無効'
  });

  // SSL設定の決定
  let sslConfig: any = false; // デフォルトはSSL無効

  if (config.ssl) {
    // DATABASE_URLでSSLが要求されている場合
    console.log('DATABASE_URLでSSLが要求されています');
    
    // 開発環境ではSSLを無効にするオプション
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_SSL === 'true') {
      console.log('開発環境でSSLを無効にします（DISABLE_SSL=true）');
      sslConfig = false;
    } else {
      // SSL証明書ファイルの存在確認
      const sslFiles = [serverCaPath, clientCertPath, clientKeyPath];
      const missingFiles = sslFiles.filter(file => !fs.existsSync(file));
      
      if (missingFiles.length === 0) {
        // SSL証明書ファイルが全て存在する場合
        console.log('SSL証明書ファイルを使用して接続します');
        sslConfig = {
          ca: fs.readFileSync(serverCaPath),      // sslrootcert=server-ca.pem
          cert: fs.readFileSync(clientCertPath),  // sslcert=client-cert.pem
          key: fs.readFileSync(clientKeyPath),    // sslkey=client-key.pem
          rejectUnauthorized: true,               // sslmode=verify-ca
          checkServerIdentity: () => undefined    // ホスト名検証をスキップ
        };
      } else {
        // SSL証明書ファイルが不足している場合
        console.log('SSL証明書ファイルが不足しています:', missingFiles);
        console.log('簡易SSLで接続を試行します');
        
        // 本番環境では警告を出す
        if (process.env.NODE_ENV === 'production') {
          console.warn('⚠️ 本番環境でSSL証明書が不足しています。セキュリティ上の注意が必要です。');
        }
        
        // 簡易SSL設定
        sslConfig = {
          rejectUnauthorized: false
        };
      }
    }
  } else {
    console.log('SSL無効で接続します');
  }

  // Cloud Run環境での特別な設定
  let connectionConfig: any = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: 5, // 最大接続数を削減
    min: 1,  // 最小接続数を削減
    idleTimeoutMillis: 30000, // アイドルタイムアウトを短縮
    connectionTimeoutMillis: 10000, // 接続タイムアウトを延長
    acquireTimeoutMillis: 10000, // 接続取得タイムアウト
  };

  // Cloud SQL Unixソケット接続の場合
  if (config.host && config.host.startsWith('/cloudsql/')) {
    console.log('Cloud SQL Unixソケット接続を使用します');
    connectionConfig.host = config.host;
    connectionConfig.port = undefined; // Unixソケットではポートは不要
    connectionConfig.ssl = false; // UnixソケットではSSLは不要
  } else if (process.env.NODE_ENV === 'production') {
    console.log('本番環境でSSLを使用して接続します');
    connectionConfig.ssl = {
      rejectUnauthorized: false
    };
  } else {
    console.log('開発環境でSSL無効で接続します');
  }

  // データベースが存在しない場合は自動作成を試行
  try {
    const { Client } = await import('pg');
    const targetDb = String(connectionConfig.database || 'postgres');
    if (targetDb !== 'postgres') {
      const adminConn: any = { ...connectionConfig, database: 'postgres' };
      const adminClient = new Client(adminConn);
      try {
        await adminClient.connect();
        const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
        if (exists.rowCount === 0) {
          console.warn(`Database "${targetDb}" not found. Creating...`);
          await adminClient.query(`CREATE DATABASE "${targetDb}"`);
          console.log(`Database "${targetDb}" created.`);
        }
      } catch (e) {
        console.warn('Database existence check/create skipped:', e?.message || e);
      } finally {
        try { await adminClient.end(); } catch {}
      }
    }
  } catch (e) {
    console.warn('Database auto-create routine skipped:', e?.message || e);
  }

  pool = new Pool(connectionConfig);

  // 接続テスト
  pool.on('connect', () => {
    if (sslConfig) {
      console.log('Connected to GCP Cloud SQL PostgreSQL with SSL certificates');
    } else {
      console.log('Connected to PostgreSQL without SSL (development mode)');
    }
  });

  pool.on('error', (err: any) => {
    console.error('Unexpected error on idle client', err);
    // プロセスを終了せずに再接続を試行
    console.log('Attempting to reconnect to database...');
  });

  pool.on('connect', (client: any) => {
    console.log('New client connected to database');
  });

  pool.on('remove', (client: any) => {
    console.log('Client removed from pool');
  });

  return pool;
};

// クエリ実行関数
export const query = async (text: string, params?: any[]) => {
  if (!isServer) {
    console.log('Database query is not available in browser environment');
    throw new Error('Database operations are not available in browser');
  }

  if (!pool) {
    pool = await createPool();
  }

  // 初回クエリ前に必須テーブルの存在チェックと自動初期化
  try {
    if (text && typeof text === 'string') {
      const lower = text.toLowerCase();
      const needsUsers = lower.includes(' into users ') || lower.includes(' from users ') || lower.includes(' update users ');
      const needsInterviewUrls = lower.includes('interview_urls');
      
      // interview_urlsテーブルの存在チェックと作成
      if (needsInterviewUrls) {
        try {
          const exists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_urls'`);
          if (exists.rowCount === 0) {
            console.log('interview_urlsテーブルが存在しないため、作成します...');
            await pool.query(`
              CREATE TABLE interview_urls (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                interview_token TEXT NOT NULL,
                interview_url TEXT NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE,
                is_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              CREATE INDEX idx_interview_urls_user_id ON interview_urls(user_id);
              CREATE INDEX idx_interview_urls_token ON interview_urls(interview_token);
              CREATE INDEX idx_interview_urls_is_used ON interview_urls(is_used);
              
              CREATE OR REPLACE FUNCTION update_interview_urls_updated_at()
              RETURNS TRIGGER AS $$
              BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
              END;
              $$ language 'plpgsql';
              
              CREATE TRIGGER update_interview_urls_updated_at_trigger
                BEFORE UPDATE ON interview_urls
                FOR EACH ROW
                EXECUTE FUNCTION update_interview_urls_updated_at();
            `);
            console.log('✅ interview_urlsテーブルを作成しました');
          }
        } catch (interviewUrlsError: any) {
          console.warn('interview_urlsテーブルの作成チェックをスキップ:', interviewUrlsError.message);
        }
      }
      
      // interview_recordingsテーブルの存在チェックと作成
      if (needsInterviewUrls || lower.includes('interview_recordings')) {
        try {
          const exists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_recordings'`);
          if (exists.rowCount === 0) {
            console.log('interview_recordingsテーブルが存在しないため、作成します...');
            // interview_sessionsテーブルが存在するかチェック（外部キー参照のため）
            const sessionsExists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_sessions'`);
            if (sessionsExists.rowCount > 0) {
              await pool.query(`
                CREATE TABLE interview_recordings (
                  id SERIAL PRIMARY KEY,
                  session_id VARCHAR(36),
                  applicant_id VARCHAR(36),
                  user_id UUID,
                  recording_url TEXT NOT NULL,
                  recording_type VARCHAR(20) DEFAULT 'audio',
                  file_size BIGINT,
                  duration INTEGER,
                  storage_path TEXT,
                  question_id VARCHAR(10),
                  transcription_text TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_id ON interview_recordings(session_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_applicant_id ON interview_recordings(applicant_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id ON interview_recordings(user_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_question_id ON interview_recordings(question_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_question ON interview_recordings(session_id, question_id);
              `);
              console.log('✅ interview_recordingsテーブルを作成しました');
            } else {
              // interview_sessionsテーブルが存在しない場合でも、テーブルだけ作成（外部キー制約なし）
              await pool.query(`
                CREATE TABLE interview_recordings (
                  id SERIAL PRIMARY KEY,
                  session_id VARCHAR(36),
                  applicant_id VARCHAR(36),
                  user_id UUID,
                  recording_url TEXT NOT NULL,
                  recording_type VARCHAR(20) DEFAULT 'audio',
                  file_size BIGINT,
                  duration INTEGER,
                  storage_path TEXT,
                  question_id VARCHAR(10),
                  transcription_text TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_id ON interview_recordings(session_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_applicant_id ON interview_recordings(applicant_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id ON interview_recordings(user_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_question_id ON interview_recordings(question_id);
                CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_question ON interview_recordings(session_id, question_id);
              `);
              console.log('✅ interview_recordingsテーブルを作成しました（外部キー制約なし）');
            }
          } else {
            // テーブルが存在する場合、question_idとtranscription_textカラムが存在するかチェック
            const columns = await pool.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'interview_recordings'
            `);
            const columnNames = columns.rows.map((r: any) => r.column_name);
            
            if (!columnNames.includes('question_id')) {
              await pool.query(`ALTER TABLE interview_recordings ADD COLUMN IF NOT EXISTS question_id VARCHAR(10)`);
              await pool.query(`CREATE INDEX IF NOT EXISTS idx_interview_recordings_question_id ON interview_recordings(question_id)`);
              console.log('✅ interview_recordings.question_idカラムを追加しました');
            }
            
            if (!columnNames.includes('transcription_text')) {
              await pool.query(`ALTER TABLE interview_recordings ADD COLUMN IF NOT EXISTS transcription_text TEXT`);
              console.log('✅ interview_recordings.transcription_textカラムを追加しました');
            }
            
            // インデックスの確認と作成
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_question ON interview_recordings(session_id, question_id)`);
          }
        } catch (interviewRecordingsError: any) {
          console.warn('interview_recordingsテーブルの作成チェックをスキップ:', interviewRecordingsError.message);
        }
      }
      
      if (needsUsers) {
        // usersテーブルが無ければスキーマを実行
        const exists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'users'`);
        if (exists.rowCount === 0) {
          const path = (await import('path')).default;
          const fs = (await import('fs')).default;
          // 複数候補パスを順に試行（Cloud Runのdist配置にも対応）
          const candidates = [
            path.join(process.cwd(), 'src/integrations/postgres/schema.sql'),
            path.join(process.cwd(), 'dist-server/integrations/postgres/schema.sql'),
            path.join(path.dirname(process.cwd()), 'src/integrations/postgres/schema.sql')
          ];
          let executed = false;
          for (const p of candidates) {
            try {
              if (fs.existsSync(p)) {
                const schema = fs.readFileSync(p, 'utf8');
                await pool.query(schema);
                console.log('Executed schema.sql to initialize database:', p);
                executed = true;
                break;
              }
            } catch {}
          }
          if (!executed) {
            console.warn('schema.sql not found. Running minimal bootstrap DDL...');
            // 最小限のテーブルだけ生成（存在チェック付き）
            const bootstrap = `
              CREATE EXTENSION IF NOT EXISTS pgcrypto;
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                user_type TEXT,
                status TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              CREATE TABLE IF NOT EXISTS job_seekers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                first_name TEXT,
                last_name TEXT,
                profile_photo TEXT,
                registration_type TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              CREATE TABLE IF NOT EXISTS user_documents (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                document_type VARCHAR(50) DEFAULT 'all',
                registration_type VARCHAR(20) DEFAULT 'engineer',
                document_data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              ALTER TABLE user_documents
                ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'engineer';
              UPDATE user_documents
                SET registration_type = 'engineer'
                WHERE registration_type IS NULL;
            `;
            await pool.query(bootstrap);
            executed = true;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Schema auto-initialize skipped:', (e as any)?.message || e);
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// トランザクション実行関数
export const transaction = async (callback: (client: any) => Promise<any>) => {
  if (!isServer) {
    console.log('Database transaction is not available in browser environment');
    throw new Error('Database operations are not available in browser');
  }

  if (!pool) {
    pool = await createPool();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// プールをエクスポート
export const getPool = async () => {
  if (!isServer) {
    return null;
  }
  
  if (!pool) {
    pool = await createPool();
  }
  return pool;
};

// 接続を閉じる関数
export const closePool = async () => {
  if (!isServer || !pool) {
    return;
  }
  
  await pool.end();
}; 