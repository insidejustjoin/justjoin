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

const emailVerificationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  firstName: z.string().min(1, '名を入力してください'),
  lastName: z.string().min(1, '姓を入力してください')
});

type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;

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
        setMessage({ type: 'error', text: result.message || 'エラーが発生しました' });
      }
    } catch (error) {
      console.error('メール本人確認エラー:', error);
      setMessage({
        type: 'error',
        text: 'メール送信中にエラーが発生しました。しばらく時間をおいて再度お試しください。'
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          メールアドレス確認
        </CardTitle>
        <CardDescription>
          メールアドレスとお名前を入力してください。確認メールを送信します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline-block h-4 w-4 mr-2" />
              メールアドレス / Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="example@email.com"
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
              名 / First Name *
            </Label>
            <Input
              id="firstName"
              type="text"
              {...form.register('firstName')}
              placeholder="太郎"
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
              姓 / Last Name *
            </Label>
            <Input
              id="lastName"
              type="text"
              {...form.register('lastName')}
              placeholder="田中"
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
            {isLoading ? '送信中...' : '確認メールを送信'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            ※ 確認メールは5分間有効です
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
