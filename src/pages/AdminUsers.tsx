import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Users, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { AdminPageLayout } from '@/components/AdminPageLayout';

interface AdminUser {
  id: string;
  email: string;
  user_type: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export function AdminUsers() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  
  // フォーム状態
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin',
    status: 'active' as 'active' | 'inactive'
  });

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/admin/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAdmins(data.users);
      } else {
        setError('管理者データの取得に失敗しました');
      }
    } catch (err: any) {
      console.error('管理者データ取得エラー:', err);
      setError(err.message || '管理者データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードは必須です');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '管理者の追加に失敗しました');
      }

      const data = await response.json();
      
      if (data.success) {
        setShowAddForm(false);
        setFormData({ email: '', password: '', role: 'admin', status: 'active' });
        await fetchAdmins();
        alert('管理者が正常に追加されました');
      } else {
        setError(data.message || '管理者の追加に失敗しました');
      }
    } catch (err: any) {
      console.error('管理者追加エラー:', err);
      setError(err.message || '管理者の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/admin/users/${editingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || undefined,
          role: formData.role,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '管理者の更新に失敗しました');
      }

      const data = await response.json();
      
      if (data.success) {
        setEditingAdmin(null);
        setFormData({ email: '', password: '', role: 'admin', status: 'active' });
        await fetchAdmins();
        alert('管理者が正常に更新されました');
      } else {
        setError(data.message || '管理者の更新に失敗しました');
      }
    } catch (err: any) {
      console.error('管理者更新エラー:', err);
      setError(err.message || '管理者の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!confirm(`${email}の管理者アカウントを削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '管理者の削除に失敗しました');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchAdmins();
        alert('管理者が正常に削除されました');
      } else {
        setError(data.message || '管理者の削除に失敗しました');
      }
    } catch (err: any) {
      console.error('管理者削除エラー:', err);
      setError(err.message || '管理者の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      password: '',
      role: admin.user_type,
      status: admin.status
    });
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingAdmin(null);
    setFormData({ email: '', password: '', role: 'admin', status: 'active' });
    setError(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'スーパー管理者';
      case 'admin': return '管理者';
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'アクティブ';
      case 'inactive': return '非アクティブ';
      default: return status;
    }
  };

  return (
    <AdminPageLayout title="管理者管理">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            管理者数: {admins.length}人
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddForm(true)} 
            disabled={loading}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            管理者追加
          </Button>
          <Button 
            onClick={fetchAdmins} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 管理者追加・編集フォーム */}
      {(showAddForm || editingAdmin) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingAdmin ? '管理者編集' : '管理者追加'}
            </CardTitle>
            <CardDescription>
              {editingAdmin ? '管理者情報を編集します' : '新しい管理者を追加します'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">
                  {editingAdmin ? 'パスワード（変更する場合のみ）' : 'パスワード'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingAdmin ? '変更しない場合は空欄' : 'パスワードを入力'}
                />
              </div>
              <div>
                <Label htmlFor="role">役割</Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'super_admin') => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="super_admin">スーパー管理者</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">アクティブ</SelectItem>
                    <SelectItem value="inactive">非アクティブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
                disabled={loading}
              >
                {editingAdmin ? '更新' : '追加'}
              </Button>
              <Button
                variant="outline"
                onClick={closeForm}
                disabled={loading}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 管理者一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>管理者一覧</CardTitle>
          <CardDescription>
            登録されている管理者アカウントの一覧
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">管理者が登録されていません</h3>
                <p className="text-gray-600">新しい管理者を追加してください。</p>
              </div>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{admin.email}</h3>
                          <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                            {getStatusLabel(admin.status)}
                          </Badge>
                          <Badge variant="outline">
                            {getRoleLabel(admin.user_type)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>作成日: {new Date(admin.created_at).toLocaleDateString('ja-JP')}</div>
                          <div>更新日: {new Date(admin.updated_at).toLocaleDateString('ja-JP')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(admin)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        編集
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
} 