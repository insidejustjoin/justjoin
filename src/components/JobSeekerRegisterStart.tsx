import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface JobSeekerRegisterStartProps {
  onExistingUser?: () => void;
}

export const JobSeekerRegisterStart: React.FC<JobSeekerRegisterStartProps> = ({ onExistingUser }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage(null);

    // 電話番号の形式を検証
    const phonePattern = /^\+[0-9]{7,15}$/;
    if (!phonePattern.test(phoneNumber.trim())) {
      setMessage({
        type: 'error',
        text: '電話番号は+から始まる国際形式で入力してください（例: +81312345678, +998901234567）'
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const availability = {
          canRegisterEngineer: data.canRegisterEngineer !== false,
          canRegisterGeneral: data.canRegisterGeneral !== false,
          existingRegistrationTypes: Array.isArray(data.existingRegistrationTypes) ? data.existingRegistrationTypes : [],
          userExists: !!data.userExists
        };

        if (!availability.canRegisterEngineer && !availability.canRegisterGeneral) {
          setMessage({
            type: 'error',
            text: 'この電話番号ではエンジニア・一般職の両方が登録済みです。ログインページへ移動してください。'
          });
          if (onExistingUser) {
            onExistingUser();
          }
          setTimeout(() => {
            navigate('/jobseeker/login');
          }, 2500);
          return;
        }

        navigate('/jobseeker/register/type', {
          state: { phoneNumber: phoneNumber.trim(), firstName, lastName, availability }
        });
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
          電話番号とお名前を入力してください / Please enter your phone number and name
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              <Mail className="inline-block h-4 w-4 mr-2" />
              電話番号 / Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+81312345678 または +998901234567"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              +から始まる国際形式で入力してください（例: +81312345678, +998901234567）
            </p>
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

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
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

