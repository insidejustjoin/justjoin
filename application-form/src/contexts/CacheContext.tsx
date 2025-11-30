import React, { createContext, useContext, useState, useEffect } from 'react';

interface CacheData {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheContextType {
  get: (key: string) => any | null;
  set: (key: string, data: any, ttl?: number) => void;
  clear: (key?: string) => void;
  clearAll: () => void;
  isExpired: (key: string) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

interface CacheProviderProps {
  children: React.ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  const [cache, setCache] = useState<Map<string, CacheData>>(new Map());

  // デフォルトTTL: 5分
  const DEFAULT_TTL = 5 * 60 * 1000;

  const get = (key: string): any | null => {
    const cached = cache.get(key);
    if (!cached) return null;

    if (isExpired(key)) {
      cache.delete(key);
      return null;
    }

    return cached.data;
  };

  const set = (key: string, data: any, ttl: number = DEFAULT_TTL) => {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    setCache(prev => new Map(prev.set(key, cacheData)));
  };

  const clear = (key?: string) => {
    if (key) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  };

  const clearAll = () => {
    setCache(new Map());
  };

  const isExpired = (key: string): boolean => {
    const cached = cache.get(key);
    if (!cached) return true;

    return Date.now() - cached.timestamp > cached.ttl;
  };

  // 定期的に期限切れのキャッシュをクリア
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev.entries()) {
          if (!isExpired(key)) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(interval);
  }, []);

  const value: CacheContextType = {
    get,
    set,
    clear,
    clearAll,
    isExpired,
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}; 