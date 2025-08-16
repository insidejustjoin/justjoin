import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { User, LogOut, Settings, Building, User as UserIcon, Home, Briefcase } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // AuthProviderの外で使用された場合の安全な処理
  if (!user) {
    return null;
  }

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.user_type === 'company' && user.profile?.company_name) {
      return user.profile.company_name.charAt(0);
    }
    if (user.user_type === 'job_seeker' && user.profile?.full_name) {
      return user.profile.full_name.charAt(0);
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.user_type === 'company' && user.profile?.company_name) {
      return user.profile.company_name;
    }
    if (user.user_type === 'job_seeker' && user.profile?.full_name) {
      return user.profile.full_name;
    }
    return user.email;
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Whoami Job Matching
              </h1>
            </Link>

            {user && (
              <nav className="hidden md:flex space-x-6">
                {user.user_type === 'job_seeker' ? (
                  <Link to="/jobseeker/search" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <Home className="h-4 w-4 mr-1" />
                    {t('header.jobSearch')}
                  </Link>
                ) : (
                  <Link to="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <Home className="h-4 w-4 mr-1" />
                    {t('common.home')}
                  </Link>
                )}
                {user.user_type === 'job_seeker' && (
                  <Link to="/jobseeker/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {t('common.dashboard')}
                  </Link>
                )}
                {user.user_type === 'company' && (
                  <Link to="/employer/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <Building className="h-4 w-4 mr-1" />
                    {t('header.jobManagement')}
                  </Link>
                )}
                {user.user_type === 'admin' && (
                  <>
                    <Link to="/admin" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                      <User className="h-4 w-4 mr-1" />
                      {t('header.adminDashboard')}
                    </Link>
                    <Link to="/admin/jobseekers" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                      <UserIcon className="h-4 w-4 mr-1" />
                      求職者管理
                    </Link>
                    <Link to="/admin/users" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                      <Settings className="h-4 w-4 mr-1" />
                      管理者管理
                    </Link>
                  </>
                )}
                {user.user_type !== 'admin' && (
                  <Link to={
                    user.user_type === 'job_seeker' ? '/jobseeker/my-page' :
                    user.user_type === 'company' ? '/employer/my-page' : '/my-page'
                  } className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {t('common.myPage')}
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <LanguageToggle />
            
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {user.user_type === 'company' ? (
                    <Building className="h-4 w-4" />
                  ) : user.user_type === 'admin' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
                  <span>
                    {user.user_type === 'company' ? t('common.company') : 
                     user.user_type === 'admin' ? t('common.admin') : t('common.jobSeeker')}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.user_type !== 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={
                          user.user_type === 'job_seeker' ? '/jobseeker/my-page' :
                          user.user_type === 'company' ? '/employer/my-page' : '/my-page'
                        }>
                          <User className="mr-2 h-4 w-4" />
                          <span>{t('common.myPage')}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('common.settings')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('common.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="outline" size="sm">
                {t('common.login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
