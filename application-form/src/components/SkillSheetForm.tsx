import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Plus, X, User, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_BASE_URL } from '@/constants/api';

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years: number;
  description: string;
}

interface SkillSheetData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  skills: Skill[];
  languages: {
    name: string;
    level: 'basic' | 'conversational' | 'fluent' | 'native';
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
}

export function SkillSheetForm() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [skillSheetData, setSkillSheetData] = useState<SkillSheetData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    skills: [],
    languages: [],
    certifications: []
  });

  const [newSkill, setNewSkill] = useState<Skill>({
    name: '',
    level: 'beginner',
    years: 0,
    description: ''
  });

  const [newLanguage, setNewLanguage] = useState({
    name: '',
    level: 'basic' as const
  });

  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    date: ''
  });

  // サーバーからデータを復元
  useEffect(() => {
    const loadSkillSheetData = async () => {
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

        const response = await fetch(`${API_BASE_URL}/documents/${user.id}/skillSheet`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.documentData) {
            setSkillSheetData(data.documentData);
          }
        } else if (response.status !== 404) {
          console.error('スキルシートデータ取得エラー:', response.status);
        }
      } catch (error) {
        console.error('スキルシートデータ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkillSheetData();
  }, [user]);

  // データ変更時にサーバーに保存
  const saveSkillSheetData = async (data: SkillSheetData) => {
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
          documentType: 'skillSheet',
          documentData: data
        })
      });

      if (!response.ok) {
        console.error('スキルシートデータ保存エラー:', response.status);
      }
    } catch (error) {
      console.error('スキルシートデータ保存エラー:', error);
    }
  };

  // データ変更時にサーバーに保存（デバウンス）
  useEffect(() => {
    if (!user || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveSkillSheetData(skillSheetData);
    }, 3000); // 1秒から3秒に延長

    return () => clearTimeout(timeoutId);
  }, [skillSheetData, user, isLoading]);

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkillSheetData(prev => ({
        ...prev,
        skills: [...prev.skills, { ...newSkill }]
      }));
      setNewSkill({
        name: '',
        level: 'beginner',
        years: 0,
        description: ''
      });
    }
  };

  const removeSkill = (index: number) => {
    setSkillSheetData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.name.trim()) {
      setSkillSheetData(prev => ({
        ...prev,
        languages: [...prev.languages, { ...newLanguage }]
      }));
      setNewLanguage({ name: '', level: 'basic' });
    }
  };

  const removeLanguage = (index: number) => {
    setSkillSheetData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      setSkillSheetData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification }]
      }));
      setNewCertification({ name: '', issuer: '', date: '' });
    }
  };

  const removeCertification = (index: number) => {
    setSkillSheetData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const exportToExcel = async () => {
    try {
      // ExcelJSライブラリの動的インポート
      const ExcelJS = await import('exceljs');
      
      // スキルシートデータをExcel形式に変換
      const workbook = new ExcelJS.Workbook();
      
      // 個人情報シート
      const worksheet = workbook.addWorksheet('スキルシート');
      
      // 列幅の設定
      worksheet.columns = [
        { width: 15 },  // A列
        { width: 20 },  // B列
        { width: 10 },  // C列
        { width: 30 },  // D列
      ];
      
      const personalInfoData = [
        ['個人情報'],
        ['氏名', skillSheetData.personalInfo.name],
        ['メールアドレス', skillSheetData.personalInfo.email],
        ['電話番号', skillSheetData.personalInfo.phone],
        ['住所', skillSheetData.personalInfo.address],
        [],
        ['スキル一覧'],
        ['スキル名', 'レベル', '経験年数', '説明']
      ];

      skillSheetData.skills.forEach(skill => {
        personalInfoData.push([
          skill.name,
          skill.level,
          skill.years.toString(),
          skill.description
        ]);
      });

      personalInfoData.push([], ['言語スキル'], ['言語名', 'レベル']);
      skillSheetData.languages.forEach(lang => {
        personalInfoData.push([lang.name, lang.level]);
      });

      personalInfoData.push([], ['資格・認定'], ['資格名', '発行機関', '取得日']);
      skillSheetData.certifications.forEach(cert => {
        personalInfoData.push([cert.name, cert.issuer, cert.date]);
      });

      // データをワークシートに追加
      personalInfoData.forEach((row, rowIndex) => {
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
      link.download = `スキルシート_${skillSheetData.personalInfo.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excelファイル生成エラー:', error);
    }
  };

  const getLevelLabel = (level: string) => {
    const labels = {
      beginner: '初級',
      intermediate: '中級',
      advanced: '上級',
      expert: 'エキスパート',
      basic: '基礎',
      conversational: '日常会話',
      fluent: '流暢',
      native: 'ネイティブ'
    };
    return labels[level as keyof typeof labels] || level;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('loadingSkillSheetData')}</div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">スキルシート作成</h1>
        <p className="text-gray-600">あなたのスキルと経験を整理してスキルシートを作成しましょう</p>
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
                value={skillSheetData.personalInfo.name}
                onChange={(e) => setSkillSheetData(prev => ({
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
                value={skillSheetData.personalInfo.email}
                onChange={(e) => setSkillSheetData(prev => ({
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
                value={skillSheetData.personalInfo.phone}
                onChange={(e) => setSkillSheetData(prev => ({
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
                value={skillSheetData.personalInfo.address}
                onChange={(e) => setSkillSheetData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, address: e.target.value }
                }))}
                placeholder="東京都渋谷区..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>スキル</CardTitle>
          <CardDescription>技術スキルや専門知識を追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>スキル名</Label>
              <Input
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                placeholder="JavaScript"
              />
            </div>
            <div>
              <Label>レベル</Label>
              <Select value={newSkill.level} onValueChange={(value: any) => setNewSkill(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">初級</SelectItem>
                  <SelectItem value="intermediate">中級</SelectItem>
                  <SelectItem value="advanced">上級</SelectItem>
                  <SelectItem value="expert">エキスパート</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>経験年数</Label>
              <Input
                type="number"
                value={newSkill.years}
                onChange={(e) => setNewSkill(prev => ({ ...prev, years: parseInt(e.target.value) || 0 }))}
                placeholder="3"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addSkill} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
          </div>
          <div>
            <Label>説明</Label>
            <Textarea
              value={newSkill.description}
              onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
              placeholder="このスキルについて詳しく説明してください"
            />
          </div>

          <div className="space-y-2">
            {skillSheetData.skills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline">{getLevelLabel(skill.level)}</Badge>
                    <Badge variant="secondary">{skill.years}年</Badge>
                  </div>
                  {skill.description && (
                    <p className="text-sm text-gray-600">{skill.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkill(index)}
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
              <Select value={newLanguage.level} onValueChange={(value: any) => setNewLanguage(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">基礎</SelectItem>
                  <SelectItem value="conversational">日常会話</SelectItem>
                  <SelectItem value="fluent">流暢</SelectItem>
                  <SelectItem value="native">ネイティブ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addLanguage} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {skillSheetData.languages.map((language, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{language.name}</span>
                  <Badge variant="outline">{getLevelLabel(language.level)}</Badge>
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
            {skillSheetData.certifications.map((certification, index) => (
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

      <div className="flex justify-center">
        <Button onClick={exportToExcel} size="lg" className="px-8">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Excelでダウンロード
        </Button>
      </div>
    </div>
  );
} 