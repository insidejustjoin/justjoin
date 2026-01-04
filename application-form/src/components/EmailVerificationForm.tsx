import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { EmailVerificationCodeForm } from './EmailVerificationCodeForm';

// HubSpot型定義
declare global {
  interface Window {
    hsConversationsAPI?: {
      addUserProperties: (properties: {
        email: string;
        firstName: string;
        lastName: string;
        fullName?: string;
      }) => void;
    };
    HubSpotConversations?: {
      widget: {
        load: (options: {
          email: string;
          firstName: string;
          lastName: string;
        }) => void;
      };
    };
  }
}

// EmailVerificationFormData の型定義
type EmailVerificationFormData = {
  email: string;
  firstName: string;
  lastName: string;
};

interface EmailVerificationFormProps {
  onSuccess?: () => void;
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');

  // 翻訳を使用したスキーマを動的に生成
  const emailVerificationSchema = z.object({
    email: z.string().email(t('register.emailVerification.validation.email')),
    firstName: z.string().min(1, t('register.emailVerification.validation.firstName')),
    lastName: z.string().min(1, t('register.emailVerification.validation.lastName'))
  });

  const form = useForm<EmailVerificationFormData>({
    resolver: zodResolver(emailVerificationSchema)
  });

  const onSubmit = async (data: EmailVerificationFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // まず30分以内に確認済みのレコードがあるかチェック
      const checkResponse = await fetch(`/api/email-verification/check/${encodeURIComponent(data.email.trim())}`);
      const checkResult = await checkResponse.json();
      
      if (checkResult.success && checkResult.isWithin30Minutes) {
        // 30分以内に確認済みの場合は、直接書類作成ページに遷移
        const checkRegResponse = await fetch(`/api/email-verification/check-registration/${encodeURIComponent(data.email.trim())}`);
        const checkRegData = await checkRegResponse.json();
        
        if (checkRegData.success) {
          // 登録タイプ選択画面に遷移
          navigate('/jobseeker/register/type', {
            state: {
              email: data.email.trim(),
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              emailVerified: true,
              availability: {
                canRegisterEngineer: checkRegData.canRegisterEngineer !== false,
                canRegisterGeneral: checkRegData.canRegisterGeneral !== false,
                existingRegistrationTypes: checkRegData.existingRegistrationTypes || [],
                userExists: checkRegData.userExists || false
              }
            }
          });
          return;
        }
      }

      // HubSpotにデータを送信
      if (window.hsConversationsAPI) {
        try {
          window.hsConversationsAPI.addUserProperties({
            email: data.email.trim(),
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            fullName: `${data.lastName.trim()} ${data.firstName.trim()}`,
          });
        } catch (hubspotError) {
          console.warn('HubSpotデータ送信エラー:', hubspotError);
        }
      } else if ((window as any).HubSpotConversations) {
        try {
          (window as any).HubSpotConversations.widget.load({
            email: data.email.trim(),
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
          });
        } catch (hubspotError) {
          console.warn('HubSpotデータ送信エラー:', hubspotError);
        }
      }

      const response = await fetch('/api/email-verification/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setEmailSent(true);
        setUserEmail(data.email.trim());
        setUserFirstName(data.firstName.trim());
        setUserLastName(data.lastName.trim());
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({ type: 'error', text: result.message || t('register.emailVerification.error') });
      }
    } catch (error) {
      console.error('メール本人確認エラー:', error);
      setMessage({
        type: 'error',
        text: t('register.emailVerification.sendError')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setEmailSent(false);
    setMessage(null);
    form.reset();
  };

  if (emailSent) {
    return (
      <EmailVerificationCodeForm
        email={userEmail}
        firstName={userFirstName}
        lastName={userLastName}
        onResend={handleResendCode}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-end mb-2">
          <LanguageToggle />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          {t('register.emailVerification.title')}
        </CardTitle>
        <CardDescription>
          {t('register.emailVerification.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Googleサインインボタン */}
        <div className="space-y-4">
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
                  setMessage({
                    type: 'error',
                    text: 'Google認証の開始に失敗しました'
                  });
                }
              } catch (error) {
                console.error('Google認証エラー:', error);
                setMessage({
                  type: 'error',
                  text: 'Google認証の開始に失敗しました'
                });
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
            {t('register.emailVerification.googleSignIn')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">{t('auth.or')}</span>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline-block h-4 w-4 mr-2" />
              {t('register.emailVerification.email')} *
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder={t('register.emailVerification.emailPlaceholder')}
              required
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">
              <User className="inline-block h-4 w-4 mr-2" />
              {t('register.emailVerification.firstName')} *
            </Label>
            <Input
              id="firstName"
              type="text"
              {...form.register('firstName')}
              placeholder={t('register.emailVerification.firstNamePlaceholder')}
              required
              disabled={isLoading}
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              <User className="inline-block h-4 w-4 mr-2" />
              {t('register.emailVerification.lastName')} *
            </Label>
            <Input
              id="lastName"
              type="text"
              {...form.register('lastName')}
              placeholder={t('register.emailVerification.lastNamePlaceholder')}
              required
              disabled={isLoading}
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
            )}
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('register.emailVerification.sending') : t('register.emailVerification.sendButton')}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            {t('register.emailVerification.note')}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
