import React, { useState } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('ログイン処理開始:', { email: data.email, userType: data.userType });

      const result = await login(
        data.email,
        data.password,
        data.userType,
        undefined,
        undefined
      );
      console.log('ログイン結果:', result);
      
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
        console.log('ログイン成功、リダイレクト開始');
        if (data.userType === 'company') {
          console.log('企業ダッシュボードにリダイレクト');
          navigate('/employer/dashboard');
        } else if (data.userType === 'admin') {
          console.log('管理者ダッシュボードにリダイレクト');
          navigate('/admin');
        } else {
          // 求職者の場合
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
      } else {
        console.log('ログイン失敗');
      }
    } catch (error) {
      console.error('ログイン処理エラー:', error);
    } finally {
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'ログイン中...' : 'ログイン'}
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