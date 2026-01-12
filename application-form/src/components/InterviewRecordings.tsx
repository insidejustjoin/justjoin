import React, { useState, useEffect, useRef } from 'react';
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
  question_id?: string; // 質問ID（q1, q2, ..., q10）
  transcription_text?: string; // 文字起こしテキスト
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
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

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
        console.log('📹 面接録画取得レスポンス:', result);
        if (result.success) {
          console.log(`✅ ${result.data.recordings?.length || 0} 件の録画を取得しました`);
          setRecordings(result.data.recordings || []);
        } else {
          console.error('❌ 録画データ取得失敗:', result.message);
          setError(result.message || '録画データの取得に失敗しました');
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}, message: ${errorText}`);
        setError(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
    } catch (error) {
      console.error('面接録画取得エラー:', error);
      setError(`面接録画の取得中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 録音を再生
  const playRecording = async (recording: InterviewRecording) => {
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
      
      // 既に再生中の場合は停止
      if (audioElementRef.current && playingRecording === recording.id) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current = null;
        setPlayingRecording(null);
        return;
      }
      
      // 前の再生を停止
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      
      // 録音URLを決定
      let audioUrl: string | null = null;
      
      if (recording.recording_url && recording.recording_url.trim() !== '') {
        // recording_urlが存在する場合
        if (recording.recording_url.startsWith('http://') || recording.recording_url.startsWith('https://')) {
          // 署名付きURLかどうかを確認（Signature、X-Goog-Signature、Expiresパラメータが含まれているか）
          const isSignedUrl = recording.recording_url.includes('Signature=') || 
                             recording.recording_url.includes('X-Goog-Signature=') || 
                             recording.recording_url.includes('Expires=');
          
          if (isSignedUrl) {
            // 署名付きURLの場合はそのまま使用
            audioUrl = recording.recording_url;
            console.log('🎵 署名付きURLを使用:', audioUrl.substring(0, 100) + '...');
          } else {
            // 通常のCloud Storage URL（署名付きURLではない）の場合、エンドポイント経由で署名付きURLを取得
            console.log('🎵 通常のCloud Storage URLのため、API経由で署名付きURLを取得:', recording.recording_url.substring(0, 100));
            // fetchで署名付きURLを取得（JSON形式で取得）
            try {
              const response = await fetch(`${apiUrl}/api/documents/admin/interview-recording/${recording.id}?format=json`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.success && result.data?.signedUrl) {
                  audioUrl = result.data.signedUrl;
                  console.log('✅ 署名付きURLを取得しました (JSON):', audioUrl.substring(0, 150) + '...');
                } else {
                  // JSON形式で取得できなかった場合、リダイレクトを追従
                  audioUrl = response.url;
                  console.log('✅ 署名付きURLを取得しました (リダイレクト):', audioUrl.substring(0, 150) + '...');
                }
              } else {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
            } catch (fetchError) {
              console.error('❌ 署名付きURL取得エラー:', fetchError);
              throw new Error('署名付きURLの取得に失敗しました');
            }
          }
        } else {
          // パス形式の場合、API経由で署名付きURLを取得
          console.log('🎵 パス形式のため、API経由で署名付きURLを取得:', recording.recording_url);
          // fetchで署名付きURLを取得（JSON形式で取得）
          try {
            const response = await fetch(`${apiUrl}/api/documents/admin/interview-recording/${recording.id}?format=json`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data?.signedUrl) {
                audioUrl = result.data.signedUrl;
                console.log('✅ 署名付きURLを取得しました (JSON):', audioUrl.substring(0, 150) + '...');
              } else {
                // JSON形式で取得できなかった場合、リダイレクトを追従
                audioUrl = response.url;
                console.log('✅ 署名付きURLを取得しました (リダイレクト):', audioUrl.substring(0, 150) + '...');
              }
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (fetchError) {
            console.error('❌ 署名付きURL取得エラー:', fetchError);
            throw new Error('署名付きURLの取得に失敗しました');
          }
        }
      } else {
        // recording_urlが空の場合はAPI経由で署名付きURLを取得
        console.log('🎵 recording_urlが空のため、API経由で署名付きURLを取得');
        // fetchで署名付きURLを取得（JSON形式で取得）
        try {
          const response = await fetch(`${apiUrl}/api/documents/admin/interview-recording/${recording.id}?format=json`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.signedUrl) {
              audioUrl = result.data.signedUrl;
              console.log('✅ 署名付きURLを取得しました (JSON):', audioUrl.substring(0, 150) + '...');
            } else {
              // JSON形式で取得できなかった場合、リダイレクトを追従
              audioUrl = response.url;
              console.log('✅ 署名付きURLを取得しました (リダイレクト):', audioUrl.substring(0, 150) + '...');
            }
          } else {
            const errorText = await response.text();
            console.error(`❌ HTTP error! status: ${response.status}, message: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('❌ 署名付きURL取得エラー:', fetchError);
          throw new Error('署名付きURLの取得に失敗しました');
        }
      }
      
      if (!audioUrl) {
        throw new Error('録音URLが取得できませんでした');
      }
      
      console.log('🎵 録音再生開始:', {
        recordingId: recording.id,
        audioUrl: audioUrl.substring(0, 150),
        hasUrl: !!recording.recording_url,
        originalUrl: recording.recording_url?.substring(0, 100)
      });
      
      const audio = new Audio(audioUrl);
      // CORS設定（署名付きURLの場合は不要だが、念のため）
      audio.crossOrigin = 'anonymous';
      
      // 音声メタデータの読み込みを待つ
      audio.addEventListener('loadedmetadata', () => {
        console.log('✅ 音声メタデータ読み込み完了:', {
          duration: audio.duration,
          readyState: audio.readyState
        });
      });
      
      audio.addEventListener('canplay', () => {
        console.log('✅ 音声再生準備完了');
      });
      
      audio.addEventListener('ended', () => {
        setPlayingRecording(null);
        audioElementRef.current = null;
      });
      
      audio.addEventListener('error', (e) => {
        console.error('録音再生エラー:', e);
        toast({
          title: "エラー",
          description: "録音の再生に失敗しました",
          variant: "destructive",
        });
        setPlayingRecording(null);
        audioElementRef.current = null;
      });
      
      await audio.play();
      audioElementRef.current = audio;
      setPlayingRecording(recording.id);
    } catch (error) {
      console.error('録音再生エラー:', error);
      toast({
        title: "エラー",
        description: "録音の再生に失敗しました",
        variant: "destructive",
      });
    }
  };
  
  // コンポーネントのアンマウント時に音声を停止
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current = null;
      }
    };
  }, []);

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
        
        // ファイル名を生成（質問IDを含む）
        const date = new Date(recording.created_at).toISOString().split('T')[0];
        const time = new Date(recording.created_at).toTimeString().split(' ')[0].replace(/:/g, '-');
        const extension = recording.recording_type === 'video' ? 'webm' : 'webm';
        const questionPrefix = recording.question_id ? `${recording.question_id}_` : '';
        const fileName = `interview_${questionPrefix}${recording.recording_type}_${date}_${time}.${extension}`;
        
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
        <div className="space-y-6">
          {/* 質問ごとにグループ化 */}
          {Object.entries(
            recordings.reduce((acc, recording) => {
              const questionKey = recording.question_id || 'unknown';
              if (!acc[questionKey]) {
                acc[questionKey] = [];
              }
              acc[questionKey].push(recording);
              return acc;
            }, {} as Record<string, InterviewRecording[]>)
          )
            .sort(([a], [b]) => {
              // 質問番号でソート（q1, q2, ..., q10, unknown）
              if (a === 'unknown') return 1;
              if (b === 'unknown') return -1;
              const numA = parseInt(a.replace('q', ''));
              const numB = parseInt(b.replace('q', ''));
              return numA - numB;
            })
            .map(([questionId, questionRecordings]) => (
              <div key={questionId} className="border rounded-lg p-4">
                <div className="mb-4 pb-3 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {questionId === 'unknown' ? '質問不明' : `質問 ${questionId.replace('q', '')}`}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {questionRecordings.map((recording) => (
                    <div
                      key={recording.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
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
                          
                          {/* 文字起こしテキストの表示 */}
                          <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div className="text-sm font-semibold text-blue-900">文字起こし</div>
                            </div>
                            {recording.transcription_text && recording.transcription_text.trim() ? (
                              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {recording.transcription_text}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                文字起こしデータがありません
                              </div>
                            )}
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
                        
                        <div className="flex gap-2">
                          {recording.recording_type === 'audio' && (
                            <Button
                              onClick={() => playRecording(recording)}
                              variant={playingRecording === recording.id ? "secondary" : "default"}
                              size="sm"
                              className="flex-shrink-0"
                            >
                              {playingRecording === recording.id ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2" />
                                  停止
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  再生
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => downloadRecording(recording)}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            ダウンロード
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
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