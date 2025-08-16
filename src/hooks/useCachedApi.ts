import { useState, useEffect, useCallback } from 'react';
import { useCache } from '@/contexts/CacheContext';

interface UseCachedApiOptions {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryCount?: number; // リトライ回数
  retryDelay?: number; // リトライ間隔（ms）
  debounceMs?: number; // デバウンス時間（ms）
}

interface UseCachedApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useCachedApi<T>(
  url: string,
  options: UseCachedApiOptions
): UseCachedApiResult<T> {
  const { 
    cacheKey, 
    ttl, 
    enabled = true, 
    onSuccess, 
    onError,
    retryCount = 2,
    retryDelay = 1000,
    debounceMs = 300
  } = options;
  const { get, set, clear } = useCache();
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デバウンス用のタイマー
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    // デバウンス処理
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const executeFetch = async () => {
      // キャッシュからデータを取得（強制更新でない場合）
      if (!forceRefresh) {
        const cachedData = get(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setError(null);
          onSuccess?.(cachedData);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          // キャッシュに保存
          set(cacheKey, result.data, ttl);
          onSuccess?.(result.data);
        } else {
          throw new Error(result.error || 'API request failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // リトライ処理
        if (retryAttempt < retryCount) {
          console.log(`API呼び出し失敗、${retryDelay}ms後にリトライします (${retryAttempt + 1}/${retryCount})`);
          setTimeout(() => {
            fetchData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setError(errorMessage);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    // デバウンス処理
    if (debounceMs > 0) {
      const timer = setTimeout(executeFetch, debounceMs);
      setDebounceTimer(timer);
    } else {
      executeFetch();
    }
  }, [url, cacheKey, ttl, onSuccess, onError, retryCount, retryDelay, debounceMs, get, set]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    clear(cacheKey);
    setData(null);
  }, [clear, cacheKey]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
    
    // クリーンアップ
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [url, enabled, fetchData, debounceTimer]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
}

// 管理者用のキャッシュ付きAPIフック
export function useAdminCachedApi<T>(
  endpoint: string,
  options: Omit<UseCachedApiOptions, 'cacheKey'> & { cacheKey?: string }
): UseCachedApiResult<T> {
  const { cacheKey = `admin_${endpoint}`, ...restOptions } = options;
  
  return useCachedApi<T>(`/api/admin/${endpoint}`, {
    cacheKey,
    ...restOptions,
  });
}

// ブログ用のキャッシュ付きAPIフック
export function useBlogCachedApi<T>(
  endpoint: string,
  options: Omit<UseCachedApiOptions, 'cacheKey'> & { cacheKey?: string }
): UseCachedApiResult<T> {
  const { cacheKey = `blog_${endpoint}`, ...restOptions } = options;
  
  return useCachedApi<T>(`/api/blog/${endpoint}`, {
    cacheKey,
    ...restOptions,
  });
} 