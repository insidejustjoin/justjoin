import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'auth.currentPasswordRequired'),
  newPassword: z.string().min(6, 'auth.newPasswordMin'),
  confirmPassword: z.string().min(1, 'auth.confirmPasswordRequired')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'auth.passwordMismatch',
  path: ['confirmPassword']
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema)
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          language: language,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('auth.passwordChangeSuccess'),
          description: t('auth.passwordChangeSuccessDescription'),
        });
        form.reset();
        setIsSuccess(true);
        // 3秒後に成功状態をリセット
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        toast({
          title: t('auth.passwordChangeError'),
          description: result.message || 'パスワードの変更に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: t('auth.passwordChangeError'),
        description: 'パスワードの変更に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 成功メッセージ */}
      {isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                {t('auth.passwordChangeSuccess')}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {t('auth.passwordChangeSuccessDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-4 ${isSuccess ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {t('auth.currentPassword')}
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            {...form.register('currentPassword')}
            placeholder={t('auth.currentPasswordPlaceholder')}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.currentPassword && (
          <p className="text-sm text-red-500">{t(form.formState.errors.currentPassword.message || '')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {t('auth.newPassword')}
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            {...form.register('newPassword')}
            placeholder={t('auth.newPasswordPlaceholder')}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.newPassword && (
          <p className="text-sm text-red-500">{t(form.formState.errors.newPassword.message || '')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {t('auth.confirmPassword')}
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...form.register('confirmPassword')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">{t(form.formState.errors.confirmPassword.message || '')}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('auth.changing') : t('auth.changePassword')}
      </Button>
    </form>

      {/* 再度変更するボタン */}
      {isSuccess && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsSuccess(false);
              form.reset();
            }}
            className="mt-4"
          >
            {t('auth.changePasswordAgain')}
          </Button>
        </div>
      )}
    </div>
  );
} 