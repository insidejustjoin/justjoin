import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DocumentGenerator from '@/components/DocumentGenerator';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const JobSeekerRegisterGeneral: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documentsData, setDocumentsData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { email, firstName, lastName } = (location.state as { email?: string; firstName?: string; lastName?: string }) || {};

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
      const response = await fetch('/api/register/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          password,
          documentsData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 登録成功後、自動ログイン
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          navigate('/jobseeker/my-page');
        } else {
          navigate('/jobseeker/login');
        }
      } else {
        setErrors([data.message || '登録に失敗しました']);
      }
    } catch (error) {
      console.error('登録エラー:', error);
      setErrors(['ネットワークエラーが発生しました']);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8文字以上、英数字混合"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      パスワード確認 / Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="パスワードを再入力"
                      required
                      disabled={isSubmitting}
                    />
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
                    {isSubmitting ? '登録中...' : '登録を完了する'}
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
        <title>一般職向け登録 - JustJoin</title>
        <meta name="description" content="一般職・事務職向けの新規登録フォーム" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/jobseeker/register/type', { state: { email, firstName, lastName } })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">一般職向け登録 / General Registration</CardTitle>
              <CardDescription>
                {firstName} {lastName} 様、必要な情報を入力してください
              </CardDescription>
            </CardHeader>
          </Card>
          
          <DocumentGenerator
            isRegistrationMode={true}
            hideSkillSheet={true}
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

export default JobSeekerRegisterGeneral;

