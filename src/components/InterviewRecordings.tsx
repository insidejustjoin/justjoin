import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Play, Video, Headphones, Clock, FileText, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InterviewRecording {
  id: string;
  recording_url: string;
  recording_type: 'video' | 'audio';
  file_size: number;
  duration?: number;
  created_at: string;
  session_id: string;
  session_status: string;
  started_at?: string;
  completed_at?: string;
}

interface InterviewRecordingsProps {
  userId: string;
  onRefresh?: () => void;
}

export function InterviewRecordings({ userId, onRefresh }: InterviewRecordingsProps) {
  const [recordings, setRecordings] = useState<InterviewRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 録画データを取得
  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('認証トークンが見つかりません');
        return;
      }
      
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const response = await fetch(`${apiUrl}/api/documents/admin/interview-recordings/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRecordings(result.data.recordings || []);
        } else {
          setError(result.message || '録画データの取得に失敗しました');
        }
      } else {
        const errorText = await response.text();
        setError(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
    } catch (error) {
      console.error('面接録画取得エラー:', error);
      setError(`面接録画の取得中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 録画をダウンロード
  const downloadRecording = async (recording: InterviewRecording) => {
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
      const response = await fetch(`${apiUrl}/api/documents/admin/interview-recording/${recording.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // ファイル名を生成
        const date = new Date(recording.created_at).toISOString().split('T')[0];
        const time = new Date(recording.created_at).toTimeString().split(' ')[0].replace(/:/g, '-');
        const extension = recording.recording_type === 'video' ? 'webm' : 'webm';
        const fileName = `interview_${recording.recording_type}_${date}_${time}.${extension}`;
        
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

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 日時を読みやすい形式に変換
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // セッションステータスを日本語に変換
  const getStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'waiting': '待機中',
      'in_progress': '面接中',
      'completed': '完了',
      'cancelled': 'キャンセル'
    };
    return statusMap[status] || status;
  };

  // セッションステータスの色を取得
  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'waiting': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchRecordings();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            面接録画
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">録画データを読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            面接録画
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={fetchRecordings} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            面接録画
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>面接録画がありません</p>
            <p className="text-sm">面接が完了すると録画データが表示されます</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          面接録画 ({recordings.length})
        </CardTitle>
        <CardDescription>
          面接の録画・録音データを確認・ダウンロードできます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {recording.recording_type === 'video' ? (
                      <Video className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Headphones className="h-5 w-5 text-green-600" />
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {recording.recording_type === 'video' ? '動画' : '音声'}
                      </Badge>
                      <Badge className={getStatusColor(recording.session_status)}>
                        {getStatusLabel(recording.session_status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(recording.file_size)}</span>
                    </div>
                    {recording.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(recording.duration / 60)}分{recording.duration % 60}秒</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateTime(recording.created_at)}</span>
                    </div>
                    {recording.started_at && (
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        <span>開始: {formatDateTime(recording.started_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => downloadRecording(recording)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <Button
            onClick={fetchRecordings}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            録画データを更新
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 