import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

// 翻訳を使用したスキーマを動的に生成する関数
const createCodeSchema = (t: (key: string) => string) => z.object({
  code: z.string().regex(/^\d{6}$/, t('register.codeVerification.validation.code'))
});

type CodeFormData = z.infer<typeof codeSchema>;

interface EmailVerificationCodeFormProps {
  email: string;
  firstName: string;
  lastName: string;
  onResend?: () => void;
}

export const EmailVerificationCodeForm: React.FC<EmailVerificationCodeFormProps> = ({ 
  email, 
  firstName, 
  lastName,
  onResend 
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  type CodeFormData = z.infer<ReturnType<typeof createCodeSchema>>;
  const form = useForm<CodeFormData>({
    resolver: zodResolver(createCodeSchema(t))
  });

  const onSubmit = async (data: CodeFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email-verification/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          code: data.code.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message || t('register.codeVerification.success') });
        // 確認成功後、エンジニア/一般職の登録可能性をチェックしてから選択画面へ遷移
        try {
          const checkResponse = await fetch(`/api/email-verification/check-registration/${encodeURIComponent(result.email || email)}`);
          const checkData = await checkResponse.json();
          
          if (checkData.success) {
            setTimeout(() => {
              navigate('/jobseeker/register/type', {
                state: {
                  email: result.email || email,
                  firstName: result.firstName || firstName,
                  lastName: result.lastName || lastName,
                  emailVerified: true,
                  availability: {
                    canRegisterEngineer: checkData.canRegisterEngineer !== false,
                    canRegisterGeneral: checkData.canRegisterGeneral !== false,
                    existingRegistrationTypes: checkData.existingRegistrationTypes || [],
                    userExists: checkData.userExists || false
                  }
                }
              });
            }, 1000);
          } else {
            setMessage({ type: 'error', text: checkData.message || t('register.codeVerification.checkFailed') });
          }
        } catch (checkError) {
          console.error('登録可能性チェックエラー:', checkError);
          // チェックエラーでも遷移は許可（デフォルトで両方登録可能として扱う）
          setTimeout(() => {
            navigate('/jobseeker/register/type', {
              state: {
                email: result.email || email,
                firstName: result.firstName || firstName,
                lastName: result.lastName || lastName,
                emailVerified: true,
                availability: {
                  canRegisterEngineer: true,
                  canRegisterGeneral: true,
                  existingRegistrationTypes: [],
                  userExists: false
                }
              }
            });
          }, 1000);
        }
      } else {
        setMessage({ type: 'error', text: result.message || t('register.codeVerification.invalidCode') });
      }
    } catch (error) {
      console.error('確認コード検証エラー:', error);
      setMessage({
        type: 'error',
        text: t('register.codeVerification.verificationError')
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-end mb-2">
          <LanguageToggle />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          {t('register.codeVerification.title')}
        </CardTitle>
        <CardDescription>
          {t('register.codeVerification.description', { email })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              {t('register.codeVerification.code')} *
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              {...form.register('code')}
              placeholder={t('register.codeVerification.codePlaceholder')}
              className="text-center text-2xl tracking-widest font-mono"
              required
              disabled={isLoading}
              onChange={(e) => {
                // 数字のみを許可
                const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                form.setValue('code', value, { shouldValidate: true });
              }}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
            <p className="text-xs text-gray-500 text-center">
              {t('register.codeVerification.note')}
            </p>
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
            size="lg"
          >
            {isLoading ? t('register.codeVerification.verifying') : (
              <>
                {t('register.codeVerification.submitButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {onResend && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onResend}
              disabled={isLoading}
            >
              {t('register.codeVerification.resendButton')}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
