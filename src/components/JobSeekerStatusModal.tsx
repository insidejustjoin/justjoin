import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Building2, UserMinus, UserPlus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface JobSeekerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobSeeker: any;
  onStatusChange: () => void;
}

type StatusAction = 'employ' | 'withdraw' | 'reactivate';

export function JobSeekerStatusModal({ 
  isOpen, 
  onClose, 
  jobSeeker, 
  onStatusChange 
}: JobSeekerStatusModalProps) {
  const [action, setAction] = useState<StatusAction>('employ');
  const [loading, setLoading] = useState(false);
  
  // 就職済み用の状態
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [employmentDate, setEmploymentDate] = useState('');
  const [employmentNotes, setEmploymentNotes] = useState('');
  
  // 退会済み用の状態
  const [withdrawalDate, setWithdrawalDate] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  
  // 復帰用の状態
  const [reactivateNotes, setReactivateNotes] = useState('');

  const handleSubmit = async () => {
    if (!jobSeeker?.user_id) {
      toast({
        title: "エラー",
        description: "求職者情報が正しく取得できませんでした",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('認証トークンが見つかりません');
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      let endpoint = '';
      let body: any = {};

      switch (action) {
        case 'employ':
          if (!companyName || !employmentDate) {
            toast({
              title: "エラー",
              description: "企業名と就職日は必須です",
              variant: "destructive",
            });
            return;
          }
          endpoint = `/api/job-seeker-status/admin/employ/${jobSeeker.user_id}`;
          body = {
            company_name: companyName,
            company_url: companyUrl,
            employment_date: employmentDate,
            notes: employmentNotes
          };
          break;

        case 'withdraw':
          if (!withdrawalDate) {
            toast({
              title: "エラー",
              description: "退会日は必須です",
              variant: "destructive",
            });
            return;
          }
          endpoint = `/api/job-seeker-status/admin/withdraw/${jobSeeker.user_id}`;
          body = {
            withdrawal_date: withdrawalDate,
            reason: withdrawalReason,
            notes: withdrawalNotes
          };
          break;

        case 'reactivate':
          endpoint = `/api/job-seeker-status/admin/reactivate/${jobSeeker.user_id}`;
          body = {
            notes: reactivateNotes
          };
          break;
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ステータス変更に失敗しました');
      }

      const result = await response.json();
      
      toast({
        title: "成功",
        description: result.message || "ステータスを変更しました",
      });

      // フォームをリセット
      resetForm();
      
      // モーダルを閉じる
      onClose();
      
      // 親コンポーネントに変更を通知
      onStatusChange();

    } catch (error) {
      console.error('ステータス変更エラー:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ステータス変更に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setCompanyUrl('');
    setEmploymentDate('');
    setEmploymentNotes('');
    setWithdrawalDate('');
    setWithdrawalReason('');
    setWithdrawalNotes('');
    setReactivateNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getActionTitle = () => {
    switch (action) {
      case 'employ': return '就職済みに変更';
      case 'withdraw': return '退会済みに変更';
      case 'reactivate': return '求職者に復帰';
      default: return 'ステータス変更';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'employ': return <Building2 className="h-5 w-5" />;
      case 'withdraw': return <UserMinus className="h-5 w-5" />;
      case 'reactivate': return <UserPlus className="h-5 w-5" />;
      default: return null;
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'employ': return '求職者を就職済みとして登録します。企業名と就職日は必須です。';
      case 'withdraw': return '求職者を退会済みとして登録します。退会日は必須です。';
      case 'reactivate': return '求職者を再度アクティブな求職者として復帰させます。';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            {getActionTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {getActionDescription()}
          </p>

          {/* アクション選択 */}
          <div className="space-y-2">
            <Label>アクション</Label>
            <Select value={action} onValueChange={(value: StatusAction) => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employ">就職済みに変更</SelectItem>
                <SelectItem value="withdraw">退会済みに変更</SelectItem>
                <SelectItem value="reactivate">求職者に復帰</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 就職済み用フォーム */}
          {action === 'employ' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">企業名 *</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="株式会社サンプル"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-url">企業URL</Label>
                <Input
                  id="company-url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment-date">就職日 *</Label>
                <Input
                  id="employment-date"
                  value={employmentDate}
                  onChange={(e) => setEmploymentDate(e.target.value)}
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment-notes">備考</Label>
                <Textarea
                  id="employment-notes"
                  value={employmentNotes}
                  onChange={(e) => setEmploymentNotes(e.target.value)}
                  placeholder="就職に関する備考があれば入力してください"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* 退会済み用フォーム */}
          {action === 'withdraw' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawal-date">退会日 *</Label>
                <Input
                  id="withdrawal-date"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-reason">退会理由</Label>
                <Select value={withdrawalReason} onValueChange={setWithdrawalReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="退会理由を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">個人的な事情</SelectItem>
                    <SelectItem value="employment">他社への就職</SelectItem>
                    <SelectItem value="study">進学・留学</SelectItem>
                    <SelectItem value="health">健康上の理由</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-notes">備考</Label>
                <Textarea
                  id="withdrawal-notes"
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  placeholder="退会に関する備考があれば入力してください"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* 復帰用フォーム */}
          {action === 'reactivate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reactivate-notes">備考</Label>
                <Textarea
                  id="reactivate-notes"
                  value={reactivateNotes}
                  onChange={(e) => setReactivateNotes(e.target.value)}
                  placeholder="復帰に関する備考があれば入力してください"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* 求職者情報表示 */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">対象求職者</p>
            <p className="text-sm text-gray-600">
              {jobSeeker?.full_name || `${jobSeeker?.first_name} ${jobSeeker?.last_name}`}
            </p>
            <p className="text-sm text-gray-600">{jobSeeker?.email}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? '処理中...' : '確定'}
          </Button>
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={loading}
          >
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 