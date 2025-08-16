import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, ArrowLeft, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

const passwordResetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  userType: z.enum(['job_seeker', 'company'])
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export function PasswordResetForm() {
  const { resetPassword } = useAuth();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      userType: 'job_seeker'
    }
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true);
    try {
      const success = await resetPassword(data.email, data.userType, language);
      if (success) {
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              パスワード再発行完了
            </CardTitle>
            <CardDescription>
              新しいパスワードをメールで送信しました
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              メールをご確認いただき、新しいパスワードでログインしてください。
            </p>
            <div className="space-y-2">
              <Link to="/jobseeker">
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  求職者ログインに戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            パスワード再発行
          </CardTitle>
          <CardDescription>
            登録済みのメールアドレスを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType">アカウント種別</Label>
              <Select 
                value={form.watch('userType')} 
                onValueChange={(value: 'job_seeker' | 'company') => form.setValue('userType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="アカウント種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_seeker">求職者</SelectItem>
                  <SelectItem value="company">企業</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.userType && (
                <p className="text-sm text-red-500">{form.formState.errors.userType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="example@email.com"
                  className="pl-10"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '送信中...' : 'パスワード再発行'}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <Link to="/jobseeker">
              <Button className="w-full" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                求職者ログインに戻る
              </Button>
            </Link>
            <Link to="/employer">
              <Button className="w-full" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                企業ログインに戻る
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">
              注意事項:
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 新しいパスワードがメールで送信されます</li>
              <li>• メールが届かない場合は迷惑メールフォルダをご確認ください</li>
              <li>• セキュリティのため、ログイン後はパスワードの変更をお勧めします</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 