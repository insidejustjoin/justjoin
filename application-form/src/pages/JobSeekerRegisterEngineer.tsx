import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DocumentGenerator from '@/components/DocumentGenerator';
import { ArrowLeft, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      getResponse?: (widgetId?: number) => string;
      render?: (container: any, parameters: any) => any;
      reset?: (widgetId?: number) => void;
    };
  }
}

const JobSeekerRegisterEngineer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documentsData, setDocumentsData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  
  const {
    email,
    firstName,
    lastName,
    availability
  } =
    (location.state as {
      email?: string;
      firstName?: string;
      lastName?: string;
      availability?: {
        canRegisterEngineer?: boolean;
        canRegisterGeneral?: boolean;
        existingRegistrationTypes?: string[];
        userExists?: boolean;
      };
    }) || {};

  if (!email || !firstName || !lastName) {
    navigate('/jobseeker/register');
    return null;
  }

  const handleDocumentsComplete = (data: any) => {
    setDocumentsData(data);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('パスワードは8文字以上で入力してください。');
    }
    
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      errors.push('パスワードは英数字混合で入力してください。');
    }
    
    return errors;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    if (password !== confirmPassword) {
      setErrors(['パスワードが一致しません。']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // v2チェックボックス運用のため、v3実行は行わない
      const recaptchaToken: string | undefined = undefined;

      const response = await fetch('/api/register/engineer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          password,
          documentsData: documentsData,
          recaptchaToken
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('登録APIエラー詳細:', data);
      }
      
      if (data.success) {
        // 登録成功を通知
        toast.success('登録が完了しました！', {
          description: 'マイページに移動します',
          duration: 3000,
        });
        
        // 登録成功後、自動ログイン
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          // 少し待ってからリダイレクト（ユーザーに成功メッセージを見せるため）
          setTimeout(() => {
            navigate('/jobseeker/my-page');
          }, 1500);
        } else {
          setTimeout(() => {
            navigate('/jobseeker/login');
          }, 1500);
        }
      } else {
        setErrors([data.message || '登録に失敗しました', data.detail].filter(Boolean) as string[]);
      }
    } catch (error) {
      console.error('登録エラー:', error);
      setErrors(['ネットワークエラーが発生しました']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // パスワード設定画面に遷移した時にスクロール
  useEffect(() => {
    if (documentsData) {
      // 少し遅延させてスクロール（DOMが完全に描画された後）
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [documentsData]);

  if (documentsData) {
    // パスワード入力ステップ
    return (
      <>
        <Helmet>
          <title>パスワード設定 - JustJoin</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-md mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">パスワード設定 / Password Setting</CardTitle>
                <CardDescription>
                  ログイン用のパスワードを設定してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      <Lock className="inline-block h-4 w-4 mr-2" />
                      パスワード / Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8文字以上、英数字混合"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      パスワード確認 / Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="パスワードを再入力"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? '確認パスワードを隠す' : '確認パスワードを表示'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errors.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting || !password || !confirmPassword}>
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        登録処理中...
                      </>
                    ) : (
                      <>
                        登録を完了する
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>エンジニア向け登録 - JustJoin</title>
        <meta name="description" content="エンジニア・開発者向けの新規登録フォーム" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() =>
                navigate('/jobseeker/register/type', {
                  state: { email, firstName, lastName, availability }
                })
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">エンジニア向け登録 / Engineer Registration</CardTitle>
              <CardDescription>
                {firstName} {lastName} 様、必要な情報を入力してください
              </CardDescription>
            </CardHeader>
          </Card>
          
          <DocumentGenerator
            isRegistrationMode={true}
            hideSkillSheet={false}
          registrationType="engineer"
            onDocumentsComplete={handleDocumentsComplete}
            prefillData={{
              firstName,
              lastName,
              liveMail: email,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default JobSeekerRegisterEngineer;

