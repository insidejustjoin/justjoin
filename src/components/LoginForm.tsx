import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
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
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  userType: z.enum(['job_seeker', 'company', 'admin'])
});

const jobSeekerRegisterSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  firstName: z.string().min(1, '名を入力してください'),
  lastName: z.string().min(1, '姓を入力してください')
});

const companyRegisterSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  companyName: z.string().min(1, '会社名を入力してください'),
  description: z.string().min(10, '会社概要は10文字以上で入力してください')
});

type LoginFormData = z.infer<typeof loginSchema>;
type JobSeekerRegisterFormData = z.infer<typeof jobSeekerRegisterSchema>;
type CompanyRegisterFormData = z.infer<typeof companyRegisterSchema>;

export function LoginForm({ defaultUserType = 'job_seeker' }: { defaultUserType?: 'job_seeker' | 'company' | 'admin' }) {
  const { login, registerJobSeeker, registerCompany } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const recaptchaRenderRef = useRef<() => void>(() => {});
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userType: defaultUserType
    }
  });

  const jobSeekerRegisterForm = useForm<JobSeekerRegisterFormData>({
    resolver: zodResolver(jobSeekerRegisterSchema)
  });

  const companyRegisterForm = useForm<CompanyRegisterFormData>({
    resolver: zodResolver(companyRegisterSchema)
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
      console.log('ログイン処理開始:', { email: data.email, userType: data.userType });

      let recaptchaV2Response = '';
      if (data.userType !== 'admin' && typeof window !== 'undefined' && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        try {
          if (!isRecaptchaReady) {
            throw new Error('reCAPTCHA is not ready yet');
          }
          recaptchaV2Response =
            widgetIdRef.current !== null
              ? window.grecaptcha.getResponse?.(widgetIdRef.current) || ''
              : window.grecaptcha.getResponse();
        } catch (error) {
          console.warn('reCAPTCHA v2レスポンス取得に失敗しました', error);
          toast.error('reCAPTCHAの初期化中です。数秒後に再度お試しください。');
          return;
        }
        if (!recaptchaV2Response) {
          toast.error('reCAPTCHAを完了してください');
          return;
        }
      }

      const success = await login(
        data.email,
        data.password,
        data.userType,
        undefined,
        data.userType !== 'admin' ? recaptchaV2Response : undefined
      );
      console.log('ログイン結果:', success);
      
      if (success) {
        console.log('ログイン成功、リダイレクト開始');
        if (data.userType === 'company') {
          console.log('企業ダッシュボードにリダイレクト');
          navigate('/employer/dashboard');
        } else if (data.userType === 'admin') {
          console.log('管理者ダッシュボードにリダイレクト');
          navigate('/admin');
        } else {
          console.log('求職者マイページにリダイレクト');
          navigate('/jobseeker/my-page');
        }
      } else {
        console.log('ログイン失敗');
      }
    } catch (error) {
      console.error('ログイン処理エラー:', error);
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

  const onJobSeekerRegisterSubmit = async (data: JobSeekerRegisterFormData) => {
    setIsLoading(true);
    try {
      const success = await registerJobSeeker(data.email, data.firstName, data.lastName);
      if (success) {
        // 登録成功時は求職者ログインページに遷移
        navigate('/jobseeker');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onCompanyRegisterSubmit = async (data: CompanyRegisterFormData) => {
    setIsLoading(true);
    try {
      const success = await registerCompany(data.email, data.companyName, data.description);
      if (success) {
        // 登録成功時は企業ログインページに遷移
        navigate('/employer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Whoami Job Matching
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            求職者と企業をつなぐマッチングプラットフォーム
          </p>
        </div>

        <Tabs defaultValue={defaultUserType === 'admin' ? 'login' : 'login'} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="jobseeker">求職者登録</TabsTrigger>
            <TabsTrigger value="company">企業登録</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>ログイン</CardTitle>
                <CardDescription>
                  アカウントにログインしてください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">メールアドレス</Label>
                    <Input
                      id="login-email"
                      type="email"
                      {...loginForm.register('email')}
                      placeholder="example@email.com"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">パスワード</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register('password')}
                      placeholder="パスワードを入力"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-userType">ユーザータイプ</Label>
                    <Select value={loginForm.watch('userType')} onValueChange={(value) => loginForm.setValue('userType', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="ユーザータイプを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job_seeker">求職者</SelectItem>
                        <SelectItem value="company">企業</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                      </SelectContent>
                    </Select>
                    {loginForm.formState.errors.userType && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.userType.message}</p>
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
                    disabled={isLoading || (!isRecaptchaReady && loginForm.watch('userType') !== 'admin')}
                    onMouseEnter={() => recaptchaRenderRef.current()}
                    onFocus={() => recaptchaRenderRef.current()}
                    onClick={() => recaptchaRenderRef.current()}
                  >
                    {isLoading ? 'ログイン中...' : 'ログイン'}
                  </Button>

                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-600">
                      パスワードを忘れた方は
                    </div>
                    <div className="flex justify-center space-x-4">
                      <Link 
                        to="/jobseeker/forgot-password" 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        求職者パスワードリセット
                      </Link>
                      <Link 
                        to="/employer/forgot-password" 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        企業パスワードリセット
                      </Link>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobseeker">
            <Card>
              <CardHeader>
                <CardTitle>求職者登録</CardTitle>
                <CardDescription>
                  求職者として新規登録します。登録後、パスワードがメールで送信されます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={jobSeekerRegisterForm.handleSubmit(onJobSeekerRegisterSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobseeker-email">メールアドレス</Label>
                    <Input
                      id="jobseeker-email"
                      type="email"
                      {...jobSeekerRegisterForm.register('email')}
                      placeholder="example@email.com"
                    />
                    {jobSeekerRegisterForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{jobSeekerRegisterForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobseeker-lastName">姓</Label>
                    <Input
                      id="jobseeker-lastName"
                      type="text"
                      {...jobSeekerRegisterForm.register('lastName')}
                      placeholder="山田"
                    />
                    {jobSeekerRegisterForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{jobSeekerRegisterForm.formState.errors.lastName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobseeker-firstName">名</Label>
                    <Input
                      id="jobseeker-firstName"
                      type="text"
                      {...jobSeekerRegisterForm.register('firstName')}
                      placeholder="太郎"
                    />
                    {jobSeekerRegisterForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">{jobSeekerRegisterForm.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '登録中...' : '求職者として登録'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>企業登録</CardTitle>
                <CardDescription>
                  企業として新規登録します。審査後に担当者から連絡いたします。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={companyRegisterForm.handleSubmit(onCompanyRegisterSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-email">メールアドレス</Label>
                    <Input
                      id="company-email"
                      type="email"
                      {...companyRegisterForm.register('email')}
                      placeholder="hr@company.com"
                    />
                    {companyRegisterForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{companyRegisterForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-name">会社名</Label>
                    <Input
                      id="company-name"
                      type="text"
                      {...companyRegisterForm.register('companyName')}
                      placeholder="株式会社サンプル"
                    />
                    {companyRegisterForm.formState.errors.companyName && (
                      <p className="text-sm text-red-500">{companyRegisterForm.formState.errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-description">会社概要</Label>
                    <Textarea
                      id="company-description"
                      {...companyRegisterForm.register('description')}
                      placeholder="会社の事業内容、規模、特徴などを記載してください"
                      rows={4}
                    />
                    {companyRegisterForm.formState.errors.description && (
                      <p className="text-sm text-red-500">{companyRegisterForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '登録中...' : '企業として登録申請'}
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