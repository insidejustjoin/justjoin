import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Video,
  Play,
  Pause,
  Volume2,
  FileVideo,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { JobSeeker } from '@/types/JobSeeker';
import { AdvancedFilterModal } from '@/components/AdvancedFilterModal';
import BulkDocumentGenerator from '@/components/BulkDocumentGenerator';

interface InterviewRecording {
  id: string;
  sessionId: string;
  recordingUrl: string;
  duration: number;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
}

interface InterviewStatus {
  isEnabled: boolean;
  isUsed: boolean;
  attemptCount: number;
  firstAttemptAt?: string;
  lastAttemptAt?: string;
}

interface AdvancedFilters {
  ageRange: [number, number];
  experienceRange: [number, number];
  skills: string[];
  gender: string[];
  hasSpouse: boolean | null;
  desiredPosition: string[];
  address: string[];
  registrationDateRange: [Date | null, Date | null];
  hasSelfIntroduction: boolean | null;
  interviewAttempts: number;
}

const AdminJobSeekers: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobSeekers, setSelectedJobSeekers] = useState<Set<number>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [interviewStatuses, setInterviewStatuses] = useState<Record<number, InterviewStatus>>({});
  const [interviewRecordings, setInterviewRecordings] = useState<Record<number, InterviewRecording[]>>({});
  const [selectedJobSeekerForDetails, setSelectedJobSeekerForDetails] = useState<JobSeeker | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [selectedJobSeekerForRecordings, setSelectedJobSeekerForRecordings] = useState<JobSeeker | null>(null);
  
  // フィルター状態
  const [filters, setFilters] = useState<AdvancedFilters>({
    ageRange: [18, 65],
    experienceRange: [0, 20],
    skills: [],
    gender: [],
    hasSpouse: null,
    desiredPosition: [],
    address: [],
    registrationDateRange: [null, null],
    hasSelfIntroduction: null,
    interviewAttempts: 0
  });

  // 管理者権限チェック
  useEffect(() => {
    if (user && user.user_type !== 'admin') {
      navigate('/');
      toast({
        title: "アクセス拒否",
        description: "管理者権限が必要です。",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);

  // 求職者データ取得
  const fetchJobSeekers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/jobseekers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('求職者データの取得に失敗しました');
      }
      
      const data = await response.json();
      console.log('APIレスポンス:', data);
      
      // データの形式をチェックして適切に処理
      let jobSeekersData = [];
      if (Array.isArray(data)) {
        jobSeekersData = data;
      } else if (data && Array.isArray(data.data)) {
        jobSeekersData = data.data;
      } else if (data && data.success && Array.isArray(data.data)) {
        jobSeekersData = data.data;
      } else {
        console.warn('予期しないデータ形式:', data);
        jobSeekersData = [];
      }
      
      console.log('処理後の求職者データ:', jobSeekersData);
      setJobSeekers(jobSeekersData);
      setFilteredJobSeekers(jobSeekersData);
    } catch (error) {
      console.error('求職者データ取得エラー:', error);
      toast({
        title: "エラー",
        description: "求職者データの取得に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 面接状態一括取得
  const fetchAllInterviewStatuses = async () => {
    try {
      const statusPromises = jobSeekers.map(async (jobSeeker) => {
        try {
          const response = await fetch(`/api/documents/admin/interview-status/${jobSeeker.user_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const status = await response.json();
            return { [jobSeeker.user_id]: status };
          }
        } catch (error) {
          console.warn(`面接状態取得エラー (ID: ${jobSeeker.user_id}):`, error);
        }
        return null;
      });
      
      const results = await Promise.all(statusPromises);
      const statusMap: Record<number, InterviewStatus> = {};
      
      results.forEach(result => {
        if (result) {
          Object.assign(statusMap, result);
        }
      });
      
      setInterviewStatuses(statusMap);
    } catch (error) {
      console.error('面接状態一括取得エラー:', error);
    }
  };

  // 面接録画データ取得
  const fetchInterviewRecordings = async (userId: number) => {
    try {
      const response = await fetch(`/api/documents/admin/interview-recordings/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const recordings = await response.json();
        setInterviewRecordings(prev => ({
          ...prev,
          [userId]: recordings
        }));
      } else if (response.status === 404) {
        // 録画データがない場合は空配列を設定
        setInterviewRecordings(prev => ({
          ...prev,
          [userId]: []
        }));
      }
    } catch (error) {
      console.error('面接録画取得エラー:', error);
      // エラーの場合も空配列を設定
      setInterviewRecordings(prev => ({
        ...prev,
        [userId]: []
      }));
    }
  };

  // 面接再有効化
  const resetInterview = async (userId: number) => {
    try {
      const response = await fetch(`/api/documents/admin/interview-reset/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "成功",
          description: "面接が再有効化されました。",
        });
        
        // 面接状態を更新
        fetchAllInterviewStatuses();
      } else {
        throw new Error('面接再有効化に失敗しました');
      }
    } catch (error) {
      console.error('面接再有効化エラー:', error);
      toast({
        title: "エラー",
        description: "面接再有効化に失敗しました。",
        variant: "destructive"
      });
    }
  };

  // 面接状態表示用の関数
  const getInterviewStatusDisplay = (userId: number) => {
    const status = interviewStatuses[userId];
    if (!status) return { text: '確認中...', color: 'bg-gray-100 text-gray-800' };
    
    if (!status.isEnabled) {
      return { text: '無効', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (status.isUsed) {
      return { text: `完了 (${status.attemptCount}回)`, color: 'bg-green-100 text-green-800' };
    }
    
    return { text: `有効 (${status.attemptCount}回)`, color: 'bg-blue-100 text-blue-800' };
  };

  // 初期データ取得
  useEffect(() => {
    if (user && user.user_type === 'admin') {
      fetchJobSeekers();
    }
  }, [user, fetchJobSeekers]);

  // 面接状態取得
  useEffect(() => {
    if (jobSeekers.length > 0) {
      fetchAllInterviewStatuses();
      // 面接録画も同時に取得
      jobSeekers.forEach(jobSeeker => {
        fetchInterviewRecordings(jobSeeker.user_id);
      });
    }
  }, [jobSeekers]);

  // 検索・フィルタリング
  useEffect(() => {
    let filtered = jobSeekers;
    
    // 検索語によるフィルタリング
    if (searchTerm) {
      filtered = filtered.filter(jobSeeker => 
        jobSeeker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobSeeker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobSeeker.phone?.includes(searchTerm)
      );
    }
    
    // 詳細フィルター適用
    if (filters.skills.length > 0) {
      filtered = filtered.filter(jobSeeker => 
        filters.skills.some(skill => 
          jobSeeker.skills && JSON.stringify(jobSeeker.skills).toLowerCase().includes(skill.toLowerCase())
        )
      );
    }
    
    if (filters.gender.length > 0) {
      filtered = filtered.filter(jobSeeker => 
        jobSeeker.gender && filters.gender.includes(jobSeeker.gender)
      );
    }
    
    if (filters.hasSpouse !== null) {
      filtered = filtered.filter(jobSeeker => 
        jobSeeker.hasSpouse === filters.hasSpouse
      );
    }
    
    if (filters.desiredPosition.length > 0) {
      filtered = filtered.filter(jobSeeker => 
        jobSeeker.desiredPosition && 
        filters.desiredPosition.some(position => 
          jobSeeker.desiredPosition?.toLowerCase().includes(position.toLowerCase())
        )
      );
    }
    
    if (filters.address.length > 0) {
      filtered = filtered.filter(jobSeeker => 
        jobSeeker.address && 
        filters.address.some(addr => 
          jobSeeker.address?.toLowerCase().includes(addr.toLowerCase())
        )
      );
    }
    
    if (filters.interviewAttempts > 0) {
      filtered = filtered.filter(jobSeeker => {
        const status = interviewStatuses[jobSeeker.user_id];
        return status && status.attemptCount >= filters.interviewAttempts;
      });
    }
    
    setFilteredJobSeekers(filtered);
  }, [jobSeekers, searchTerm, filters, interviewStatuses]);

  // 全選択・全解除
  const toggleSelectAll = () => {
    if (selectedJobSeekers.size === filteredJobSeekers.length) {
      setSelectedJobSeekers(new Set());
    } else {
      setSelectedJobSeekers(new Set(filteredJobSeekers.map(js => js.user_id)));
    }
  };

  // 個別選択・解除
  const toggleSelection = (userId: number) => {
    const newSelected = new Set(selectedJobSeekers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedJobSeekers(newSelected);
  };

  // 詳細表示モーダルを開く
  const openDetailsModal = (jobSeeker: JobSeeker) => {
    setSelectedJobSeekerForDetails(jobSeeker);
    setShowDetailsModal(true);
  };

  // 録画表示モーダルを開く
  const openRecordingsModal = async (jobSeeker: JobSeeker) => {
    setSelectedJobSeekerForRecordings(jobSeeker);
    setShowRecordingsModal(true);
    
    // 録画データを取得
    await fetchInterviewRecordings(jobSeeker.user_id);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">求職者管理</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAdvancedFilters(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            詳細フィルター
          </Button>
          <Button
            onClick={fetchJobSeekers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="名前、メール、電話番号で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* 選択された求職者に対する操作 */}
      {selectedJobSeekers.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-blue-800">
              {selectedJobSeekers.size}人の求職者が選択されています
            </p>
            <div className="flex gap-2">
              <BulkDocumentGenerator 
                selectedJobSeekers={Array.from(selectedJobSeekers)}
                onComplete={() => setSelectedJobSeekers(new Set())}
              />
            </div>
          </div>
        </div>
      )}

      {/* 求職者一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredJobSeekers.map((jobSeeker) => {
          const interviewStatus = getInterviewStatusDisplay(jobSeeker.user_id);
          const recordings = interviewRecordings[jobSeeker.user_id] || [];
          
          return (
            <Card key={jobSeeker.user_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {jobSeeker.name || '名前未設定'}
                    </CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{jobSeeker.email}</span>
                      </div>
                      {jobSeeker.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{jobSeeker.phone}</span>
                        </div>
                      )}
                      {jobSeeker.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{jobSeeker.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 選択チェックボックス */}
                  <Checkbox
                    checked={selectedJobSeekers.has(jobSeeker.user_id)}
                    onCheckedChange={() => toggleSelection(jobSeeker.user_id)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* 面接状態 */}
                <div className="mb-3">
                  <Badge className={interviewStatus.color}>
                    {interviewStatus.text}
                  </Badge>
                </div>
                
                {/* 面接受験回数 */}
                {interviewStatuses[jobSeeker.user_id]?.attemptCount > 0 && (
                  <div className="mb-3">
                    <Badge variant="secondary" className="text-xs">
                      面接{interviewStatuses[jobSeeker.user_id]?.attemptCount}回
                    </Badge>
                  </div>
                )}
                
                {/* 録画データ */}
                {recordings.length > 0 && (
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <FileVideo className="h-3 w-3" />
                      録画{recordings.length}件
                    </Badge>
                  </div>
                )}
                
                {/* アクションボタン */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDetailsModal(jobSeeker)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    詳細
                  </Button>
                  
                  {recordings.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRecordingsModal(jobSeeker)}
                      className="flex-1"
                    >
                      <Video className="h-3 w-3 mr-1" />
                      録画
                    </Button>
                  )}
                  
                  {interviewStatuses[jobSeeker.user_id]?.isUsed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetInterview(jobSeeker.user_id)}
                      className="flex-1"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      面接再有効化
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 詳細表示モーダル */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>求職者詳細</DialogTitle>
          </DialogHeader>
          
          {selectedJobSeekerForDetails && (
            <div className="space-y-6">
              {/* 基本情報 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">名前</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.name || '未設定'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">メール</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">電話番号</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.phone || '未設定'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">住所</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.address || '未設定'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* 面接情報 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">面接情報</h3>
                {(() => {
                  const status = interviewStatuses[selectedJobSeekerForDetails.user_id];
                  if (!status) return <p className="text-gray-500">確認中...</p>;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">面接状態</label>
                        <Badge className={getInterviewStatusDisplay(selectedJobSeekerForDetails.user_id).color}>
                          {getInterviewStatusDisplay(selectedJobSeekerForDetails.user_id).text}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">受験回数</label>
                        <p className="text-gray-900">{status.attemptCount}回</p>
                      </div>
                      {status.firstAttemptAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">初回受験日</label>
                          <p className="text-gray-900">{new Date(status.firstAttemptAt).toLocaleDateString('ja-JP')}</p>
                        </div>
                      )}
                      {status.lastAttemptAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">最終受験日</label>
                          <p className="text-gray-900">{new Date(status.lastAttemptAt).toLocaleDateString('ja-JP')}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <Separator />
              
              {/* スキル情報 */}
              {selectedJobSeekerForDetails.skills && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">スキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedJobSeekerForDetails.skills).map(([skill, level]) => (
                        <Badge key={skill} variant="secondary">
                          {skill}: {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              
              {/* その他の情報 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">その他の情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">性別</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.gender || '未設定'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">配偶者</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.hasSpouse ? 'あり' : 'なし'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">希望職種</label>
                    <p className="text-gray-900">{selectedJobSeekerForDetails.desiredPosition || '未設定'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">登録日</label>
                    <p className="text-gray-900">
                      {selectedJobSeekerForDetails.created_at 
                        ? new Date(selectedJobSeekerForDetails.created_at).toLocaleDateString('ja-JP')
                        : '未設定'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 録画表示モーダル */}
      <Dialog open={showRecordingsModal} onOpenChange={setShowRecordingsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>面接録画</DialogTitle>
          </DialogHeader>
          
          {selectedJobSeekerForRecordings && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">求職者情報</h4>
                <p className="text-gray-700">
                  {selectedJobSeekerForRecordings.name || '名前未設定'} ({selectedJobSeekerForRecordings.email})
                </p>
              </div>
              
              {(() => {
                const recordings = interviewRecordings[selectedJobSeekerForRecordings.user_id] || [];
                
                if (recordings.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">録画データがありません</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {recordings.map((recording, index) => (
                      <div key={recording.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              面接録画 #{index + 1}
                            </h5>
                            <p className="text-sm text-gray-500">
                              セッションID: {recording.sessionId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={recording.status === 'completed' ? 'default' : 
                                     recording.status === 'processing' ? 'secondary' : 'destructive'}
                            >
                              {recording.status === 'completed' ? '完了' : 
                               recording.status === 'processing' ? '処理中' : 'エラー'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">録画時間</label>
                            <p className="text-gray-900 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {Math.floor(recording.duration / 60)}分{recording.duration % 60}秒
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">録画日時</label>
                            <p className="text-gray-900">
                              {new Date(recording.createdAt).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>
                        
                        {recording.status === 'completed' && recording.recordingUrl && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">録画プレビュー</label>
                            <div className="bg-black rounded-lg overflow-hidden">
                              <video 
                                controls 
                                className="w-full h-64 object-contain"
                                src={recording.recordingUrl}
                              >
                                お使いのブラウザは動画再生をサポートしていません。
                              </video>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={recording.recordingUrl} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  ダウンロード
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 詳細フィルターモーダル */}
      <AdvancedFilterModal
        open={showAdvancedFilters}
        onOpenChange={setShowAdvancedFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
};

export { AdminJobSeekers };