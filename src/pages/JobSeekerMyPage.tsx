import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Mail, Calendar, Edit, FileText, Building, Briefcase, Star, Trophy, AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle, ExternalLink, Globe, Bell, Copy } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { FuriganaText } from '@/components/FuriganaText';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function JobSeekerMyPage() {
  const { user, logout, deleteAccount, getProfile, clearAllStorage } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [completionRate, setCompletionRate] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // AI面接関連の状態
  const [interviewData, setInterviewData] = useState<any>(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  // ふりがな表示設定
  const [showFurigana, setShowFurigana] = useState(true);

  // 多言語表示用のヘルパー関数
  const getMultilingualText = (key: string): string => {
    return t(`myPage.${key}`);
  };



  // 未読通知数を取得
  const fetchUnreadNotificationCount = async () => {
    if (!user) return;
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/notifications/unread-count/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnreadNotificationCount(result.data.count);
        }
      }
    } catch (error) {
      // エラーは静かに処理
    }
  };

  // 面接履歴を取得
  const fetchInterviewHistory = async () => {
    if (!user) return;
    
    setIsLoadingInterview(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/documents/interview-history/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setInterviewData(result.data);
        }
      }
    } catch (error) {
      // エラーは静かに処理
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // AI面接開始
  const startAIInterview = async () => {
    if (!user || !interviewData?.canTakeInterview) return;
    
    setIsStartingInterview(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/documents/interview-token/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 面接システムを新しいタブで開く
          const interviewUrl = process.env.NODE_ENV === 'development' 
            ? `http://localhost:8080/interview?token=${result.data.token}`
            : `https://interview.justjoin.jp?token=${result.data.token}`;
          
          window.open(interviewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          
          toast.success(t('aiInterviewStarted'));
          
          // 面接履歴を再取得
          setTimeout(() => {
            fetchInterviewHistory();
          }, 2000);
        }
      } else {
        const errorResult = await response.json();
        if (errorResult.error === 'INTERVIEW_ALREADY_TAKEN') {
          toast.error('1次面接は既に受験済みです');
          fetchInterviewHistory(); // 最新状態を取得
        } else {
          toast.error('面接を開始できませんでした');
        }
      }
    } catch (error) {
      toast.error('面接を開始できませんでした');
    } finally {
      setIsStartingInterview(false);
    }
  };

  // 面接ステータスのバッジを表示
  const getInterviewStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /><FuriganaText text="完了" showFurigana={showFurigana} /></Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /><FuriganaText text="進行中" showFurigana={showFurigana} /></Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /><FuriganaText text="中断" showFurigana={showFurigana} /></Badge>;
      default:
        return <Badge variant="outline"><FuriganaText text="未受験" showFurigana={showFurigana} /></Badge>;
    }
  };

  // 面接推奨レベルのバッジを表示
  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return <Badge className="bg-emerald-500"><FuriganaText text="強く推薦" showFurigana={showFurigana} /></Badge>;
      case 'yes':
        return <Badge className="bg-green-500"><FuriganaText text="推薦" showFurigana={showFurigana} /></Badge>;
      case 'maybe':
        return <Badge className="bg-yellow-500"><FuriganaText text="要検討" showFurigana={showFurigana} /></Badge>;
      case 'no':
        return <Badge className="bg-red-500"><FuriganaText text="非推薦" showFurigana={showFurigana} /></Badge>;
      case 'strong_no':
        return <Badge className="bg-red-700"><FuriganaText text="強く非推薦" showFurigana={showFurigana} /></Badge>;
      default:
        return null;
    }
  };

  // ユーザーデータ読み込み
  const loadUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 基本的なユーザー情報を設定（プロフィール情報が既にある場合は使用）
      const basicUserData = {
        id: user.id,
        email: user.email,
        full_name: user.profile?.full_name || '',
        created_at: user.created_at,
        user_type: user.user_type,
        interview_enabled: (user.profile as any)?.interview_enabled || false
      };
      
      // 基本的なユーザーデータは一時的に設定（APIから取得後に更新される）
      setUserData(basicUserData);
      
      // 求職者の場合は常にAPIから取得（interview_enabledを含む）
      if (user.user_type === 'job_seeker') {
        try {
          const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
          const response = await fetch(`${apiUrl}/api/jobseekers/${user.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
              const profileData = result.data;
              
              // ユーザーデータを更新
              const updatedUserData = {
                ...basicUserData,
                full_name: profileData.full_name || '',
                interview_enabled: profileData.interview_enabled || false
              };
              setUserData(updatedUserData);
            }
          } else {
            // Profile API エラーは静かに処理
          }
        } catch (error) {
          // Profile fetch エラーは静かに処理
        }
      }
      
      // 完成度と面接履歴を並行して取得
      await Promise.all([
        fetchCompletionRate(),
        fetchInterviewHistory()
      ]);
    } catch (error) {
      // ユーザーデータ読み込みエラーは静かに処理
    } finally {
      setIsLoading(false);
    }
  };



  // 入力率取得関数
  const fetchCompletionRate = async () => {
    if (!user) return;
    
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://justjoin.jp';
      const url = `${apiUrl}/api/jobseekers/completion-rate/${user.id}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const rate = result.completionRate || 0;
          setCompletionRate(rate);
          
          // 入力率が100%未満の場合はモーダルを表示
          if (rate < 100) {
            setShowCompletionModal(true);
          }
        }
              } else {
        // APIエラーは静かに処理
      }
    } catch (error) {
      // 入力率取得エラーは静かに処理
    }
  };

  // コンポーネントマウント時にデータを読み込み
  useEffect(() => {
    if (user && !userData) {
      loadUserData();
    }
  }, [user]); // userDataを依存配列から削除

  // 通知と面接データを取得
  useEffect(() => {
    if (user) {
      fetchInterviewHistory();
      fetchCompletionRate();
      fetchUnreadNotificationCount();
    }
  }, [user]);

  // 無効なユーザー情報のチェック
  useEffect(() => {
    if (user) {
      // 存在しないメールアドレスのチェック
      if (user.email === 'sonokenno25work@gmail.com') {
        toast.error('認証情報が無効です。再度ログインしてください。');
        clearAllStorage();
        window.location.href = '/jobseeker';
        return;
      }
    }
  }, [user, clearAllStorage, navigate]);

  // AuthContextの状態を取得
  const { isLoading: authLoading, isInitialized } = useAuth();

  // 認証状態の初期化が完了していない場合は待機
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingData')}</p>
        </div>
      </div>
    );
  }

  // 認証が完了してユーザーが存在しない場合はリダイレクト
  if (!user) {
    window.location.href = '/jobseeker';
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ログインページにリダイレクト中...</p>
        </div>
      </div>
    );
  }

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingData')}</p>
        </div>
      </div>
    );
  }

  if (user.user_type !== 'job_seeker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">求職者アカウントでログインしてください。</div>
      </div>
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
      
      {/* メインコンテナ */}
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* ヘッダー部分に言語切り替えを追加 */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  <FuriganaText 
                    text={getMultilingualText('myPageTitle')} 
                    showFurigana={showFurigana}
                    onToggleFurigana={setShowFurigana}
                    showToggleButton={true}
                  />
                </h1>
                <p className="text-gray-600 mt-2">
                  <FuriganaText 
                    text={getMultilingualText('myPageDescription')} 
                    showFurigana={showFurigana}
                  />
                </p>
              </div>
              {/* 通知ベルと言語切り替えを右上に配置 */}
              <div className="flex gap-2">
                {/* 通知ベル */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/notifications')}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </Badge>
                  )}
                </Button>
                
                {/* 言語切り替え */}
                <LanguageToggle />
              </div>
            </div>
          </div>

          {/* 書類作成 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <FuriganaText 
                  text={getMultilingualText('documentCreation')} 
                  showFurigana={showFurigana}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* プロフィール完成度 */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">
                      <FuriganaText 
                        text={t('profileCompletion.rate')} 
                        showFurigana={showFurigana}
                      />
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
                    <div className="text-sm text-blue-600">
                      {completionRate < 30 && (
                        <FuriganaText 
                          text={t('profileCompletion.initialEntry')} 
                          showFurigana={showFurigana}
                        />
                      )}
                      {completionRate >= 30 && completionRate < 70 && (
                        <FuriganaText 
                          text={t('profileCompletion.incomplete')} 
                          showFurigana={showFurigana}
                        />
                      )}
                      {completionRate >= 70 && completionRate < 100 && (
                        <FuriganaText 
                          text={t('profileCompletion.almostComplete')} 
                          showFurigana={showFurigana}
                        />
                      )}
                      {completionRate === 100 && (
                        <FuriganaText 
                          text={t('profileCompletion.complete')} 
                          showFurigana={showFurigana}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <Progress value={completionRate} className="h-3 mb-3" />
                <div className="text-sm text-blue-700">
                  {completionRate < 30 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>
                        <FuriganaText 
                          text={t('profileCompletion.encourageCompletion')} 
                          showFurigana={showFurigana}
                        />
                      </span>
                    </div>
                  )}
                  {completionRate >= 30 && completionRate < 70 && (
                    <span>
                      <FuriganaText 
                        text={t('profileCompletion.basicComplete')} 
                        showFurigana={showFurigana}
                      />
                    </span>
                  )}
                  {completionRate >= 70 && completionRate < 100 && (
                    <span>
                      <FuriganaText 
                        text={t('profileCompletion.almostDone')} 
                        showFurigana={showFurigana}
                      />
                    </span>
                  )}
                  {completionRate === 100 && (
                    <span>
                      <FuriganaText 
                        text={t('profileCompletion.perfect')} 
                        showFurigana={showFurigana}
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* 書類作成ボタン */}
              <Button
                onClick={() => navigate('/jobseeker/documents')}
                className="w-full h-12 text-lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                <FuriganaText 
                  text={t('createEditDocuments')} 
                  showFurigana={showFurigana}
                />
              </Button>
            </CardContent>
          </Card>

          {/* AI面接カード */}
          {userData?.interview_enabled && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <FuriganaText 
                    text={getMultilingualText('aiInterview')} 
                    showFurigana={showFurigana}
                  />
                </CardTitle>
                <CardDescription>
                  <FuriganaText 
                    text={getMultilingualText('aiInterviewDescription')} 
                    showFurigana={showFurigana}
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingInterview ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">
                      <FuriganaText 
                        text="面接情報を読み込み中..." 
                        showFurigana={showFurigana}
                      />
                    </p>
                  </div>
                ) : interviewData ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">
                            <FuriganaText 
                              text="面接ステータス" 
                              showFurigana={showFurigana}
                            />
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getInterviewStatusBadge(interviewData.status)}
                            {interviewData.latestRecommendation && getRecommendationBadge(interviewData.latestRecommendation)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          <FuriganaText 
                            text="受験回数" 
                            showFurigana={showFurigana}
                          />
                        </p>
                        <p className="text-lg font-semibold">{interviewData.totalInterviews}/1</p>
                      </div>
                    </div>

                    {interviewData.hasInterview && interviewData.latestCompletion && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">
                          <FuriganaText 
                            text="最新の面接結果" 
                            showFurigana={showFurigana}
                          />
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-gray-600">
                              <FuriganaText 
                                text="完了日時:" 
                                showFurigana={showFurigana}
                              />
                            </span>
                            <span>{format(new Date(interviewData.latestCompletion), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
                          </div>
                          {interviewData.latestScore && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="text-gray-600">
                                <FuriganaText 
                                  text="総合スコア:" 
                                  showFurigana={showFurigana}
                                />
                              </span>
                              <span className="font-medium">{Math.round(interviewData.latestScore)}/100</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI面接開始ボタン */}
                    {interviewData.canTakeInterview && (
                      <Button
                        onClick={startAIInterview}
                        disabled={isStartingInterview}
                        className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                      >
                        {isStartingInterview ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            <FuriganaText 
                              text="面接を開始中..." 
                              showFurigana={showFurigana}
                            />
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-5 w-5 mr-2" />
                            <FuriganaText 
                              text={getMultilingualText('startAIInterview')} 
                              showFurigana={showFurigana}
                            />
                          </>
                        )}
                      </Button>
                    )}

                    {/* 面接完了済みの場合 */}
                    {!interviewData.canTakeInterview && interviewData.hasInterview && (
                      <div className="text-center py-4">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          <FuriganaText 
                            text={getMultilingualText('aiInterviewCompleted')} 
                            showFurigana={showFurigana}
                          />
                        </p>
                        <p className="text-xs text-gray-500">
                          <FuriganaText 
                            text={getMultilingualText('aiInterviewOneTimeOnly')} 
                            showFurigana={showFurigana}
                          />
                        </p>
                      </div>
                    )}

                    {/* 面接準備中の場合 */}
                    {!interviewData.canTakeInterview && !interviewData.hasInterview && (
                      <div className="text-center py-4">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-3">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <p className="text-sm text-gray-600">
                          <FuriganaText 
                            text={getMultilingualText('interviewPreparing')} 
                            showFurigana={showFurigana}
                          />
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      <FuriganaText 
                        text={getMultilingualText('interviewLoadError')} 
                        showFurigana={showFurigana}
                      />
                    </p>
                    <Button
                      onClick={fetchInterviewHistory}
                      variant="outline"
                      size="sm"
                    >
                      <FuriganaText 
                        text={getMultilingualText('reload')} 
                        showFurigana={showFurigana}
                      />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* テスト用面接システムボタン */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <FuriganaText 
                    text="テスト用面接システム" 
                    showFurigana={showFurigana}
                  />
                </CardTitle>
                <CardDescription>
                  <FuriganaText 
                    text="開発・テスト環境での面接システム動作確認用" 
                    showFurigana={showFurigana}
                  />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.open('https://interview.justjoin.jp/test', '_blank')}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  <FuriganaText 
                    text="テスト用面接システムを開く" 
                    showFurigana={showFurigana}
                  />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* プロフィール情報 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <FuriganaText 
                      text={getMultilingualText('profileInformation')} 
                      showFurigana={showFurigana}
                    />
                  </CardTitle>
                  <CardDescription>
                    <FuriganaText 
                      text={getMultilingualText('profileDescription')} 
                      showFurigana={showFurigana}
                    />
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings">
                    <Edit className="h-4 w-4 mr-2" />
                    <FuriganaText 
                      text={getMultilingualText('edit')} 
                      showFurigana={showFurigana}
                    />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <FuriganaText 
                      text={getMultilingualText('fullName')} 
                      showFurigana={showFurigana}
                    />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.full_name || user.profile?.full_name || getMultilingualText('notSet')}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <FuriganaText 
                      text={getMultilingualText('email')} 
                      showFurigana={showFurigana}
                    />
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <FuriganaText 
                      text={getMultilingualText('registrationDate')} 
                      showFurigana={showFurigana}
                    />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'yyyy年MM月dd日', { locale: ja })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* プロフィール完成モーダル */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                <FuriganaText 
                  text="プロフィール完成度 / Profile Completion" 
                  showFurigana={showFurigana}
                />
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <FuriganaText 
                  text={`現在のプロフィール完成度は${completionRate}%です。プロフィールを完成させることで、より良い求人とのマッチングが可能になります。`}
                  showFurigana={showFurigana}
                />
                <br/>
                Your current profile completion rate is {completionRate}%. Completing your profile will enable better job matching.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCompletionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  <FuriganaText 
                    text="後で / Later" 
                    showFurigana={showFurigana}
                  />
                </Button>
                <Button
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate('/jobseeker/documents');
                  }}
                  className="flex-1"
                >
                  <FuriganaText 
                    text="今すぐ完了 / Complete Now" 
                    showFurigana={showFurigana}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* デバッグ用クリアボタン（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={clearAllStorage}
            variant="destructive"
            size="sm"
            className="shadow-lg"
          >
            <FuriganaText 
              text="デバッグ: 認証クリア" 
              showFurigana={showFurigana}
            />
          </Button>
        </div>
      )}
    </>
  );
}
