import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Users, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock,
  Calendar
} from 'lucide-react';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target_type: 'all' | 'specific' | 'jobseeker' | 'company';
  target_users?: string[];
  created_at: string;
  updated_at: string;
  is_sent: boolean;
  sent_at?: string;
  read_count?: number;
  total_count?: number;
}

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target_type: 'all' | 'specific' | 'jobseeker' | 'company';
  created_at: string;
  sent_at?: string;
  read_count: number;
  total_count: number;
}

export function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target_type: 'all' as 'all' | 'specific' | 'jobseeker' | 'company',
  });

  const token = localStorage.getItem('auth_token');

  // 通知一覧を取得
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('通知の取得に失敗しました');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('通知取得エラー:', error);
      setError('通知の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 通知履歴を取得
  const fetchNotificationHistory = async () => {
    try {
      const response = await fetch('/api/notifications/admin/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('通知履歴の取得に失敗しました');
      }

      const data = await response.json();
      setNotificationHistory(data.history || []);
    } catch (error) {
      console.error('通知履歴取得エラー:', error);
    }
  };

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchNotificationHistory();
    fetchUsers();
  }, []);

  // 通知を作成
  const createNotification = async () => {
    try {
      const payload = {
        ...formData,
        target_users: formData.target_type === 'specific' ? selectedUsers : undefined
      };

      const response = await fetch('/api/notifications/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('通知の作成に失敗しました');
      }

      toast.success('通知を作成しました');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_type: 'all'
      });
      setSelectedUsers([]);
      fetchNotifications();
    } catch (error) {
      console.error('通知作成エラー:', error);
      toast.error('通知の作成に失敗しました');
    }
  };

  // 通知を編集
  const updateNotification = async () => {
    if (!editingNotification) return;

    try {
      const payload = {
        ...formData,
        target_users: formData.target_type === 'specific' ? selectedUsers : undefined
      };

      const response = await fetch(`/api/notifications/admin/${editingNotification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('通知の更新に失敗しました');
      }

      toast.success('通知を更新しました');
      setShowEditDialog(false);
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_type: 'all'
      });
      setSelectedUsers([]);
      fetchNotifications();
    } catch (error) {
      console.error('通知更新エラー:', error);
      toast.error('通知の更新に失敗しました');
    }
  };

  // 通知を削除
  const deleteNotification = async (id: string) => {
    if (!confirm('この通知を削除しますか？')) return;

    try {
      const response = await fetch(`/api/notifications/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('通知の削除に失敗しました');
      }

      toast.success('通知を削除しました');
      fetchNotifications();
    } catch (error) {
      console.error('通知削除エラー:', error);
      toast.error('通知の削除に失敗しました');
    }
  };

  // 通知を送信
  const sendNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/admin/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('通知の送信に失敗しました');
      }

      toast.success('通知を送信しました');
      fetchNotifications();
      fetchNotificationHistory();
    } catch (error) {
      console.error('通知送信エラー:', error);
      toast.error('通知の送信に失敗しました');
    }
  };

  // 編集ダイアログを開く
  const openEditDialog = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      target_type: notification.target_type
    });
    setSelectedUsers(notification.target_users || []);
    setShowEditDialog(true);
  };

  // 通知タイプのアイコンを取得
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // 通知タイプのラベルを取得
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success':
        return '成功';
      case 'warning':
        return '警告';
      case 'error':
        return 'エラー';
      default:
        return '情報';
    }
  };

  // ターゲットタイプのラベルを取得
  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return '全ユーザー';
      case 'jobseeker':
        return '求職者のみ';
      case 'company':
        return '企業のみ';
      case 'specific':
        return '特定ユーザー';
      default:
        return '不明';
    }
  };

  return (
    <AdminPageLayout title="通知管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">通知管理</h1>
            <p className="text-muted-foreground">システム全体の通知を一元管理します</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規通知作成
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">通知一覧</TabsTrigger>
            <TabsTrigger value="history">送信履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>読み込み中...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {notifications.map((notification) => (
                  <Card key={notification.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(notification.type)}
                            <CardTitle className="text-lg">{notification.title}</CardTitle>
                            <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                            <Badge variant="secondary">{getTargetTypeLabel(notification.target_type)}</Badge>
                            {notification.is_sent && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <Send className="h-3 w-3 mr-1" />
                                送信済み
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-2">
                            {notification.message}
                          </CardDescription>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                            <span>作成日: {new Date(notification.created_at).toLocaleDateString('ja-JP')}</span>
                            {notification.sent_at && (
                              <span>送信日: {new Date(notification.sent_at).toLocaleDateString('ja-JP')}</span>
                            )}
                            {notification.read_count !== undefined && notification.total_count !== undefined && (
                              <span>既読: {notification.read_count}/{notification.total_count}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.is_sent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendNotification(notification.id)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              送信
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(notification)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            編集
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4">
              {notificationHistory.map((notification) => (
                <Card key={notification.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(notification.type)}
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                          <Badge variant="secondary">{getTargetTypeLabel(notification.target_type)}</Badge>
                        </div>
                        <CardDescription className="mt-2">
                          {notification.message}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                          <span>作成日: {new Date(notification.created_at).toLocaleDateString('ja-JP')}</span>
                          {notification.sent_at && (
                            <span>送信日: {new Date(notification.sent_at).toLocaleDateString('ja-JP')}</span>
                          )}
                          <span>既読: {notification.read_count}/{notification.total_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 新規作成ダイアログ */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規通知作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="通知のタイトルを入力してください"
                />
              </div>
              <div>
                <Label htmlFor="message">メッセージ *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="通知のメッセージを入力してください"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="type">通知タイプ *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">情報</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="error">エラー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_type">送信対象 *</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value: 'all' | 'specific' | 'jobseeker' | 'company') => 
                    setFormData({ ...formData, target_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ユーザー</SelectItem>
                    <SelectItem value="jobseeker">求職者のみ</SelectItem>
                    <SelectItem value="company">企業のみ</SelectItem>
                    <SelectItem value="specific">特定ユーザー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.target_type === 'specific' && (
                <div>
                  <Label>対象ユーザー選択</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id.toString()]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id.toString()));
                            }
                          }}
                        />
                        <span>{user.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={createNotification}>
                  作成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 編集ダイアログ */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>通知編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">タイトル *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="通知のタイトルを入力してください"
                />
              </div>
              <div>
                <Label htmlFor="edit-message">メッセージ *</Label>
                <Textarea
                  id="edit-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="通知のメッセージを入力してください"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">通知タイプ *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">情報</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="error">エラー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-target_type">送信対象 *</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value: 'all' | 'specific' | 'jobseeker' | 'company') => 
                    setFormData({ ...formData, target_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ユーザー</SelectItem>
                    <SelectItem value="jobseeker">求職者のみ</SelectItem>
                    <SelectItem value="company">企業のみ</SelectItem>
                    <SelectItem value="specific">特定ユーザー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.target_type === 'specific' && (
                <div>
                  <Label>対象ユーザー選択</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id.toString()]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id.toString()));
                            }
                          }}
                        />
                        <span>{user.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={updateNotification}>
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageLayout>
  );
} 