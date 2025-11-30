import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Mail, Calendar, Edit, FileText, Users, TrendingUp, Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { jobPostingsRepository, JobPosting } from '@/integrations/postgres';
import { toast } from 'sonner';

export function CompanyMyPage() {
  const { user } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobPostings, setFilteredJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');

  useEffect(() => {
    if (user?.user_type === 'company') {
      loadCompanyJobPostings();
    }
  }, [user]);

  useEffect(() => {
    filterJobPostings();
  }, [jobPostings, searchTerm, statusFilter, jobTypeFilter]);

  const loadCompanyJobPostings = async () => {
    try {
      // 実際のAPIでは企業IDで求人情報を取得
      const allJobPostings = await jobPostingsRepository.getActive();
      // 簡易的に企業の求人情報をフィルタリング
      const companyJobPostings = allJobPostings.filter((_, index) => index % 3 === 0);
      setJobPostings(companyJobPostings);
    } catch (error) {
      toast.error('求人情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobPostings = () => {
    let filtered = [...jobPostings];

    if (searchTerm) {
      filtered = filtered.filter(posting =>
        posting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(posting => posting.status === statusFilter);
    }

    if (jobTypeFilter && jobTypeFilter !== 'all') {
      filtered = filtered.filter(posting => posting.job_type === jobTypeFilter);
    }

    setFilteredJobPostings(filtered);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '公開中';
      case 'inactive': return '非公開';
      case 'closed': return '終了';
      default: return status;
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'full_time': return '正社員';
      case 'part_time': return 'パートタイム';
      case 'contract': return '契約社員';
      case 'internship': return 'インターン';
      default: return jobType;
    }
  };

  if (!user || user.user_type !== 'company') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">企業アカウントでログインしてください</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">企業マイページ</h1>
        <p className="text-gray-600 mt-2">
          会社情報と求人情報の管理を行えます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 会社情報 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>会社情報</CardTitle>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">会社名</p>
                  <p className="text-sm text-muted-foreground">
                    {user.profile?.company_name || '未設定'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">メールアドレス</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">登録日</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'yyyy年MM月dd日', { locale: ja })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium">審査状況</p>
                  <Badge variant={
                    user.status === 'approved' ? 'default' : 
                    user.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {user.status === 'approved' ? '承認済み' : 
                     user.status === 'rejected' ? '却下' : '審査中'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 求人情報管理 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>求人情報管理</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規求人投稿
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* フィルター */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="求人を検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="ステータス" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="active">公開中</SelectItem>
                      <SelectItem value="inactive">非公開</SelectItem>
                      <SelectItem value="closed">終了</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="雇用形態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="full_time">正社員</SelectItem>
                      <SelectItem value="part_time">パートタイム</SelectItem>
                      <SelectItem value="contract">契約社員</SelectItem>
                      <SelectItem value="internship">インターン</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setJobTypeFilter('all');
                  }}>
                    <Filter className="h-4 w-4 mr-2" />
                    リセット
                  </Button>
                </div>
              </div>

              {/* 求人一覧 */}
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-lg">読み込み中...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobPostings.map((posting) => (
                    <div key={posting.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{posting.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {posting.location} • {getJobTypeLabel(posting.job_type || '')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            posting.status === 'active' ? 'default' : 
                            posting.status === 'inactive' ? 'secondary' : 
                            posting.status === 'closed' ? 'outline' : 'outline'
                          }>
                            {getStatusLabel(posting.status || '')}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {posting.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>応募者: 3名</span>
                          <span>閲覧数: 156回</span>
                          <span>投稿日: {format(new Date(posting.created_at), 'yyyy/MM/dd', { locale: ja })}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">編集</Button>
                          <Button size="sm" variant="outline">詳細</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredJobPostings.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">条件に一致する求人が見つかりませんでした</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle>統計情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{jobPostings.length}</p>
                  <p className="text-sm text-gray-600">投稿中の求人</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">12</p>
                  <p className="text-sm text-gray-600">総応募者数</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-purple-600">1,234</p>
                  <p className="text-sm text-gray-600">総閲覧数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                求人を投稿
              </Button>
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                応募者を確認
              </Button>
              <Button className="w-full" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                会社情報を編集
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 