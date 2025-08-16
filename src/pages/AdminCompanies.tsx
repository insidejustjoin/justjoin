import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Building, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Company {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  company_size: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  created_at: string;
  updated_at: string;
}

export function AdminCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フィルタリング用の状態
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/api/admin/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const companiesData = data.companies || [];
        setCompanies(companiesData);
        setFilteredCompanies(companiesData);
      } else {
        setError('企業データの取得に失敗しました');
      }
    } catch (err: any) {
      console.error('企業データ取得エラー:', err);
      setError(err.message || '企業データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // フィルタリング処理
  useEffect(() => {
    let filtered = [...companies];

    // 企業名・メールでの検索
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ステータスでのフィルタリング
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter);
    }

    // 業界でのフィルタリング
    if (industryFilter) {
      filtered = filtered.filter(company => 
        company.industry?.toLowerCase().includes(industryFilter.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, statusFilter, industryFilter]);

  const handleApproveCompany = async (companyId: string) => {
    try {
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/admin/companies/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // ローカル状態を更新
        setCompanies(prev => prev.map(company => 
          company.id === companyId 
            ? { ...company, status: 'active' as const }
            : company
        ));
        toast.success('企業を承認しました');
      } else {
        throw new Error(result.message || '承認に失敗しました');
      }
    } catch (error: any) {
      console.error('承認エラー:', error);
      toast.error(error.message || '承認に失敗しました');
    }
  };

  const handleRejectCompany = async (companyId: string) => {
    try {
      // 開発環境ではローカルAPIを使用、本番環境では本番APIを使用
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/admin/companies/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // ローカル状態を更新
        setCompanies(prev => prev.map(company => 
          company.id === companyId 
            ? { ...company, status: 'rejected' as const }
            : company
        ));
        toast.success('企業を却下しました');
      } else {
        throw new Error(result.message || '却下に失敗しました');
      }
    } catch (error: any) {
      console.error('却下エラー:', error);
      toast.error(error.message || '却下に失敗しました');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '審査中';
      case 'approved': return '承認済み';
      case 'rejected': return '却下';
      case 'active': return 'アクティブ';
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'active': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'active': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <AdminPageLayout title="企業管理">
      <div className="flex justify-end mb-4">
        <Button onClick={() => fetchCompanies()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          データ更新
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総企業数</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">表示中</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCompanies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">審査中</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {companies.filter(c => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {companies.filter(c => c.status === 'active' || c.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルタリング */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            検索・フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="企業名・メール・業界で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスでフィルター" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="pending">審査中</SelectItem>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="approved">承認済み</SelectItem>
                  <SelectItem value="rejected">却下</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="業界でフィルター..."
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 企業一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>企業一覧</CardTitle>
          <CardDescription>
            登録された企業の詳細情報と承認管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">企業が見つかりません</h3>
                <p className="text-gray-600">検索条件を変更してお試しください。</p>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* 基本情報 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{company.company_name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>メール: {company.email}</div>
                        <div>電話: {company.phone}</div>
                        <div>住所: {company.address}</div>
                        <div>業界: {company.industry}</div>
                        <div>規模: {company.company_size}</div>
                      </div>
                    </div>

                    {/* 詳細情報 */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">詳細情報</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>登録日: {new Date(company.created_at).toLocaleDateString('ja-JP')}</div>
                        <div>更新日: {new Date(company.updated_at).toLocaleDateString('ja-JP')}</div>
                        <div className="flex items-center space-x-2">
                          <span>ステータス:</span>
                          <Badge variant={getStatusBadgeVariant(company.status)}>
                            {getStatusIcon(company.status)}
                            <span className="ml-1">{getStatusLabel(company.status)}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* アクション */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">アクション</h4>
                      <div className="space-y-2">
                        {company.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveCompany(company.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              承認
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectCompany(company.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              却下
                            </Button>
                          </div>
                        )}
                        {company.status === 'active' && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            承認済み
                          </Badge>
                        )}
                        {company.status === 'rejected' && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            却下済み
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 企業説明 */}
                  {company.description && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">企業説明</h4>
                      <p className="text-sm text-gray-600">{company.description}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
} 