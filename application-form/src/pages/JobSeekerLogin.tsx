import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageToggle } from '@/components/LanguageToggle';
import { LoginGuidance } from '@/components/LoginGuidance';
import { BetaNotice } from '@/components/BetaNotice';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Lock, UserPlus, ArrowLeft, Briefcase, Key, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6)
});

type LoginFormData = z.infer<typeof loginSchema>;

export function JobSeekerLogin() {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [currentTab, setCurrentTab] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();

  // 初回訪問時にガイダンスを表示（少し遅延させて表示）
  useEffect(() => {
    const hasSeenGuidance = localStorage.getItem('hasSeenLoginGuidance');
    if (!hasSeenGuidance) {
      const timer = setTimeout(() => {
        setShowGuidance(true);
        localStorage.setItem('hasSeenLoginGuidance', 'true');
      }, 1000); // 1秒後に表示
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTabChange = (tab: 'login' | 'register') => {
    setCurrentTab(tab);
    if (tab === 'register') {
      // 新しい登録フローにリダイレクト
      navigate('/jobseeker/register');
    }
  };

  // 動的バリデーションメッセージ（メールアドレスベース）
  const loginSchemaWithTranslation = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    password: z.string().min(6, t('auth.validation.passwordMin'))
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchemaWithTranslation)
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // registrationTypeは渡さない（ログイン後にタイプ選択画面で選択する）
      const result = await login(
        data.email,
        data.password,
        'job_seeker',
        undefined,
        undefined,
        undefined
      );
      
      if (result === 'type_selection_required') {
        // 複数のタイプがある場合、タイプ選択画面に遷移
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          navigate('/jobseeker/login/type', {
            state: {
              registrationTypes: user.registration_types || [],
              email: user.email,
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              fromGoogleAuth: false
            }
          });
        }
      } else if (result === true) {
        // ログイン成功（1つのタイプのみ、またはタイプがない場合）
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const registrationTypes = user.registration_types || [];
          
          // 1つのタイプのみの場合はそのマイページへ、タイプがない場合はデフォルトのマイページへ
          if (registrationTypes.length === 1) {
            const type = registrationTypes[0];
            if (type === 'general') {
              navigate('/jobseeker/my-page-general');
            } else {
              navigate('/jobseeker/my-page-engineer');
            }
          } else {
            // タイプがない場合はデフォルトのマイページへ
            navigate('/jobseeker/my-page');
          }
        } else {
          navigate('/jobseeker/my-page');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <Helmet>
        <title>求職者ログイン・仮登録 | JustJoin</title>
        <meta name="description" content="求職者のログインと仮登録。安全で簡単な求職者登録システム。" />
        <meta name="keywords" content="求職者,ログイン,登録,転職,就職" />
        <meta property="og:title" content="求職者ログイン・仮登録 | JustJoin" />
        <meta property="og:description" content="求職者のログインと仮登録。安全で簡単な求職者登録システム。" />
        <meta name="twitter:title" content="求職者ログイン・仮登録 | JustJoin" />
        <meta name="twitter:description" content="求職者のログインと仮登録。安全で簡単な求職者登録システム。" />
      </Helmet>
      
      {/* メインコンテナ */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 言語切り替えボタン */}
          <div className="absolute top-6 right-6 z-50">
            <LanguageToggle />
          </div>

          {/* ガイダンス吹き出し */}
          {showGuidance && (
            <LoginGuidance 
              onClose={() => setShowGuidance(false)} 
              onTabChange={handleTabChange}
              currentTab={currentTab}
            />
          )}

          <div className="w-full space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src="/logo.svg" 
                  alt="just join" 
                  className="h-12 w-auto"
                />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {t('auth.title')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('auth.subtitle')}
              </p>
            </div>

            <Tabs defaultValue="login" className="w-full" onValueChange={(value) => handleTabChange(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t('auth.loginTab')}
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t('auth.jobSeekerTab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      {t('auth.jobSeekerLoginTitle')}
                    </CardTitle>
                    <CardDescription>
                      {t('auth.jobSeekerLoginDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('auth.email')}
                        </Label>
                        <Input
                          id="login-email"
                          type="email"
                          {...loginForm.register('email')}
                          placeholder={t('auth.emailPlaceholder')}
                          className="pl-3"
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {t('auth.password')}
                        </Label>
                        <Input
                          id="login-password"
                          type="password"
                          {...loginForm.register('password')}
                          placeholder={t('auth.passwordPlaceholder')}
                          className="pl-3"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      {/* パスワードを忘れた場合のリンク */}
                      <div className="text-right">
                        <Link 
                          to="/jobseeker/forgot-password" 
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {t('auth.forgotPassword')}
                        </Link>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">{t('auth.or')}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
                            const response = await fetch(`${apiUrl}/api/auth/google`);
                            const data = await response.json();
                            
                            if (data.success && data.authUrl) {
                              window.location.href = data.authUrl;
                            } else {
                              toast.error('Google認証の開始に失敗しました');
                            }
                          } catch (error) {
                            console.error('Google認証エラー:', error);
                            toast.error('Google認証の開始に失敗しました');
                          }
                        }}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        {t('auth.googleLogin')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                      {t('auth.jobSeekerRegisterTitle')}
                    </CardTitle>
                    <CardDescription>
                      {t('auth.jobSeekerRegisterDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <p className="text-sm text-gray-600">
                        {t('auth.goToRegisterPage')}
                      </p>
                      <Button 
                        onClick={() => navigate('/jobseeker/register')}
                        className="w-full"
                      >
                        {t('auth.goToRegister')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* β版表記 */}
            <div className="mt-6">
              <BetaNotice />
            </div>

            {/* ナビゲーションボタン */}
            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/jobseeker/register')}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('auth.goToRegister')}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = 'https://justjoin.jp/'}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('auth.goToTopPage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}