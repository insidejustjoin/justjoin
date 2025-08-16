import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Building, Clock, DollarSign } from 'lucide-react';
// import { jobPostingsRepository, JobPosting } from '@/integrations/postgres';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface JobPostingWithCompany {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  company_name: string;
  location?: string;
  job_type?: string;
  remote_work: boolean;
  salary_min?: number;
  salary_max?: number;
  created_at: string;
}

export function JobPostingList() {
  const { t } = useLanguage();
  const [jobPostings, setJobPostings] = useState<JobPostingWithCompany[]>([]);
  const [filteredJobPostings, setFilteredJobPostings] = useState<JobPostingWithCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    loadJobPostings();
  }, []);

  useEffect(() => {
    filterJobPostings();
  }, [jobPostings, searchTerm, selectedLocation, selectedJobType, remoteOnly]);

  const loadJobPostings = async () => {
    try {
      // モックデータを使用
      const mockJobPostings: JobPostingWithCompany[] = [
        {
          id: '1',
          title: 'フロントエンドエンジニア',
          description: 'React、TypeScriptを使用したWebアプリケーション開発',
          company_id: '1',
          company_name: 'TechCorp株式会社',
          location: '東京',
          job_type: 'full_time',
          remote_work: true,
          salary_min: 400,
          salary_max: 600,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'バックエンドエンジニア',
          description: 'Node.js、PostgreSQLを使用したAPI開発',
          company_id: '2',
          company_name: 'StartupInc',
          location: '大阪',
          job_type: 'full_time',
          remote_work: false,
          salary_min: 350,
          salary_max: 500,
          created_at: new Date().toISOString()
        }
      ];
      
      setJobPostings(mockJobPostings);
    } catch (error) {
      console.error('求人情報取得エラー:', error);
      toast.error('求人情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobPostings = () => {
    let filtered = [...jobPostings];

    // 検索語でフィルタリング
    if (searchTerm) {
      filtered = filtered.filter(posting =>
        posting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 勤務地でフィルタリング
    if (selectedLocation) {
      filtered = filtered.filter(posting =>
        posting.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // 雇用形態でフィルタリング
    if (selectedJobType && selectedJobType !== 'all') {
      filtered = filtered.filter(posting => posting.job_type === selectedJobType);
    }

    // リモートワークのみ
    if (remoteOnly) {
      filtered = filtered.filter(posting => posting.remote_work);
    }

    setFilteredJobPostings(filtered);
  };

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'full_time': return t('jobSearch.fullTime');
      case 'part_time': return t('jobSearch.partTime');
      case 'contract': return t('jobSearch.contract');
      case 'internship': return t('jobSearch.internship');
      default: return jobType;
    }
  };

  const formatSalary = (min: number, max: number) => {
    return `${min}万円〜${max}万円`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>{t('jobSearch.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('jobSearch.keywordSearch')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Input
              placeholder={t('jobSearch.location')}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            />
            
            <Select value={selectedJobType} onValueChange={setSelectedJobType}>
              <SelectTrigger>
                <SelectValue placeholder={t('jobSearch.employmentType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('jobSearch.allTypes')}</SelectItem>
                <SelectItem value="full_time">{t('jobSearch.fullTime')}</SelectItem>
                <SelectItem value="part_time">{t('jobSearch.partTime')}</SelectItem>
                <SelectItem value="contract">{t('jobSearch.contract')}</SelectItem>
                <SelectItem value="internship">{t('jobSearch.internship')}</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote"
                checked={remoteOnly}
                onCheckedChange={(checked) => setRemoteOnly(checked as boolean)}
              />
              <Label htmlFor="remote">{t('jobSearch.remoteOnly')}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 結果件数 */}
      <div className="text-sm text-muted-foreground">
        {filteredJobPostings.length}件の求人が見つかりました
      </div>

      {/* 求人一覧 */}
      <div className="space-y-4">
        {filteredJobPostings.map((posting) => (
          <Card key={posting.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{posting.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Building className="h-4 w-4" />
                    {posting.company_name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {posting.remote_work && (
                    <Badge variant="secondary">リモート可</Badge>
                  )}
                  <Badge variant="outline">
                    {getJobTypeLabel(posting.job_type || '')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {posting.description}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {posting.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {posting.location}
                    </div>
                  )}
                  
                  {posting.salary_min && posting.salary_max && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary(posting.salary_min, posting.salary_max)}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button size="sm">
                    詳細を見る
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobPostings.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <p className="text-muted-foreground">条件に一致する求人が見つかりませんでした</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('');
                setSelectedJobType('all');
                setRemoteOnly(false);
              }}
              className="mt-2"
            >
              フィルターをリセット
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 