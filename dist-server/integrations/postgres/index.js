// ブラウザ環境ではサーバーサイド機能を無効化
const isServer = typeof window === 'undefined';
// サーバーサイド専用の関数（ブラウザでは使用不可）
export const query = async (text, params) => {
    if (!isServer) {
        console.warn('Database query is not available in browser environment');
        throw new Error('Database operations are not available in browser');
    }
    const { query: serverQuery } = await import('./client');
    return serverQuery(text, params);
};
export const transaction = async (callback) => {
    if (!isServer) {
        console.warn('Database transaction is not available in browser environment');
        throw new Error('Database operations are not available in browser');
    }
    const { transaction: serverTransaction } = await import('./client');
    return serverTransaction(callback);
};
export const getPool = async () => {
    if (!isServer) {
        return null;
    }
    const { getPool: serverGetPool } = await import('./client');
    return serverGetPool();
};
export const closePool = async () => {
    if (!isServer) {
        return;
    }
    const { closePool: serverClosePool } = await import('./client');
    return serverClosePool();
};
// 動的インポート用の関数をエクスポート
export const getInitFunctions = async () => {
    if (!isServer) {
        return await import('./init.browser');
    }
    else {
        return await import('./init');
    }
};
export { jobSeekersRepository } from './jobSeekers';
export { companiesRepository } from './companies';
export { jobPostingsRepository } from './jobPostings';
