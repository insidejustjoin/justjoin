import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  EyeOff, 
  Bell, 
  BellOff, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  Download,
  RefreshCw
} from 'lucide-react';
import { InterviewData, InterviewNotification } from '@/types/interview';

interface InterviewManagementProps {
  jobSeekerId: string;
  jobSeekerName: string;
  onInterviewVisibilityChange: (visible: boolean) => void;
  onNotificationSettingsChange: (enabled: boolean, type: string) => void;
  onBulkDocumentGeneration: (selectedJobSeekers: string[]) => void;
}

export function InterviewManagement({
  jobSeekerId,
  jobSeekerName,
  onInterviewVisibilityChange,
  onNotificationSettingsChange,
  onBulkDocumentGeneration
}: InterviewManagementProps) {
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedJobSeekers, setSelectedJobSeekers] = useState<string[]>([]);

  // 面接データを取得
  const fetchInterviewData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/interview/${jobSeekerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterviewData(data);
      }
    } catch (error) {
      console.error('面接データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewData();
  }, [jobSeekerId]);

  // 面接表示/非表示の切り替え
  const handleVisibilityToggle = (visible: boolean) => {
    setIsVisible(visible);
    onInterviewVisibilityChange(visible);
  };

  // 通知設定の切り替え
  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    onNotificationSettingsChange(enabled, 'all');
  };

  // 面接ステータスのバッジを表示
  const getInterviewStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />完了</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />進行中</Badge>;
      case 'waiting':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />待機中</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />中断</Badge>;
      default:
        return <Badge variant="outline">未受験</Badge>;
    }
  };

  // 推奨レベルのバッジを表示
  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return <Badge className="bg-emerald-500">強く推薦</Badge>;
      case 'yes':
        return <Badge className="bg-green-500">推薦</Badge>;
      case 'maybe':
        return <Badge className="bg-yellow-500">要検討</Badge>;
      case 'no':
        return <Badge variant="destructive">非推薦</Badge>;
      case 'strong_no':
        return <Badge className="bg-red-700">強く非推薦</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 面接表示制御 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            面接表示制御
          </CardTitle>
          <CardDescription>
            求職者の面接情報の表示/非表示を制御します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="interview-visibility"
              checked={isVisible}
              onCheckedChange={handleVisibilityToggle}
            />
            <Label htmlFor="interview-visibility">
              {isVisible ? '面接情報を表示' : '面接情報を非表示'}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            通知設定
          </CardTitle>
          <CardDescription>
            面接関連の通知設定を管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications-enabled"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
              <Label htmlFor="notifications-enabled">
                面接完了通知を有効にする
              </Label>
            </div>
            
            {notificationsEnabled && (
              <div className="space-y-2">
                <Label>通知タイプ</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notify-completion" defaultChecked />
                    <Label htmlFor="notify-completion">面接完了</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notify-reminder" defaultChecked />
                    <Label htmlFor="notify-reminder">面接リマインダー</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 面接情報表示 */}
      {isVisible && interviewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              面接情報
            </CardTitle>
            <CardDescription>
              {jobSeekerName}さんの面接結果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 面接ステータス */}
              <div className="flex items-center justify-between">
                <span className="font-medium">面接ステータス:</span>
                {getInterviewStatusBadge(interviewData.session.status)}
              </div>

              {/* 面接結果 */}
              {interviewData.summary && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">総合スコア:</span>
                    <Badge variant="outline">{interviewData.summary.overall_score}/100点</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">推奨レベル:</span>
                    {getRecommendationBadge(interviewData.summary.recommendation)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">完了率:</span>
                    <Badge variant="outline">
                      {Math.round(interviewData.summary.completion_rate * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">平均回答時間:</span>
                    <Badge variant="outline">
                      {Math.round(interviewData.summary.average_response_time)}秒
                    </Badge>
                  </div>
                </>
              )}

              {/* アクションボタン */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchInterviewData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  更新
                </Button>
                
                {interviewData.summary && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    結果ダウンロード
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 一括資料作成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            一括資料作成
          </CardTitle>
          <CardDescription>
            選択された求職者の資料を一括で生成します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="求職者IDをカンマ区切りで入力"
                value={selectedJobSeekers.join(', ')}
                onChange={(e) => setSelectedJobSeekers(e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
              />
              <Button
                onClick={() => onBulkDocumentGeneration(selectedJobSeekers)}
                disabled={selectedJobSeekers.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                一括生成
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              選択された求職者数: {selectedJobSeekers.length}人
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 