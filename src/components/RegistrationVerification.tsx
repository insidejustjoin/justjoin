import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import DocumentGenerator from './DocumentGenerator';

interface RegistrationData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
}

export const RegistrationVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'verifying' | 'documents' | 'password' | 'completed'>('verifying');

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/register/verify/${token}`);
      const data = await response.json();

      if (data.success) {
        setRegistrationData(data.data);
        setStep('documents');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('トークンの確認中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentsComplete = async (documentsData: any) => {
    try {
      const response = await fetch(`/api/register/documents/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentsData),
      });

      const data = await response.json();

      if (data.success) {
        setStep('password');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('書類データの保存中にエラーが発生しました。');
    }
  };

  const handlePasswordComplete = async (password: string) => {
    try {
      const response = await fetch(`/api/register/complete/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('completed');
        // 3秒後にマイページにリダイレクト
        setTimeout(() => {
          navigate('/jobseeker/my-page');
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('パスワード設定中にエラーが発生しました。');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">トークンを確認中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button 
                onClick={() => navigate('/register')} 
                variant="outline"
                className="w-full"
              >
                登録ページに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">登録完了</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                登録が完了しました！マイページにリダイレクトします...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <PasswordSettingForm 
        onComplete={handlePasswordComplete}
        registrationData={registrationData!}
      />
    );
  }

  if (step === 'documents' && registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">書類入力</CardTitle>
              <CardDescription>
                {registrationData.lastName} {registrationData.firstName} 様、必要な情報を入力してください。
              </CardDescription>
            </CardHeader>
          </Card>
          
          <DocumentGenerator
            isRegistrationMode={true}
            onDocumentsComplete={handleDocumentsComplete}
            prefillData={{
              resume: {
                basicInfo: {
                  firstName: registrationData.firstName,
                  lastName: registrationData.lastName,
                  email: registrationData.email,
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};

interface PasswordSettingFormProps {
  onComplete: (password: string) => void;
  registrationData: RegistrationData;
}

const PasswordSettingForm: React.FC<PasswordSettingFormProps> = ({ onComplete, registrationData }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    setIsLoading(true);
    setErrors([]);
    
    try {
      await onComplete(password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">パスワード設定</CardTitle>
          <CardDescription>
            最後にパスワードを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                パスワード *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8文字以上、英数字混合"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                パスワード確認 *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを再入力"
                required
                disabled={isLoading}
              />
            </div>

            {errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                {errors.map((error, index) => (
                  <AlertDescription key={index} className="text-red-800">
                    {error}
                  </AlertDescription>
                ))}
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                '登録を完了する'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>※ パスワードは8文字以上、英数字混合で入力してください</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 