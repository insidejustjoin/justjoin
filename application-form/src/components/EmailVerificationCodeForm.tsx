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

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '6桁の数字を入力してください')
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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema)
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
        setMessage({ type: 'success', text: result.message || 'メールアドレスが確認されました' });
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
            setMessage({ type: 'error', text: checkData.message || '登録可能性の確認に失敗しました' });
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
        setMessage({ type: 'error', text: result.message || '確認コードが正しくありません' });
      }
    } catch (error) {
      console.error('確認コード検証エラー:', error);
      setMessage({
        type: 'error',
        text: '確認コードの検証中にエラーが発生しました。再度お試しください。'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          確認コードを入力
        </CardTitle>
        <CardDescription>
          {email} に送信された6桁の確認コードを入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              確認コード / Verification Code *
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              {...form.register('code')}
              placeholder="123456"
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
              ※ このコードは2分間有効です
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
            {isLoading ? '確認中...' : (
              <>
                確認して次へ進む
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
              コードを再送信
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
