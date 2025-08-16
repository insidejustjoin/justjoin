import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// API設定
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://justjoin.jp';

export interface User {
  id: string | number;
  email: string;
  user_type: 'job_seeker' | 'company' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'active';
  profile?: {
    id: string | number;
    full_name?: string;
    company_name?: string;
    phone?: string;
    address?: string;
    desired_job_title?: string;
    experience_years?: number;
    skills?: string[];
    self_introduction?: string;
    profile_photo_url?: string;
  };
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string, userType: 'job_seeker' | 'company' | 'admin') => Promise<boolean>;
  logout: () => void;
  registerJobSeeker: (email: string, firstName: string, lastName: string, language?: 'ja' | 'en') => Promise<boolean>;
  registerCompany: (email: string, companyName: string, description: string) => Promise<boolean>;
  updateProfile: (profile: Partial<User['profile']>) => Promise<void>;
  getProfile: () => Promise<void>;
  approveCompany: (companyId: string) => Promise<boolean>;
  rejectCompany: (companyId: string, reason: string) => Promise<boolean>;
  resetPassword: (email: string, userType: 'job_seeker' | 'company', language?: 'ja' | 'en') => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;

  isAuthenticated: boolean;
  // キャッシュ関連の関数
  clearProfileCache: (userId: string) => void;
  getCachedProfile: (userId: string) => any;
  // デバッグ用関数
  clearAllStorage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // プロフィールキャッシュ関連
  const profileCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_DURATION = 5 * 60 * 1000; // 5分
  
  const getCachedProfile = (userId: string) => {
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const updateCachedProfile = (userId: string, profile: any) => {
    profileCache.set(userId, {
        data: profile,
        timestamp: Date.now()
    });
  };

  const clearProfileCache = (userId: string) => {
    profileCache.delete(userId);
  };

  // 初期化処理
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (token && storedUser) {
          try {
            const initialUser: User = JSON.parse(storedUser);
            
            // セッション有効期限チェック（8時間）
            const loginTime = localStorage.getItem('auth_login_time');
            if (loginTime) {
              const loginTimestamp = new Date(loginTime);
              const now = new Date();
              const hoursDiff = (now.getTime() - loginTimestamp.getTime()) / (1000 * 60 * 60);
              
              if (hoursDiff > 8) {
                console.log('セッションが期限切れです。ログアウトします。');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_login_time');
                setUser(null);
                setIsLoading(false);
                setIsInitialized(true);
                return;
              }
            }
            
            // idを文字列として処理
            const userId = String(initialUser.id);
            console.log('AuthContext: 初期化 - ユーザーID:', userId);
            
            // ユーザー情報の検証（数値のユーザーIDも有効とする）
            if (!initialUser.email || !initialUser.user_type) {
              console.log('AuthContext: 無効なユーザー情報です。ログアウトします。');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              localStorage.removeItem('auth_login_time');
              setUser(null);
              setIsLoading(false);
              setIsInitialized(true);
              
              // ログインページにリダイレクト
              window.location.href = '/jobseeker';
              return;
            }
            
            // ユーザー情報を設定
            setUser({
              ...initialUser,
              id: userId
            });
            
            console.log('AuthContext: 初期化完了 - ユーザー:', initialUser.email);
          } catch (parseError) {
            console.error('AuthContext: ユーザー情報のパースエラー:', parseError);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_login_time');
            setUser(null);
          }
        } else {
          console.log('AuthContext: 認証情報が見つかりません');
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: 初期化エラー:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // ブラウザバック時の状態復元（初期化完了後のみ実行）
  useEffect(() => {
    if (!isInitialized) return;

    const handleBeforeUnload = () => {
      // ページを離れる前にユーザー情報を保存
      if (user) {
        // idを文字列として保存
        const userForStorage = {
          ...user,
          id: String(user.id)
        };
        localStorage.setItem('auth_user', JSON.stringify(userForStorage));
      }
    };

    const handlePopState = () => {
      // ブラウザバック時にユーザー情報を復元
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser && !user) {
        try {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore user data:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInitialized]); // userを依存配列から削除

  const login = async (email: string, password: string, userType: 'job_seeker' | 'company' | 'admin'): Promise<boolean> => {
    try {
      console.log('Login requested for:', email, userType);
      
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('有効なメールアドレスを入力してください');
        return false;
      }
      
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 管理者の場合は専用APIを使用
      const apiEndpoint = userType === 'admin' ? '/api/admin/login' : '/api/login';
      const requestBody = userType === 'admin' 
        ? { email, password }
        : { email, password, userType };
      
      const response = await fetch(`${apiUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success && result.user) {
        const user = result.user;
        
        // ユーザー情報の検証
        if (!user.id || !user.email || !user.user_type) {
          console.error('Invalid user data received:', user);
          toast.error('ログインに失敗しました');
          return false;
        }
        
        // idを文字列として保存
        const userForStorage = {
          ...user,
          id: String(user.id)
        };
        
        setUser(user);
        localStorage.setItem('auth_token', result.token || 'token-' + Date.now());
        localStorage.setItem('auth_user', JSON.stringify(userForStorage));
        localStorage.setItem('auth_login_time', new Date().toISOString()); // ログイン時刻を保存
        
        toast.success(`${userType === 'job_seeker' ? '求職者' : userType === 'company' ? '企業' : '管理者'}としてログインしました`);
        return true;
      } else {
        console.error('Login failed:', result);
        toast.error(result.message || 'ログインに失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('ログインに失敗しました');
      return false;
    }
  };

  const logout = () => {
    // ログアウト時にキャッシュをクリア
    if (user) {
      clearProfileCache(String(user.id));
    }
    
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_login_time'); // ログイン時刻もクリア
    toast.success('ログアウトしました');
    // 求職者ログインページにリダイレクト
    window.location.href = '/jobseeker';
  };

  // localStorageを完全にクリアする関数（デバッグ用）
  const clearAllStorage = () => {
    console.log('AuthContext: Clearing all localStorage data');
    console.log('AuthContext: Before clear - auth_token:', localStorage.getItem('auth_token'));
    console.log('AuthContext: Before clear - auth_user:', localStorage.getItem('auth_user'));
    console.log('AuthContext: Before clear - auth_login_time:', localStorage.getItem('auth_login_time'));
    
    localStorage.clear();
    setUser(null);
    setIsLoading(false);
    setIsInitialized(true);
    
    console.log('AuthContext: After clear - all localStorage cleared');
    toast.success('すべての認証データをクリアしました');
  };

  const registerJobSeeker = async (email: string, firstName: string, lastName: string, language: 'ja' | 'en' = 'ja'): Promise<boolean> => {
    try {
      console.log('Job seeker registration requested for:', email, firstName, lastName, language);
      
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/register-jobseeker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          firstName,
          lastName,
          language
        })
      });

      const result = await response.json();

      if (result.success) {
        // 登録成功時にユーザー情報をlocalStorageに保存
        if (result.user) {
          const userForStorage = {
            ...result.user,
            id: String(result.user.id)
          };
          localStorage.setItem('auth_user', JSON.stringify(userForStorage));
          setUser(result.user);
        }
        toast.success('求職者登録に成功しました');
        return true;
      } else {
        toast.error(result.message || '求職者登録に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Job seeker registration error:', error);
      toast.error('求職者登録に失敗しました');
      return false;
    }
  };

  const registerCompany = async (email: string, companyName: string, description: string): Promise<boolean> => {
    try {
      console.log('Company registration requested for:', email, companyName);
      
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/register-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          companyName,
          description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 登録成功時にユーザー情報をlocalStorageに保存
        if (result.user) {
          const userForStorage = {
            ...result.user,
            id: String(result.user.id)
          };
          localStorage.setItem('auth_user', JSON.stringify(userForStorage));
          setUser(result.user);
        }
        toast.success('企業登録に成功しました');
        return true;
      } else {
        toast.error(result.message || '企業登録に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Company registration error:', error);
      toast.error('企業登録に失敗しました');
      return false;
    }
  };

  const updateProfile = async (profile: Partial<User['profile']>) => {
    if (!user) {
      return;
    }

    // 管理者の場合はプロフィール更新をスキップ
    if (user.user_type === 'admin') {
      console.log('AuthContext: Admin user - skipping profile update');
      return;
    }

    try {
      console.log('Profile update requested for:', user.id, profile);
      
      // ローカルでユーザー情報を更新（即座にUIに反映）
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...profile
        }
      };
      setUser(updatedUser);
      
      // idを文字列として保存
      const userForStorage = {
        ...updatedUser,
        id: String(updatedUser.id)
      };
      localStorage.setItem('auth_user', JSON.stringify(userForStorage));
      
      // キャッシュを更新
      updateCachedProfile(String(user.id), updatedUser.profile);
      
      console.log('AuthContext: Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('プロフィール更新に失敗しました');
    }
  };

  const getProfile = async () => {
    if (!user) {
      return;
    }

    // 管理者の場合はプロフィール取得をスキップ
    if (user.user_type === 'admin') {
      console.log('AuthContext: Admin user - skipping profile fetch');
      return;
    }

    // キャッシュからプロフィール情報を取得（5分間有効）
          const cachedProfile = getCachedProfile(String(user.id));
      if (cachedProfile) {
        console.log('AuthContext: Using cached profile data');
        const updatedUser = {
          ...user,
          profile: { ...cachedProfile }
        };
        setUser(updatedUser);
        // idを文字列として保存
        const userForStorage = {
          ...updatedUser,
          id: String(updatedUser.id)
        };
        localStorage.setItem('auth_user', JSON.stringify(userForStorage));
        return;
      }

    console.log('AuthContext: Fetching profile from API (cache miss)');

    try {
      // 実際のAPIを呼び出し
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/jobseekers/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('AuthContext: Profile not found, creating default profile');
          // プロフィールが見つからない場合はデフォルトプロフィールを作成
          const defaultProfile = {
            id: user.id,
            full_name: user.profile?.full_name || 'テストユーザー',
            company_name: user.profile?.company_name,
            phone: user.profile?.phone || '',
            address: user.profile?.address || '',
            desired_job_title: user.profile?.desired_job_title || '',
            experience_years: user.profile?.experience_years || 0,
            skills: user.profile?.skills || [],
            self_introduction: user.profile?.self_introduction || '',
            profile_photo_url: user.profile?.profile_photo_url || ''
          };

          // キャッシュを更新
          updateCachedProfile(String(user.id), defaultProfile);

          // userオブジェクトとlocalStorageを即座に更新
          const updatedUser = {
            ...user,
            profile: { ...defaultProfile }
          };
          setUser(updatedUser);
          // idを文字列として保存
          const userForStorage = {
            ...updatedUser,
            id: String(updatedUser.id)
          };
          localStorage.setItem('auth_user', JSON.stringify(userForStorage));
          
          console.log('AuthContext: Default profile created and cached');
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.jobSeeker) {
        const profile = result.jobSeeker;
        
        // キャッシュを更新
        updateCachedProfile(String(user.id), profile);

              // userオブジェクトとlocalStorageを即座に更新
      const updatedUser = {
        ...user,
        profile: { ...profile }
      };
      setUser(updatedUser);
      // idを文字列として保存
      const userForStorage = {
        ...updatedUser,
        id: String(updatedUser.id)
      };
      localStorage.setItem('auth_user', JSON.stringify(userForStorage));
        
        console.log('AuthContext: Profile updated from API');
      } else {
        throw new Error(result.message || 'プロフィールの取得に失敗しました');
      }
    } catch (error) {
      console.error('Profile get error:', error);
      toast.error('プロフィールの取得に失敗しました');
    }
  };

  const approveCompany = async (companyId: string): Promise<boolean> => {
    try {
      // 現在はモック処理（バックエンドAPIが復旧後に実際のAPIを呼び出す）
      console.log('Company approval requested for:', companyId);
      
      // モック成功レスポンス
      toast.success('企業を承認しました。承認メールを送信しました。（モック）');
      
      return true;
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('承認に失敗しました');
      return false;
    }
  };

  const rejectCompany = async (companyId: string, reason: string): Promise<boolean> => {
    try {
      // 現在はモック処理（バックエンドAPIが復旧後に実際のAPIを呼び出す）
      console.log('Company rejection requested for:', companyId, reason);
      
      // モック成功レスポンス
      toast.success('企業を却下しました。却下メールを送信しました。（モック）');
      
      return true;
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('却下に失敗しました');
      return false;
    }
  };

  const resetPassword = async (email: string, userType: 'job_seeker' | 'company', language: 'ja' | 'en' = 'ja'): Promise<boolean> => {
    try {
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      console.log('パスワード再設定API呼び出し:', { email, userType, language, apiUrl });
      
      const response = await fetch(`${apiUrl}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userType, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        // APIから返されるエラーメッセージを使用
        throw new Error(data.message || 'パスワード再発行に失敗しました');
      }

      console.log('パスワード再設定成功:', data);
      toast.success(data.message || '新しいパスワードがメールで送信されました。');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'パスワード再発行に失敗しました');
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      console.log('アカウント削除API呼び出し:', { userId: user.id, apiUrl });
      
      const response = await fetch(`${apiUrl}/api/user/account/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // APIから返されるエラーメッセージを使用
        throw new Error(data.message || 'アカウントの削除に失敗しました');
      }

      console.log('アカウント削除成功:', data);
      
      // ローカルストレージとユーザー状態をクリア
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_login_time'); // ログイン時刻もクリア
      if (user) {
        clearProfileCache(String(user.id));
      }
      
      toast.success(data.message || 'アカウントが正常に削除されました');
      
      // ホームページにリダイレクト
      window.location.href = '/';
      
      return true;
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(error instanceof Error ? error.message : 'アカウントの削除に失敗しました');
      return false;
    }
  };



  const value: AuthContextType = {
    user,
    isLoading,
    isInitialized,
    login,
    logout,
    registerJobSeeker,
    registerCompany,
    updateProfile,
    getProfile,
    approveCompany,
    rejectCompany,
    resetPassword,
    deleteAccount,

    isAuthenticated: !!user,
    clearProfileCache,
    getCachedProfile,
    clearAllStorage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
