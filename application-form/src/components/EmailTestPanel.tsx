import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { emailService } from '@/services/emailService';
import { toast } from 'sonner';

const EmailTestPanel: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    service: import.meta.env.VITE_EMAIL_SERVICE || 'console',
    gmailUser: import.meta.env.VITE_GMAIL_USER || '',
    gmailPassword: import.meta.env.VITE_GMAIL_PASSWORD || ''
  });

  const getEmailServiceStatus = () => {
    if (emailConfig.service === 'gmail') {
      if (emailConfig.gmailUser && emailConfig.gmailPassword) {
        return { status: 'configured', message: 'Gmail SMTP設定済み' };
      } else {
        return { status: 'incomplete', message: 'Gmail設定が不完全です' };
      }
    } else if (emailConfig.service === 'console') {
      return { status: 'development', message: '開発環境（コンソール出力）' };
    } else {
      return { status: 'unknown', message: '未設定' };
    }
  };

  const serviceStatus = getEmailServiceStatus();

  const getStatusBadge = () => {
    switch (serviceStatus.status) {
      case 'configured':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />設定済み</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />設定不完全</Badge>;
      case 'development':
        return <Badge className="bg-yellow-100 text-yellow-800"><Settings className="w-3 h-3 mr-1" />開発環境</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />未設定</Badge>;
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setIsSending(true);
    try {
      const success = await emailService.sendJobSeekerPassword(testEmail, 'テストユーザー', 'testpassword123');
      
      if (success) {
        if (emailConfig.service === 'console') {
          toast.success('テストメールを送信しました（コンソールで確認してください）');
        } else {
          toast.success('テストメールを送信しました');
        }
      } else {
        toast.error('メール送信に失敗しました');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('メール送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    if (!testEmail) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setIsSending(true);
    try {
      const success = await emailService.sendPasswordReset(testEmail, 'テストユーザー', 'newpassword123');
      
      if (success) {
        if (emailConfig.service === 'console') {
          toast.success('パスワード再発行メールを送信しました（コンソールで確認してください）');
        } else {
          toast.success('パスワード再発行メールを送信しました');
        }
      } else {
        toast.error('メール送信に失敗しました');
      }
    } catch (error) {
      console.error('Password reset email error:', error);
      toast.error('メール送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          メール送信テスト
        </CardTitle>
        <CardDescription>
          求人マッチングシステムのメール送信機能をテストします
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* メールサービス設定状況 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">メールサービス設定状況</h4>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600">{serviceStatus.message}</p>
          {emailConfig.service === 'gmail' && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Gmail User: {emailConfig.gmailUser ? '設定済み' : '未設定'}</p>
              <p>Gmail Password: {emailConfig.gmailPassword ? '設定済み' : '未設定'}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="testEmail">テスト用メールアドレス</Label>
          <Input
            id="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSendTestEmail}
            disabled={isSending || !testEmail}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            求職者登録メール送信
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSendPasswordResetEmail}
            disabled={isSending || !testEmail}
            className="flex-1"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            パスワード再発行メール送信
          </Button>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">
            注意事項:
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• 開発環境ではコンソールに出力されます</li>
            <li>• 本番環境ではGmail SMTP、SendGrid、Resendなどを使用</li>
            <li>• Gmailを使用する場合は2段階認証とアプリパスワードが必要です</li>
            <li>• 環境変数でメール送信サービスを設定してください</li>
          </ul>
        </div>

        {emailConfig.service === 'gmail' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Gmail SMTP設定手順:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Gmailアカウントで2段階認証を有効にする</li>
              <li>Googleアカウント設定 → セキュリティ → アプリパスワードで生成</li>
              <li>.envファイルにGMAIL_USERとGMAIL_PASSWORDを設定</li>
              <li>npm run email:test で接続テストを実行</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailTestPanel; 