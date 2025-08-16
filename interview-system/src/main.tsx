import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './App.css';

// エラーハンドリング
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // ユーザーに分かりやすいエラーメッセージを表示
  if (event.reason?.message?.includes('fetch')) {
    console.warn('Network error detected - this may be expected during development');
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// React Strict Mode で開発時の問題を検出
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
); 