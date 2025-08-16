
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JobSeeker } from '../types/JobSeeker';
import { getJobSeekers, filterJobSeekersBySkills } from '../utils/storage';
import { Search, Users, Calendar, Phone, User } from 'lucide-react';

const EmployerDashboard: React.FC = () => {
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<JobSeeker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    const seekers = getJobSeekers();
    setJobSeekers(seekers);
    setFilteredJobSeekers(seekers);
  }, []);

  useEffect(() => {
    let filtered = jobSeekers;

    // 名前での検索
    if (searchTerm) {
      filtered = filtered.filter(seeker =>
        seeker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.desiredJobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // スキルでのフィルタリング
    if (skillFilter) {
      const skillFilters = skillFilter.split(',').map(s => s.trim()).filter(s => s.length > 0);
      filtered = filterJobSeekersBySkills(filtered, skillFilters);
    }

    setFilteredJobSeekers(filtered);
  }, [jobSeekers, searchTerm, skillFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return gender;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">求職者ダッシュボード</h1>
          <p className="text-gray-600">登録された求職者の一覧と詳細情報</p>
        </div>

        {/* 検索・フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="名前または職種で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  placeholder="スキルでフィルター (例: JavaScript, React)"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計情報 */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">総求職者数</p>
                  <p className="text-2xl font-bold">{jobSeekers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Search className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">検索結果</p>
                  <p className="text-2xl font-bold">{filteredJobSeekers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">平均経験年数</p>
                  <p className="text-2xl font-bold">
                    {jobSeekers.length > 0 
                      ? Math.round(jobSeekers.reduce((sum, seeker) => sum + seeker.experience, 0) / jobSeekers.length)
                      : 0
                    }年
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 求職者一覧 */}
        <div className="grid gap-6">
          {filteredJobSeekers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">求職者が見つかりません</h3>
                <p className="text-gray-600">検索条件を変更してお試しください。</p>
              </CardContent>
            </Card>
          ) : (
            filteredJobSeekers.map((seeker) => (
              <Card key={seeker.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* 基本情報 */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{seeker.fullName}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {getAge(seeker.dateOfBirth)}歳 ({getGenderLabel(seeker.gender)})
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {seeker.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          登録日: {formatDate(seeker.registeredAt)}
                        </div>
                      </div>
                    </div>

                    {/* 職歴・希望 */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">希望職種</h4>
                      <p className="text-lg text-blue-600 font-medium mb-3">{seeker.desiredJobTitle}</p>
                      <h4 className="font-semibold text-gray-900 mb-2">経験年数</h4>
                      <p className="text-gray-700">{seeker.experience}年</p>
                    </div>

                    {/* スキル */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">スキル</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {seeker.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 自己紹介 */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">自己紹介</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{seeker.selfIntroduction}</p>
                  </div>

                  {/* 連絡先 */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">メール:</span>
                        <span className="ml-2 text-blue-600">{seeker.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">住所:</span>
                        <span className="ml-2 text-gray-700">{seeker.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
