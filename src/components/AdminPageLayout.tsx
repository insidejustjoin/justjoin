import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Shield } from 'lucide-react';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminPageLayout({ children, title }: AdminPageLayoutProps) {
  const location = useLocation();

  const navItems = [
    {
      path: '/admin/jobseekers',
      label: '求職者管理',
      icon: Users,
    },
    {
      path: '/admin/users',
      label: '管理者管理',
      icon: Shield,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ナビゲーションバー */}
      <div className="mb-6">
        <nav className="flex space-x-4 border-b">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ページタイトル */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      {/* ページコンテンツ */}
      {children}
    </div>
  );
} 