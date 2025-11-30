import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, Info, XCircle, Download, Search, Users, FileText, Building, Activity, Settings } from 'lucide-react';
import { AdminJobSeekers } from '@/pages/AdminJobSeekers';
import { AdminCompanies } from '@/pages/AdminCompanies';
import AdminSettingsPage from '@/pages/AdminSettingsPage';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  details?: any;
  userId?: string;
  action?: string;
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  errorRate: number;
}

interface JobSeeker {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  desired_job_title: string;
  experience_years: number;
  skills: string[];
  self_introduction: string;
  created_at: string;
  updated_at: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logStats, setLogStats] = useState<LogStats>({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    errorRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<JobSeeker[]>([]);
  
  // フィルタリング用の状態
  const [skillFilter, setSkillFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // モック処理：APIが実装されるまでモックデータを使用
      const mockLogs: LogEntry[] = [
        {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'システムが正常に起動しました',
          details: { component: 'AdminDashboard' }
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'WARN',
          message: '一部のAPIエンドポイントが未実装です',
          details: { component: 'DocumentGenerator' }
        }
      ];
      
      setLogs(mockLogs);
        
        // 統計情報を計算
      const total = mockLogs.length;
      const errors = mockLogs.filter((log: LogEntry) => log.level === 'ERROR').length;
      const warnings = mockLogs.filter((log: LogEntry) => log.level === 'WARN').length;
      const info = mockLogs.filter((log: LogEntry) => log.level === 'INFO').length;
        const errorRate = total > 0 ? Math.round((errors / total) * 100) : 0;
        
        setLogStats({ total, errors, warnings, info, errorRate });
    } catch (err) {
      setError('ログデータの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobSeekers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // モック処理：APIが実装されるまでモックデータを使用
      const mockJobSeekers: JobSeeker[] = [
        {
          id: '1',
          user_id: 'user1',
          full_name: '田中 太郎',
          date_of_birth: '1990-01-01',
          gender: 'male',
          email: 'tanaka@example.com',
          phone: '090-1234-5678',
          address: '東京都渋谷区',
          desired_job_title: 'フロントエンドエンジニア',
          experience_years: 5,
          skills: ['React', 'TypeScript', 'JavaScript'],
          self_introduction: 'フロントエンド開発に5年の経験があります。',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user2',
          full_name: '佐藤 花子',
          date_of_birth: '1985-05-15',
          gender: 'female',
          email: 'sato@example.com',
          phone: '080-9876-5432',
          address: '大阪府大阪市',
          desired_job_title: 'バックエンドエンジニア',
          experience_years: 8,
          skills: ['Python', 'Django', 'PostgreSQL'],
          self_introduction: 'バックエンド開発に8年の経験があります。',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setJobSeekers(mockJobSeekers);
      setFilteredJobSeekers(mockJobSeekers);
    } catch (err: any) {
      console.error('求職者データ取得エラー:', err);
      setError(err.message || '求職者データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchJobSeekers();
  }, []);

  // フィルタリング処理
  useEffect(() => {
    let filtered = [...jobSeekers];

    // 名前・メール・職種での検索
    if (searchTerm) {
      filtered = filtered.filter(seeker =>
        seeker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.desired_job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // スキルでのフィルタリング
    if (skillFilter) {
      const skillFilters = skillFilter.split(',').map(s => s.trim()).filter(s => s.length > 0);
      filtered = filtered.filter(seeker => {
        if (!seeker.skills || !Array.isArray(seeker.skills)) return false;
        return skillFilters.some(skill => 
          seeker.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
      });
    }

    // 年齢でのフィルタリング
    if (ageFilter) {
      filtered = filtered.filter(seeker => {
        const age = getAge(seeker.date_of_birth);
        switch (ageFilter) {
          case '20-29': return age >= 20 && age <= 29;
          case '30-39': return age >= 30 && age <= 39;
          case '40-49': return age >= 40 && age <= 49;
          case '50+': return age >= 50;
          default: return true;
        }
      });
    }

    // 経験年数でのフィルタリング
    if (experienceFilter) {
      filtered = filtered.filter(seeker => {
        const experience = seeker.experience_years || 0;
        switch (experienceFilter) {
          case '0-2': return experience >= 0 && experience <= 2;
          case '3-5': return experience >= 3 && experience <= 5;
          case '6-10': return experience >= 6 && experience <= 10;
          case '10+': return experience >= 10;
          default: return true;
        }
      });
    }

    setFilteredJobSeekers(filtered);
  }, [jobSeekers, searchTerm, skillFilter, ageFilter, experienceFilter]);

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return gender;
    }
  };

  const downloadDocument = async (userId: string, documentType: 'resume' | 'skill-sheet' | 'work-history') => {
    try {
      // モック処理：APIが実装されるまでモックデータを使用
      const mockDocumentData = {
        userId: userId,
        documentType: documentType,
        data: {
          basicInfo: {
            name: 'サンプルユーザー',
            email: 'sample@example.com'
          },
          skills: ['React', 'TypeScript', 'JavaScript'],
          experience: '5年の開発経験'
        }
      };
      
        // 書類データをダウンロード
      const blob = new Blob([JSON.stringify(mockDocumentData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documents_${userId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
      setError(`${documentType === 'resume' ? '履歴書' : documentType === 'skill-sheet' ? 'スキルシート' : '職務経歴書'}のダウンロード中にエラーが発生しました`);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <XCircle className="h-4 w-4" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4" />;
      case 'INFO': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'secondary';
      case 'INFO': return 'default';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
        <Button onClick={() => fetchLogs()} disabled={loading}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="jobseekers">求職者管理</TabsTrigger>
          <TabsTrigger value="companies">企業管理</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
          <TabsTrigger value="logs">システムログ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総ログ数</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logStats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">エラー数</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{logStats.errors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">警告数</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{logStats.warnings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">エラー率</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logStats.errorRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
              <CardDescription>
                よく使用する機能への素早いアクセス
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('jobseekers')}
                >
                  <Users className="h-8 w-8" />
                  <span>求職者管理</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('companies')}
                >
                  <Building className="h-8 w-8" />
                  <span>企業管理</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-8 w-8" />
                  <span>設定</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('logs')}
                >
                  <Activity className="h-8 w-8" />
                  <span>システムログ</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobseekers">
          <AdminJobSeekers />
        </TabsContent>

        <TabsContent value="companies">
          <AdminCompanies />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettingsPage />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* ログフィルタリング */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                ログ検索・フィルター
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Input
                    placeholder="ログメッセージで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="ログレベルでフィルター" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="ERROR">エラー</SelectItem>
                      <SelectItem value="WARN">警告</SelectItem>
                      <SelectItem value="INFO">情報</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ログ一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>システムログ</CardTitle>
              <CardDescription>
                システムの動作状況とエラーログ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ログが見つかりません</h3>
                    <p className="text-gray-600">検索条件を変更してお試しください。</p>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {getLevelIcon(log.level)}
                            <span className="ml-1">{log.level}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        {log.userId && (
                          <Badge variant="outline" className="text-xs">
                            ユーザー: {log.userId}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.details && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 