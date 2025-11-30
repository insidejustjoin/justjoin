import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, UserPlus, Key, Trash2, Mail, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUser {
  id: string;
  email: string;
  user_type: 'admin';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface CreateAdminData {
  email: string;
  password?: string;
}

const AdminSettingsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminData>({
    email: '',
    password: ''
  });
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // 管理者一覧を取得
  const fetchAdmins = async () => {
    try {
      // モック処理：APIが実装されるまでモックデータを使用
      const data = {
        success: true,
        admins: [
          {
            id: '1',
            email: 'admin@example.com',
            user_type: 'admin' as const,
            status: 'active' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };
              if (data.success) {
        setAdmins(data.admins || []);
      } else {
        toast({
          title: "エラー",
          description: "管理者一覧の取得に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('管理者一覧取得エラー:', error);
      toast({
        title: "エラー",
        description: "管理者一覧の取得中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 新規管理者作成
  const handleCreateAdmin = async () => {
    if (!createForm.email.trim()) {
      toast({
        title: "エラー",
        description: "メールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/match-job/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "成功",
          description: `管理者 ${createForm.email} を作成しました。パスワード: ${data.password}`,
        });
        setCreateDialogOpen(false);
        setCreateForm({ email: '', password: '' });
        fetchAdmins(); // 一覧を更新
      } else {
        toast({
          title: "エラー",
          description: data.message || "管理者の作成に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('管理者作成エラー:', error);
      toast({
        title: "エラー",
        description: "管理者作成中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // 管理者パスワードリセット
  const handleResetPassword = async (adminId: string, email: string) => {
    setIsResetting(adminId);
    try {
      const response = await fetch(`/match-job/api/admins/${adminId}/reset-password`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResetResult({ email, password: data.password });
        toast({
          title: "成功",
          description: `${email} のパスワードをリセットしました`,
        });
      } else {
        toast({
          title: "エラー",
          description: data.message || "パスワードリセットに失敗しました",
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
      setIsResetting(null);
    }
  };

  // 管理者削除
  const handleDeleteAdmin = async (adminId: string, email: string) => {
    // 自分自身は削除できない
    if (user?.email === email) {
      toast({
        title: "エラー",
        description: "自分自身のアカウントは削除できません",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(adminId);
    try {
      const response = await fetch(`/match-job/api/admins/${adminId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "成功",
          description: `管理者 ${email} を削除しました`,
        });
        fetchAdmins(); // 一覧を更新
      } else {
        toast({
          title: "エラー",
          description: data.message || "管理者の削除に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('管理者削除エラー:', error);
      toast({
        title: "エラー",
        description: "管理者削除中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            管理者設定
          </h1>
          <p className="text-muted-foreground mt-1">
            管理者アカウントの追加、更新、削除を行います
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              管理者を追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規管理者を追加</DialogTitle>
              <DialogDescription>
                新しい管理者アカウントを作成します。パスワードは自動生成され、メールで送信されます。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">パスワード（オプション）</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="空欄の場合は自動生成されます"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateAdmin} disabled={isCreating}>
                {isCreating ? '作成中...' : '作成'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理者一覧</CardTitle>
          <CardDescription>
            現在登録されている管理者アカウントの一覧です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">管理者が登録されていません</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead>更新日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {admin.email}
                        {user?.email === admin.email && (
                          <Badge variant="secondary" className="text-xs">現在のユーザー</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.status === 'active' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              アクティブ
                            </Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <Badge variant="destructive">
                              無効
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(admin.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(admin.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(admin.id, admin.email)}
                          disabled={isResetting === admin.id}
                        >
                          {isResetting === admin.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          ) : (
                            <Key className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {user?.email !== admin.email && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting === admin.id}
                              >
                                {isDeleting === admin.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>管理者を削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  管理者 {admin.email} を削除しますか？この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* パスワードリセット結果表示 */}
      {resetResult && (
        <Dialog open={!!resetResult} onOpenChange={() => setResetResult(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>パスワードリセット完了</DialogTitle>
              <DialogDescription>
                新しいパスワードが生成されました。このパスワードを安全に保管してください。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>メールアドレス</Label>
                <p className="text-sm text-gray-600">{resetResult.email}</p>
              </div>
              <div>
                <Label>新しいパスワード</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={resetResult.password}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(resetResult.password);
                      toast({
                        title: "コピー完了",
                        description: "パスワードをクリップボードにコピーしました",
                      });
                    }}
                  >
                    コピー
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setResetResult(null)}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 注意事項 */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            注意事項
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <ul className="space-y-2 text-sm">
            <li>• 管理者アカウントの削除は取り消せません</li>
            <li>• 自分自身のアカウントは削除できません</li>
            <li>• パスワードリセット後は新しいパスワードがメールで送信されます</li>
            <li>• 管理者アカウントはシステム全体にアクセスできます</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage; 