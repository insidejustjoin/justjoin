import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Key, Mail, Shield } from 'lucide-react';

const adminLoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください')
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: 'inside.justjoin@gmail.com'
    }
  });

  const onLoginSubmit = async (data: AdminLoginFormData) => {
    // 管理者アカウントは inside.justjoin@gmail.com のみ許可
    if (data.email !== 'inside.justjoin@gmail.com') {
      toast({
        title: "アクセス拒否",
        description: "管理者アカウントは inside.justjoin@gmail.com のみ許可されています",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(data.email, data.password, 'admin');
      if (success) {
        navigate('/admin/overview');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsResetting(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/admins/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.success) {
        const newPassword = result.newPassword;
        toast({
          title: "パスワードリセット完了",
          description: `新しいパスワード: ${newPassword}`,
        });
        
        setResetDialogOpen(false);
      } else {
        toast({
          title: "エラー",
          description: result.message || "パスワードリセットに失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      toast({
        title: "エラー",
        description: "パスワードリセット中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            管理者ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            システム管理画面にアクセス
          </p>
        </div>



        <Card>
          <CardHeader>
            <CardTitle>管理者認証</CardTitle>
            <CardDescription>
              管理者アカウントでログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  メールアドレス
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  value="inside.justjoin@gmail.com"
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  管理者アカウントは固定されています
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  パスワード
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  {...loginForm.register('password')}
                  placeholder="パスワードを入力"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>

              <div className="text-center">
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm">
                      パスワードを忘れた場合
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>管理者パスワードリセット</DialogTitle>
                      <DialogDescription>
                        管理者アカウントのパスワードをリセットします。新しいパスワードが生成されます。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        管理者アカウント（inside.justjoin@gmail.com）のパスワードをリセットします。
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setResetDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={handlePasswordReset}
                        disabled={isResetting}
                      >
                        {isResetting ? '送信中...' : 'パスワードリセット'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 