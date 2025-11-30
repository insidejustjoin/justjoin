import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/constants/api';

// 型定義
interface InterviewSession {
  id: string;
  applicant_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  language: string;
  current_question_index: number;
  started_at: string;
  completed_at: string;
  total_duration: number;
  consent_given: boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

interface InterviewSummary {
  session_id: string;
  applicant_id: string;
  total_questions: number;
  answered_questions: number;
  total_duration: number;
  average_response_time: number;
  completion_rate: number;
  key_insights: string[];
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  notes: string;
  created_at: string;
}

interface InterviewApplicant {
  id: string;
  email: string;
  name: string;
  position: string;
  experience_years: number;
  created_at: string;
  updated_at: string;
}

interface InterviewAnswer {
  id: string;
  question_id: string;
  session_id: string;
  applicant_id: string;
  text: string;
  response_time: number;
  word_count: number;
  sentiment_score: number;
  timestamp: string;
  created_at: string;
}

interface AnalyticsData {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  cancelledSessions: number;
  averageDuration: number;
  averageScore: number;
  positiveRecommendations: number;
  totalApplicants: number;
  recentSessions: InterviewSession[];
  topPerformers: InterviewSummary[];
  recentAnswers: InterviewAnswer[];
}

export function AdminInterviewAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [summaries, setSummaries] = useState<InterviewSummary[]>([]);
  const [applicants, setApplicants] = useState<InterviewApplicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('7d');

  const { user } = useAuth();
  const { toast } = useToast();

  // データ取得
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 面接統計データ取得
      const statsResponse = await fetch(`${apiUrl}/api/admin/interview/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsResponse.ok) {
        throw new Error(`HTTP error! status: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setAnalyticsData(statsData.data);
      } else {
        setError('面接統計データの取得に失敗しました');
      }

      // 面接セッション一覧取得
      const sessionsResponse = await fetch(`${apiUrl}/api/admin/interview/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          setSessions(sessionsData.sessions);
        }
      }

      // 面接サマリー一覧取得
      const summariesResponse = await fetch(`${apiUrl}/api/admin/interview/summaries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (summariesResponse.ok) {
        const summariesData = await summariesResponse.json();
        if (summariesData.success) {
          setSummaries(summariesData.summaries);
        }
      }

    } catch (err: any) {
      console.error('面接分析データ取得エラー:', err);
      setError(err.message || '面接分析データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // フィルタリング処理
  const filteredSessions = sessions.filter(session => {
    if (filterStatus !== 'all' && session.status !== filterStatus) return false;
    if (searchTerm && !session.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredSummaries = summaries.filter(summary => {
    if (filterRecommendation !== 'all' && summary.recommendation !== filterRecommendation) return false;
    return true;
  });

  // 統計カード
  const StatCard = ({ title, value, icon: Icon, description, color = 'blue' }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    description?: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  // 推奨レベルバッジ
  const getRecommendationBadge = (recommendation: string) => {
    const variants = {
      strong_yes: 'bg-green-100 text-green-800',
      yes: 'bg-blue-100 text-blue-800',
      maybe: 'bg-yellow-100 text-yellow-800',
      no: 'bg-orange-100 text-orange-800',
      strong_no: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={variants[recommendation as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {recommendation === 'strong_yes' && '強く推奨'}
        {recommendation === 'yes' && '推奨'}
        {recommendation === 'maybe' && '検討'}
        {recommendation === 'no' && '非推奨'}
        {recommendation === 'strong_no' && '強く非推奨'}
      </Badge>
    );
  };

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status === 'waiting' && '待機中'}
        {status === 'in_progress' && '面接中'}
        {status === 'completed' && '完了'}
        {status === 'cancelled' && 'キャンセル'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">面接分析データを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">面接結果分析</h1>
          <p className="text-muted-foreground">
            AI面接システムの統計情報と詳細分析
          </p>
        </div>
        <Button onClick={fetchAnalyticsData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          更新
        </Button>
      </div>

      {/* 統計カード */}
      {analyticsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="総面接数"
            value={analyticsData.totalSessions}
            icon={Users}
            description="全期間の面接セッション数"
          />
          <StatCard
            title="完了率"
            value={`${Math.round((analyticsData.completedSessions / analyticsData.totalSessions) * 100)}%`}
            icon={CheckCircle}
            description="完了した面接の割合"
            color="green"
          />
          <StatCard
            title="平均スコア"
            value={analyticsData.averageScore.toFixed(1)}
            icon={TrendingUp}
            description="面接結果の平均スコア"
            color="blue"
          />
          <StatCard
            title="推奨率"
            value={`${Math.round((analyticsData.positiveRecommendations / analyticsData.completedSessions) * 100)}%`}
            icon={Award}
            description="推奨された候補者の割合"
            color="purple"
          />
        </div>
      )}

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">ステータス</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="waiting">待機中</SelectItem>
                  <SelectItem value="in_progress">面接中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">推奨レベル</label>
              <Select value={filterRecommendation} onValueChange={setFilterRecommendation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="strong_yes">強く推奨</SelectItem>
                  <SelectItem value="yes">推奨</SelectItem>
                  <SelectItem value="maybe">検討</SelectItem>
                  <SelectItem value="no">非推奨</SelectItem>
                  <SelectItem value="strong_no">強く非推奨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">検索</label>
              <Input
                placeholder="セッションIDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">期間</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">過去7日</SelectItem>
                  <SelectItem value="30d">過去30日</SelectItem>
                  <SelectItem value="90d">過去90日</SelectItem>
                  <SelectItem value="all">全期間</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブコンテンツ */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">面接セッション</TabsTrigger>
          <TabsTrigger value="summaries">面接結果</TabsTrigger>
          <TabsTrigger value="analytics">詳細分析</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>面接セッション一覧</CardTitle>
              <CardDescription>
                {filteredSessions.length}件のセッション
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>セッションID</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>開始時刻</TableHead>
                    <TableHead>完了時刻</TableHead>
                    <TableHead>所要時間</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">{session.id}</TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        {session.started_at ? new Date(session.started_at).toLocaleString('ja-JP') : '-'}
                      </TableCell>
                      <TableCell>
                        {session.completed_at ? new Date(session.completed_at).toLocaleString('ja-JP') : '-'}
                      </TableCell>
                      <TableCell>
                        {session.total_duration ? `${Math.floor(session.total_duration / 60)}分${session.total_duration % 60}秒` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summaries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>面接結果サマリー</CardTitle>
              <CardDescription>
                {filteredSummaries.length}件の結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>セッションID</TableHead>
                    <TableHead>総合スコア</TableHead>
                    <TableHead>完了率</TableHead>
                    <TableHead>平均回答時間</TableHead>
                    <TableHead>推奨レベル</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map((summary) => (
                    <TableRow key={summary.session_id}>
                      <TableCell className="font-mono text-sm">{summary.session_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{summary.overall_score}</span>
                          <Progress value={summary.overall_score} className="w-20" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {Math.round(summary.completion_rate * 100)}%
                      </TableCell>
                      <TableCell>
                        {Math.round(summary.average_response_time)}秒
                      </TableCell>
                      <TableCell>
                        {getRecommendationBadge(summary.recommendation)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>スコア分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>90-100点</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <Progress value={15} />
                  
                  <div className="flex items-center justify-between">
                    <span>80-89点</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <Progress value={25} />
                  
                  <div className="flex items-center justify-between">
                    <span>70-79点</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <Progress value={30} />
                  
                  <div className="flex items-center justify-between">
                    <span>60-69点</span>
                    <span className="font-bold">20%</span>
                  </div>
                  <Progress value={20} />
                  
                  <div className="flex items-center justify-between">
                    <span>60点未満</span>
                    <span className="font-bold">10%</span>
                  </div>
                  <Progress value={10} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>推奨レベル分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>強く推奨</span>
                    <span className="font-bold">20%</span>
                  </div>
                  <Progress value={20} className="bg-green-100" />
                  
                  <div className="flex items-center justify-between">
                    <span>推奨</span>
                    <span className="font-bold">35%</span>
                  </div>
                  <Progress value={35} className="bg-blue-100" />
                  
                  <div className="flex items-center justify-between">
                    <span>検討</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <Progress value={25} className="bg-yellow-100" />
                  
                  <div className="flex items-center justify-between">
                    <span>非推奨</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <Progress value={15} className="bg-orange-100" />
                  
                  <div className="flex items-center justify-between">
                    <span>強く非推奨</span>
                    <span className="font-bold">5%</span>
                  </div>
                  <Progress value={5} className="bg-red-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>エクスポート</CardTitle>
              <CardDescription>
                面接結果データをCSV形式でダウンロード
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  面接セッション一覧
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  面接結果サマリー
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  詳細分析レポート
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 