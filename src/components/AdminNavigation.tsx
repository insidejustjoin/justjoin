import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Users, Building, FileText, Shield, Bell, BarChart3, BookOpen } from 'lucide-react';
import { AdminOverview } from '@/pages/AdminOverview';

export function AdminNavigation() {
  const location = useLocation();

  const navItems = [
    {
      path: '/admin',
      label: '概要',
      icon: Activity,
      description: 'システム統計とログ'
    },
    {
      path: '/admin/jobseekers',
      label: '求職者管理',
      icon: Users,
      description: '求職者データと書類'
    },
    {
      path: '/admin/companies',
      label: '企業管理',
      icon: Building,
      description: '企業データと承認'
    },
    {
      path: '/admin/users',
      label: '管理者管理',
      icon: Shield,
      description: '管理者アカウント管理'
    },
    {
      path: '/admin/notification-history',
      label: '通知履歴',
      icon: Bell,
      description: '送信された通知の履歴'
    },
    {
      path: '/admin/interview-analytics',
      label: '面接結果分析',
      icon: BarChart3,
      description: 'AI面接の統計と詳細分析'
    },
    {
      path: '/admin/blog',
      label: 'ブログ管理',
      icon: BookOpen,
      description: 'ブログ記事の作成・編集・管理'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">管理者ダッシュボード</h1>
        <p className="text-muted-foreground">システム管理とユーザー管理を行います</p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Card key={item.path} className={`transition-all duration-200 hover:shadow-lg ${
              isActive ? 'ring-2 ring-primary' : ''
            }`}>
              <CardContent className="p-6">
                <Link to={item.path} className="block">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 