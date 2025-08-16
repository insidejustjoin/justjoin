import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_BASE_URL } from '@/constants/api';

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

interface Education {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: {
    name: string;
    level: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
}

export function ResumeForm() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      github: ''
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: []
  });

  const [newWorkExperience, setNewWorkExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    achievements: []
  });

  const [newEducation, setNewEducation] = useState<Education>({
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState({ name: '', level: '' });
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '', date: '' });
  const [newAchievement, setNewAchievement] = useState('');

  // サーバーからデータを復元
  useEffect(() => {
    const loadResumeData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('認証トークンが見つかりません');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/documents/${user.id}/resume`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.documentData) {
            setResumeData(data.documentData);
          }
        } else if (response.status !== 404) {
          console.error('履歴書データ取得エラー:', response.status);
        }
      } catch (error) {
        console.error('履歴書データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResumeData();
  }, [user]);

  // データ変更時にサーバーに保存
  const saveResumeData = async (data: ResumeData) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('認証トークンが見つかりません');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          documentType: 'resume',
          documentData: data
        })
      });

      if (!response.ok) {
        console.error('履歴書データ保存エラー:', response.status);
      }
    } catch (error) {
      console.error('履歴書データ保存エラー:', error);
    }
  };

  // データ変更時にサーバーに保存（デバウンス）
  useEffect(() => {
    if (!user || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveResumeData(resumeData);
    }, 3000); // 1秒から3秒に延長

    return () => clearTimeout(timeoutId);
  }, [resumeData, user, isLoading]);

  const addWorkExperience = () => {
    if (newWorkExperience.company.trim() && newWorkExperience.position.trim()) {
      setResumeData(prev => ({
        ...prev,
        workExperience: [...prev.workExperience, { ...newWorkExperience }]
      }));
      setNewWorkExperience({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        achievements: []
      });
    }
  };

  const removeWorkExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setNewWorkExperience(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setNewWorkExperience(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    if (newEducation.school.trim() && newEducation.degree.trim()) {
      setResumeData(prev => ({
        ...prev,
        education: [...prev.education, { ...newEducation }]
      }));
      setNewEducation({
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      });
    }
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.name.trim() && newLanguage.level.trim()) {
      setResumeData(prev => ({
        ...prev,
        languages: [...prev.languages, { ...newLanguage }]
      }));
      setNewLanguage({ name: '', level: '' });
    }
  };

  const removeLanguage = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      setResumeData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification }]
      }));
      setNewCertification({ name: '', issuer: '', date: '' });
    }
  };

  const removeCertification = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // タイトル
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('履歴書', 105, yPos, { align: 'center' });
    yPos += 20;

    // 個人情報
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('個人情報', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`氏名: ${resumeData.personalInfo.name}`, 20, yPos);
    yPos += 7;
    doc.text(`メール: ${resumeData.personalInfo.email}`, 20, yPos);
    yPos += 7;
    doc.text(`電話: ${resumeData.personalInfo.phone}`, 20, yPos);
    yPos += 7;
    doc.text(`住所: ${resumeData.personalInfo.address}`, 20, yPos);
    yPos += 15;

    // 自己紹介
    if (resumeData.summary) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('自己紹介', 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(resumeData.summary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 7 + 10;
    }

    // 職歴
    if (resumeData.workExperience.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('職歴', 20, yPos);
      yPos += 10;

      resumeData.workExperience.forEach((work, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${work.position} - ${work.company}`, 20, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${work.startDate} - ${work.endDate}`, 20, yPos);
        yPos += 7;

        if (work.description) {
          const descLines = doc.splitTextToSize(work.description, 170);
          doc.text(descLines, 20, yPos);
          yPos += descLines.length * 7;
        }

        if (work.achievements.length > 0) {
          work.achievements.forEach(achievement => {
            doc.text(`• ${achievement}`, 25, yPos);
            yPos += 7;
          });
        }
        yPos += 10;
      });
    }

    // 学歴
    if (resumeData.education.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('学歴', 20, yPos);
      yPos += 10;

      resumeData.education.forEach((edu) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${edu.degree} - ${edu.school}`, 20, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${edu.field}`, 20, yPos);
        yPos += 7;
        doc.text(`${edu.startDate} - ${edu.endDate}`, 20, yPos);
        if (edu.gpa) {
          yPos += 7;
          doc.text(`GPA: ${edu.gpa}`, 20, yPos);
        }
        yPos += 10;
      });
    }

    // スキル
    if (resumeData.skills.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('スキル', 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(resumeData.skills.join(', '), 20, yPos);
      yPos += 15;
    }

    // 言語
    if (resumeData.languages.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('言語スキル', 20, yPos);
      yPos += 10;

      resumeData.languages.forEach((lang) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${lang.name}: ${lang.level}`, 20, yPos);
        yPos += 7;
      });
    }

    // 資格
    if (resumeData.certifications.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('資格・認定', 20, yPos);
      yPos += 10;

      resumeData.certifications.forEach((cert) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${cert.name} - ${cert.issuer} (${cert.date})`, 20, yPos);
        yPos += 7;
      });
    }

    doc.save(`履歴書_${resumeData.personalInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = async () => {
    try {
      // ExcelJSライブラリの動的インポート
      const ExcelJS = await import('exceljs');
      
      const workbook = new ExcelJS.Workbook();
      
      // 列幅の設定
      const worksheet = workbook.addWorksheet('履歴書');
      worksheet.columns = [
        { width: 15 },  // A列
        { width: 20 },  // B列
        { width: 15 },  // C列
        { width: 15 },  // D列
        { width: 15 },  // E列
        { width: 30 },  // F列
      ];
    
    const resumeDataArray = [
      ['履歴書'],
      [],
      ['個人情報'],
      ['氏名', resumeData.personalInfo.name],
      ['メールアドレス', resumeData.personalInfo.email],
      ['電話番号', resumeData.personalInfo.phone],
      ['住所', resumeData.personalInfo.address],
      ['LinkedIn', resumeData.personalInfo.linkedin || ''],
      ['GitHub', resumeData.personalInfo.github || ''],
      [],
      ['自己紹介'],
      [resumeData.summary],
      [],
      ['職歴'],
      ['会社名', '役職', '開始日', '終了日', '説明', '成果']
    ];

    resumeData.workExperience.forEach(work => {
      resumeDataArray.push([
        work.company,
        work.position,
        work.startDate,
        work.endDate,
        work.description,
        work.achievements.join('; ')
      ]);
    });

    resumeDataArray.push([], ['学歴'], ['学校名', '学位', '専攻', '開始日', '終了日', 'GPA']);
    resumeData.education.forEach(edu => {
      resumeDataArray.push([
        edu.school,
        edu.degree,
        edu.field,
        edu.startDate,
        edu.endDate,
        edu.gpa || ''
      ]);
    });

    resumeDataArray.push([], ['スキル'], resumeData.skills);
    resumeDataArray.push([], ['言語スキル'], ['言語名', 'レベル']);
    resumeData.languages.forEach(lang => {
      resumeDataArray.push([lang.name, lang.level]);
    });

    resumeDataArray.push([], ['資格・認定'], ['資格名', '発行機関', '取得日']);
    resumeData.certifications.forEach(cert => {
      resumeDataArray.push([cert.name, cert.issuer, cert.date]);
    });

      // データをワークシートに追加
      resumeDataArray.forEach((row, rowIndex) => {
        const worksheetRow = worksheet.addRow(row);
        
        // セルのスタイル設定
        row.forEach((cellValue, colIndex) => {
          const cell = worksheetRow.getCell(colIndex + 1);
          
          // セルのスタイル設定
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          
          cell.font = {
            name: 'MS PGothic',
            size: 10
          };
          
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true
          };
        });
      });

      // ファイルをダウンロード
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `履歴書_${resumeData.personalInfo.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excelファイル生成エラー:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('loadingResumeData')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">ログインが必要です</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">履歴書作成</h1>
        <p className="text-gray-600">あなたの経歴とスキルを整理して履歴書を作成しましょう</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>個人情報</CardTitle>
          <CardDescription>基本的な連絡先情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">氏名</Label>
              <Input
                id="name"
                value={resumeData.personalInfo.name}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, name: e.target.value }
                }))}
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={resumeData.personalInfo.email}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, email: e.target.value }
                }))}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={resumeData.personalInfo.phone}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, phone: e.target.value }
                }))}
                placeholder="090-1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={resumeData.personalInfo.address}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, address: e.target.value }
                }))}
                placeholder="東京都渋谷区..."
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={resumeData.personalInfo.linkedin}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                }))}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={resumeData.personalInfo.github}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, github: e.target.value }
                }))}
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自己紹介</CardTitle>
          <CardDescription>あなたの強みやキャリア目標を簡潔に説明してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={resumeData.summary}
            onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="経験豊富なフルスタック開発者として、React、Node.js、PostgreSQLを使用したWebアプリケーション開発に従事..."
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>職歴</CardTitle>
          <CardDescription>過去の職歴を時系列順に追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>会社名</Label>
              <Input
                value={newWorkExperience.company}
                onChange={(e) => setNewWorkExperience(prev => ({ ...prev, company: e.target.value }))}
                placeholder="株式会社サンプル"
              />
            </div>
            <div>
              <Label>役職</Label>
              <Input
                value={newWorkExperience.position}
                onChange={(e) => setNewWorkExperience(prev => ({ ...prev, position: e.target.value }))}
                placeholder="フロントエンドエンジニア"
              />
            </div>
            <div>
              <Label>開始日</Label>
              <Input
                type="date"
                value={newWorkExperience.startDate}
                onChange={(e) => setNewWorkExperience(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>終了日</Label>
              <Input
                type="date"
                value={newWorkExperience.endDate}
                onChange={(e) => setNewWorkExperience(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>職務内容</Label>
            <Textarea
              value={newWorkExperience.description}
              onChange={(e) => setNewWorkExperience(prev => ({ ...prev, description: e.target.value }))}
              placeholder="React、TypeScriptを使用したWebアプリケーション開発..."
              rows={3}
            />
          </div>
          <div>
            <Label>成果・実績</Label>
            <div className="flex gap-2">
              <Input
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="売上向上20%を達成"
              />
              <Button onClick={addAchievement} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              {newWorkExperience.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm">• {achievement}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAchievement(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={addWorkExperience} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            職歴を追加
          </Button>

          <div className="space-y-4">
            {resumeData.workExperience.map((work, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{work.position}</h4>
                    <p className="text-sm text-gray-600">{work.company}</p>
                    <p className="text-sm text-gray-500">{work.startDate} - {work.endDate}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkExperience(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {work.description && (
                  <p className="text-sm mb-2">{work.description}</p>
                )}
                {work.achievements.length > 0 && (
                  <ul className="text-sm text-gray-600">
                    {work.achievements.map((achievement, i) => (
                      <li key={i}>• {achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学歴</CardTitle>
          <CardDescription>学歴を追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>学校名</Label>
              <Input
                value={newEducation.school}
                onChange={(e) => setNewEducation(prev => ({ ...prev, school: e.target.value }))}
                placeholder="東京大学"
              />
            </div>
            <div>
              <Label>学位</Label>
              <Input
                value={newEducation.degree}
                onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                placeholder="学士"
              />
            </div>
            <div>
              <Label>専攻</Label>
              <Input
                value={newEducation.field}
                onChange={(e) => setNewEducation(prev => ({ ...prev, field: e.target.value }))}
                placeholder="情報工学"
              />
            </div>
            <div>
              <Label>GPA</Label>
              <Input
                value={newEducation.gpa}
                onChange={(e) => setNewEducation(prev => ({ ...prev, gpa: e.target.value }))}
                placeholder="3.8/4.0"
              />
            </div>
            <div>
              <Label>開始日</Label>
              <Input
                type="date"
                value={newEducation.startDate}
                onChange={(e) => setNewEducation(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>終了日</Label>
              <Input
                type="date"
                value={newEducation.endDate}
                onChange={(e) => setNewEducation(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={addEducation} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            学歴を追加
          </Button>

          <div className="space-y-2">
            {resumeData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{edu.degree} - {edu.school}</div>
                  <div className="text-sm text-gray-600">{edu.field}</div>
                  <div className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</div>
                  {edu.gpa && <div className="text-sm text-gray-500">GPA: {edu.gpa}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>スキル</CardTitle>
          <CardDescription>技術スキルや専門知識を追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="JavaScript, React, Node.js"
            />
            <Button onClick={addSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-sm">{skill}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkill(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>言語スキル</CardTitle>
          <CardDescription>外国語のスキルを追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>言語名</Label>
              <Input
                value={newLanguage.name}
                onChange={(e) => setNewLanguage(prev => ({ ...prev, name: e.target.value }))}
                placeholder="英語"
              />
            </div>
            <div>
              <Label>レベル</Label>
              <Input
                value={newLanguage.level}
                onChange={(e) => setNewLanguage(prev => ({ ...prev, level: e.target.value }))}
                placeholder="ビジネスレベル"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addLanguage} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {resumeData.languages.map((language, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-sm text-gray-600">- {language.level}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLanguage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>資格・認定</CardTitle>
          <CardDescription>取得している資格や認定を追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>資格名</Label>
              <Input
                value={newCertification.name}
                onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                placeholder="AWS認定ソリューションアーキテクト"
              />
            </div>
            <div>
              <Label>発行機関</Label>
              <Input
                value={newCertification.issuer}
                onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                placeholder="Amazon Web Services"
              />
            </div>
            <div>
              <Label>取得日</Label>
              <Input
                type="date"
                value={newCertification.date}
                onChange={(e) => setNewCertification(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addCertification} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {resumeData.certifications.map((certification, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{certification.name}</div>
                  <div className="text-sm text-gray-600">
                    {certification.issuer} - {certification.date}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCertification(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={exportToPDF} size="lg" className="px-8">
          <FileText className="h-5 w-5 mr-2" />
          PDFでダウンロード
        </Button>
        <Button onClick={exportToExcel} size="lg" className="px-8">
          <Download className="h-5 w-5 mr-2" />
          Excelでダウンロード
        </Button>
      </div>
    </div>
  );
} 