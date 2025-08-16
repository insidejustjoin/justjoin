import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: 'job_seeker' | 'company' | 'admin';
}

export function AuthGuard({ children, requiredUserType }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    // 管理者ページの場合は管理者ログインページにリダイレクト
    if (requiredUserType === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    // その他の場合は求職者ログインページにリダイレクト
    return <Navigate to="/jobseeker" replace />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    const getUserTypeLabel = (type: string) => {
      switch (type) {
        case 'job_seeker': return '求職者';
        case 'company': return '企業';
        case 'admin': return '管理者';
        default: return type;
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              アクセス権限がありません
            </h2>
            <p className="text-gray-600 mb-6">
              このページにアクセスするには{getUserTypeLabel(requiredUserType)}アカウントが必要です。
            </p>
            <p className="text-sm text-gray-500">
              現在のアカウント: {getUserTypeLabel(user.user_type)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 