// ブラウザ環境では実行しない
const isServer = typeof window === 'undefined';
export const initializeDatabase = async () => {
    if (!isServer) {
        console.log('Database initialization is not available in browser environment');
        return;
    }
    try {
        console.log('Initializing GCP Cloud SQL database...');
        // サーバー環境でのみインポート
        const { Pool } = await import('pg');
        const path = (await import('path')).default;
        const fs = (await import('fs')).default;
        // スキーマファイルを読み込み（サーバー環境でのみ実行）
        const schemaPath = path.join(process.cwd(), 'src/integrations/postgres/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // スキーマを実行
        const { query } = await import('./client.js');
        await query(schema);
        console.log('Database initialized successfully!');
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};
// テスト用の接続確認
export const testConnection = async () => {
    if (!isServer) {
        console.log('Database connection test is not available in browser environment');
        return false;
    }
    try {
        const { query } = await import('./client.js');
        const result = await query('SELECT NOW() as current_time');
        console.log('Database connection successful:', result.rows[0]);
        return true;
    }
    catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};
// SQLファイルのパスを取得（サーバー環境でのみ実行）
export const getSqlFilePath = async () => {
    if (!isServer) {
        return null;
    }
    try {
        const path = (await import('path')).default;
        return path.join(process.cwd(), 'src/integrations/postgres/init.sql');
    }
    catch (error) {
        console.warn('Failed to get SQL file path:', error);
        return null;
    }
};
