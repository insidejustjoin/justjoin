import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Briefcase, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const JobSeekerRegisterType: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  
  // 前のページから渡されたデータを取得
  const {
    phoneNumber,
    email,
    firstName,
    lastName,
    availability,
    emailVerified
  } =
    (location.state as {
      phoneNumber?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      availability?: {
        canRegisterEngineer?: boolean;
        canRegisterGeneral?: boolean;
        existingRegistrationTypes?: string[];
        userExists?: boolean;
      };
      emailVerified?: boolean;
    }) || {};

  const canRegisterEngineer = availability?.canRegisterEngineer !== false;
  const canRegisterGeneral = availability?.canRegisterGeneral !== false;
  const existingRegistrationTypes = availability?.existingRegistrationTypes || [];

  // メール認証が必要な場合は、30分以内に確認済みのレコードがあるかチェック
  useEffect(() => {
    if (email && !emailVerified) {
      setIsCheckingVerification(true);
      const checkVerification = async () => {
        try {
          const checkResponse = await fetch(`/api/email-verification/check/${encodeURIComponent(email)}`);
          const checkResult = await checkResponse.json();
          
          if (checkResult.success && checkResult.isWithin30Minutes) {
            // 30分以内に確認済みの場合は、そのまま続行
            setIsCheckingVerification(false);
          } else {
            // 30分を超えている場合は、新規登録画面に戻す
            navigate('/jobseeker/register');
          }
        } catch (error) {
          console.error('確認状態チェックエラー:', error);
          navigate('/jobseeker/register');
        }
      };
      
      checkVerification();
    }
  }, [email, emailVerified, navigate]);

  // データがない場合は最初のページに戻す（メールアドレスベースまたは電話番号ベースのどちらか）
  if ((!email && !phoneNumber) || !firstName || !lastName) {
    navigate('/jobseeker/register');
    return null;
  }

  // メール認証が必要で、30分以内の確認済みレコードがない場合は、新規登録画面に戻す
  if (email && !emailVerified && isCheckingVerification === false) {
    navigate('/jobseeker/register');
    return null;
  }

  // 確認中は何も表示しない
  if (email && !emailVerified && isCheckingVerification) {
    return null;
  }

  if (!canRegisterEngineer && !canRegisterGeneral) {
    navigate('/jobseeker/register');
    return null;
  }

  const handleTypeSelect = (type: 'engineer' | 'general') => {
    if ((type === 'engineer' && !canRegisterEngineer) || (type === 'general' && !canRegisterGeneral)) {
      return;
    }

    const nextState = {
      ...(email ? { email } : { phoneNumber }),
      firstName,
      lastName,
      ...(emailVerified !== undefined ? { emailVerified } : {}),
      availability: {
        canRegisterEngineer,
        canRegisterGeneral,
        existingRegistrationTypes
      }
    };

    if (type === 'engineer') {
      navigate('/jobseeker/register/engineer', {
        state: nextState
      });
    } else {
      navigate('/jobseeker/register/general', {
        state: nextState
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>登録タイプ選択 - JustJoin</title>
        <meta name="description" content="エンジニア向けまたは一般職向けの登録タイプを選択してください" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              登録タイプを選択 / Select Registration Type
            </h1>
            <p className="text-gray-600">
              {firstName} {lastName} 様、ご希望の登録タイプを選択してください
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* エンジニア向け */}
            <Card
              className={cn(
                'transition-shadow',
                canRegisterEngineer ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleTypeSelect('engineer')}
              aria-disabled={!canRegisterEngineer}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Code className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">
                  エンジニア向け / Engineer
                </CardTitle>
                <CardDescription className="text-center mt-2">
                  エンジニア・開発者向けの登録フォーム
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>スキルシート入力</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>技術スキル管理</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>プロジェクト経験記録</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={() => handleTypeSelect('engineer')} disabled={!canRegisterEngineer}>
                  エンジニア向けで登録
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!canRegisterEngineer && (
                  <p className="text-xs text-center text-gray-500">エンジニア向けは既に登録済みです</p>
                )}
              </CardContent>
            </Card>

            {/* 一般職向け */}
            <Card
              className={cn(
                'transition-shadow',
                canRegisterGeneral ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleTypeSelect('general')}
              aria-disabled={!canRegisterGeneral}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Briefcase className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">
                  一般職向け / General
                </CardTitle>
                <CardDescription className="text-center mt-2">
                  一般職・事務職向けの登録フォーム
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>履歴書・職務経歴書</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>基本情報入力</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>シンプルな登録プロセス</span>
                  </li>
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleTypeSelect('general')}
                  disabled={!canRegisterGeneral}
                >
                  一般職向けで登録
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!canRegisterGeneral && (
                  <p className="text-xs text-center text-gray-500">一般職向けは既に登録済みです</p>
                )}
              </CardContent>
            </Card>
          </div>

          {existingRegistrationTypes.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>現在登録済みのタイプ: {existingRegistrationTypes.map((type) => (type === 'general' ? '一般職' : 'エンジニア')).join(' / ')}</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={() => navigate('/jobseeker/register')}>
              戻る / Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSeekerRegisterType;

