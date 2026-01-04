import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google認証に失敗しました');
        navigate('/jobseeker');
        return;
      }

      if (!token || !userParam) {
        toast.error('認証情報が取得できませんでした');
        navigate('/jobseeker');
        return;
      }

      try {
        // ユーザー情報をパース
        const user = JSON.parse(decodeURIComponent(userParam));
        
        console.log('GoogleAuthCallback - parsed user:', user);
        console.log('GoogleAuthCallback - isNewUser:', isNewUser);
        
        // idを文字列として処理
        const userForStorage = {
          ...user,
          id: String(user.id),
          registration_types: user.registration_types || []
        };

        // トークンとユーザー情報をlocalStorageに保存
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userForStorage));
        localStorage.setItem('auth_login_time', new Date().toISOString());
        
        if (user.registration_types && Array.isArray(user.registration_types)) {
          localStorage.setItem('job_seeker_registration_types', JSON.stringify(user.registration_types));
        }
        
        toast.success(isNewUser ? '新規登録が完了しました' : 'ログインしました');
        
        const registrationTypes = user.registration_types || [];
        
        // 新規ユーザーの場合は登録タイプ選択ページへ
        if (isNewUser && user.user_type === 'job_seeker') {
          // registration_typesが空の場合は新規ユーザーとして扱う
          const hasEngineer = registrationTypes.includes('engineer');
          const hasGeneral = registrationTypes.includes('general');
          
          const availability = {
            canRegisterEngineer: !hasEngineer,
            canRegisterGeneral: !hasGeneral,
            existingRegistrationTypes: registrationTypes,
            userExists: true // Google OAuthで作成されたユーザーなので存在する
          };
          
          // firstNameとlastNameが空の場合でも、Google OAuthからの場合は続行可能にする
          // (名前は書類作成時に入力できる)
          const firstName = user.first_name || user.firstName || '名';
          const lastName = user.last_name || user.lastName || '姓';
          
          const navigationState = {
            email: user.email,
            firstName: firstName,
            lastName: lastName,
            emailVerified: true, // Google OAuthなので認証済み
            availability
          };
          
          console.log('GoogleAuthCallback - navigating to /jobseeker/register/type with state:', navigationState);
          
          // 登録タイプ選択ページに遷移
          navigate('/jobseeker/register/type', {
            state: navigationState
          });
        } else if (!isNewUser && user.user_type === 'job_seeker') {
          // 既存ユーザーで複数のタイプがある場合、タイプ選択画面へ
          if (registrationTypes.length > 1) {
            const firstName = user.first_name || user.firstName || '';
            const lastName = user.last_name || user.lastName || '';
            
            navigate('/jobseeker/login/type', {
              state: {
                registrationTypes: registrationTypes,
                email: user.email,
                firstName: firstName,
                lastName: lastName,
                fromGoogleAuth: true
              }
            });
          } else if (registrationTypes.length === 1) {
            // 1つのタイプのみの場合は直接マイページへ
            const type = registrationTypes[0];
            if (type === 'general') {
              window.location.href = '/jobseeker/my-page-general';
            } else {
              window.location.href = '/jobseeker/my-page-engineer';
            }
          } else {
            // タイプがない場合はマイページへ（デフォルト）
            window.location.href = '/jobseeker/my-page';
          }
        } else {
          // その他の場合はマイページへ
          console.log('GoogleAuthCallback - redirecting to /jobseeker/my-page');
          window.location.href = '/jobseeker/my-page';
        }
      } catch (error) {
        console.error('Google認証コールバック処理エラー:', error);
        toast.error('認証処理中にエラーが発生しました');
        navigate('/jobseeker');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">認証処理中...</p>
      </div>
    </div>
  );
}

