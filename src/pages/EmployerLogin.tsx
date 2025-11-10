import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Mail, Lock, UserPlus, ArrowLeft, Key } from 'lucide-react';
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

const registerSchema = z.object({
  email: z.string().email(),
  companyName: z.string().min(1),
  description: z.string().min(10)
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function EmployerLogin() {
  const { login, registerCompany } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const recaptchaRenderRef = useRef<() => void>(() => {});
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  // 動的バリデーションメッセージ
  const loginSchemaWithTranslation = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    password: z.string().min(6, t('auth.validation.passwordMin'))
  });

  const registerSchemaWithTranslation = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    companyName: z.string().min(1, t('auth.validation.companyNameRequired')),
    description: z.string().min(10, t('auth.validation.descriptionMin'))
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchemaWithTranslation)
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchemaWithTranslation)
  });

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

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      if (!isRecaptchaReady) {
        toast.error('reCAPTCHAが初期化中です。数秒後に再度お試しください。');
        return;
      }

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
        if (!recaptchaV2Response) {
          toast.error('reCAPTCHAを完了してください');
          return;
        }
      }

      const success = await login(data.email, data.password, 'company', undefined, recaptchaV2Response);
      if (success) {
        navigate('/employer/my-page');
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

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const success = await registerCompany(data.email, data.companyName, data.description);
      if (success) {
        toast.success(t('auth.companyRegisterSuccess') || '企業登録申請を送信しました。審査後に担当者から連絡いたします。');
        const tabsElement = document.querySelector('[data-value="login"]') as HTMLElement;
        if (tabsElement) {
          tabsElement.click();
        }
        loginForm.setValue('email', data.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 言語切り替えボタン */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageToggle />
      </div>
      
      {/* トップページに戻るボタン */}
      <div className="absolute top-6 left-6 z-50">
        <Button variant="ghost" asChild className="flex items-center gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>
        </Button>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Building className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('auth.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t('auth.loginTab')}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t('auth.companyTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Building className="h-5 w-5 text-emerald-600" />
                  {t('auth.companyLoginTitle')}
                </CardTitle>
                <CardDescription>
                  {t('auth.companyLoginDescription')}
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

                  {siteKey && (
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
                        <p className="text-xs text-muted-foreground">reCAPTCHAを読み込み中です…</p>
                      )}
                    </div>
                  )}

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

                  <div className="text-center mt-4">
                    <Link 
                      to="/employer/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      パスワードを忘れた方はこちら
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  {t('auth.companyRegisterTitle')}
                </CardTitle>
                <CardDescription>
                  {t('auth.companyRegisterDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      {...registerForm.register('email')}
                      placeholder={t('auth.emailPlaceholder')}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-companyName" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {t('auth.companyName')}
                    </Label>
                    <Input
                      id="register-companyName"
                      {...registerForm.register('companyName')}
                      placeholder={t('auth.companyNamePlaceholder')}
                    />
                    {registerForm.formState.errors.companyName && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-description">
                      {t('auth.description')}
                    </Label>
                    <Textarea
                      id="register-description"
                      {...registerForm.register('description')}
                      placeholder={t('auth.descriptionPlaceholder')}
                      rows={4}
                    />
                    {registerForm.formState.errors.description && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('auth.registering') : t('auth.registerButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
