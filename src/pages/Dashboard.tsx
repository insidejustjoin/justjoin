import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Building, User, Briefcase, FileText, Users, TrendingUp } from 'lucide-react';
import { JobPostingList } from '@/components/JobPostingList';
import { CompanyRegistrationForm } from '@/components/CompanyRegistrationForm';
import { JobPostingForm } from '@/components/JobPostingForm';

export function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div>ログインが必要です</div>;
  }

  if (user.user_type === 'company') {
    return <CompanyDashboard />;
  }

  if (user.user_type === 'admin') {
    return <AdminDashboard />;
  }

  return <JobSeekerDashboard />;
}

function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCompanyForm, setShowCompanyForm] = React.useState(false);
  const [showJobForm, setShowJobForm] = React.useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">企業ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          求人情報の管理と応募者の確認を行えます
        </p>
      </div>

      {!user?.profile?.company_name ? (
        <Card>
          <CardHeader>
            <CardTitle>企業情報の登録</CardTitle>
            <CardDescription>
              求人情報を投稿するには、まず企業情報を登録してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowCompanyForm(true)}>
              企業情報を登録
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 統計カード */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">投稿中の求人</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">応募者数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +4 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">閲覧数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 企業情報登録フォーム */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">企業情報登録</h2>
                <Button variant="ghost" onClick={() => setShowCompanyForm(false)}>
                  ✕
                </Button>
              </div>
              <CompanyRegistrationForm 
                userId={user.id} 
                onSuccess={() => setShowCompanyForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 求人投稿フォーム */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">求人情報投稿</h2>
                <Button variant="ghost" onClick={() => setShowJobForm(false)}>
                  ✕
                </Button>
              </div>
              <JobPostingForm 
                companyId="temp-company-id" 
                onSuccess={() => setShowJobForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="mt-8 flex gap-4">
        <Button onClick={() => setShowJobForm(true)}>
          <Briefcase className="h-4 w-4 mr-2" />
          新しい求人を投稿
        </Button>
        <Button variant="outline" onClick={() => navigate('/employer/my-page')}>
          <FileText className="h-4 w-4 mr-2" />
          応募者を確認
        </Button>
      </div>
    </div>
  );
}

function JobSeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">求職者ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          求人情報の検索と応募を行えます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 統計カード */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">応募済み</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面接予定</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Next: Tomorrow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">お気に入り</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 求人一覧 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">おすすめの求人</h2>
          <Button variant="outline" onClick={() => navigate('/jobseeker/my-page')}>
            すべての求人を見る
          </Button>
        </div>
        <JobPostingList />
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          システム全体の管理と監視を行えます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* 統計カード */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総企業数</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総求職者数</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">審査待ち</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              承認が必要
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総求人数</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +8 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>企業管理</CardTitle>
            <CardDescription>
              企業の承認・却下と管理を行います
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/admin/my-page')}>
              <Building className="h-4 w-4 mr-2" />
              企業一覧を表示
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>求職者管理</CardTitle>
            <CardDescription>
              求職者の情報と活動を確認します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/admin/my-page')}>
              <User className="h-4 w-4 mr-2" />
              求職者一覧を表示
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>システム監視</CardTitle>
            <CardDescription>
              システムの状態とログを確認します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/admin/my-page')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              システム状況を確認
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 