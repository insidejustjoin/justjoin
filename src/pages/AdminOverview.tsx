import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCachedApi } from '@/hooks/useCachedApi';
import { 
  Users, 
  Building2, 
  FileText, 
  Bell, 
  TrendingUp, 
  Eye,
  Calendar,
  RefreshCw,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalJobSeekers: number;
  totalCompanies: number;
  totalDocuments: number;
  totalNotifications: number;
  recentRegistrations: number;
  activeUsers: number;
  totalViews: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'document' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  user_id?: number;
}

export function AdminOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // ダッシュボード統計データ（キャッシュ付き）
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    clearCache: clearStatsCache
  } = useAdminCachedApi<DashboardStats>('dashboard/stats', {
    cacheKey: `admin_dashboard_stats_${selectedPeriod}`,
    ttl: 5 * 60 * 1000, // 5分間キャッシュ
    onError: (error) => {
      console.error('統計データ取得エラー:', error);
    }
  });

  // 最近のアクティビティ（キャッシュ付き）
  const {
    data: recentActivity,
    loading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
    clearCache: clearActivityCache
  } = useAdminCachedApi<RecentActivity[]>('dashboard/activity', {
    cacheKey: `admin_dashboard_activity_${selectedPeriod}`,
    ttl: 2 * 60 * 1000, // 2分間キャッシュ
    onError: (error) => {
      console.error('アクティビティ取得エラー:', error);
    }
  });

  const handleRefresh = async () => {
    clearStatsCache();
    clearActivityCache();
    await Promise.all([refetchStats(), refetchActivity()]);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <Users className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'registration':
        return <Badge variant="default" className="bg-green-500">登録</Badge>;
      case 'document':
        return <Badge variant="secondary">書類</Badge>;
      case 'notification':
        return <Badge variant="outline">通知</Badge>;
      default:
        return <Badge variant="outline">その他</Badge>;
    }
  };

  if (statsLoading || activityLoading) {
    return (
      <>
        <Helmet>
          <title>registration form for job seeker</title>
          <meta name="description" content="registration form for job seeker" />
          <meta name="keywords" content="registration form for job seeker" />
          <meta property="og:title" content="registration form for job seeker" />
          <meta property="og:description" content="registration form for job seeker" />
          <meta name="twitter:title" content="registration form for job seeker" />
          <meta name="twitter:description" content="registration form for job seeker" />
        </Helmet>
        <AdminPageLayout title="管理者ダッシュボード">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>ダッシュボードを読み込み中...</p>
            </div>
          </div>
        </AdminPageLayout>
      </>
    );
  }

  if (statsError || activityError) {
    return (
      <>
        <Helmet>
          <title>registration form for job seeker</title>
          <meta name="description" content="registration form for job seeker" />
          <meta name="keywords" content="registration form for job seeker" />
          <meta property="og:title" content="registration form for job seeker" />
          <meta property="og:description" content="registration form for job seeker" />
          <meta name="twitter:title" content="registration form for job seeker" />
          <meta name="twitter:description" content="registration form for job seeker" />
        </Helmet>
        <AdminPageLayout title="管理者ダッシュボード">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">エラーが発生しました</p>
              <Button onClick={handleRefresh}>再試行</Button>
            </div>
          </div>
        </AdminPageLayout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>registration form for job seeker</title>
        <meta name="description" content="registration form for job seeker" />
        <meta name="keywords" content="registration form for job seeker" />
        <meta property="og:title" content="registration form for job seeker" />
        <meta property="og:description" content="registration form for job seeker" />
        <meta name="twitter:title" content="registration form for job seeker" />
        <meta name="twitter:description" content="registration form for job seeker" />
      </Helmet>
      <AdminPageLayout title="管理者ダッシュボード">
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
              <p className="text-gray-600">システム全体の状況を確認できます</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
                className="border rounded px-3 py-2"
              >
                <option value="7d">過去7日間</option>
                <option value="30d">過去30日間</option>
                <option value="90d">過去90日間</option>
              </select>
              <Button
                variant="outline"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                更新
              </Button>
            </div>
          </div>

          {/* 統計カード */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">求職者数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalJobSeekers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.recentRegistrations} 新規登録
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">企業数</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} アクティブ
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">書類作成数</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    今月の作成数
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">通知数</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalNotifications}</div>
                  <p className="text-xs text-muted-foreground">
                    未読: {stats.totalNotifications - stats.activeUsers}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 成長率と閲覧数 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    成長率
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    +{stats.monthlyGrowth}%
                  </div>
                  <p className="text-sm text-gray-600">
                    前月比での成長率
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    総閲覧数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">
                    累計ページビュー
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 最近のアクティビティ */}
          {recentActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  最近のアクティビティ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {getActivityBadge(activity.type)}
                            <span className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      最近のアクティビティはありません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/jobseekers'}
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span>求職者管理</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/companies'}
                >
                  <Building2 className="h-6 w-6 mb-2" />
                  <span>企業管理</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/notifications'}
                >
                  <Bell className="h-6 w-6 mb-2" />
                  <span>通知管理</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPageLayout>
    </>
  );
} 