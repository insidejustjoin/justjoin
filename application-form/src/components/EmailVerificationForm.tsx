import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          {t('register.emailVerification.title')}
        </CardTitle>
        <CardDescription>
          {t('register.emailVerification.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
