import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Package } from 'lucide-react';

const DeployTest: React.FC = () => {
  const deployInfo = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'メール送信機能（Gmail SMTP）',
      '求職者登録・ログイン',
      '企業登録・承認システム',
      'スキルシート作成',
      '履歴書作成',
      '設定ページ',
      'パスワード再発行',
      'Google SSOログイン'
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 デプロイテストページ
          </h1>
          <p className="text-xl text-gray-600">
            最新の変更が正常に反映されていることを確認します
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* デプロイ情報 */}
          <Card className="shadow-lg">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                デプロイ成功
              </CardTitle>
              <CardDescription>
                最新の変更が正常に反映されています
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">デプロイ時刻:</span>
                <Badge variant="outline">
                  {new Date(deployInfo.timestamp).toLocaleString('ja-JP')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">バージョン:</span>
                <Badge variant="secondary">{deployInfo.version}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ステータス:</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  稼働中
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 機能一覧 */}
          <Card className="shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Package className="w-5 h-5" />
                実装済み機能
              </CardTitle>
              <CardDescription>
                現在利用可能な機能一覧
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deployInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* テストリンク */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              機能テスト
            </CardTitle>
            <CardDescription>
              各機能が正常に動作するかテストしてください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <a 
                href="/jobseeker/register" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-2">求職者登録</h3>
                <p className="text-sm text-gray-600">新規求職者アカウント作成</p>
              </a>
              <a 
                href="/employer/register" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-2">企業登録</h3>
                <p className="text-sm text-gray-600">新規企業アカウント作成</p>
              </a>
              <a 
                href="/settings" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-2">設定ページ</h3>
                <p className="text-sm text-gray-600">システム設定・メールテスト</p>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* 技術情報 */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>技術情報</CardTitle>
            <CardDescription>
              デプロイ環境と技術スタック
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">フロントエンド</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• React 18 + TypeScript</li>
                  <li>• Vite (ビルドツール)</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• React Router DOM</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">バックエンド</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Node.js + PostgreSQL</li>
                  <li>• Gmail SMTP (メール送信)</li>
                  <li>• JWT認証</li>
                  <li>• Google OAuth 2.0</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            このページが正常に表示されていれば、デプロイは成功しています。
          </p>
          <p className="text-sm text-gray-500 mt-2">
            最終更新: {new Date(deployInfo.timestamp).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeployTest; 