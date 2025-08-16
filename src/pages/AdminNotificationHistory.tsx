import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Bell, Trash2, Info, CheckCircle, AlertCircle, XCircle, Edit, Save, X } from 'lucide-react';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SpotNotification {
  id: string;
  title: string;
  message: string;
  type: 'notice' | 'important';
  targetUsers: 'all' | 'selected' | 'filtered';
  selectedUserIds?: string[];
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  sentAt?: string;
  recipientCount?: number;
}

interface WorkflowNotification {
  id: string;
  name: string;
  description: string;
  trigger: 'registration_complete' | 'profile_complete' | 'document_complete' | 'custom';
  enabled: boolean;
  title: string;
  message: string;
  type: 'notice' | 'important';
  lastSentAt?: string;
  totalSentCount?: number;
}

export function AdminNotificationHistory() {
  const { user, isAuthenticated } = useAuth();
  const [spotNotifications, setSpotNotifications] = useState<SpotNotification[]>([]);
  const [workflowNotifications, setWorkflowNotifications] = useState<WorkflowNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNotification, setEditingNotification] = useState<SpotNotification | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkflowEditDialog, setShowWorkflowEditDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowNotification | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    message: '',
    type: 'notice' as 'notice' | 'important'
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    message: '',
    type: 'notice' as 'notice' | 'important',
    targetUsers: 'all' as 'all' | 'selected' | 'filtered'
  });
  const [workflowEditForm, setWorkflowEditForm] = useState({
    name: '',
    description: '',
    title: '',
    message: '',
    type: 'notice' as 'notice' | 'important',
    enabled: false
  });

  // 通知履歴を取得
  const fetchNotificationHistory = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 認証チェック
      if (!isAuthenticated || !user) {
        throw new Error('認証されていません。再度ログインしてください。');
      }
      
      // 認証トークンを取得
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンがありません。再度ログインしてください。');
      }

      // スポット通知履歴を取得
      const spotResponse = await fetch(`${apiUrl}/api/notifications/admin/spot-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (spotResponse.ok) {
        const spotData = await spotResponse.json();
        if (spotData.success) {
          setSpotNotifications(spotData.data || []);
        }
      }

      // ワークフロー通知履歴を取得
      const workflowResponse = await fetch(`${apiUrl}/api/notifications/admin/workflow-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        if (workflowData.success) {
          setWorkflowNotifications(workflowData.data || []);
        }
      }

    } catch (err: any) {
      console.error('通知履歴取得エラー:', err);
      setError(err.message || '通知履歴の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // スポット通知の削除
  const deleteSpotNotification = async (notificationId: string) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 認証チェック
      if (!isAuthenticated || !user) {
        throw new Error('認証されていません。再度ログインしてください。');
      }
      
      // 認証トークンを取得
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンがありません。再度ログインしてください。');
      }
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/spot/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSpotNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('スポット通知を削除しました');
      } else {
        throw new Error(data.message || '削除に失敗しました');
      }
    } catch (err: any) {
      console.error('スポット通知削除エラー:', err);
      toast.error(err.message || 'スポット通知の削除中にエラーが発生しました');
    }
  };

  // 通知編集を開始
  const startEditNotification = (notification: SpotNotification) => {
    setEditingNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      type: convertNotificationType(notification.type)
    });
  };

  // 通知編集をキャンセル
  const cancelEditNotification = () => {
    setEditingNotification(null);
    setEditForm({
      title: '',
      message: '',
      type: 'notice'
    });
  };

  // 通知を更新
  const updateNotification = async () => {
    if (!editingNotification) return;

    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 認証チェック
      if (!isAuthenticated || !user) {
        throw new Error('認証されていません。再度ログインしてください。');
      }
      
      // 認証トークンを取得
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンがありません。再度ログインしてください。');
      }
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/spot/${editingNotification.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // 通知履歴を更新
        setSpotNotifications(prev => 
          prev.map(n => 
            n.id === editingNotification.id 
              ? { ...n, title: editForm.title, message: editForm.message, type: editForm.type }
              : n
          )
        );
        
        // 求職者の通知も更新
        await updateUserNotifications(editingNotification.id, editForm);
        
        setEditingNotification(null);
        setEditForm({
          title: '',
          message: '',
          type: 'notice'
        });
        toast.success('通知を更新しました');
      } else {
        throw new Error(data.message || '更新に失敗しました');
      }
    } catch (err: any) {
      console.error('通知更新エラー:', err);
      toast.error(err.message || '通知の更新中にエラーが発生しました');
    }
  };

  // 求職者の通知を更新
  const updateUserNotifications = async (notificationId: string, updatedData: any) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/update-user-notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        console.error('求職者通知更新エラー:', response.status);
      }
    } catch (error) {
      console.error('求職者通知更新エラー:', error);
    }
  };

  // 新しい通知を作成
  const createNotification = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 認証チェック
      if (!isAuthenticated || !user) {
        throw new Error('認証されていません。再度ログインしてください。');
      }
      
      // 認証トークンを取得
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンがありません。再度ログインしてください。');
      }
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/send-to-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // 通知履歴を更新
        await fetchNotificationHistory();
        
        setShowCreateDialog(false);
        setCreateForm({
          title: '',
          message: '',
          type: 'notice',
          targetUsers: 'all'
        });
        toast.success('通知を作成しました');
      } else {
        throw new Error(data.message || '作成に失敗しました');
      }
    } catch (err: any) {
      console.error('通知作成エラー:', err);
      toast.error(err.message || '通知の作成中にエラーが発生しました');
    }
  };

  // ワークフロー通知を編集
  const editWorkflowNotification = (workflow: WorkflowNotification) => {
    setEditingWorkflow(workflow);
    setWorkflowEditForm({
      name: workflow.name,
      description: workflow.description,
      title: workflow.title,
      message: workflow.message,
      type: convertNotificationType(workflow.type),
      enabled: workflow.enabled
    });
    setShowWorkflowEditDialog(true);
  };

  // ワークフロー通知を更新
  const updateWorkflowNotification = async () => {
    if (!editingWorkflow) return;

    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 認証チェック
      if (!isAuthenticated || !user) {
        throw new Error('認証されていません。再度ログインしてください。');
      }
      
      // 認証トークンを取得
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンがありません。再度ログインしてください。');
      }
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/workflow/${editingWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowEditForm)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // ワークフロー通知履歴を更新
        await fetchNotificationHistory();
        
        setShowWorkflowEditDialog(false);
        setEditingWorkflow(null);
        setWorkflowEditForm({
          name: '',
          description: '',
          title: '',
          message: '',
          type: 'notice',
          enabled: false
        });
        toast.success('ワークフロー通知を更新しました');
      } else {
        throw new Error(data.message || '更新に失敗しました');
      }
    } catch (err: any) {
      console.error('ワークフロー通知更新エラー:', err);
      toast.error(err.message || 'ワークフロー通知の更新中にエラーが発生しました');
    }
  };

  // 通知タイプアイコンを取得
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'important':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'notice':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // 通知タイプラベルを取得
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'important':
        return '重要';
      case 'notice':
      default:
        return 'お知らせ';
    }
  };

  // 古い通知タイプを新しいタイプに変換
  const convertNotificationType = (oldType: string): 'notice' | 'important' => {
    switch (oldType) {
      case 'success':
      case 'info':
        return 'notice';
      case 'warning':
      case 'error':
        return 'important';
      default:
        return 'notice';
    }
  };

  // 送信対象ラベルを取得
  const getTargetUsersLabel = (targetUsers: string) => {
    switch (targetUsers) {
      case 'all':
        return '全ユーザー';
      case 'selected':
        return '選択ユーザー';
      case 'filtered':
        return 'フィルター対象';
      default:
        return '不明';
    }
  };

  // トリガーラベルを取得
  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'registration_complete':
        return '登録完了';
      case 'document_complete':
        return '書類完成';
      default:
        return 'カスタム';
    }
  };

  useEffect(() => {
    fetchNotificationHistory();
  }, []);

  if (loading) {
    return (
      <AdminPageLayout title="通知履歴">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">通知履歴を読み込み中...</span>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="通知履歴">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">通知履歴</h1>
            <p className="text-muted-foreground">
              送信された通知の履歴を管理します
            </p>
          </div>
          <Button onClick={fetchNotificationHistory} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="spot" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spot">スポット通知履歴</TabsTrigger>
            <TabsTrigger value="workflow">ワークフロー通知履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="spot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  スポット通知履歴
                </CardTitle>
                <CardDescription>
                  即座に送信されたスポット通知の履歴
                </CardDescription>
              </CardHeader>
              <CardContent>
                {spotNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    スポット通知の履歴がありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {spotNotifications.map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getNotificationTypeIcon(notification.type)}
                          <div className="flex-1">
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>送信日時: {new Date(notification.createdAt).toLocaleString()}</span>
                              <span>対象: {getTargetUsersLabel(notification.targetUsers)}</span>
                              {notification.recipientCount && (
                                <span>送信数: {notification.recipientCount}人</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'}>
                            {notification.status === 'sent' ? '送信済み' : '下書き'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditNotification(notification)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSpotNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  ワークフロー通知履歴
                </CardTitle>
                <CardDescription>
                  自動送信されるワークフロー通知の設定と履歴
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflowNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ワークフロー通知の履歴がありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflowNotifications.map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getNotificationTypeIcon(notification.type)}
                          <div className="flex-1">
                            <div className="font-medium">{notification.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {notification.description}
                            </div>
                            <div className="text-sm mt-1">
                              <strong>タイトル:</strong> {notification.title}
                            </div>
                            <div className="text-sm mt-1">
                              <strong>メッセージ:</strong> {notification.message}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>トリガー: {getTriggerLabel(notification.trigger)}</span>
                              {notification.lastSentAt && (
                                <span>最終送信: {new Date(notification.lastSentAt).toLocaleString()}</span>
                              )}
                              {notification.totalSentCount && (
                                <span>総送信数: {notification.totalSentCount}回</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          <Badge variant={notification.enabled ? 'default' : 'secondary'}>
                            {notification.enabled ? '有効' : '無効'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 通知編集ダイアログ */}
        <Dialog open={!!editingNotification} onOpenChange={() => cancelEditNotification()}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>通知を編集</DialogTitle>
              <DialogDescription>
                通知の内容を編集します。変更は求職者の通知ページにも反映されます。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">タイトル</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="通知のタイトル"
                />
              </div>
              <div>
                <label className="text-sm font-medium">メッセージ</label>
                <Textarea
                  value={editForm.message}
                  onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="通知のメッセージ"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">通知タイプ</label>
                <Select
                  value={editForm.type}
                  onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                    setEditForm(prev => ({ ...prev, type: value }))
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={cancelEditNotification}>
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </Button>
              <Button onClick={updateNotification}>
                <Save className="h-4 w-4 mr-2" />
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageLayout>
  );
} 