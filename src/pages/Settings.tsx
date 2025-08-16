import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/constants/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PasswordChangeForm } from '@/components/PasswordChangeForm';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Calendar, Shield, ArrowLeft, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

export function Settings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();


  // ログアウトとアカウント削除の状態
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);







  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.pleaseLogin')}</div>
      </div>
    );
  }





  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/jobseeker/login');
  };

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobseekers/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: t('settings.accountDeleted'),
          description: t('settings.accountDeletedDescription'),
        });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        navigate('/jobseeker/login');
      } else {
        throw new Error('アカウント削除に失敗しました');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast({
        title: t('settings.error'),
        description: t('settings.deleteAccountError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/jobseeker/my-page')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToMyPage')}
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('settings.description')}
          </p>
        </div>

        <div className="space-y-6">
          {/* メインコンテンツ */}
          <div className="space-y-6">


            {/* アカウント情報 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.accountInformation')}</CardTitle>
                <CardDescription>
                  {t('settings.accountDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('settings.email')}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('settings.registrationDate')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'yyyy年MM月dd日', { locale: ja })}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('settings.accountType')}</p>
                    <Badge variant="outline">
                      {user.user_type === 'job_seeker' ? t('common.jobSeeker') : 
                       user.user_type === 'company' ? t('common.company') : 
                       t('common.admin')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* パスワード変更 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('auth.changePassword')}
                </CardTitle>
                <CardDescription>
                  {t('auth.changePasswordDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>

            {/* アカウント管理 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('settings.accountManagement')}
                </CardTitle>
                <CardDescription>
                  {t('settings.accountManagementDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ログアウトボタン */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{t('settings.logout')}</p>
                      <p className="text-sm text-gray-500">{t('settings.logoutDescription')}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('settings.logout')}
                  </Button>
                </div>

                {/* アカウント削除ボタン */}
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-700">{t('settings.deleteAccount')}</p>
                      <p className="text-sm text-red-600">{t('settings.deleteAccountDescription')}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('settings.deleteAccount')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ログアウト確認モーダル */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <LogOut className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('settings.logout')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('settings.logoutConfirm')}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowLogoutModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="flex-1"
                  >
                    {t('settings.logout')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* アカウント削除確認モーダル */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('settings.deleteAccount')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('settings.deleteAccountWarning')}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeleteModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isDeleting}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="flex-1"
                    disabled={isDeleting}
                  >
                    {isDeleting ? t('settings.deleting') : t('settings.deleteAccountConfirm')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 