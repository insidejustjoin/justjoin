import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TemporaryRegistrationFormProps {
  onSuccess?: () => void;
}

export const TemporaryRegistrationForm: React.FC<TemporaryRegistrationFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/register/temporary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setEmail('');
        setFirstName('');
        setLastName('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '仮登録中にエラーが発生しました。しばらく時間をおいて再度お試しください。' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('temporaryRegistration.title', '仮登録')}
        </CardTitle>
        <CardDescription>
          {t('temporaryRegistration.description', 'メールアドレスとお名前を入力して仮登録を開始してください')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {t('temporaryRegistration.email', 'メールアドレス')} *
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
              {t('temporaryRegistration.firstName', '名')} *
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
              {t('temporaryRegistration.lastName', '姓')} *
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="田中"
              required
              disabled={isLoading}
            />
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertDescription className="text-red-800">
                  {message.text}
                </AlertDescription>
              )}
              {message.type === 'success' && (
                <AlertDescription className="text-green-800">
                  {message.text}
                </AlertDescription>
              )}
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email || !firstName || !lastName}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('temporaryRegistration.submitting', '送信中...')}
              </>
            ) : (
              t('temporaryRegistration.submit', '仮登録を開始')
            )}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              {t('temporaryRegistration.note', '※ 仮登録後、確認メールが送信されます')}
            </p>
            <p>
              {t('temporaryRegistration.expiry', '※ メール内のリンクは30分間有効です')}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 