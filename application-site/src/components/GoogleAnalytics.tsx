import { useEffect } from 'react';
import { pageview } from '../utils/gtag';

/**
 * Google Analytics ページビュー追跡コンポーネント
 * シングルページアプリケーションのページ遷移を追跡します
 */
export const GoogleAnalytics = () => {
  useEffect(() => {
    // 初期ページビューを送信
    const path = window.location.pathname + window.location.search;
    pageview(path);

    // ハッシュ変更（ページ内リンク）を監視
    const handleHashChange = () => {
      const newPath = window.location.pathname + window.location.search + window.location.hash;
      pageview(newPath);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return null;
};

