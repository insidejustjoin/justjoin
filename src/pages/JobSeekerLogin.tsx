import React, { useState, useEffect, useRef } from 'react';
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
import { User, Mail, Lock, UserPlus, ArrowLeft, Briefcase, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      render?: (container: any, parameters: any) => any;
      getResponse?: (widgetId?: number) => string;
      reset?: (widgetId?: number) => void;
    };
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginFormData = z.infer<typeof loginSchema>;

export function JobSeekerLogin() {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [currentTab, setCurrentTab] = useState<'login' | 'register'>('login');
  const [registrationType, setRegistrationType] = useState<'engineer' | 'general'>('engineer');
  const navigate = useNavigate();
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const recaptchaRenderRef = useRef<() => void>(() => {});
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

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

  // reCAPTCHA v2ウィジェットを手動レンダリング
  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let scriptEl: HTMLScriptElement | null = null;
    let loadListener: (() => void) | null = null;

    const renderRecaptcha = () => {
      if (cancelled || widgetIdRef.current !== null || !recaptchaContainerRef.current) return;

      const grecaptcha = typeof window !== 'undefined' ? window.grecaptcha : undefined;
      if (!grecaptcha || typeof grecaptcha.render !== 'function' || typeof grecaptcha.ready !== 'function') return;

      grecaptcha.ready(() => {
        if (cancelled || widgetIdRef.current !== null || !recaptchaContainerRef.current) return;
        try {
          const id = grecaptcha.render(recaptchaContainerRef.current as Element, { sitekey: siteKey });
          widgetIdRef.current = typeof id === 'number' ? id : Number(id);
          setIsRecaptchaReady(true);
        } catch (error) {
          console.warn('reCAPTCHA v2レンダリングに失敗しました', error);
        }
      });
    };

    const ensureScript = () => {
      if (typeof document === 'undefined') return;
      const existing = document.querySelector<HTMLScriptElement>('script[src^="https://www.google.com/recaptcha/api.js"]');
      if (existing) {
        scriptEl = existing;
        if ((window as any).grecaptcha) {
          renderRecaptcha();
        } else {
          loadListener = () => renderRecaptcha();
          existing.addEventListener('load', loadListener);
        }
      } else {
        scriptEl = document.createElement('script');
        scriptEl.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=ja';
        scriptEl.async = true;
        scriptEl.defer = true;
        loadListener = () => renderRecaptcha();
        scriptEl.addEventListener('load', loadListener);
        document.head.appendChild(scriptEl);
      }
    };

    recaptchaRenderRef.current = renderRecaptcha;
    setIsRecaptchaReady(false);
    ensureScript();
    interval = setInterval(renderRecaptcha, 1000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (loadListener && scriptEl) {
        scriptEl.removeEventListener('load', loadListener);
      }
      recaptchaRenderRef.current = () => {};
    };
  }, [siteKey]);

  const handleTabChange = (tab: 'login' | 'register') => {
    setCurrentTab(tab);
    if (tab === 'register') {
      // 新しい登録フローにリダイレクト
      navigate('/jobseeker/register');
    }
  };

  // 動的バリデーションメッセージ
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
      if (!isRecaptchaReady) {
        toast.error('reCAPTCHAが初期化中です。数秒後に再度お試しください。');
        return;
      }

      // reCAPTCHA v2（チェックボックス）レスポンス取得
      let recaptchaV2Response = '';
      if (typeof window !== 'undefined' && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        try {
          recaptchaV2Response =
            widgetIdRef.current !== null
              ? window.grecaptcha.getResponse?.(widgetIdRef.current) || ''
              : window.grecaptcha.getResponse();
        } catch (error) {
          console.warn('reCAPTCHA v2レスポンス取得に失敗しました', error);
          toast.error('reCAPTCHAの取得に失敗しました。ページを再読み込みしてお試しください。');
          return;
        }
      }

      if (!recaptchaV2Response) {
        toast.error('reCAPTCHAを完了してください');
        return;
      }

      const success = await login(
        data.email,
        data.password,
        'job_seeker',
        undefined,
        recaptchaV2Response,
        registrationType
      );
      if (success) {
        if (registrationType === 'general') {
          navigate('/jobseeker/my-page-general');
        } else {
          navigate('/jobseeker/my-page-engineer');
        }
      }
    } finally {
      if (typeof window !== 'undefined' && window.grecaptcha && typeof window.grecaptcha.reset === 'function' && widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (error) {
          console.warn('reCAPTCHAリセットに失敗しました', error);
        } finally {
          setIsRecaptchaReady(true);
        }
      }
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
                <div className="bg-blue-100 p-3 rounded-full">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
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
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          ログイン対象
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={registrationType === 'engineer' ? 'default' : 'outline'}
                            onClick={() => setRegistrationType('engineer')}
                          >
                            エンジニア
                          </Button>
                          <Button
                            type="button"
                            variant={registrationType === 'general' ? 'default' : 'outline'}
                            onClick={() => setRegistrationType('general')}
                          >
                            一般職
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          同じメールアドレスで複数タイプが登録されている場合は、選択したマイページが開きます。
                        </p>
                      </div>

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

                      <div
                        className="flex flex-col items-center space-y-2"
                        onMouseEnter={() => recaptchaRenderRef.current()}
                        onFocus={() => recaptchaRenderRef.current()}
                      >
                        <div
                          ref={recaptchaContainerRef}
                          className="g-recaptcha"
                          data-sitekey={siteKey}
                        />
                        {!isRecaptchaReady && (
                          <p className="text-xs text-muted-foreground">
                            reCAPTCHAを読み込み中です…
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !isRecaptchaReady}
                        onMouseEnter={() => recaptchaRenderRef.current()}
                        onFocus={() => recaptchaRenderRef.current()}
                        onClick={() => recaptchaRenderRef.current()}
                      >
                        {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
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
                        新規登録ページへ移動します
                      </p>
                      <Button 
                        onClick={() => navigate('/jobseeker/register')}
                        className="w-full"
                      >
                        新規登録へ
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
          </div>
        </div>
      </div>
    </>
  );
}