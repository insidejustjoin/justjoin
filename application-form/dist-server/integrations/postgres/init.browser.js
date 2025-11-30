// ブラウザ環境用のダミーファイル
// サーバーサイド専用の関数をブラウザ環境で安全に呼び出せるようにする
export const initializeDatabase = async () => {
    console.log('Database initialization is not available in browser environment');
    return;
};
export const testConnection = async () => {
    console.log('Database connection test is not available in browser environment');
    return false;
};
export const getSqlFilePath = async () => {
    console.log('SQL file path is not available in browser environment');
    return null;
};
