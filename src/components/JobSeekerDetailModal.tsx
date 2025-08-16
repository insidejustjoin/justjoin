import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, User, FileText, Briefcase, GraduationCap, MapPin, Phone, Mail, Calendar, Globe, Award, Languages, Video } from 'lucide-react';
import { JobSeeker } from '@/types/JobSeeker';
import { InterviewRecordings } from './InterviewRecordings';

interface JobSeekerDetailModalProps {
  jobSeeker: JobSeeker | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentData {
  resume?: {
    personalInfo?: {
      name?: string;
      kana?: string;
      dateOfBirth?: string;
      gender?: string;
      nationality?: string;
      address?: string;
      phone?: string;
      email?: string;
    };
    workExperience?: Array<{
      companyName?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
    }>;
    education?: Array<{
      schoolName?: string;
      degree?: string;
      field?: string;
      startDate?: string;
      endDate?: string;
    }>;
    qualifications?: Array<{
      name?: string;
      issuingOrganization?: string;
      dateObtained?: string;
    }>;
    selfIntroduction?: string;
  };
  skillSheet?: {
    skills?: {
      [key: string]: {
        evaluation?: string;
        experience?: string;
        description?: string;
      };
    };
  };
}

export function JobSeekerDetailModal({ jobSeeker, isOpen, onClose }: JobSeekerDetailModalProps) {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && jobSeeker) {
      loadDocumentData();
    }
  }, [isOpen, jobSeeker]);

  const loadDocumentData = async () => {
    if (!jobSeeker) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/jobseekers/documents/${jobSeeker.user_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDocumentData(data.data);
        }
      }
    } catch (error) {
      console.error('書類データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '未設定';
    }
  };

  const getSkillLevelLabel = (level: string) => {
    switch (level) {
      case 'A': return 'A (上級)';
      case 'B': return 'B (中級)';
      case 'C': return 'C (初級)';
      case 'D': return 'D (学習中)';
      case 'E': return 'E (未経験)';
      default: return '未設定';
    }
  };

  if (!isOpen || !jobSeeker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {jobSeeker.profile_photo ? (
                <img
                  src={jobSeeker.profile_photo}
                  alt={`${jobSeeker.full_name}の写真`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {jobSeeker.full_name || '名前未設定'}
              </h2>
              <p className="text-gray-600">
                {jobSeeker.email || jobSeeker.user_email || 'メール未設定'}
              </p>
            </div>
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                基本情報
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                履歴書
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                スキルシート
              </TabsTrigger>
              <TabsTrigger value="work" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                職務経歴
              </TabsTrigger>
              <TabsTrigger value="interview" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                面接録画
              </TabsTrigger>
            </TabsList>

            {/* 基本情報タブ */}
            <TabsContent value="basic" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      個人情報
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">氏名:</span>
                      <span>{jobSeeker.full_name || '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">フリガナ:</span>
                      <span>{jobSeeker.kana_last_name && jobSeeker.kana_first_name ? 
                        `${jobSeeker.kana_last_name} ${jobSeeker.kana_first_name}` : '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">生年月日:</span>
                      <span>{jobSeeker.date_of_birth ? 
                        new Date(jobSeeker.date_of_birth).toLocaleDateString('ja-JP') : '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">年齢:</span>
                      <span>{jobSeeker.age ? `${jobSeeker.age}歳` : '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">性別:</span>
                      <span>{getGenderLabel(jobSeeker.gender || '')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">国籍:</span>
                      <span>{jobSeeker.nationality || '未設定'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      連絡先情報
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">メール:</span>
                      <span>{jobSeeker.email || jobSeeker.user_email || '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">電話:</span>
                      <span>{jobSeeker.phone || '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">住所:</span>
                      <span>{jobSeeker.address || '未設定'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      資格・言語
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">日本語資格:</span>
                      <Badge variant="outline">
                        {jobSeeker.certificateStatus?.name || '未設定'}
                      </Badge>
                    </div>
                                         <div className="flex items-center gap-2">
                       <span className="font-medium">配偶者:</span>
                       <span>{jobSeeker.spouse || '未設定'}</span>
                     </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">通勤時間:</span>
                      <span>{jobSeeker.commuting_time || '未設定'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      システム情報
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">登録日:</span>
                      <span>{new Date(jobSeeker.created_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">最終更新:</span>
                      <span>{new Date(jobSeeker.updated_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">面接状態:</span>
                      <Badge variant={jobSeeker.interviewEnabled ? "default" : "secondary"}>
                        {jobSeeker.interviewEnabled ? "有効" : "無効"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 履歴書タブ */}
            <TabsContent value="resume" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">データを読み込み中...</p>
                </div>
              ) : documentData?.resume ? (
                <div className="space-y-6">
                  {/* 自己紹介 */}
                  {documentData.resume.selfIntroduction && (
                    <Card>
                      <CardHeader>
                        <CardTitle>自己紹介</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{documentData.resume.selfIntroduction}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* 職務経歴 */}
                  {documentData.resume.workExperience && documentData.resume.workExperience.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>職務経歴</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {documentData.resume.workExperience.map((work, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{work.companyName || '会社名未設定'}</h4>
                                <span className="text-sm text-gray-600">
                                  {work.startDate} - {work.endDate || '現在'}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{work.position || '役職未設定'}</p>
                              {work.description && (
                                <p className="text-gray-600 whitespace-pre-wrap">{work.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 学歴 */}
                  {documentData.resume.education && documentData.resume.education.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>学歴</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {documentData.resume.education.map((edu, index) => (
                            <div key={index} className="border-l-4 border-green-500 pl-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{edu.schoolName || '学校名未設定'}</h4>
                                <span className="text-sm text-gray-600">
                                  {edu.startDate} - {edu.endDate || '現在'}
                                </span>
                              </div>
                              <p className="text-gray-700">{edu.degree || '学位未設定'} - {edu.field || '専攻未設定'}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 資格 */}
                  {documentData.resume.qualifications && documentData.resume.qualifications.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>資格</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {documentData.resume.qualifications.map((qual, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{qual.name || '資格名未設定'}</p>
                                <p className="text-sm text-gray-600">{qual.issuingOrganization || '発行機関未設定'}</p>
                              </div>
                              <span className="text-sm text-gray-600">{qual.dateObtained || '取得日未設定'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">履歴書データがありません</p>
                </div>
              )}
            </TabsContent>

            {/* スキルシートタブ */}
            <TabsContent value="skills" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">データを読み込み中...</p>
                </div>
              ) : documentData?.skillSheet?.skills ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(documentData.skillSheet.skills).map(([skillName, skillData]) => (
                    <Card key={skillName}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{skillName}</span>
                          <Badge variant="outline">
                            {getSkillLevelLabel(skillData.evaluation || '')}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {skillData.experience && (
                          <div>
                            <p className="font-medium text-sm text-gray-700">経験年数:</p>
                            <p className="text-gray-600">{skillData.experience}</p>
                          </div>
                        )}
                        {skillData.description && (
                          <div>
                            <p className="font-medium text-sm text-gray-700">詳細:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{skillData.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">スキルシートデータがありません</p>
                </div>
              )}
            </TabsContent>

            {/* 職務経歴タブ */}
            <TabsContent value="work" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">データを読み込み中...</p>
                </div>
              ) : documentData?.resume?.workExperience && documentData.resume.workExperience.length > 0 ? (
                <div className="space-y-6">
                  {documentData.resume.workExperience.map((work, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{work.companyName || '会社名未設定'}</span>
                          <Badge variant="outline">
                            {work.startDate} - {work.endDate || '現在'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="font-medium text-gray-700">役職:</p>
                          <p className="text-gray-600">{work.position || '役職未設定'}</p>
                        </div>
                        {work.description && (
                          <div>
                            <p className="font-medium text-gray-700">職務内容:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{work.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">職務経歴データがありません</p>
                </div>
              )}
            </TabsContent>

            {/* 面接録画タブ */}
            <TabsContent value="interview" className="mt-6">
              <InterviewRecordings userId={jobSeeker.user_id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 