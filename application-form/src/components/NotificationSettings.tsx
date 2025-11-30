import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Users,
  UserCheck,
  FileText,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface WorkflowNotification {
  id: string;
  name: string;
  description: string;
  trigger: 'registration_complete' | 'profile_complete' | 'document_complete' | 'custom';
  enabled: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface SpotNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  targetUsers: 'all' | 'selected' | 'filtered';
  selectedUserIds?: string[];
  filterCriteria?: any;
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
}

interface NotificationSettingsProps {
  selectedJobSeekers?: any[];
  onClose?: () => void;
}

export function NotificationSettings({ selectedJobSeekers = [], onClose }: NotificationSettingsProps) {
  const { user, isAuthenticated } = useAuth();
  const [workflowNotifications, setWorkflowNotifications] = useState<WorkflowNotification[]>([
    {
      id: '1',
      name: '登録完了通知',
      description: '新規ユーザー登録完了時に送信',
      trigger: 'registration_complete',
      enabled: true,
      title: '登録完了のお知らせ',
      message: 'JustJoinへのご登録ありがとうございます。プロフィールの入力をお願いします。',
      type: 'success'
    },
    {
      id: '3',
      name: '書類完成通知',
      description: '書類作成100%完成時に送信',
      trigger: 'document_complete',
      enabled: true,
      title: '書類完成のお知らせ',
      message: '書類の作成が完了しました。AI面接に進んでください。',
      type: 'success'
    }
  ]);

  const [spotNotifications, setSpotNotifications] = useState<SpotNotification[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowNotification | null>(null);
  const [editingSpot, setEditingSpot] = useState<SpotNotification | null>(null);
  const [loading, setLoading] = useState(false);

  // スポット通知の初期化
  useEffect(() => {
    if (selectedJobSeekers.length > 0) {
      setEditingSpot({
        id: '',
        title: '',
        message: '',
        type: 'info',
        targetUsers: 'selected',
        selectedUserIds: selectedJobSeekers.map(user => user.user_id || user.id),
        status: 'draft',
        createdAt: new Date().toISOString()
      });
    }
  }, [selectedJobSeekers]);

  // ワークフロー通知の保存
  const saveWorkflowNotification = async (notification: WorkflowNotification) => {
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
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...notification,
          sendToExisting: true // 既存ユーザーにも送信
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setWorkflowNotifications(prev => 
          prev.map(n => n.id === notification.id ? notification : n)
        );
        setEditingWorkflow(null);
        toast.success('ワークフロー通知を保存しました');
      } else {
        throw new Error(data.message || '保存に失敗しました');
      }
    } catch (err: any) {
      console.error('ワークフロー通知保存エラー:', err);
      toast.error(err.message || 'ワークフロー通知の保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // スポット通知の送信
  const sendSpotNotification = async (notification: SpotNotification) => {
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
      
      const response = await fetch(`${apiUrl}/api/notifications/admin/send-spot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          targetUsers: notification.targetUsers,
          selectedUserIds: notification.selectedUserIds
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSpotNotifications(prev => [
          ...prev,
          { ...notification, id: data.notificationId, status: 'sent', createdAt: new Date().toISOString() }
        ]);
        setEditingSpot(null);
        toast.success('スポット通知を送信しました');
      } else {
        throw new Error(data.message || '送信に失敗しました');
      }
    } catch (err: any) {
      console.error('スポット通知送信エラー:', err);
      toast.error(err.message || 'スポット通知の送信中にエラーが発生しました');
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

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return '成功';
      case 'warning': return '警告';
      case 'error': return 'エラー';
      default: return '情報';
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'registration_complete': return '登録完了';
      case 'profile_complete': return 'プロフィール完成';
      case 'document_complete': return '書類完成';
      case 'custom': return 'カスタム';
      default: return trigger;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">通知設定</h2>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        )}
      </div>

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            ワークフロー通知
          </TabsTrigger>
          <TabsTrigger value="spot" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            スポット通知
          </TabsTrigger>
        </TabsList>

        {/* ワークフロー通知タブ */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ワークフロー通知設定
              </CardTitle>
              <CardDescription>
                自動的に送信される通知の設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowNotifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getNotificationTypeIcon(notification.type)}
                      <div>
                        <h3 className="font-medium">{notification.name}</h3>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={notification.enabled}
                        onCheckedChange={(enabled) => {
                          const updated = { ...notification, enabled };
                          setWorkflowNotifications(prev => 
                            prev.map(n => n.id === notification.id ? updated : n)
                          );
                          saveWorkflowNotification(updated);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingWorkflow(notification)}
                      >
                        編集
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">トリガー</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{getTriggerLabel(notification.trigger)}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">通知タイプ</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{getNotificationTypeLabel(notification.type)}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* スポット通知タブ */}
        <TabsContent value="spot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                スポット通知送信
              </CardTitle>
              <CardDescription>
                即座に送信する通知を作成します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 新規スポット通知作成フォーム */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">新規通知作成</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="notification-title">通知タイトル</Label>
                      <Input
                        id="notification-title"
                        placeholder="通知のタイトルを入力"
                        value={editingSpot?.title || ''}
                        onChange={(e) => setEditingSpot(prev => 
                          prev ? { ...prev, title: e.target.value } : null
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notification-type">通知タイプ</Label>
                      <Select
                        value={editingSpot?.type || 'info'}
                        onValueChange={(value: any) => setEditingSpot(prev => 
                          prev ? { ...prev, type: value } : null
                        )}
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

                  <div className="mb-4">
                    <Label htmlFor="notification-message">通知メッセージ</Label>
                    <Textarea
                      id="notification-message"
                      placeholder="通知の内容を入力"
                      rows={3}
                      value={editingSpot?.message || ''}
                      onChange={(e) => setEditingSpot(prev => 
                        prev ? { ...prev, message: e.target.value } : null
                      )}
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="notification-target">送信対象</Label>
                    <Select
                      value={editingSpot?.targetUsers || 'selected'}
                      onValueChange={(value: any) => setEditingSpot(prev => 
                        prev ? { ...prev, targetUsers: value } : null
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全ユーザー</SelectItem>
                        <SelectItem value="selected">選択されたユーザー ({selectedJobSeekers.length}人)</SelectItem>
                        <SelectItem value="filtered">フィルター条件</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingSpot?.targetUsers === 'selected' && selectedJobSeekers.length > 0 && (
                    <div className="mb-4">
                      <Label>選択されたユーザー ({selectedJobSeekers.length}人)</Label>
                      <div className="mt-2 space-y-2">
                        {selectedJobSeekers.map((user: any) => (
                          <div key={user.id} className="flex items-center gap-2 text-sm">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            {user.full_name || user.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (editingSpot) {
                          sendSpotNotification(editingSpot);
                        }
                      }}
                      disabled={loading || !editingSpot?.title || !editingSpot?.message}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      通知送信
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingSpot(null)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>

                {/* 送信履歴 */}
                {spotNotifications.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4">送信履歴</h3>
                    <div className="space-y-2">
                      {spotNotifications.map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            {getNotificationTypeIcon(notification.type)}
                            <div>
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {notification.status === 'sent' ? '送信済み' : '下書き'}
                            </Badge>
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ワークフロー通知編集モーダル */}
      {editingWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">ワークフロー通知編集</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingWorkflow(null)}
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="workflow-name">通知名</Label>
                <Input
                  id="workflow-name"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-description">説明</Label>
                <Input
                  id="workflow-description"
                  value={editingWorkflow.description}
                  onChange={(e) => setEditingWorkflow(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>

              <div>
                <Label htmlFor="workflow-title">通知タイトル</Label>
                <Input
                  id="workflow-title"
                  value={editingWorkflow.title}
                  onChange={(e) => setEditingWorkflow(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                />
              </div>

              <div>
                <Label htmlFor="workflow-message">通知メッセージ</Label>
                <Textarea
                  id="workflow-message"
                  value={editingWorkflow.message}
                  onChange={(e) => setEditingWorkflow(prev => 
                    prev ? { ...prev, message: e.target.value } : null
                  )}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="workflow-type">通知タイプ</Label>
                <Select
                  value={editingWorkflow.type}
                  onValueChange={(value: any) => setEditingWorkflow(prev => 
                    prev ? { ...prev, type: value } : null
                  )}
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="send-to-existing"
                  checked={true}
                  disabled
                />
                <Label htmlFor="send-to-existing">
                  既存ユーザーにも送信（条件に合致する既存ユーザーに即座に送信）
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingWorkflow) {
                      saveWorkflowNotification(editingWorkflow);
                    }
                  }}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingWorkflow(null)}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 