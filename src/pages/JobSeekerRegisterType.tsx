import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Briefcase, ArrowRight } from 'lucide-react';

const JobSeekerRegisterType: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 前のページから渡されたデータを取得
  const { email, firstName, lastName } = (location.state as { email?: string; firstName?: string; lastName?: string }) || {};

  // データがない場合は最初のページに戻す
  if (!email || !firstName || !lastName) {
    navigate('/jobseeker/register');
    return null;
  }

  const handleTypeSelect = (type: 'engineer' | 'general') => {
    if (type === 'engineer') {
      navigate('/jobseeker/register/engineer', {
        state: { email, firstName, lastName }
      });
    } else {
      navigate('/jobseeker/register/general', {
        state: { email, firstName, lastName }
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleTypeSelect('engineer')}>
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
                <Button className="w-full" onClick={() => handleTypeSelect('engineer')}>
                  エンジニア向けで登録
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* 一般職向け */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleTypeSelect('general')}>
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
                <Button className="w-full" variant="outline" onClick={() => handleTypeSelect('general')}>
                  一般職向けで登録
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

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

