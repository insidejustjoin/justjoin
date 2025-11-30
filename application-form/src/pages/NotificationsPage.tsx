import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Check, Trash2, ArrowLeft, MessageSquare, Info, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LanguageToggle } from '@/components/LanguageToggle';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('unread');





  // 通知一覧を取得
  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/notifications/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data);
        }
      }
          } catch (error) {
        console.error('通知取得エラー:', error);
        toast.error(t('notifications.fetchError'));
      } finally {
      setIsLoading(false);
    }
  };

  // 未読通知数を取得
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/notifications/unread-count/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnreadCount(result.data.count);
        }
      }
    } catch (error) {
      console.error('未読通知数取得エラー:', error);
    }
  };

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/notifications/mark-read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        // 通知リストを更新
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        
                  // 未読数を更新
          fetchUnreadCount();
          toast.success(t('notifications.markRead'));
        }
      } catch (error) {
        console.error('通知既読化エラー:', error);
        toast.error(t('notifications.markReadError'));
      }
  };

  // すべての通知を既読にする
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/notifications/mark-all-read/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        // すべての通知を既読に更新
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        
        // 未読数を0に更新
        setUnreadCount(0);
        toast.success(t('notifications.markAllReadSuccess'));
      }
    } catch (error) {
      console.error('全通知既読化エラー:', error);
      toast.error(t('notifications.markReadError'));
    }
  };

  // 通知を削除
  const deleteNotification = async (notificationId: string) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        // 通知リストから削除
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        
        // 未読数を更新
        fetchUnreadCount();
        toast.success(t('notifications.deleteSuccess'));
      }
    } catch (error) {
      console.error('通知削除エラー:', error);
      toast.error(t('notifications.deleteError'));
    }
  };

  // 通知タイプに応じたアイコンを取得
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // 通知タイプに応じたバッジを取得
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('notifications.success')}</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">{t('notifications.warning')}</Badge>;
      case 'error':
        return <Badge variant="destructive">{t('notifications.error')}</Badge>;
      default:
        return <Badge variant="secondary">{t('notifications.info')}</Badge>;
    }
  };

  // 未読通知のみをフィルタリング
  const unreadNotifications = notifications.filter(notification => !notification.is_read);
  
  // 既読通知のみをフィルタリング
  const readNotifications = notifications.filter(notification => notification.is_read);

  // 通知カードコンポーネント
  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <div
      className={`p-4 border rounded-lg ${
        notification.is_read 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getNotificationIcon(notification.type)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h3>
              {getNotificationBadge(notification.type)}
              {!notification.is_read && (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {t('notifications.unread')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(notification.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {!notification.is_read && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAsRead(notification.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteNotification(notification.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // 空の状態コンポーネント
  const EmptyState = ({ message, description }: { message: string; description: string }) => (
    <div className="text-center py-8">
      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('notifications.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('notifications.title')}</h1>
              <p className="text-gray-600 mt-2">
                {t('notifications.unreadCount')}: {unreadCount}件
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* 言語切り替え */}
            <LanguageToggle />
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <Check className="h-4 w-4 mr-2" />
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 通知一覧（タブ付き） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications.title')}
          </CardTitle>
          <CardDescription>
            {t('notifications.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('notifications.loading')}</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t('notifications.unreadCount')}
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read" className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  {t('notifications.readCount')}
                  {readNotifications.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {readNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unread" className="mt-6">
                {unreadNotifications.length === 0 ? (
                  <EmptyState 
                    message={t('notifications.noUnread')} 
                    description={t('notifications.noUnreadDesc')} 
                  />
                ) : (
                  <div className="space-y-4">
                    {unreadNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="read" className="mt-6">
                {readNotifications.length === 0 ? (
                  <EmptyState 
                    message={t('notifications.noRead')} 
                    description={t('notifications.noReadDesc')} 
                  />
                ) : (
                  <div className="space-y-4">
                    {readNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 