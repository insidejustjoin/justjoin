import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Briefcase, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

export function JobSeekerLoginTypeSelection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 前のページから渡されたデータを取得
  const {
    registrationTypes,
    email,
    firstName,
    lastName,
    fromGoogleAuth
  } = (location.state as {
    registrationTypes?: Array<'engineer' | 'general'>;
    email?: string;
    firstName?: string;
    lastName?: string;
    fromGoogleAuth?: boolean;
  }) || {};

  // registrationTypesがない場合はログインページに戻る
  if (!registrationTypes || registrationTypes.length === 0) {
    navigate('/jobseeker/login');
    return null;
  }

  // 1つのタイプしかない場合は直接マイページへ
  if (registrationTypes.length === 1) {
    const type = registrationTypes[0];
    if (type === 'general') {
      navigate('/jobseeker/my-page-general');
    } else {
      navigate('/jobseeker/my-page-engineer');
    }
    return null;
  }

  const handleTypeSelect = (type: 'engineer' | 'general') => {
    // 選択したタイプをlocalStorageに保存
    localStorage.setItem('job_seeker_registration_preference', type);
    
    // 選択したタイプのマイページに遷移
    if (type === 'general') {
      navigate('/jobseeker/my-page-general');
    } else {
      navigate('/jobseeker/my-page-engineer');
    }
  };

  const canSelectEngineer = registrationTypes.includes('engineer');
  const canSelectGeneral = registrationTypes.includes('general');

  return (
    <>
      <Helmet>
        <title>{t('auth.loginTypeSelection.title')} - JustJoin</title>
        <meta name="description" content={t('auth.loginTypeSelection.description')} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.loginTypeSelection.title')}
            </h1>
            <p className="text-gray-600">
              {t('auth.loginTypeSelection.description', { 
                firstName: firstName || '', 
                lastName: lastName || '',
                email: email || ''
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* エンジニア向け */}
            {canSelectEngineer && (
              <Card
                className={cn(
                  'transition-shadow hover:shadow-lg cursor-pointer'
                )}
                onClick={() => handleTypeSelect('engineer')}
              >
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Code className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-2xl">
                    {t('auth.loginTypeSelection.engineer.title')}
                  </CardTitle>
                  <CardDescription className="text-center mt-2">
                    {t('auth.loginTypeSelection.engineer.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                      {t('auth.loginTypeSelection.engineer.feature1')}
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                      {t('auth.loginTypeSelection.engineer.feature2')}
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                      {t('auth.loginTypeSelection.engineer.feature3')}
                    </li>
                  </ul>
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleTypeSelect('engineer')}
                  >
                    {t('auth.loginTypeSelection.engineer.button')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 一般職向け */}
            {canSelectGeneral && (
              <Card
                className={cn(
                  'transition-shadow hover:shadow-lg cursor-pointer'
                )}
                onClick={() => handleTypeSelect('general')}
              >
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 bg-green-100 rounded-full">
                      <Briefcase className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-2xl">
                    {t('auth.loginTypeSelection.general.title')}
                  </CardTitle>
                  <CardDescription className="text-center mt-2">
                    {t('auth.loginTypeSelection.general.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-green-600" />
                      {t('auth.loginTypeSelection.general.feature1')}
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-green-600" />
                      {t('auth.loginTypeSelection.general.feature2')}
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-green-600" />
                      {t('auth.loginTypeSelection.general.feature3')}
                    </li>
                  </ul>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => handleTypeSelect('general')}
                  >
                    {t('auth.loginTypeSelection.general.button')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/jobseeker/login')}
            >
              {t('auth.loginTypeSelection.back')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}






