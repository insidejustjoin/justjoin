import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/constants/api';

interface JobSeekerFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  desiredJobTitle: string;
  experience: number;
  skills: string;
  selfIntroduction: string;
}

const JobSeekerRegister: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { registerJobSeeker } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSuccess, setEmailSuccess] = useState<string>('');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<JobSeekerFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    email: '',
    phone: '',
    address: '',
    desiredJobTitle: '',
    experience: 0,
    skills: '',
    selfIntroduction: '',
  });

  const handleInputChange = (field: keyof JobSeekerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // メールアドレスが変更された場合、エラーとサクセスメッセージをクリア
    if (field === 'email') {
      setEmailError('');
      setEmailSuccess('');
    }
  };

  // メールアドレスの重複チェック（デバウンス付き）
  const checkEmailAvailability = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) return true;
    
    try {
      setIsCheckingEmail(true);
      const response = await fetch(`${API_BASE_URL}/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.available;
      } else {
        console.error('Email check failed:', data.message);
        return true; // エラーの場合は利用可能とみなす
      }
    } catch (error) {
      console.error('Email check error:', error);
      return true; // エラーの場合は利用可能とみなす
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // メールアドレス入力時の重複チェック（デバウンス付き）
  const handleEmailChange = (email: string) => {
    handleInputChange('email', email);
    
    // 既存のタイムアウトをクリア
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }
    
    // エラーとサクセスメッセージをクリア
    setEmailError('');
    setEmailSuccess('');
    
    if (email && email.includes('@')) {
      // 500ms後にチェックを実行（デバウンス）
      const timeout = setTimeout(async () => {
        const isAvailable = await checkEmailAvailability(email);
        if (!isAvailable) {
          setEmailError('このメールアドレスは既に使用されています');
          setEmailSuccess('');
        } else {
          setEmailError('');
          setEmailSuccess('このメールアドレスは利用可能です');
        }
      }, 500);
      
      setEmailCheckTimeout(timeout);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // フォームのバリデーション
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.email || 
        !formData.phone || !formData.address || !formData.desiredJobTitle || 
        !formData.skills || !formData.selfIntroduction) {
      toast({
        title: 'エラー',
        description: 'すべての必須項目を入力してください',
        variant: 'destructive',
      });
      return;
    }
    
    // メールアドレスの重複エラーがある場合は送信しない
    if (emailError) {
      toast({
        title: 'エラー',
        description: emailError,
        variant: 'destructive',
      });
      return;
    }

    // メールアドレスの最終チェック
    if (formData.email && formData.email.includes('@')) {
      try {
        const isAvailable = await checkEmailAvailability(formData.email);
        if (!isAvailable) {
          setEmailError('このメールアドレスは既に使用されています');
          toast({
            title: 'エラー',
            description: 'このメールアドレスは既に使用されています',
            variant: 'destructive',
          });
          return;
        }
      } catch (error) {
        console.error('Email availability check failed:', error);
        toast({
          title: 'エラー',
          description: 'メールアドレスの確認中にエラーが発生しました',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 新しい登録処理を使用
      await registerJobSeeker(formData.email, formData.firstName, formData.lastName);
      
      // 成功時の処理（registerJobSeeker内でトーストが表示される）
      // フォームをリセット
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        email: '',
        phone: '',
        address: '',
        desiredJobTitle: '',
        experience: 0,
        skills: '',
        selfIntroduction: '',
      });
      setEmailError('');
      setEmailSuccess('');
      
      // 画面遷移は削除 - その場で確認メッセージを表示
    } catch (error) {
      // registerJobSeekerから投げられるエラーは既にトーストで表示されているため、
      // ここでは追加の処理は不要
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">求職者登録</CardTitle>
              <p className="text-blue-100">スキルを活かして新しいキャリアを始めましょう</p>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastName">姓 *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      placeholder="田中"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="firstName">名 *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      placeholder="太郎"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">生年月日 *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">性別 *</Label>
                    <Select value={formData.gender} onValueChange={(value: 'male' | 'female' | 'other') => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience">経験年数 *</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', parseInt(e.target.value))}
                      required
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">メールアドレス *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                      placeholder="tanaka@example.com"
                      className={emailError ? 'border-red-500' : emailSuccess ? 'border-green-500' : ''}
                    />
                    {isCheckingEmail && (
                      <p className="text-sm text-blue-500 mt-1">メールアドレスを確認中...</p>
                    )}
                    {emailError && (
                      <p className="text-sm text-red-500 mt-1">{emailError}</p>
                    )}
                    {emailSuccess && (
                      <p className="text-sm text-green-500 mt-1">{emailSuccess}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">電話番号 *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">現住所 *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="東京都渋谷区..."
                  />
                </div>

                <div>
                  <Label htmlFor="desiredJobTitle">希望職種 *</Label>
                  <Input
                    id="desiredJobTitle"
                    value={formData.desiredJobTitle}
                    onChange={(e) => handleInputChange('desiredJobTitle', e.target.value)}
                    required
                    placeholder="フロントエンドエンジニア"
                  />
                </div>

                <div>
                  <Label htmlFor="skills">スキル *</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    required
                    placeholder="JavaScript, React, TypeScript, Node.js"
                  />
                  <p className="text-sm text-gray-500 mt-1">カンマ区切りで入力してください</p>
                </div>

                <div>
                  <Label htmlFor="selfIntroduction">自己紹介 *</Label>
                  <Textarea
                    id="selfIntroduction"
                    value={formData.selfIntroduction}
                    onChange={(e) => handleInputChange('selfIntroduction', e.target.value)}
                    required
                    rows={4}
                    placeholder="自己紹介や志望動機をご記入ください..."
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isCheckingEmail || !!emailError}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                  onClick={(e) => {
                    // 追加の保護として、ボタンクリック時にもイベントを制御
                    if (isSubmitting || isCheckingEmail || !!emailError) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                  }}
                >
                  {isSubmitting ? '登録中...' : '登録する'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default JobSeekerRegister;
