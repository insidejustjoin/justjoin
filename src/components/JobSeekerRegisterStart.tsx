import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

interface JobSeekerRegisterStartProps {
  onExistingUser?: () => void;
}

export const JobSeekerRegisterStart: React.FC<JobSeekerRegisterStartProps> = ({ onExistingUser }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // reCAPTCHAが設定されている場合、トークンの確認
    if (siteKey && !recaptchaToken) {
      setMessage({ 
        type: 'error', 
        text: '「私はロボットではありません」のチェックボックスにチェックを入れてください。' 
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/register/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.exists) {
          // 既存ユーザーの場合
          setMessage({ 
            type: 'error', 
            text: 'このメールアドレスは既に登録されています。ログインページに移動しますか？' 
          });
          if (onExistingUser) {
            onExistingUser();
          }
          // 3秒後にログインページにリダイレクト
          setTimeout(() => {
            navigate('/jobseeker/login');
          }, 3000);
        } else {
          // 新規ユーザーの場合、登録タイプ選択ページへ
          navigate('/jobseeker/register/type', {
            state: { email, firstName, lastName }
          });
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'エラーが発生しました' });
      }
    } catch (error) {
      console.error('登録チェックエラー:', error);
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました。再度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          新規登録 / New Registration
        </CardTitle>
        <CardDescription className="text-center">
          メールアドレスとお名前を入力してください / Please enter your email and name
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline-block h-4 w-4 mr-2" />
              メールアドレス / Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">
              <User className="inline-block h-4 w-4 mr-2" />
              名 / First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="太郎"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              <User className="inline-block h-4 w-4 mr-2" />
              姓 / Last Name
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="山田"
              required
              disabled={isLoading}
            />
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                確認中 / Checking...
              </>
            ) : (
              <>
                次へ / Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* reCAPTCHA */}
        {siteKey && (
          <div className="mt-4 flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              size="normal"
              onChange={handleRecaptchaChange}
            />
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            既にアカウントをお持ちの方は{' '}
            <a href="/jobseeker/login" className="text-primary hover:underline">
              こちらからログイン
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

