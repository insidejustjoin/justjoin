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
import { User, Mail, Lock, UserPlus, ArrowLeft, Briefcase, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function JobSeekerLogin() {
  const { login, registerJobSeeker } = useAuth();
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
  };

  // 動的バリデーションメッセージ
  const loginSchemaWithTranslation = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    password: z.string().min(6, t('auth.validation.passwordMin'))
  });

  const registerSchemaWithTranslation = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    firstName: z.string().min(1, t('auth.validation.firstNameRequired')),
    lastName: z.string().min(1, t('auth.validation.lastNameRequired'))
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchemaWithTranslation)
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchemaWithTranslation)
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password, 'job_seeker');
      if (success) {
        navigate('/jobseeker/my-page');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const success = await registerJobSeeker(data.email, data.firstName, data.lastName, language);
      if (success) {
        toast.success(t('auth.registerSuccess') || '求職者として登録しました。パスワードがメールで送信されます。');
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
    <>
      <Helmet>
        <title>registration form for job seeker</title>
        <meta name="description" content="registration form for job seeker" />
        <meta name="keywords" content="registration form for job seeker" />
        <meta property="og:title" content="registration form for job seeker" />
        <meta property="og:description" content="registration form for job seeker" />
        <meta name="twitter:title" content="registration form for job seeker" />
        <meta name="twitter:description" content="registration form for job seeker" />
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

            <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setCurrentTab(value as 'login' | 'register')}>
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

                      <Button type="submit" className="w-full" disabled={isLoading}>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-lastName">
                            {t('auth.lastName')}
                          </Label>
                          <Input
                            id="register-lastName"
                            {...registerForm.register('lastName')}
                            placeholder={t('auth.lastNamePlaceholder')}
                          />
                          {registerForm.formState.errors.lastName && (
                            <p className="text-sm text-red-500">{registerForm.formState.errors.lastName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-firstName">
                            {t('auth.firstName')}
                          </Label>
                          <Input
                            id="register-firstName"
                            {...registerForm.register('firstName')}
                            placeholder={t('auth.firstNamePlaceholder')}
                          />
                          {registerForm.formState.errors.firstName && (
                            <p className="text-sm text-red-500">{registerForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? t('auth.registering') : t('auth.registerButton')}
                      </Button>
                    </form>
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