import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageview } from '../utils/gtag';

/**
 * Google Analytics ページビュー追跡コンポーネント
 * React Routerのページ遷移を追跡します
 */
export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // ページ遷移を追跡
    const path = location.pathname + location.search;
    pageview(path);
  }, [location]);

  return null;
};

