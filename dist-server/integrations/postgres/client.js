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
        }
        catch (error) {
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
                }
                else {
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
let pool = null;
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
    let sslConfig = false; // デフォルトはSSL無効
    if (config.ssl) {
        // DATABASE_URLでSSLが要求されている場合
        console.log('DATABASE_URLでSSLが要求されています');
        // 開発環境ではSSLを無効にするオプション
        if (process.env.NODE_ENV === 'development' && process.env.DISABLE_SSL === 'true') {
            console.log('開発環境でSSLを無効にします（DISABLE_SSL=true）');
            sslConfig = false;
        }
        else {
            // SSL証明書ファイルの存在確認
            const sslFiles = [serverCaPath, clientCertPath, clientKeyPath];
            const missingFiles = sslFiles.filter(file => !fs.existsSync(file));
            if (missingFiles.length === 0) {
                // SSL証明書ファイルが全て存在する場合
                console.log('SSL証明書ファイルを使用して接続します');
                sslConfig = {
                    ca: fs.readFileSync(serverCaPath), // sslrootcert=server-ca.pem
                    cert: fs.readFileSync(clientCertPath), // sslcert=client-cert.pem
                    key: fs.readFileSync(clientKeyPath), // sslkey=client-key.pem
                    rejectUnauthorized: true, // sslmode=verify-ca
                    checkServerIdentity: () => undefined // ホスト名検証をスキップ
                };
            }
            else {
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
    }
    else {
        console.log('SSL無効で接続します');
    }
    // Cloud Run環境での特別な設定
    let connectionConfig = {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        max: 5, // 最大接続数を削減
        min: 1, // 最小接続数を削減
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
    }
    else if (process.env.NODE_ENV === 'production') {
        console.log('本番環境でSSLを使用して接続します');
        connectionConfig.ssl = {
            rejectUnauthorized: false
        };
    }
    else {
        console.log('開発環境でSSL無効で接続します');
    }
    pool = new Pool(connectionConfig);
    // 接続テスト
    pool.on('connect', () => {
        if (sslConfig) {
            console.log('Connected to GCP Cloud SQL PostgreSQL with SSL certificates');
        }
        else {
            console.log('Connected to PostgreSQL without SSL (development mode)');
        }
    });
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        // プロセスを終了せずに再接続を試行
        console.log('Attempting to reconnect to database...');
    });
    pool.on('connect', (client) => {
        console.log('New client connected to database');
    });
    pool.on('remove', (client) => {
        console.log('Client removed from pool');
    });
    return pool;
};
// クエリ実行関数
export const query = async (text, params) => {
    if (!isServer) {
        console.log('Database query is not available in browser environment');
        throw new Error('Database operations are not available in browser');
    }
    if (!pool) {
        pool = await createPool();
    }
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};
// トランザクション実行関数
export const transaction = async (callback) => {
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
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
