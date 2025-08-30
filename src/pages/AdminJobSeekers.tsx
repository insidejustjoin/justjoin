import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Users, Search, FileText, Download, X, Trash2, Filter, Bell, Send, CheckSquare, Square, Play, MessageSquare, FileSpreadsheet, Eye, Building2, UserPlus, UserMinus } from 'lucide-react';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import DocumentGenerator from '@/components/DocumentGenerator';
import BulkDocumentGenerator from '@/components/BulkDocumentGenerator';
import { JobSeeker } from '@/types/JobSeeker';
import { AdvancedFilterModal } from '@/components/AdvancedFilterModal';
import { QuickFilters } from '@/components/QuickFilters';
import { ActiveFiltersDisplay } from '@/components/ActiveFiltersDisplay';
import { InterviewManagement } from '@/components/InterviewManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobSeekerDetailModal } from '@/components/JobSeekerDetailModal';
import { JobSeekerStatusModal } from '@/components/JobSeekerStatusModal';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_SKILLS } from '@/constants/skills';
import { toast } from '@/hooks/use-toast';


// 共通のJobSeeker型を使用

interface AdvancedFilters {
  searchTerm: string;
  ageValue: number;
  ageCondition: 'gte' | 'lte' | 'eq';
  gender: string;
  nationality: string;
  hasWorkExperience: boolean;
  japaneseLevel: 'all' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'none';
  skillLevelFilters: { [skill: string]: 'all' | 'A' | 'B' | 'C' | 'D' };
  // 資料作成データとの連携を強化
  hasSelfIntroduction: boolean;
  hasPhoto: boolean;
  hasWorkHistory: boolean;
  hasQualifications: boolean;
  spouseStatus: 'all' | 'married' | 'single' | 'other';
  commutingTime: 'all' | '30min' | '1hour' | '1.5hour' | '2hour' | '2hour+';
  interviewAttempts: number; // 追加: 面接受験回数フィルター
}

export function AdminJobSeekers() {
  const { user } = useAuth();
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobSeekers, setSelectedJobSeekers] = useState<JobSeeker[]>([]);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 求職者ステータス管理用の状態
  const [jobSeekerStatuses, setJobSeekerStatuses] = useState<{[key: string]: any[]}>({
    active: [],
    employed: [],
    withdrawn: []
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusJobSeeker, setSelectedStatusJobSeeker] = useState<any>(null);
  
  // 一括操作用の状態
  const [isSelectAll, setIsSelectAll] = useState(false);
  
  // 面接状態管理
  const [interviewStatuses, setInterviewStatuses] = useState<{[key: string]: any}>({});
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  
  // 面接録画管理
  const [interviewRecordings, setInterviewRecordings] = useState<{[key: string]: any[]}>({});
  const [loadingRecordings, setLoadingRecordings] = useState<{[key: string]: boolean}>({});
  
  // スポット通知用の状態
  const [showSpotNotificationModal, setShowSpotNotificationModal] = useState(false);
  const [spotNotificationData, setSpotNotificationData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error'
  });

  // 詳細表示モーダル用の状態
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailJobSeeker, setSelectedDetailJobSeeker] = useState<JobSeeker | null>(null);

  // フィルター状態を追加
  const [currentFilters, setCurrentFilters] = useState<AdvancedFilters>({
    searchTerm: '',
    ageValue: 0,
    ageCondition: 'gte',
    gender: 'all',
    nationality: 'all',
    hasWorkExperience: false,
    japaneseLevel: 'all',
    skillLevelFilters: {},
    hasSelfIntroduction: false,
    hasPhoto: false,
    hasWorkHistory: false,
    hasQualifications: false,
    spouseStatus: 'all',
    commutingTime: 'all',
    interviewAttempts: 0, // 追加: 面接受験回数フィルターの初期値
  });
  
  const CACHE_DURATION = 10 * 60 * 1000; // 10分に延長

  // 全ユーザーの書類データを一括で取得する関数
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  const loadAllDocumentData = async () => {
    if (jobSeekers.length === 0 || isLoadingDocuments) return;
    
    setIsLoadingDocuments(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('認証トークンが見つかりません');
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      console.log('Loading document data for', jobSeekers.length, 'users...');
      
      // 書類データ読み込み状態を表示
      // setDocumentDataLoading(true); // この行は削除
      
      // 各求職者の書類データを並行して取得
      const promises = jobSeekers.map(async (jobSeeker) => {
        try {
          const response = await fetch(`${apiUrl}/api/documents/${jobSeeker.user_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              console.log(`Document data loaded for user ${jobSeeker.user_id}:`, result.data);
              console.log(`Gender data for user ${jobSeeker.user_id}:`, result.data.gender);
              return { userId: jobSeeker.user_id, data: result.data };
            } else {
              console.log(`No document data for user ${jobSeeker.user_id}`);
            }
          } else if (response.status === 404) {
            // 404の場合は書類データが存在しないので、スキップ
            console.log(`No documents found for user ${jobSeeker.user_id} (404)`);
            return null;
          } else {
            console.log(`Failed to load document data for user ${jobSeeker.user_id}:`, response.status);
          }
          return null;
        } catch (error) {
          console.error(`Error loading document data for user ${jobSeeker.user_id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      
      // 書類データを取得した求職者の情報を更新
      const updatedJobSeekers = jobSeekers.map(jobSeeker => {
        const documentData = results.find(result => result?.userId === jobSeeker.user_id)?.data;
        if (documentData) {
          return {
            ...jobSeeker,
            certificateStatus: documentData.certificateStatus,
            gender: documentData.gender || jobSeeker.gender,
            skillLevels: documentData.skillLevels || jobSeeker.skillLevels,
            detailed_info: {
              ...jobSeeker.detailed_info,
              documentData: documentData
            }
            // その他の必要なデータも更新
          };
        }
        return jobSeeker;
      });
      
      // 更新された求職者データを状態に反映
      setJobSeekers(updatedJobSeekers);
      setFilteredJobSeekers(updatedJobSeekers);
      
      console.log('Updated job seekers with document data:', updatedJobSeekers);
    } catch (error) {
      console.error('Error loading all document data:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const isCacheValid = () => {
    return lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION;
  };

  // 面接状態を取得する関数
  const fetchInterviewStatus = async (userId: string | number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/documents/admin/interview-status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('面接状態取得エラー:', error);
    }
    return null;
  };

  // 面接状態を一括取得する関数
  const fetchAllInterviewStatuses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 各求職者の面接状態を並行して取得
      const statusPromises = filteredJobSeekers.map(async (jobSeeker) => {
        const status = await fetchInterviewStatus(jobSeeker.user_id);
        return { userId: jobSeeker.user_id, status };
      });

      const results = await Promise.allSettled(statusPromises);
      
      const newStatuses: { [key: string]: any } = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.status) {
          newStatuses[result.value.userId] = result.value.status;
        }
      });

      setInterviewStatuses(prev => ({ ...prev, ...newStatuses }));
    } catch (error) {
      console.error('面接状態一括取得エラー:', error);
    }
  };

  // 面接録画を取得する関数
  const fetchInterviewRecordings = async (userId: string) => {
    try {
      setLoadingRecordings(prev => ({ ...prev, [userId]: true }));
      
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/documents/admin/interview-recordings/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setInterviewRecordings(prev => ({
            ...prev,
            [userId]: result.data.recordings || []
          }));
        }
      }
    } catch (error) {
      console.error('面接録画取得エラー:', error);
      toast({
        title: "エラー",
        description: "面接録画の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoadingRecordings(prev => ({ ...prev, [userId]: false }));
    }
  };

  // 面接録画をダウンロードする関数
  const downloadInterviewRecording = async (recordingId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/documents/admin/interview-recording/${recordingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "成功",
          description: "面接録画のダウンロードが完了しました",
        });
      } else {
        throw new Error('ダウンロードに失敗しました');
      }
    } catch (error) {
      console.error('面接録画ダウンロードエラー:', error);
      toast({
        title: "エラー",
        description: "面接録画のダウンロードに失敗しました",
        variant: "destructive",
      });
    }
  };

  const forceRefresh = () => {
    setLastFetchTime(null);
    setDocumentDataLoaded(false);
    fetchJobSeekers(true);
  };

  const fetchJobSeekers = async (force = false) => {
    if (!force && !isCacheValid()) {
      return;
    }

    if (force) {
      setDocumentDataLoaded(false);
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('認証トークンが見つかりません');
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/admin/jobseekers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(Array.from(response.headers.entries())));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success) {
        const jobSeekersData = data.jobSeekers || [];
        console.log('Job seekers data:', jobSeekersData);
        setJobSeekers(jobSeekersData);
        setFilteredJobSeekers(jobSeekersData);
        setLastFetchTime(Date.now());
        
        // 各求職者の面接状態を取得
        jobSeekersData.forEach(jobSeeker => {
          fetchInterviewStatus(jobSeeker.user_id);
        });
        
        if (jobSeekersData.length === 0) {
          setError('求職者データが見つかりませんでした');
        }
      } else {
        console.error('API returned error:', data);
        setError(data.message || '求職者データの取得に失敗しました');
      }
    } catch (error) {
      console.error('求職者データ取得エラー:', error);
      setError(`求職者データの取得中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 求職者ステータスデータを取得する関数
  const fetchJobSeekerStatuses = async () => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('認証トークンが見つかりません');
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 各ステータスの求職者データを取得
      const [activeResponse, employedResponse, withdrawnResponse] = await Promise.all([
        fetch(`${apiUrl}/api/job-seeker-status/admin/status?status=active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/job-seeker-status/admin/status?status=employed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/job-seeker-status/admin/status?status=withdrawn`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const activeData = activeResponse.ok ? await activeResponse.json() : { data: [] };
      const employedData = employedResponse.ok ? await employedResponse.json() : { data: [] };
      const withdrawnData = withdrawnResponse.ok ? await withdrawnResponse.json() : { data: [] };

      setJobSeekerStatuses({
        active: activeData.data || [],
        employed: employedData.data || [],
        withdrawn: withdrawnData.data || []
      });

    } catch (error) {
      console.error('求職者ステータス取得エラー:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // 求職者データを取得（キャッシュが無効または未取得時に実行）
  useEffect(() => {
    if (!isCacheValid()) {
      fetchJobSeekers();
    }
  }, []);

  // 求職者ステータスデータを取得
  useEffect(() => {
    fetchJobSeekerStatuses();
  }, []);

  // 面接状態を自動取得
  useEffect(() => {
    if (filteredJobSeekers.length > 0) {
      fetchAllInterviewStatuses();
    }
  }, [filteredJobSeekers]);

  // 求職者データが取得された後に書類データを読み込む（一度だけ）
  const [documentDataLoaded, setDocumentDataLoaded] = useState(false);
  
  useEffect(() => {
    if (jobSeekers.length > 0 && !documentDataLoaded) {
      setDocumentDataLoaded(true);
      loadAllDocumentData();
    }
  }, [jobSeekers, documentDataLoaded]);

  // フィルターが変更されたら自動的に適用
  useEffect(() => {
    if (jobSeekers.length > 0) {
      console.log('Auto-applying filters due to currentFilters change');
      applyFilters(jobSeekers, currentFilters);
    }
  }, [currentFilters, jobSeekers]);

  const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getDisplayAge = (seeker: JobSeeker) => {
    if (seeker.age !== undefined) return seeker.age;
    if (seeker.date_of_birth) {
      const age = getAge(seeker.date_of_birth);
      return age;
    }
    return null;
  };

  const getGenderLabel = (gender: string) => {
    // 英語の性別データ
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: break;
    }
    
    // 日本語の性別データ
    switch (gender) {
      case '男性': return '男性';
      case '女性': return '女性';
      case 'その他': return 'その他';
      default: return '未設定';
    }
  };

  // 生年月日から年齢を計算する関数
  const calculateAge = (birthDateStr: string): number | null => {
    if (!birthDateStr) return null;
    
    try {
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) return null;
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('年齢計算エラー:', error);
      return null;
    }
  };

  const openDocumentGenerator = (jobSeeker: JobSeeker) => {
    setSelectedJobSeeker(jobSeeker);
    setShowDocumentGenerator(true);
    
    // DocumentGeneratorからデータを取得するために、既存のデータを読み込む
    // loadDocumentDataForJobSeeker(jobSeeker.user_id); // この行は削除
  };

  // 特定の求職者の書類データを読み込む
  const loadDocumentDataForJobSeeker = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('認証トークンが見つかりません');
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/documents/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // setDocumentData(prev => ({ // この行は削除
          //   ...prev, // この行は削除
          //   [userId]: result.data // この行は削除
          // })); // この行は削除
        }
      }
    } catch (error) {
      console.error('書類データ読み込みエラー:', error);
    }
  };

  const closeDocumentGenerator = () => {
    setShowDocumentGenerator(false);
    setSelectedJobSeeker(null);
    
    // 書類生成が閉じられた後に、全データを再読み込み
    setTimeout(() => {
      // loadAllDocumentData(); // この行は削除
    }, 500);
  };

  // 詳細表示モーダルの開閉
  const openDetailModal = (jobSeeker: JobSeeker) => {
    setSelectedDetailJobSeeker(jobSeeker);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDetailJobSeeker(null);
  };

  const handleApplyAdvancedFilters = (filters: AdvancedFilters) => {
    setCurrentFilters(filters);
    applyFilters(jobSeekers, filters); // フィルターが変更されたら求職者リストを更新
  };

  const handleClearAdvancedFilters = () => {
    const emptyFilters: AdvancedFilters = {
      searchTerm: '',
      ageValue: 0,
      ageCondition: 'gte',
      gender: 'all',
      nationality: 'all',
      hasWorkExperience: false,
      japaneseLevel: 'all',
      skillLevelFilters: {},
      hasSelfIntroduction: false,
      hasPhoto: false,
      hasWorkHistory: false,
      hasQualifications: false,
      spouseStatus: 'all',
      commutingTime: 'all',
      interviewAttempts: 0, // 追加: 面接受験回数フィルターのクリア
    };
    setCurrentFilters(emptyFilters);
    applyFilters(jobSeekers, emptyFilters); // フィルタークリア時も求職者リストを更新
  };

  // フィルタリングロジック
  const applyFilters = (jobSeekers: JobSeeker[], filters: AdvancedFilters): JobSeeker[] => {
    console.log('Applying filters:', filters);
    
    const filteredResult = jobSeekers.filter(jobSeeker => {
      // 検索語フィルター
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableText = [
          jobSeeker.full_name,
          jobSeeker.email,
          jobSeeker.user_email,
          jobSeeker.phone,
          jobSeeker.nationality,
          jobSeeker.desired_job_title,
          jobSeeker.self_introduction
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // 年齢フィルター
      if (filters.ageValue > 0) {
        const age = getDisplayAge(jobSeeker);
        if (age !== null) {
          switch (filters.ageCondition) {
            case 'gte':
              if (age < filters.ageValue) return false;
              break;
            case 'lte':
              if (age > filters.ageValue) return false;
              break;
            case 'eq':
              if (age !== filters.ageValue) return false;
              break;
          }
        }
      }

      // 性別フィルター
      if (filters.gender !== 'all') {
        const gender = jobSeeker.gender as string;
        const filterGender = filters.gender;
        
        console.log(`Gender filter: ${filterGender}, user gender: ${gender}`);
        
        // 英語と日本語の性別データを正しく処理
        const genderMatches = 
          (filterGender === 'male' && (gender === 'male' || gender === '男性')) ||
          (filterGender === 'female' && (gender === 'female' || gender === '女性')) ||
          (filterGender === 'other' && (gender === 'other' || gender === 'その他'));
        
        if (!genderMatches) {
          console.log(`Gender filter failed for user: ${jobSeeker.full_name}`);
          return false;
        }
      }

      // 国籍フィルター
      if (filters.nationality !== 'all' && jobSeeker.nationality !== filters.nationality) {
        return false;
      }

      // 日本語レベルフィルター
      if (filters.japaneseLevel !== 'all') {
        const japaneseLevel = jobSeeker.certificateStatus?.name || jobSeeker.japaneseLevel || jobSeeker.japanese_level;
        
        console.log(`Japanese level filter: ${filters.japaneseLevel}, user level: ${japaneseLevel}`);
        
        if (filters.japaneseLevel === 'none') {
          if (japaneseLevel && japaneseLevel !== 'none' && japaneseLevel !== 'なし') return false;
        } else {
          // レベル別フィルタリング（N1 > N2 > N3 > N4 > N5 > なし）
          const levelOrder = { 'N1': 5, 'N2': 4, 'N3': 3, 'N4': 2, 'N5': 1, 'none': 0, 'なし': 0 };
          const userLevel = levelOrder[japaneseLevel as keyof typeof levelOrder] || 0;
          const filterLevel = levelOrder[filters.japaneseLevel as keyof typeof levelOrder] || 0;
          
          console.log(`Japanese level comparison: user=${userLevel}, filter=${filterLevel}`);
          
          if (userLevel < filterLevel) {
            console.log(`Japanese level filter failed for user: ${jobSeeker.full_name}`);
            return false;
          }
        }
      }

      // 職歴フィルター
      if (filters.hasWorkExperience && (!jobSeeker.experience_years || jobSeeker.experience_years === 0)) {
        return false;
      }

      // 自己紹介フィルター
      if (filters.hasSelfIntroduction && !jobSeeker.self_introduction) {
        return false;
      }

      // 写真フィルター
      if (filters.hasPhoto && !jobSeeker.profile_photo) {
        return false;
      }

      // 職歴書フィルター
      if (filters.hasWorkHistory) {
        // 職務経歴の有無をチェック（APIから取得した書類データを使用）
        const workExperience = jobSeeker.detailed_info?.documentData?.resume?.workExperience;
        const hasWorkHistory = workExperience && 
                              Array.isArray(workExperience) &&
                              workExperience.length > 0 &&
                              workExperience.some((exp: any) => 
                                exp.year && exp.month && exp.content
                              );
        
        if (!hasWorkHistory) {
          return false;
        }
      }

      // 資格フィルター
      if (filters.hasQualifications) {
        // 資格の有無をチェック（実装が必要）
        // 現在はスキップ
      }

      // 面接受験回数フィルター
      if (filters.interviewAttempts > 0) {
        const attemptCount = jobSeeker.interview_attempts?.count || 0;
        if (attemptCount < filters.interviewAttempts) {
          return false;
        }
      }

      // 配偶者フィルター
      if (filters.spouseStatus !== 'all') {
        const spouse = jobSeeker.spouse;
        if (filters.spouseStatus === 'married' && spouse !== 'married') return false;
        if (filters.spouseStatus === 'single' && spouse !== 'single') return false;
        if (filters.spouseStatus === 'other' && spouse !== 'other') return false;
      }

      // 通勤時間フィルター
      if (filters.commutingTime !== 'all') {
        const commutingTime = jobSeeker.commuting_time;
        if (filters.commutingTime === '30min' && commutingTime !== '30min') return false;
        if (filters.commutingTime === '1hour' && commutingTime !== '1hour') return false;
        if (filters.commutingTime === '1.5hour' && commutingTime !== '1.5hour') return false;
        if (filters.commutingTime === '2hour' && commutingTime !== '2hour') return false;
        if (filters.commutingTime === '2hour+' && commutingTime !== '2hour+') return false;
      }

      // スキルレベルフィルター
      const skillLevelFilters = filters.skillLevelFilters;
      if (Object.keys(skillLevelFilters).length > 0) {
        // 書類データからスキルレベルを取得
        const skillSheet = jobSeeker.detailed_info?.documentData?.skillSheet?.skills || {};
        
        console.log(`Skill level filters:`, skillLevelFilters);
        console.log(`User skill sheet:`, skillSheet);
        
        for (const [skillName, requiredLevel] of Object.entries(skillLevelFilters)) {
          if (requiredLevel === 'all') continue;
          
          const skillData = skillSheet[skillName];
          const userLevel = skillData?.evaluation;
          
          console.log(`Checking skill ${skillName}: required=${requiredLevel}, user=${userLevel}`);
          
          // スキルレベルが存在しない場合は除外
          if (!userLevel) {
            console.log(`Skill ${skillName} not found for user: ${jobSeeker.full_name}`);
            return false;
          }
          
          // レベル順序: A > B > C > D > E
          const levelOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
          const userLevelValue = levelOrder[userLevel] || 0;
          const requiredLevelValue = levelOrder[requiredLevel as keyof typeof levelOrder] || 0;
          
          console.log(`Skill level comparison for ${skillName}: user=${userLevelValue}, required=${requiredLevelValue}`);
          
          if (userLevelValue < requiredLevelValue) {
            console.log(`Skill level filter failed for ${skillName} in user: ${jobSeeker.full_name}`);
            return false;
          }
        }
      }

      return true;
    });
    
        console.log(`Filtering result: ${filteredResult.length} users out of ${jobSeekers.length}`);
    return filteredResult;
  };

  // フィルタ変更時に求職者リストを更新
  useEffect(() => {
    if (jobSeekers.length > 0) {
      const filtered = applyFilters(jobSeekers, currentFilters);
      setFilteredJobSeekers(filtered);
    }
  }, [jobSeekers, currentFilters]);

  // 利用可能なスキルを取得
  const getAvailableSkills = (): string[] => {
    return ALL_SKILLS;
  };

  const toggleJobSeekerSelection = (jobSeeker: JobSeeker) => {
    setSelectedJobSeekers(prev => {
      const isSelected = prev.some(selected => selected.id === jobSeeker.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== jobSeeker.id);
      } else {
        return [...prev, jobSeeker];
      }
    });
  };

  const toggleAllJobSeekers = () => {
    if (selectedJobSeekers.length === filteredJobSeekers.length) {
      setSelectedJobSeekers([]);
    } else {
      setSelectedJobSeekers([...filteredJobSeekers]);
    }
  };

  const deleteJobSeeker = async (id: string, name: string) => {
    if (!confirm(`求職者「${name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('認証トークンが見つかりません');
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/admin/jobseekers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setJobSeekers(prev => prev.filter(seeker => seeker.id !== id));
        setFilteredJobSeekers(prev => prev.filter(seeker => seeker.id !== id));
        setSelectedJobSeekers(prev => prev.filter(seeker => seeker.id !== id));
        alert('求職者を削除しました');
        
        // ステータスデータも更新
        fetchJobSeekerStatuses();
      } else {
        alert('削除に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // ステータス変更モーダルを開く
  const openStatusModal = (jobSeeker: any) => {
    setSelectedStatusJobSeeker(jobSeeker);
    setShowStatusModal(true);
  };

  // ステータス変更後の処理
  const handleStatusChange = () => {
    fetchJobSeekerStatuses();
    fetchJobSeekers(true);
  };

  // 一括選択の処理
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedJobSeekers([]);
      setIsSelectAll(false);
    } else {
      setSelectedJobSeekers([...filteredJobSeekers]);
      setIsSelectAll(true);
    }
  };

  const handleSelectJobSeeker = (jobSeeker: JobSeeker) => {
    setSelectedJobSeekers(prev => {
      const isSelected = prev.some(js => js.id === jobSeeker.id);
      if (isSelected) {
        return prev.filter(js => js.id !== jobSeeker.id);
      } else {
        return [...prev, jobSeeker];
      }
    });
  };

  const isJobSeekerSelected = (jobSeeker: JobSeeker) => {
    return selectedJobSeekers.some(js => js.id === jobSeeker.id);
  };

  // 面接開始一括処理
  const startBulkInterviews = async () => {
    if (selectedJobSeekers.length === 0) {
      toast({
        title: "エラー",
        description: "面接を開始する求職者を選択してください",
        variant: "destructive",
      });
      return;
    }

    setBulkOperationLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "エラー",
          description: "認証トークンが見つかりません",
          variant: "destructive",
        });
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 各求職者に対して面接トークンを生成
      const results = await Promise.allSettled(
        selectedJobSeekers.map(async (jobSeeker) => {
          const response = await fetch(`${apiUrl}/api/documents/interview-token/${jobSeeker.user_id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            return { success: true, jobSeeker, token: result.data.token };
          } else {
            return { success: false, jobSeeker, error: 'トークン生成に失敗' };
          }
        })
      );

      const successfulInterviews = results
        .filter((result): result is PromiseFulfilledResult<{ success: true; jobSeeker: JobSeeker; token: string }> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value);

      const failedInterviews = results
        .filter((result): result is PromiseFulfilledResult<{ success: false; jobSeeker: JobSeeker; error: string }> => 
          result.status === 'fulfilled' && !result.value.success
        )
        .map(result => result.value);

      // 成功した面接のURLを表示
      if (successfulInterviews.length > 0) {
        const urls = successfulInterviews.map(item => 
          `${item.jobSeeker.full_name}: https://interview.justjoin.jp?token=${item.token}`
        ).join('\n');
        
        // クリップボードにコピー
        await navigator.clipboard.writeText(urls);
        
        // 面接開始URLをアラートで表示
        const interviewUrls = successfulInterviews.map(item => 
          `【${item.jobSeeker.full_name}】\nhttps://interview.justjoin.jp?token=${item.token}\n`
        ).join('\n');
        
        alert(`面接開始URLをクリップボードにコピーしました。\n\n${interviewUrls}\n\n※求職者はログインしていないとinterview.justjoin.jpにアクセスできません。`);
        
        toast({
          title: "面接開始URL生成完了",
          description: `${successfulInterviews.length}件の面接URLをクリップボードにコピーしました。`,
        });
      }

      if (failedInterviews.length > 0) {
        toast({
          title: "一部の面接開始に失敗",
          description: `${failedInterviews.length}件の面接開始に失敗しました。`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('面接開始エラー:', error);
      toast({
        title: "エラー",
        description: "面接開始中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // 面接URLを再有効化する機能
  const resetInterview = async (jobSeeker: JobSeeker) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "エラー",
          description: "認証トークンが見つかりません",
          variant: "destructive",
        });
        return;
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      const response = await fetch(`${apiUrl}/api/documents/admin/interview-reset/${jobSeeker.user_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "面接再有効化完了",
          description: `${jobSeeker.full_name}の面接が再有効化されました`,
        });
        
        // 求職者リストを再読み込み
        fetchJobSeekers(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "エラー",
          description: errorData.message || "面接再有効化に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('面接再有効化エラー:', error);
      toast({
        title: "エラー",
        description: "面接再有効化中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // スポット通知一括送信
  const sendBulkSpotNotification = async () => {
    const targetJobSeekers = selectedJobSeekers.length > 0 ? selectedJobSeekers : filteredJobSeekers;
    
    if (targetJobSeekers.length === 0) {
      toast({
        title: "エラー",
        description: "通知を送信する求職者が見つかりません",
        variant: "destructive",
      });
      return;
    }

    if (!spotNotificationData.title || !spotNotificationData.message) {
      toast({
        title: "エラー",
        description: "通知のタイトルとメッセージを入力してください",
        variant: "destructive",
      });
      return;
    }

    setBulkOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンが見つかりません');
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // スポット通知を送信（履歴も保存される）
      const response = await fetch(`${apiUrl}/api/notifications/admin/send-spot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: spotNotificationData.title,
          message: spotNotificationData.message,
          type: spotNotificationData.type,
          targetUsers: selectedJobSeekers.length > 0 ? 'selected' : 'all',
          selectedUserIds: selectedJobSeekers.length > 0 ? selectedJobSeekers.map(js => js.user_id) : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('スポット通知の送信に失敗しました');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'スポット通知の送信に失敗しました');
      }

      // 成功メッセージを表示
      const targetType = selectedJobSeekers.length > 0 ? '選択された求職者' : 'フィルタ結果の全員';
      const recipientCount = selectedJobSeekers.length > 0 ? selectedJobSeekers.length : filteredJobSeekers.length;
      
      toast({
        title: "スポット通知送信完了",
        description: `${recipientCount}件の通知を${targetType}に送信しました`,
      });

      // モーダルを閉じる
      setShowSpotNotificationModal(false);
      setSpotNotificationData({ title: '', message: '', type: 'info' });

    } catch (error) {
      console.error('通知送信エラー:', error);
      toast({
        title: "エラー",
        description: "通知送信中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Excel一覧抽出
  const exportToExcel = () => {
    if (filteredJobSeekers.length === 0) {
      toast({
        title: "エラー",
        description: "エクスポートするデータがありません",
        variant: "destructive",
      });
      return;
    }

    try {
      // CSVデータの作成
      const headers = ['名前', '年齢', '性別', '国籍', 'メールアドレス', '電話番号', '希望職種', '経験年数'];
      const csvData = [
        headers.join(','),
        ...filteredJobSeekers.map(seeker => [
          seeker.full_name || '',
          getDisplayAge(seeker) || '',
          getGenderLabel(seeker.gender || ''),
          seeker.nationality || '',
          seeker.email || seeker.user_email || '',
          seeker.phone || '',
          seeker.desired_job_title || '',
          seeker.experience_years || 0
        ].join(','))
      ].join('\n');

      // BOMを追加して日本語文字化けを防ぐ
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });
      
      // ダウンロード
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `求職者一覧_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "エクスポート完了",
        description: `${filteredJobSeekers.length}件のデータをCSVファイルでダウンロードしました`,
      });

    } catch (error) {
      console.error('エクスポートエラー:', error);
      toast({
        title: "エラー",
        description: "エクスポート中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // 面接状態表示のヘルパー関数
  const getInterviewStatusDisplay = (userId: string | number) => {
    const status = interviewStatuses[userId];
    if (!status) return { text: '読み込み中...', color: 'bg-gray-100 text-gray-600' };
    
    switch (status.status) {
      case 'not_public':
        return { text: '公開前', color: 'bg-gray-100 text-gray-600' };
      case 'not_created':
        return { text: '受験前', color: 'bg-blue-100 text-blue-700' };
      case 'available':
        return { text: '受験前', color: 'bg-blue-100 text-blue-700' };
      case 'completed':
        return { text: '受験完了', color: 'bg-green-100 text-green-700' };
      default:
        return { text: '不明', color: 'bg-gray-100 text-gray-600' };
    }
  };

  // 面接のオンオフ機能
  const toggleInterviewVisibility = async (enabled: boolean) => {
    if (selectedJobSeekers.length === 0) {
      toast({
        title: "エラー",
        description: "面接表示を制御する求職者を選択してください",
        variant: "destructive",
      });
      return;
    }

    setBulkOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンが見つかりません');
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 各求職者に対して面接表示設定を更新
      const results = await Promise.allSettled(
        selectedJobSeekers.map(async (jobSeeker) => {
          const response = await fetch(`${apiUrl}/api/documents/admin/jobseekers/${jobSeeker.id}/interview-visibility`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              interviewEnabled: enabled
            }),
          });
          
          if (response.ok) {
            return { success: true, jobSeeker };
          } else {
            return { success: false, jobSeeker, error: '設定更新に失敗' };
          }
        })
      );

      const successfulUpdates = results
        .filter((result): result is PromiseFulfilledResult<{ success: true; jobSeeker: JobSeeker }> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value);

      const failedUpdates = results
        .filter((result): result is PromiseFulfilledResult<{ success: false; jobSeeker: JobSeeker; error: string }> => 
          result.status === 'fulfilled' && !result.value.success
        )
        .map(result => result.value);

      if (successfulUpdates.length > 0) {
        toast({
          title: "面接表示設定更新完了",
          description: `${successfulUpdates.length}件の面接表示設定を${enabled ? '有効' : '無効'}にしました`,
        });
        
        // 求職者データを再取得
        fetchJobSeekers();
      }

      if (failedUpdates.length > 0) {
        toast({
          title: "一部の設定更新に失敗",
          description: `${failedUpdates.length}件の設定更新に失敗しました`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('面接表示設定更新エラー:', error);
      toast({
        title: "エラー",
        description: "面接表示設定の更新中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // フィルターコンポーネントの状態を管理
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [filterChange, setFilterChange] = useState(0); // フィルターが変更されたことを検知

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setFilterChange(prev => prev + 1); // フィルターが変更されたことを検知
  };

  const handleClearFilters = () => {
    const emptyFilters: AdvancedFilters = {
      searchTerm: '',
      ageValue: 0,
      ageCondition: 'gte',
      gender: 'all',
      nationality: 'all',
      hasWorkExperience: false,
      japaneseLevel: 'all',
      skillLevelFilters: {},
      hasSelfIntroduction: false,
      hasPhoto: false,
      hasWorkHistory: false,
      hasQualifications: false,
      spouseStatus: 'all',
      commutingTime: 'all',
      interviewAttempts: 0, // 追加: 面接受験回数フィルターのクリア
    };
    setCurrentFilters(emptyFilters);
    setFilterChange(prev => prev + 1); // フィルターが変更されたことを検知
  };

  const handleRemoveFilter = (key: keyof AdvancedFilters, value: any) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setFilterChange(prev => prev + 1);
  };

  return (
    <AdminPageLayout title="管理者ダッシュボード">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">求職者管理</h1>
            <p className="text-muted-foreground">求職者の管理と書類生成を行います</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Current jobSeekers:', jobSeekers);
                // console.log('Current documentData:', documentData); // この行は削除
                console.log('Current filteredJobSeekers:', filteredJobSeekers);
              }}
            >
              デバッグ情報
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={forceRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </div>

        {/* フィルタセクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              フィルタ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* クイックフィルター */}
              <QuickFilters
                filters={currentFilters}
                onFilterChange={handleFilterChange}
              />
              
              {/* アクティブフィルター表示 */}
              <ActiveFiltersDisplay
                filters={currentFilters}
                onClearFilter={handleRemoveFilter}
                onClearAll={handleClearFilters}
              />
              
              {/* 詳細フィルター */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilterModal(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  詳細フィルター
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  フィルタークリア
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 一括操作バー */}
        {filteredJobSeekers.length > 0 && selectedJobSeekers.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedJobSeekers.length}件の求職者が選択されています
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleInterviewVisibility(true)}
                    disabled={bulkOperationLoading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    面接有効化
                  </Button>
                  <Button
                    onClick={() => toggleInterviewVisibility(false)}
                    disabled={bulkOperationLoading}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    面接無効化
                  </Button>

                  <Button
                    onClick={() => setShowSpotNotificationModal(true)}
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    スポット通知
                  </Button>
                  <Button
                    onClick={() => setShowDocumentGenerator(true)}
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    書類一括作成
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel抽出
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* フィルタ結果に対する一括操作バー */}
        {filteredJobSeekers.length > 0 && selectedJobSeekers.length === 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-orange-800">
                    フィルタ結果: {filteredJobSeekers.length}件の求職者が表示されています
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowSpotNotificationModal(true)}
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    全員にスポット通知
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    フィルタ結果をExcel抽出
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 求職者管理タブ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">求職者一覧</TabsTrigger>
            <TabsTrigger value="employed">就職済み一覧</TabsTrigger>
            <TabsTrigger value="withdrawn">退会済み一覧</TabsTrigger>
          </TabsList>

          {/* 求職者一覧タブ */}
          <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">データを読み込み中...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredJobSeekers.length === 0 ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                条件に一致する求職者が見つかりませんでした。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* 一括選択ヘッダー */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {isSelectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {isSelectAll ? '全選択解除' : '全選択'}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedJobSeekers.length} / {filteredJobSeekers.length} 選択中
                </span>
              </div>

              {/* 求職者カード */}
              {filteredJobSeekers.map((jobSeeker) => (
                <Card key={jobSeeker.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* 選択チェックボックス */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectJobSeeker(jobSeeker)}
                          className={`flex items-center gap-2 ${
                            isJobSeekerSelected(jobSeeker) 
                              ? 'bg-blue-100 border-blue-300' 
                              : 'bg-white'
                          }`}
                        >
                          {isJobSeekerSelected(jobSeeker) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>

                        {/* 顔写真 */}
                        <div className="flex-shrink-0">
                          {jobSeeker.profile_photo ? (
                            <div className="w-[76px] h-[102px]">
                              <img
                                src={jobSeeker.profile_photo}
                                alt={`${jobSeeker.full_name}の写真`}
                                className="w-full h-full object-cover rounded-lg border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-[76px] h-[102px] bg-gray-200 rounded-lg border flex items-center justify-center">
                              <span className="text-gray-500 text-xs">写真なし</span>
                            </div>
                          )}
                        </div>

                        {/* 求職者情報 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {jobSeeker.full_name || '名前未設定'}
                            </h3>
                            <Badge variant="secondary">
                              {getDisplayAge(jobSeeker) ? `${getDisplayAge(jobSeeker)}歳` : '年齢未設定'}
                            </Badge>
                            <Badge variant="outline">
                              {getGenderLabel(jobSeeker.gender || '')}
                            </Badge>
                            {jobSeeker.nationality && (
                              <Badge variant="outline">
                                {jobSeeker.nationality}
                              </Badge>
                            )}
                            {/* 面接表示状態バッジ */}
                            <Badge 
                              variant={jobSeeker.interviewEnabled ? "default" : "secondary"}
                              className={jobSeeker.interviewEnabled ? "bg-green-500" : "bg-gray-400"}
                            >
                              {jobSeeker.interviewEnabled ? "面接有効" : "面接無効"}
                            </Badge>
                            
                            {/* 面接状態バッジ */}
                            <Badge 
                              variant="outline"
                              className={`${getInterviewStatusDisplay(jobSeeker.user_id).color}`}
                            >
                              {getInterviewStatusDisplay(jobSeeker.user_id).text}
                            </Badge>
                            
                            {/* 面接受験回数バッジ */}
                            {jobSeeker.interview_attempts && jobSeeker.interview_attempts.count > 0 && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                面接{jobSeeker.interview_attempts.count}回
                              </Badge>
                            )}
                            
                            {/* 面接再有効化ボタン（面接完了時のみ表示） */}
                            {getInterviewStatusDisplay(jobSeeker.user_id).text === '受験完了' && (
                              <Button
                                onClick={() => resetInterview(jobSeeker)}
                                size="sm"
                                variant="outline"
                                className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                再有効化
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>生年月日:</strong> {jobSeeker.date_of_birth ? new Date(jobSeeker.date_of_birth).toLocaleDateString('ja-JP') : '未設定'}</p>
                              <p><strong>国籍:</strong> {jobSeeker.nationality || '未設定'}</p>
                              <p><strong>日本語資格:</strong> {jobSeeker.certificateStatus?.name || '未設定'}</p>
                              <p><strong>メール:</strong> {jobSeeker.email || jobSeeker.user_email || '未設定'}</p>
                            </div>
                            <div>
                              <p><strong>電話:</strong> {jobSeeker.phone || '未設定'}</p>
                              <p><strong>登録日:</strong> {new Date(jobSeeker.created_at).toLocaleDateString('ja-JP')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => openDetailModal(jobSeeker)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          詳細表示
                        </Button>
                        <Button
                          onClick={() => openDocumentGenerator(jobSeeker)}
                          size="sm"
                          variant="outline"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          書類作成
                        </Button>
                        {/* 面接再有効化ボタン */}
                        <Button
                          onClick={() => resetInterview(jobSeeker)}
                          size="sm"
                          variant="outline"
                          className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          面接再有効化
                        </Button>
                        <Button
                          onClick={() => openStatusModal(jobSeeker)}
                          size="sm"
                          variant="outline"
                          className="bg-green-100 hover:bg-green-200 border-green-300"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          就職済み
                        </Button>
                        <Button
                          onClick={() => deleteJobSeeker(jobSeeker.id, jobSeeker.full_name)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </TabsContent>

          {/* 就職済み一覧タブ */}
          <TabsContent value="employed" className="space-y-4">
            {statusLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">データを読み込み中...</span>
              </div>
            ) : jobSeekerStatuses.employed.length === 0 ? (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  就職済みの求職者が見つかりませんでした。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {jobSeekerStatuses.employed.map((jobSeeker) => (
                  <Card key={jobSeeker.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {jobSeeker.full_name || `${jobSeeker.first_name} ${jobSeeker.last_name}`}
                            </h3>
                            <p className="text-gray-600">{jobSeeker.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                就職済み
                              </Badge>
                              <span className="text-sm text-gray-600">
                                就職先: {jobSeeker.company_name}
                              </span>
                              <span className="text-sm text-gray-600">
                                就職日: {new Date(jobSeeker.employment_date).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openStatusModal(jobSeeker)}
                            size="sm"
                            variant="outline"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            求職者に復帰
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 退会済み一覧タブ */}
          <TabsContent value="withdrawn" className="space-y-4">
            {statusLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">データを読み込み中...</span>
              </div>
            ) : jobSeekerStatuses.withdrawn.length === 0 ? (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  退会済みの求職者が見つかりませんでした。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {jobSeekerStatuses.withdrawn.map((jobSeeker) => (
                  <Card key={jobSeeker.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <UserMinus className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {jobSeeker.full_name || `${jobSeeker.first_name} ${jobSeeker.last_name}`}
                            </h3>
                            <p className="text-gray-600">{jobSeeker.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                退会済み
                              </Badge>
                              <span className="text-sm text-gray-600">
                                退会日: {new Date(jobSeeker.withdrawal_date).toLocaleDateString('ja-JP')}
                              </span>
                              {jobSeeker.reason && (
                                <span className="text-sm text-gray-600">
                                  理由: {jobSeeker.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openStatusModal(jobSeeker)}
                            size="sm"
                            variant="outline"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            求職者に復帰
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 書類生成モーダル */}
        {showDocumentGenerator && selectedJobSeeker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">書類作成 - {selectedJobSeeker.full_name}</h3>
                <Button
                  onClick={closeDocumentGenerator}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <DocumentGenerator
                isAdminMode={true}
                jobSeekerData={selectedJobSeeker}
                onClose={closeDocumentGenerator}
              />
            </div>
          </div>
        )}

        {/* スポット通知モーダル */}
        {showSpotNotificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">スポット通知作成</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notification-title">タイトル</Label>
                  <Input
                    id="notification-title"
                    value={spotNotificationData.title}
                    onChange={(e) => setSpotNotificationData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="通知のタイトルを入力"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notification-message">メッセージ</Label>
                  <textarea
                    id="notification-message"
                    value={spotNotificationData.message}
                    onChange={(e) => setSpotNotificationData(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    placeholder="通知のメッセージを入力"
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notification-type">タイプ</Label>
                  <Select
                    value={spotNotificationData.type}
                    onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                      setSpotNotificationData(prev => ({ ...prev, type: value }))
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
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={sendBulkSpotNotification}
                  disabled={bulkOperationLoading}
                  className="flex-1"
                >
                  {selectedJobSeekers.length > 0 
                    ? `${selectedJobSeekers.length}件に送信`
                    : `フィルタ結果全員(${filteredJobSeekers.length}件)に送信`
                  }
                </Button>
                <Button
                  onClick={() => setShowSpotNotificationModal(false)}
                  variant="outline"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 一括書類生成モーダル */}
        {showDocumentGenerator && (
          <>
            {(() => {
              console.log('=== AdminJobSeekers 選択された求職者 ===');
              console.log('selectedJobSeekers:', selectedJobSeekers);
              selectedJobSeekers.forEach((js, index) => {
                console.log(`${index + 1}. ID: ${js.id}, user_id: ${js.user_id}`);
                console.log(`   fullName: "${js.fullName}"`);
                console.log(`   full_name: "${js.full_name}"`);
                console.log(`   kana_last_name: "${js.kana_last_name}"`);
                console.log(`   kana_first_name: "${js.kana_first_name}"`);
                console.log(`   メール: ${js.email || js.user_email}`);
              });
              return null;
            })()}
            <BulkDocumentGenerator
              selectedJobSeekers={selectedJobSeekers}
              onClose={() => setShowDocumentGenerator(false)}
              onComplete={() => {
                setShowDocumentGenerator(false);
                toast({
                  title: "完了",
                  description: "一括書類作成が完了しました",
                });
              }}
            />
          </>
        )}

        {/* 詳細表示モーダル */}
        <JobSeekerDetailModal
          jobSeeker={selectedDetailJobSeeker}
          isOpen={showDetailModal}
          onClose={closeDetailModal}
        />

        {/* 詳細フィルターモーダル */}
        <AdvancedFilterModal
          currentFilters={currentFilters}
          onApplyFilters={handleApplyAdvancedFilters}
          onClearFilters={handleClearFilters}
          availableSkills={ALL_SKILLS}
          open={showAdvancedFilterModal}
          onOpenChange={setShowAdvancedFilterModal}
        />

        {/* 求職者ステータス変更モーダル */}
        <JobSeekerStatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          jobSeeker={selectedStatusJobSeeker}
          onStatusChange={handleStatusChange}
        />
      </div>
    </AdminPageLayout>
  );
} 