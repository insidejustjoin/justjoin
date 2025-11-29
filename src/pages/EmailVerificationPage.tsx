import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function EmailVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState<{ email: string; firstName: string; lastName: string; token: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('確認トークンが無効です');
      return;
    }

    // メール確認検証APIを呼び出し
    fetch(`/api/email-verification/verify/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'メールアドレスが確認されました');
          setUserData({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            token: data.token
          });
        } else {
          setStatus('error');
          setMessage(data.message || 'メール確認に失敗しました');
        }
      })
      .catch((error) => {
        console.error('メール確認エラー:', error);
        setStatus('error');
        setMessage('メール確認中にエラーが発生しました');
      });
  }, [token]);

  const handleProceedToDocuments = () => {
    if (userData) {
      // 書類作成画面に遷移（エンジニアまたは一般職の選択画面へ）
      navigate('/jobseeker/register/type', {
        state: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          emailVerified: true
        }
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>メールアドレス確認 - JustJoin</title>
        <meta name="description" content="メールアドレスの本人確認を行います" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {status === 'loading' && 'メールアドレス確認中...'}
              {status === 'success' && 'メールアドレス確認完了'}
              {status === 'error' && '確認エラー'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'しばらくお待ちください'}
              {status === 'success' && 'メールアドレスが確認されました'}
              {status === 'error' && '確認に失敗しました'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            {status === 'success' && (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {message}
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600">
                  次に、エンジニアまたは一般職のいずれかのタイプを選択して、書類作成に進んでください。
                </p>
                <Button 
                  onClick={handleProceedToDocuments} 
                  className="w-full"
                  size="lg"
                >
                  書類作成に進む
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {message}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => navigate('/jobseeker/register')} 
                  variant="outline"
                  className="w-full"
                >
                  登録ページに戻る
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
