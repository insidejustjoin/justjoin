import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, AlertCircle, CheckCircle, FileSpreadsheet, Settings, User, Briefcase, Award, Upload, Camera, Star, Trophy, ArrowLeft, Percent, Globe } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/constants/api';
import ExcelJS from 'exceljs';
import { cn } from '@/lib/utils';

interface DocumentData {
  // 基本情報
  lastName: string;
  firstName: string;
  kanaLastName: string;
  kanaFirstName: string;
  birthDate: string;
  gender: string;
  
  // 現住所情報
  livePostNumber: string;
  liveAddress: string;
  kanaLiveAddress: string;
  livePhoneNumber: string;
  liveMail: string;
  nationality: string; // 国籍
  
  // 連絡先情報
  contactPostNumber: string;
  contactAddress: string;
  kanaContactAddress: string;
  contactPhoneNumber: string;
  contactMail: string;
  
  // 履歴書固有
  resume: {
    photoUrl: string;
    education: Array<{
      year: string;
      month: string;
      content: string;
    }>;
    workExperience: Array<{
      year: string;
      month: string;
      content: string;
    }>;
    qualifications: Array<{
      year: string;
      month: string;
      name: string;
    }>;
    skills: Array<{
      category: string;
      level: string;
    }>;
    selfPR: string;
    noEducation: boolean;
    noWorkExperience: boolean;
    noQualifications: boolean;
  };
  
  // 職務経歴書固有
  workHistory: {
    currentDate: string;
    workExperiences: Array<{
      period: string;
      company: string;
      position: string;
      description: string;
      technologies: string;
      software: string;
      role: string;
    }>;
    qualifications: string;
    noWorkHistory: boolean;
  };
  
  // スキルシート固有
  skillSheet: {
    skills: {
      [skillName: string]: {
        level: string;
        experience: string;
        projects: string;
        evaluation: string; // A-D評価
        pcUsageYears?: string; // パソコン利用歴（数値）
      };
    };
  };
  
  // 追加情報
  selfIntroduction: string;
  personalPreference: string;
  contactSameAsLive: boolean;
  spouse: string;
  spouseSupport: string;
  
  // 日本語関連情報
  certificateStatus: {
    date: string;
    name: string;
  };
  nextJapaneseTestDate: string;
  nextJapaneseTestLevel: string;
  whyJapan: string;
  whyInterestJapan: string;
}

interface DocumentGeneratorProps {
  // 管理者画面用のプロパティ
  isAdminMode?: boolean;
  jobSeekerData?: Partial<{
    id: string;
    user_id: string;
    full_name: string;
    date_of_birth: string | null;
    gender: 'male' | 'female' | 'other' | null;
    email: string;
    phone: string | null;
    address: string | null;
    desired_job_title: string | null;
    experience_years: number;
    skills: string[];
    self_introduction: string | null;
    spouse: string | null;
    spouse_support: string | null;
    commuting_time: string | null;
    family_number: string | null;
    profile_photo: string | null;
    kana_first_name: string | null;
    kana_last_name: string | null;
    created_at: string;
    updated_at: string;
    // 日本語資格情報を追加
    certificateStatus?: {
      name: string;
      date: string;
    };
    // スキルレベル情報を追加
    skillLevels?: {
      [skillName: string]: 'A' | 'B' | 'C' | 'D';
    };
  }>;
  onClose?: () => void;
}

// 国連加盟国193カ国のリスト（英語名）
const UN_MEMBER_COUNTRIES = [
  "Japan", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Democratic Republic of the Congo", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba",
  "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "North Korea", "Korea", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ 
  isAdminMode = false, 
  jobSeekerData, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('resume');
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentData>({
    // 基本情報
    lastName: '',
    firstName: '',
    kanaLastName: '',
    kanaFirstName: '',
    birthDate: '2000-01-01', // ← 初期値を2000年1月1日に
    gender: '',
    
    // 現住所情報
    livePostNumber: '',
    liveAddress: '',
    kanaLiveAddress: '',
    livePhoneNumber: '',
    liveMail: '',
    nationality: '', // 国籍を追加
    
    // 連絡先情報
    contactPostNumber: '',
    contactAddress: '',
    kanaContactAddress: '',
    contactPhoneNumber: '',
    contactMail: '',
    
    resume: {
      photoUrl: '',
      education: [{ year: '', month: '', content: '' }],
      workExperience: [{ year: '', month: '', content: '' }],
      qualifications: [{ year: '', month: '', name: '' }],
      skills: [{ category: '', level: '' }],
      selfPR: jobSeekerData?.self_introduction || '',
      noEducation: false,
      noWorkExperience: false,
      noQualifications: false
    },
    workHistory: {
      currentDate: new Date().toLocaleDateString('ja-JP'),
      workExperiences: [{ period: '', company: '', position: '', description: '', technologies: '', software: '', role: '' }],
      qualifications: '',
      noWorkHistory: false
    },
    skillSheet: {
      skills: {
        'Windows': { level: '', experience: '', projects: '', evaluation: '-' },
        'MacOS': { level: '', experience: '', projects: '', evaluation: '-' },
        'Linux': { level: '', experience: '', projects: '', evaluation: '-' },
        'Photoshop': { level: '', experience: '', projects: '', evaluation: '-' },
        'Illustrator': { level: '', experience: '', projects: '', evaluation: '-' },

        'Webサーバ（構築、運用）': { level: '', experience: '', projects: '', evaluation: '-' },
        'メールサーバ（構築、運用）': { level: '', experience: '', projects: '', evaluation: '-' },
        'DBサーバ（構築、運用）': { level: '', experience: '', projects: '', evaluation: '-' },
        'DNSサーバ（構築、運用）': { level: '', experience: '', projects: '', evaluation: '-' },
        'N/W設計': { level: '', experience: '', projects: '', evaluation: '-' },
        'N/W構築': { level: '', experience: '', projects: '', evaluation: '-' },
        'N/W調査': { level: '', experience: '', projects: '', evaluation: '-' },
        'N/W監視': { level: '', experience: '', projects: '', evaluation: '-' },
        'DB2': { level: '', experience: '', projects: '', evaluation: '-' },
        'SQL Server': { level: '', experience: '', projects: '', evaluation: '-' },
        'Oracle': { level: '', experience: '', projects: '', evaluation: '-' },
        'MySQL': { level: '', experience: '', projects: '', evaluation: '-' },
        'PostgreSQL': { level: '', experience: '', projects: '', evaluation: '-' },
        'プログラマ': { level: '', experience: '', projects: '', evaluation: '-' },
        'SE': { level: '', experience: '', projects: '', evaluation: '-' },
        'リーダー': { level: '', experience: '', projects: '', evaluation: '-' },
        'マネージャー': { level: '', experience: '', projects: '', evaluation: '-' },
        'C / C++': { level: '', experience: '', projects: '', evaluation: '-' },
        'C#': { level: '', experience: '', projects: '', evaluation: '-' },
        'VB.NET': { level: '', experience: '', projects: '', evaluation: '-' },
        'JAVA': { level: '', experience: '', projects: '', evaluation: '-' },
        'JavaScript ': { level: '', experience: '', projects: '', evaluation: '-' },
        'PHP': { level: '', experience: '', projects: '', evaluation: '-' },
        'Python': { level: '', experience: '', projects: '', evaluation: '-' },
        'Ruby': { level: '', experience: '', projects: '', evaluation: '-' },
        'Swift': { level: '', experience: '', projects: '', evaluation: '-' },
        'Objective-C': { level: '', experience: '', projects: '', evaluation: '-' },
        'HTML / HTML5': { level: '', experience: '', projects: '', evaluation: '-' },
        'CSS / CSS3': { level: '', experience: '', projects: '', evaluation: '-' },
        'R': { level: '', experience: '', projects: '', evaluation: '-' },
        'ASP.NET (Web Forms)': { level: '', experience: '', projects: '', evaluation: '-' },
        'ASP.NET (Core) MVC': { level: '', experience: '', projects: '', evaluation: '-' },
        'jQuery': { level: '', experience: '', projects: '', evaluation: '-' },
        'Bootstrap': { level: '', experience: '', projects: '', evaluation: '-' },
        'Tailwind': { level: '', experience: '', projects: '', evaluation: '-' },
        'ReactJS': { level: '', experience: '', projects: '', evaluation: '-' },
        'VueJS': { level: '', experience: '', projects: '', evaluation: '-' },
        'Laravel': { level: '', experience: '', projects: '', evaluation: '-' },
        '要件定義': { level: '', experience: '', projects: '', evaluation: '-' },
        '外部設計/基本設計': { level: '', experience: '', projects: '', evaluation: '-' },
        '内部設計/詳細設計': { level: '', experience: '', projects: '', evaluation: '-' },
        '検証試験': { level: '', experience: '', projects: '', evaluation: '-' },
        'セキュリティ試験': { level: '', experience: '', projects: '', evaluation: '-' },
        '負荷試験': { level: '', experience: '', projects: '', evaluation: '-' },
        'MS-WORD': { level: '', experience: '', projects: '', evaluation: '-' },
        'MS-EXCEL': { level: '', experience: '', projects: '', evaluation: '-' },
        'MS-Access': { level: '', experience: '', projects: '', evaluation: '-' },
        'MS-PowerPoint': { level: '', experience: '', projects: '', evaluation: '-' },
        'InDesiｇn': { level: '', experience: '', projects: '', evaluation: '-' },
        'Dreamweaver': { level: '', experience: '', projects: '', evaluation: '-' },
        'Fireworks': { level: '', experience: '', projects: '', evaluation: '-' },
        'MAYA': { level: '', experience: '', projects: '', evaluation: '-' },
        'Studio Design': { level: '', experience: '', projects: '', evaluation: '-' },
        'Figma': { level: '', experience: '', projects: '', evaluation: '-' },
        'Visual Studio / VSCode': { level: '', experience: '', projects: '', evaluation: '-' },
        'Git / SVN': { level: '', experience: '', projects: '', evaluation: '-' },
        'Backlog / Redmine': { level: '', experience: '', projects: '', evaluation: '-' },
        'Notion': { level: '', experience: '', projects: '', evaluation: '-' },
        'AWS': { level: '', experience: '', projects: '', evaluation: '-' },
        'Azure': { level: '', experience: '', projects: '', evaluation: '-' },
        'Google Cloud Platform': { level: '', experience: '', projects: '', evaluation: '-' },
        'IBM Cloud (Bluemix)': { level: '', experience: '', projects: '', evaluation: '-' },
        'W3Schools': { level: '', experience: '', projects: '', evaluation: '-' },
        'タッチタイピング': { level: '', experience: '', projects: '', evaluation: '-' },
        'パソコン利用歴': { level: '', experience: '', projects: '', evaluation: '-', pcUsageYears: '' }
      }
    },
    
    // 追加情報
    selfIntroduction: '',
    personalPreference: '',
    contactSameAsLive: false,
    spouse: '',
    spouseSupport: '',
    
    // 日本語関連情報
    certificateStatus: {
      date: '',
      name: 'なし'
    },
    nextJapaneseTestDate: '',
    nextJapaneseTestLevel: '',
    whyJapan: '',
    whyInterestJapan: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // スキル名を翻訳キーから取得する関数
  const getSkillDisplayName = (skillKey: string): string => {
    const skillMap: { [key: string]: string } = {
      'Windows': t('skills.os.windows'),
      'MacOS': t('skills.os.macos'),
      'Linux': t('skills.os.linux'),
      'Photoshop': t('skills.design.photoshop'),
      'Illustrator': t('skills.design.illustrator'),
      'Webサーバ（構築、運用）': t('skills.server.web'),
      'メールサーバ（構築、運用）': t('skills.server.mail'),
      'DBサーバ（構築、運用）': t('skills.server.db'),
      'DNSサーバ（構築、運用）': t('skills.server.dns'),
      'N/W設計': t('skills.network.design'),
      'N/W構築': t('skills.network.build'),
      'N/W調査': t('skills.network.investigation'),
      'N/W監視': t('skills.network.monitoring'),
      'DB2': t('skills.database.db2'),
      'SQL Server': t('skills.database.sqlserver'),
      'Oracle': t('skills.database.oracle'),
      'MySQL': t('skills.database.mysql'),
      'PostgreSQL': t('skills.database.postgresql'),
      'プログラマ': t('skills.role.programmer'),
      'SE': t('skills.role.se'),
      'リーダー': t('skills.role.leader'),
      'マネージャー': t('skills.role.manager'),
      '要件定義': t('skills.process.requirements'),
      '外部設計/基本設計': t('skills.process.external'),
      '内部設計/詳細設計': t('skills.process.internal'),
      '検証試験': t('skills.testing.verification'),
      'セキュリティ試験': t('skills.testing.security'),
      '負荷試験': t('skills.testing.load'),
      'MS-WORD': t('skills.office.word'),
      'MS-EXCEL': t('skills.office.excel'),
      'MS-Access': t('skills.office.access'),
      'MS-PowerPoint': t('skills.office.powerpoint'),
      'タッチタイピング': t('skills.typing.touch'),
      'パソコン利用歴': t('skills.pc.usage')
    };
    return skillMap[skillKey] || skillKey;
  };

  // 国籍名を翻訳キーから取得する関数
  const getNationalityName = (nationalityKey: string): string => {
    // 翻訳キーが存在する場合は翻訳を使用、存在しない場合は英語名をそのまま表示
    const translationKey = `nationality.${nationalityKey.toLowerCase().replace(/\s+/g, '_')}`;
    const translation = t(translationKey);
    
    // 翻訳キーが存在しない場合（翻訳がキーと同じ場合）は英語名をそのまま返す
    if (translation === translationKey) {
      return nationalityKey;
    }
    
    return translation;
  };

  // 管理者用：任意のユーザーIDでデータを取得する関数（現在は使用していない）
  const loadUserDataByUserId = async (userId: string) => {
    // この関数は非推奨です
    // 代わりにloadFromDatabaseByUserIdを使用してください
  };

  // 管理者モードで求職者データから初期データを設定
  useEffect(() => {
    if (isAdminMode && jobSeekerData) {
      // 求職者データから初期データを設定
      const fullName = jobSeekerData.full_name || '';
      const nameParts = fullName.split(' ');
      const lastName = nameParts[0] || '';
      const firstName = nameParts.slice(1).join(' ') || '';
      
      // スキルデータを設定
      const skillData: { [key: string]: { level: string; experience: string; projects: string; evaluation: string; pcUsageYears?: string } } = {};
      
      // デフォルトのスキルリスト
      const defaultSkills = [
        'Windows', 'MacOS', 'Linux', 'Photoshop', 'Illustrator', 'Webサーバ（構築、運用）', 'メールサーバ（構築、運用）',
        'DBサーバ（構築、運用）', 'DNSサーバ（構築、運用）', 'N/W設計', 'N/W構築', 'N/W調査', 'N/W監視',
        'DB2', 'SQL Server', 'Oracle', 'MySQL', 'PostgreSQL', 'プログラマ', 'SE', 'リーダー', 'マネージャー',
        'C / C++', 'C#', 'VB.NET', 'JAVA', 'JavaScript ', 'PHP', 'Python', 'Ruby', 'Swift', 'Objective-C',
        'HTML / HTML5', 'CSS / CSS3', 'R', 'ASP.NET (Web Forms)', 'ASP.NET (Core) MVC', 'jQuery', 'Bootstrap',
        'Tailwind', 'ReactJS', 'VueJS', 'Laravel', '要件定義', '外部設計/基本設計', '内部設計/詳細設計',
        '検証試験', 'セキュリティ試験', '負荷試験', 'MS-WORD', 'MS-EXCEL', 'MS-Access', 'MS-PowerPoint',
        'InDesiｇn', 'Dreamweaver', 'Fireworks', 'MAYA', 'Studio Design',
        'Figma', 'Visual Studio / VSCode', 'Git / SVN', 'Backlog / Redmine', 'Notion', 'AWS', 'Azure',
        'Google Cloud Platform', 'IBM Cloud (Bluemix)', 'W3Schools', 'タッチタイピング', 'パソコン利用歴'
      ];
      
      defaultSkills.forEach(skill => {
        skillData[skill] = { level: '', experience: '', projects: '', evaluation: '-' };
      });
      
      // 求職者のスキルを設定
      if (jobSeekerData.skills && Array.isArray(jobSeekerData.skills)) {
        jobSeekerData.skills.forEach(skill => {
          if (skillData[skill]) {
            skillData[skill].evaluation = 'B'; // デフォルトでB評価
          }
        });
      }
      
      // パソコン利用歴を経験年数から設定
      if (jobSeekerData.experience_years) {
        skillData['パソコン利用歴'] = { 
          level: '', 
          experience: '', 
          projects: '', 
          evaluation: '-', 
          pcUsageYears: jobSeekerData.experience_years.toString() 
        };
      }

      // 保存されたドキュメントデータを取得して設定
      const loadSavedDocumentData = async () => {
        try {
          const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
          const savedDocumentResponse = await fetch(`${apiUrl}/api/documents/${jobSeekerData.user_id}`);
          let savedDocumentData = null;
          
          if (savedDocumentResponse.ok) {
            const savedResult = await savedDocumentResponse.json();
            if (savedResult.success && savedResult.data) {
              savedDocumentData = savedResult.data.document_data || savedResult.data;
            }
          }
          
          // 保存されたデータがある場合はそれを使用、ない場合は基本データを使用
          const documentData = savedDocumentData ? {
            // 基本情報
            lastName: savedDocumentData.lastName || savedDocumentData.basicInfo?.lastName || lastName,
            firstName: savedDocumentData.firstName || savedDocumentData.basicInfo?.firstName || firstName,
            kanaLastName: savedDocumentData.kanaLastName || savedDocumentData.basicInfo?.kanaLastName || jobSeekerData.kana_last_name || '',
            kanaFirstName: savedDocumentData.kanaFirstName || savedDocumentData.basicInfo?.kanaFirstName || jobSeekerData.kana_first_name || '',
            birthDate: savedDocumentData.birthDate || savedDocumentData.basicInfo?.birthDate || (jobSeekerData.date_of_birth ? new Date(jobSeekerData.date_of_birth).toLocaleDateString('ja-JP') : ''),
            gender: savedDocumentData.gender || savedDocumentData.basicInfo?.gender || (jobSeekerData.gender === 'male' ? '男性' : jobSeekerData.gender === 'female' ? '女性' : 'その他'),
            nationality: savedDocumentData.nationality || savedDocumentData.basicInfo?.nationality || '', // 国籍を追加
            
            // 現住所情報
            livePostNumber: savedDocumentData.livePostNumber || savedDocumentData.addressInfo?.livePostNumber || '',
            liveAddress: savedDocumentData.liveAddress || savedDocumentData.addressInfo?.liveAddress || jobSeekerData.address || '',
            kanaLiveAddress: savedDocumentData.kanaLiveAddress || savedDocumentData.addressInfo?.kanaLiveAddress || '',
            livePhoneNumber: savedDocumentData.livePhoneNumber || savedDocumentData.addressInfo?.livePhoneNumber || jobSeekerData.phone || '',
            liveMail: savedDocumentData.liveMail || savedDocumentData.addressInfo?.liveMail || jobSeekerData.email,
            
            // 連絡先情報
            contactPostNumber: savedDocumentData.contactPostNumber || savedDocumentData.addressInfo?.contactPostNumber || '',
            contactAddress: savedDocumentData.contactAddress || savedDocumentData.addressInfo?.contactAddress || '',
            kanaContactAddress: savedDocumentData.kanaContactAddress || savedDocumentData.addressInfo?.kanaContactAddress || '',
            contactPhoneNumber: savedDocumentData.contactPhoneNumber || savedDocumentData.addressInfo?.contactPhoneNumber || '',
            contactMail: savedDocumentData.contactMail || savedDocumentData.addressInfo?.contactMail || '',
            contactSameAsLive: savedDocumentData.contactSameAsLive || savedDocumentData.addressInfo?.contactSameAsLive || false,
            
            resume: {
              photoUrl: savedDocumentData.resume?.photoUrl || savedDocumentData.resume?.photoUrl || '',
              education: savedDocumentData.resume?.education || savedDocumentData.resume?.education || [{ year: '', month: '', content: '' }],
              workExperience: savedDocumentData.resume?.workExperience || savedDocumentData.resume?.workExperience || [{ year: '', month: '', content: '' }],
              qualifications: savedDocumentData.resume?.qualifications || savedDocumentData.resume?.qualifications || [{ year: '', month: '', name: '' }],
              skills: savedDocumentData.resume?.skills || savedDocumentData.resume?.skills || [{ category: '', level: '' }],
              selfPR: savedDocumentData.resume?.selfPR || savedDocumentData.resume?.selfPR || jobSeekerData.self_introduction || '',
              noEducation: savedDocumentData.resume?.noEducation || savedDocumentData.resume?.noEducation || false,
              noWorkExperience: savedDocumentData.resume?.noWorkExperience || savedDocumentData.resume?.noWorkExperience || false,
              noQualifications: savedDocumentData.resume?.noQualifications || savedDocumentData.resume?.noQualifications || false
            },
            workHistory: {
              currentDate: savedDocumentData.workHistory?.currentDate || savedDocumentData.workHistory?.currentDate || new Date().toLocaleDateString('ja-JP'),
              workExperiences: savedDocumentData.workHistory?.workExperiences || savedDocumentData.workHistory?.workExperiences || [{ period: '', company: '', position: '', description: '', technologies: '', software: '', role: '' }],
              qualifications: savedDocumentData.workHistory?.qualifications || savedDocumentData.workHistory?.qualifications || '',
              noWorkHistory: savedDocumentData.workHistory?.noWorkHistory || savedDocumentData.workHistory?.noWorkHistory || false
            },
            skillSheet: {
              skills: savedDocumentData.skillSheet?.skills || savedDocumentData.skillSheet?.skills || skillData
            },
            
            // 追加情報
            selfIntroduction: savedDocumentData.selfIntroduction || savedDocumentData.additionalInfo?.selfIntroduction || jobSeekerData.self_introduction || '',
            personalPreference: savedDocumentData.personalPreference || savedDocumentData.additionalInfo?.personalPreference || '',
            spouse: savedDocumentData.spouse || savedDocumentData.additionalInfo?.spouse || jobSeekerData.spouse || '',
            spouseSupport: savedDocumentData.spouseSupport || savedDocumentData.additionalInfo?.spouseSupport || jobSeekerData.spouse_support || '',
            
            // 日本語関連情報
            certificateStatus: savedDocumentData.certificateStatus || savedDocumentData.japaneseInfo?.certificateStatus || { date: '', name: '' },
            nextJapaneseTestDate: savedDocumentData.nextJapaneseTestDate || savedDocumentData.japaneseInfo?.nextJapaneseTestDate || '',
            nextJapaneseTestLevel: savedDocumentData.nextJapaneseTestLevel || savedDocumentData.japaneseInfo?.nextJapaneseTestLevel || '',
            whyJapan: savedDocumentData.whyJapan || savedDocumentData.japaneseInfo?.whyJapan || '',
            whyInterestJapan: savedDocumentData.whyInterestJapan || savedDocumentData.japaneseInfo?.whyInterestJapan || ''
          } : {
            // 基本情報
            lastName: lastName,
            firstName: firstName,
            kanaLastName: jobSeekerData.kana_last_name || '',
            kanaFirstName: jobSeekerData.kana_first_name || '',
            birthDate: jobSeekerData.date_of_birth ? new Date(jobSeekerData.date_of_birth).toLocaleDateString('ja-JP') : '',
            gender: jobSeekerData.gender === 'male' ? '男性' : jobSeekerData.gender === 'female' ? '女性' : 'その他',
            nationality: '', // 国籍を追加
            
            // 現住所情報
            livePostNumber: '',
            liveAddress: jobSeekerData.address || '',
            kanaLiveAddress: '',
            livePhoneNumber: jobSeekerData.phone || '',
            liveMail: jobSeekerData.email,
            
            // 連絡先情報
            contactPostNumber: '',
            contactAddress: '',
            kanaContactAddress: '',
            contactPhoneNumber: '',
            contactMail: '',
            
            resume: {
              photoUrl: '',
              education: [{ year: '', month: '', content: '' }],
              workExperience: [{ year: '', month: '', content: '' }],
              qualifications: [{ year: '', month: '', name: '' }],
              skills: [{ category: '', level: '' }],
              selfPR: jobSeekerData.self_introduction || '',
              noEducation: false,
              noWorkExperience: false,
              noQualifications: false
            },
            workHistory: {
              currentDate: new Date().toLocaleDateString('ja-JP'),
              workExperiences: [{ period: '', company: '', position: '', description: '', technologies: '', software: '', role: '' }],
              qualifications: '',
              noWorkHistory: false
            },
            skillSheet: {
              skills: skillData
            },
            
            // 追加情報
            selfIntroduction: jobSeekerData.self_introduction || '',
            personalPreference: '',
            contactSameAsLive: false,
            spouse: jobSeekerData.spouse || '',
            spouseSupport: jobSeekerData.spouse_support || '',
            
            // 日本語関連情報
            certificateStatus: {
              date: '',
              name: ''
            },
            nextJapaneseTestDate: '',
            nextJapaneseTestLevel: '',
            whyJapan: '',
            whyInterestJapan: ''
          };

          setDocumentData({
            ...documentData,
            resume: {
              ...documentData.resume,
              noEducation: false,
              noWorkExperience: false,
              noQualifications: false
            }
          });
          toast({
            title: "成功",
            description: "求職者データを読み込みました",
          });
        } catch (error) {
          console.error('保存されたデータの読み込みエラー:', error);
          // エラーが発生した場合は基本データのみで設定
          setDocumentData({
            // 基本情報
            lastName: lastName,
            firstName: firstName,
            kanaLastName: jobSeekerData.kana_last_name || '',
            kanaFirstName: jobSeekerData.kana_first_name || '',
            birthDate: jobSeekerData.date_of_birth ? new Date(jobSeekerData.date_of_birth).toLocaleDateString('ja-JP') : '',
            gender: jobSeekerData.gender === 'male' ? '男性' : jobSeekerData.gender === 'female' ? '女性' : 'その他',
            nationality: '', // 国籍を追加
            
            // 現住所情報
            livePostNumber: '',
            liveAddress: jobSeekerData.address || '',
            kanaLiveAddress: '',
            livePhoneNumber: jobSeekerData.phone || '',
            liveMail: jobSeekerData.email,
            
            // 連絡先情報
            contactPostNumber: '',
            contactAddress: '',
            kanaContactAddress: '',
            contactPhoneNumber: '',
            contactMail: '',
            
            resume: {
              photoUrl: '',
              education: [{ year: '', month: '', content: '' }],
              workExperience: [{ year: '', month: '', content: '' }],
              qualifications: [{ year: '', month: '', name: '' }],
              skills: [{ category: '', level: '' }],
              selfPR: jobSeekerData.self_introduction || '',
              noEducation: false,
              noWorkExperience: false,
              noQualifications: false
            },
            workHistory: {
              currentDate: new Date().toLocaleDateString('ja-JP'),
              workExperiences: [{ period: '', company: '', position: '', description: '', technologies: '', software: '', role: '' }],
              qualifications: '',
              noWorkHistory: false
            },
            skillSheet: {
              skills: skillData
            },
            
            // 追加情報
            selfIntroduction: jobSeekerData.self_introduction || '',
            personalPreference: '',
            contactSameAsLive: false,
            spouse: jobSeekerData.spouse || '',
            spouseSupport: jobSeekerData.spouse_support || '',
            
            // 日本語関連情報
            certificateStatus: {
              date: '',
              name: ''
            },
            nextJapaneseTestDate: '',
            nextJapaneseTestLevel: '',
            whyJapan: '',
            whyInterestJapan: ''
          });
        }
      };

      loadSavedDocumentData();
    }
  }, [isAdminMode, jobSeekerData]);

  const handleResumeInputChange = (field: string, value: any, index?: number) => {
    if (index !== undefined) {
      setDocumentData(prev => ({
        ...prev,
        resume: {
          ...prev.resume,
          [field]: Array.isArray(prev.resume[field as keyof typeof prev.resume]) 
            ? (prev.resume[field as keyof typeof prev.resume] as any[]).map((item: any, i: number) => 
                i === index ? { ...item, ...(typeof value === 'object' ? value : {}) } : item
              )
            : prev.resume[field as keyof typeof prev.resume]
        }
      }));
    } else {
      setDocumentData(prev => ({
        ...prev,
        resume: {
          ...prev.resume,
          [field]: value
        }
      }));
    }
  };

  const handleWorkHistoryInputChange = (field: string, value: any, index?: number) => {
    if (index !== undefined) {
      setDocumentData(prev => ({
        ...prev,
        workHistory: {
          ...prev.workHistory,
          [field]: Array.isArray(prev.workHistory[field as keyof typeof prev.workHistory])
            ? (prev.workHistory[field as keyof typeof prev.workHistory] as any[]).map((item: any, i: number) => 
                i === index ? { ...item, ...(typeof value === 'object' ? value : {}) } : item
              )
            : prev.workHistory[field as keyof typeof prev.workHistory]
        }
      }));
    } else {
      setDocumentData(prev => ({
        ...prev,
        workHistory: {
          ...prev.workHistory,
          [field]: value
        }
      }));
    }
  };

  const handleSkillSheetInputChange = (category: string, field: string, value: string) => {
    setDocumentData(prev => ({
      ...prev,
      skillSheet: {
        ...prev.skillSheet,
        skills: {
          ...prev.skillSheet.skills,
          [category]: {
            ...prev.skillSheet.skills[category],
            [field]: value
          }
        }
      }
    }));
  };

  const addEducation = () => {
    // 学歴と職務経歴を合わせて15個までに制限
    const totalEducationAndWork = documentData.resume.education.length + documentData.resume.workExperience.length;
    if (totalEducationAndWork >= 15) {
      toast({
        title: t('common.warning'),
        description: t('documents.maxEducationWorkLimit'),
        variant: "destructive",
      });
      return;
    }
    
    setDocumentData(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        education: [...prev.resume.education, { year: '', month: '', content: '' }]
      }
    }));
  };

  const removeEducation = (index: number) => {
    setDocumentData(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        education: prev.resume.education.filter((_, i) => i !== index)
      }
    }));
  };

  const addWorkExperience = () => {
    // 学歴と職務経歴を合わせて15個までに制限
    const totalEducationAndWork = documentData.resume.education.length + documentData.resume.workExperience.length;
    if (totalEducationAndWork >= 15) {
      toast({
        title: t('common.warning'),
        description: t('documents.maxEducationWorkLimit'),
        variant: "destructive",
      });
      return;
    }
    
    setDocumentData(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        workExperience: [...prev.resume.workExperience, { year: '', month: '', content: '' }]
      }
    }));
  };

  const removeWorkExperience = (index: number) => {
    setDocumentData(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        workExperience: prev.resume.workExperience.filter((_, i) => i !== index)
      }
    }));
  };

  const addWorkHistoryExperience = () => {
    setDocumentData(prev => ({
      ...prev,
      workHistory: {
        ...prev.workHistory,
        workExperiences: [...prev.workHistory.workExperiences, { period: '', company: '', position: '', description: '', technologies: '', software: '', role: '' }]
      }
    }));
  };

  const removeWorkHistoryExperience = (index: number) => {
    setDocumentData(prev => ({
      ...prev,
      workHistory: {
        ...prev.workHistory,
        workExperiences: prev.workHistory.workExperiences.filter((_, i) => i !== index)
      }
    }));
  };

  const addQualification = () => {
    // 資格・免許を4つまでに制限
    if (documentData.resume.qualifications.length >= 4) {
      toast({
        title: t('common.warning'),
        description: t('documents.maxQualificationsLimit'),
        variant: "destructive",
      });
      return;
    }
    
    setDocumentData(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        qualifications: [...prev.resume.qualifications, { year: '', month: '', name: '' }]
      }
    }));
  };

  const removeQualification = (index: number) => {
    setDocumentData(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        qualifications: prev.resume.qualifications.filter((_, i) => i !== index)
      }
    }));
  };

  // 顔写真アップロード機能
  // 画像を圧縮する関数（元の比率を保持）
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 元のアスペクト比を計算
        const originalRatio = img.width / img.height;
        
        // 最大幅または高さに基づいてリサイズ（比率を保持）
        let newWidth, newHeight;
        if (img.width > img.height) {
          // 横長の画像
          newWidth = Math.min(maxWidth, img.width);
          newHeight = newWidth / originalRatio;
        } else {
          // 縦長の画像
          newHeight = Math.min(maxWidth, img.height);
          newWidth = newHeight * originalRatio;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 画像を描画（元の比率を保持）
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 圧縮されたBase64データを取得
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
              img.onerror = () => reject(new Error(t('documents.imageLoadError')));
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('documents.fileSizeError').replace('{size}', (file.size / (1024 * 1024)).toFixed(1)),
        variant: "destructive",
      });
      return;
    }

    // 画像形式チェック
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: t('documents.imageFormatError'),
        variant: "destructive",
      });
      return;
    }

    try {
      // 画像を圧縮
      const compressedImage = await compressImage(file, 400, 0.7);
      
      // 圧縮後のサイズをチェック
      const base64SizeInMB = (compressedImage.length * 0.75) / (1024 * 1024);
      
      if (base64SizeInMB > 2) {
        toast({
          title: t('common.warning'),
          description: t('documents.imageTooLarge'),
          variant: "destructive",
        });
        return;
      }

      setDocumentData(prev => ({
        ...prev,
        resume: {
          ...prev.resume,
          photoUrl: compressedImage
        }
      }));

      toast({
        title: t('common.success'),
        description: t('documents.photoUploadSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('documents.photoUploadError'),
        variant: "destructive",
      });
    }
  };

  // バリデーション関数（入力時は制限なし）
  const validateKana = (value: string): boolean => {
    // 入力時は何でも許可（保存時にエラーチェック）
    return true;
  };

  // ひらがなをカタカナに変換する関数（マッピングテーブル使用）
  const convertHiraganaToKatakana = (value: string): string => {
    const hiraganaToKatakana: { [key: string]: string } = {
      'あ': 'ア', 'い': 'イ', 'う': 'ウ', 'え': 'エ', 'お': 'オ',
      'か': 'カ', 'き': 'キ', 'く': 'ク', 'け': 'ケ', 'こ': 'コ',
      'さ': 'サ', 'し': 'シ', 'す': 'ス', 'せ': 'セ', 'そ': 'ソ',
      'た': 'タ', 'ち': 'チ', 'つ': 'ツ', 'て': 'テ', 'と': 'ト',
      'な': 'ナ', 'に': 'ニ', 'ぬ': 'ヌ', 'ね': 'ネ', 'の': 'ノ',
      'は': 'ハ', 'ひ': 'ヒ', 'ふ': 'フ', 'へ': 'ヘ', 'ほ': 'ホ',
      'ま': 'マ', 'み': 'ミ', 'む': 'ム', 'め': 'メ', 'も': 'モ',
      'や': 'ヤ', 'ゆ': 'ユ', 'よ': 'ヨ',
      'ら': 'ラ', 'り': 'リ', 'る': 'ル', 'れ': 'レ', 'ろ': 'ロ',
      'わ': 'ワ', 'を': 'ヲ', 'ん': 'ン',
      'が': 'ガ', 'ぎ': 'ギ', 'ぐ': 'グ', 'げ': 'ゲ', 'ご': 'ゴ',
      'ざ': 'ザ', 'じ': 'ジ', 'ず': 'ズ', 'ぜ': 'ゼ', 'ぞ': 'ゾ',
      'だ': 'ダ', 'ぢ': 'ヂ', 'づ': 'ヅ', 'で': 'デ', 'ど': 'ド',
      'ば': 'バ', 'び': 'ビ', 'ぶ': 'ブ', 'べ': 'ベ', 'ぼ': 'ボ',
      'ぱ': 'パ', 'ぴ': 'ピ', 'ぷ': 'プ', 'ぺ': 'ペ', 'ぽ': 'ポ',
      'ぁ': 'ァ', 'ぃ': 'ィ', 'ぅ': 'ゥ', 'ぇ': 'ェ', 'ぉ': 'ォ',
      'ゃ': 'ャ', 'ゅ': 'ュ', 'ょ': 'ョ', 'っ': 'ッ',
      'きゃ': 'キャ', 'きゅ': 'キュ', 'きょ': 'キョ',
      'しゃ': 'シャ', 'しゅ': 'シュ', 'しょ': 'ショ',
      'ちゃ': 'チャ', 'ちゅ': 'チュ', 'ちょ': 'チョ',
      'にゃ': 'ニャ', 'にゅ': 'ニュ', 'にょ': 'ニョ',
      'ひゃ': 'ヒャ', 'ひゅ': 'ヒュ', 'ひょ': 'ヒョ',
      'みゃ': 'ミャ', 'みゅ': 'ミュ', 'みょ': 'ミョ',
      'りゃ': 'リャ', 'りゅ': 'リュ', 'りょ': 'リョ',
      'ぎゃ': 'ギャ', 'ぎゅ': 'ギュ', 'ぎょ': 'ギョ',
      'じゃ': 'ジャ', 'じゅ': 'ジュ', 'じょ': 'ジョ',
      'びゃ': 'ビャ', 'びゅ': 'ビュ', 'びょ': 'ビョ',
      'ぴゃ': 'ピャ', 'ぴゅ': 'ピュ', 'ぴょ': 'ピョ'
    };

    let result = value;
    
    // 2文字の組み合わせを先に処理
    Object.keys(hiraganaToKatakana).forEach(hiragana => {
      if (hiragana.length === 2) {
        result = result.replace(new RegExp(hiragana, 'g'), hiraganaToKatakana[hiragana]);
      }
    });
    
    // 1文字の変換を処理
    Object.keys(hiraganaToKatakana).forEach(hiragana => {
      if (hiragana.length === 1) {
        result = result.replace(new RegExp(hiragana, 'g'), hiraganaToKatakana[hiragana]);
      }
    });
    
    return result;
  };

  const validatePhoneNumber = (value: string): boolean => {
    // 数字が1文字以上含まれていればOK（海外の電話番号に対応）
    return /[0-9]/.test(value);
  };

  const validatePostNumber = (value: string): boolean => {
    // 数字が1文字以上含まれていればOK（海外の郵便番号に対応）
    return /[0-9]/.test(value);
  };

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // 文字数制限チェック関数
  const validateTextLength = (text: string, minLength: number = 300, maxLength: number = 500): { isValid: boolean; message: string } => {
    const length = text.length;
    if (length < minLength) {
      return { isValid: false, message: t('documents.textLengthMinError').replace('{minLength}', minLength.toString()).replace('{current}', length.toString()) };
    }
    if (length > maxLength) {
      return { isValid: false, message: t('documents.textLengthMaxError').replace('{maxLength}', maxLength.toString()).replace('{current}', length.toString()) };
    }
    return { isValid: true, message: t('documents.textLengthValid').replace('{current}', length.toString()).replace('{minLength}', minLength.toString()).replace('{maxLength}', maxLength.toString()) };
  };

  // 全ての必須テキストフィールドの文字数チェック
  const validateAllTextLengths = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 姓と名の入力チェック
    if (!documentData.lastName || !documentData.firstName) {
      errors.push(t('documents.nameRequired'));
    }
    
    const selfIntroValidation = validateTextLength(documentData.selfIntroduction);
    if (!selfIntroValidation.isValid) {
              errors.push(`${t('documents.selfPR')}: ${selfIntroValidation.message}`);
    }
    
    const whyJapanValidation = validateTextLength(documentData.whyJapan);
    if (!whyJapanValidation.isValid) {
              errors.push(`${t('documents.whyJapanError')}: ${whyJapanValidation.message}`);
    }
    
    const whyInterestJapanValidation = validateTextLength(documentData.whyInterestJapan);
    if (!whyInterestJapanValidation.isValid) {
              errors.push(`${t('documents.whyInterestJapanError')}: ${whyInterestJapanValidation.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // 入力値のフォーマット関数
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const formatPostNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 年齢を計算する関数
  const calculateAge = (birthDateStr: string): number | null => {
    if (!birthDateStr) return null;
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 入力率計算関数
  const calculateCompletionRate = (data: DocumentData): number => {
    const fields = [
      // 基本情報
      data.lastName, data.firstName, data.kanaLastName, data.kanaFirstName,
      data.birthDate, data.gender, data.nationality,
      
      // 現住所情報
      data.livePostNumber, data.liveAddress, data.kanaLiveAddress,
      data.livePhoneNumber, data.liveMail,
      
      // 連絡先情報（現住所と同じ場合は完了とみなす）
      data.contactSameAsLive ? true : data.contactPostNumber,
      data.contactSameAsLive ? true : data.contactAddress,
      data.contactSameAsLive ? true : data.kanaContactAddress,
      data.contactSameAsLive ? true : data.contactPhoneNumber,
      data.contactSameAsLive ? true : data.contactMail,
      
      // 履歴書（selfIntroductionを使用）
      data.selfIntroduction,
      
      // 学歴（ない場合はチェックボックスで完了とみなす）
      data.resume.noEducation ? true : (data.resume.education && data.resume.education.length > 0),
      
      // 職歴（ない場合はチェックボックスで完了とみなす）
      data.resume.noWorkExperience ? true : (data.resume.workExperience && data.resume.workExperience.length > 0),
      
      // 資格（ない場合はチェックボックスで完了とみなす）
      data.resume.noQualifications ? true : (data.resume.qualifications && data.resume.qualifications.length > 0),
      
      // 職務経歴書（ない場合はチェックボックスで完了とみなす）
      data.workHistory.noWorkHistory ? true : (data.workHistory.workExperiences && data.workHistory.workExperiences.length > 0),
      
      // スキルシート（主要スキル）- 評価が設定されているかチェック
      data.skillSheet.skills.Windows?.evaluation && data.skillSheet.skills.Windows.evaluation !== '-',
      data.skillSheet.skills.MacOS?.evaluation && data.skillSheet.skills.MacOS.evaluation !== '-',
      data.skillSheet.skills.Linux?.evaluation && data.skillSheet.skills.Linux.evaluation !== '-',
      
      // 日本語関連
      data.certificateStatus.name, data.whyJapan, data.whyInterestJapan,
      
      // 追加情報
      data.selfIntroduction,
      data.spouse, data.spouseSupport
    ];

    // デバッグ用：各フィールドの状態をログ出力
    console.log('=== 入力率計算デバッグ ===');
    console.log('基本情報:', {
      lastName: !!data.lastName,
      firstName: !!data.firstName,
      kanaLastName: !!data.kanaLastName,
      kanaFirstName: !!data.kanaFirstName,
      birthDate: !!data.birthDate,
      gender: !!data.gender,
      nationality: !!data.nationality
    });
    console.log('現住所情報:', {
      livePostNumber: !!data.livePostNumber,
      liveAddress: !!data.liveAddress,
      kanaLiveAddress: !!data.kanaLiveAddress,
      livePhoneNumber: !!data.livePhoneNumber,
      liveMail: !!data.liveMail
    });
    console.log('連絡先情報:', {
      contactSameAsLive: data.contactSameAsLive,
      contactPostNumber: !!data.contactPostNumber,
      contactAddress: !!data.contactAddress,
      kanaContactAddress: !!data.kanaContactAddress,
      contactPhoneNumber: !!data.contactPhoneNumber,
      contactMail: !!data.contactMail
    });
    console.log('履歴書:', {
      selfPR: !!data.resume.selfPR,
      noEducation: data.resume.noEducation,
      noWorkExperience: data.resume.noWorkExperience,
      noQualifications: data.resume.noQualifications,
      education: data.resume.education?.length || 0,
      workExperience: data.resume.workExperience?.length || 0,
      qualifications: data.resume.qualifications?.length || 0
    });
    console.log('職務経歴書:', {
      noWorkHistory: data.workHistory.noWorkHistory,
      workExperiences: data.workHistory.workExperiences?.length || 0
    });
    console.log('スキルシート:', {
      Windows: data.skillSheet.skills.Windows?.evaluation,
      MacOS: data.skillSheet.skills.MacOS?.evaluation,
      Linux: data.skillSheet.skills.Linux?.evaluation
    });
    console.log('日本語関連:', {
      certificateStatus: !!data.certificateStatus.name,
      whyJapan: !!data.whyJapan,
      whyInterestJapan: !!data.whyInterestJapan
    });
    console.log('追加情報:', {
      selfIntroduction: !!data.selfIntroduction,
      spouse: !!data.spouse,
      spouseSupport: !!data.spouseSupport
    });

    const filledFields = fields.filter((field: any) => {
      if (typeof field === 'string') {
        return field && field.trim() !== '';
      }
      if (typeof field === 'boolean') {
        return field === true;
      }
      if (Array.isArray(field)) {
        return (field as any[]).length > 0;
      }
      return field;
    });

    const totalFields = fields.length;
    return totalFields > 0 ? Math.round((filledFields.length / totalFields) * 100) : 0;
  };

  // 入力率を更新
  useEffect(() => {
    const rate = calculateCompletionRate(documentData);
    console.log('入力率計算結果:', rate + '%');
    console.log('現在のデータ:', documentData);
    setCompletionRate(rate);
  }, [documentData]);

  // データベース保存機能
  const saveToDatabase = async () => {
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('auth.loginRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // データサイズをチェック
      const dataSize = (JSON.stringify(documentData).length * 0.75) / (1024 * 1024);
      
      let finalSaveData = { ...documentData };
      
      // データサイズが1MBを超える場合は画像を除外
      if (dataSize > 1) {
        finalSaveData = {
          ...documentData,
          resume: {
            ...documentData.resume,
            photoUrl: '' // 画像を除外
          }
        };
      }

      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
      const targetUserId = isAdminMode && jobSeekerData ? jobSeekerData.user_id : String(user.id);

      const requestBody = {
        userId: targetUserId,
        documentType: 'resume',
        documentData: finalSaveData
      };

      const documentsResponse = await fetch(`${apiUrl}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!documentsResponse.ok) {
        const responseText = await documentsResponse.text();
        throw new Error(`書類保存エラー: ${documentsResponse.status} - ${responseText}`);
      }

      const documentsResult = await documentsResponse.json();
      
      if (!documentsResult.success) {
        throw new Error(documentsResult.message || '書類保存に失敗しました');
      }

      // 求職者情報も更新
      const jobSeekerUpdateData = {
        firstName: documentData.firstName,
        lastName: documentData.lastName,
        kanaFirstName: documentData.kanaFirstName,
        kanaLastName: documentData.kanaLastName,
        dateOfBirth: documentData.birthDate,
        gender: documentData.gender === '男性' ? 'male' : documentData.gender === '女性' ? 'female' : 'other',
        phone: documentData.livePhoneNumber,
        address: documentData.liveAddress,
        selfIntroduction: documentData.selfIntroduction,
        spouse: documentData.spouse,
        spouseSupport: documentData.spouseSupport
      };

      const jobSeekerResponse = await fetch(`${apiUrl}/api/jobseekers/${targetUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobSeekerUpdateData)
      });

      if (!jobSeekerResponse.ok) {
        const responseText = await jobSeekerResponse.text();
        throw new Error(`求職者更新エラー: ${jobSeekerResponse.status} - ${responseText}`);
      }

      const jobSeekerResult = await jobSeekerResponse.json();
      
      if (!jobSeekerResult.success) {
        throw new Error(jobSeekerResult.message || '求職者情報の更新に失敗しました');
      }

      // 資料作成完了率をチェックしてワークフロー通知を送信
      if (targetUserId) {
        try {
          const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
          
          // 完了率を計算
          const completionRate = calculateCompletionRate(documentData);
          
          if (completionRate === 100) {
            // 100%完了時の通知
            await fetch(`${apiUrl}/api/notifications/admin/send-to-user`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: targetUserId,
                title: 'おめでとうございます！',
                message: `${documentData.lastName} ${documentData.firstName}様、書類作成が100%完成しました！AI面接を受験できます。`,
                type: 'success'
              })
            });
          } else if (completionRate < 100) {
            // 100%未満の場合は警告通知
            await fetch(`${apiUrl}/api/notifications/admin/send-to-user`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: targetUserId,
                title: '採用担当者にアピールできません！',
                message: `${documentData.lastName} ${documentData.firstName}様、資料作成が完了していません（${completionRate}%）。プロフィールを100%完成させて、採用担当者にアピールしましょう！`,
                type: 'warning'
              })
            });
          }
        } catch (error) {
          console.error('ワークフロー通知送信エラー:', error);
        }
      }

      toast({
        title: t('common.success'),
        description: t('documents.saveSuccess'),
      });

      // 管理者モードの場合は閉じる
      if (isAdminMode && onClose) {
        // 保存されたデータを親コンポーネントに通知
        if (jobSeekerData) {
          // 保存完了後に親コンポーネントでデータを再読み込みできるようにする
          onClose();
        }
      }

    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('documents.saveError'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 保存されたデータを読み込み
  const loadFromDatabase = async () => {
    if (!user) return;
    await loadFromDatabaseByUserId(String(user.id));
  };

  const loadFromDatabaseByUserId = async (userId: string) => {
    try {
      setIsLoadingData(true);
      
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';

      const response = await fetch(`${apiUrl}/api/documents/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // 保存されたデータが見つからない場合は基本データのみで設定
          return;
        }
        
        const responseText = await response.text();
        throw new Error(`読み込みエラー: ${response.status} - ${responseText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        // データが見つからない場合は正常な状態として扱う（初回利用の可能性）
        if (result.message === '書類が見つかりません') {
          return;
        }
        throw new Error(result.message || 'データの読み込みに失敗しました');
      }

      const savedData = result.data;
      
      if (savedData) {
        // データの整合性を確保するために、不足している部分を初期値で補完
        const mergedData: DocumentData = {
          // 基本情報
          lastName: savedData.lastName || '',
          firstName: savedData.firstName || '',
          kanaLastName: savedData.kanaLastName || '',
          kanaFirstName: savedData.kanaFirstName || '',
          birthDate: savedData.birthDate || '2000-01-01',
          gender: savedData.gender || '',
          
          // 現住所情報
          livePostNumber: savedData.livePostNumber || '',
          liveAddress: savedData.liveAddress || '',
          kanaLiveAddress: savedData.kanaLiveAddress || '',
          livePhoneNumber: savedData.livePhoneNumber || '',
          liveMail: savedData.liveMail || '',
          nationality: savedData.nationality || '',
          
          // 連絡先情報
          contactPostNumber: savedData.contactPostNumber || '',
          contactAddress: savedData.contactAddress || '',
          kanaContactAddress: savedData.kanaContactAddress || '',
          contactPhoneNumber: savedData.contactPhoneNumber || '',
          contactMail: savedData.contactMail || '',
          
          // 履歴書固有
          resume: {
            photoUrl: savedData.resume?.photoUrl || '',
            education: savedData.resume?.education || [{ year: '', month: '', content: '' }],
            workExperience: savedData.resume?.workExperience || [{ year: '', month: '', content: '' }],
            qualifications: savedData.resume?.qualifications || [{ year: '', month: '', name: '' }],
            skills: savedData.resume?.skills || [{ category: '', level: '' }],
            selfPR: savedData.resume?.selfPR || '',
            noEducation: savedData.resume?.noEducation || false,
            noWorkExperience: savedData.resume?.noWorkExperience || false,
            noQualifications: savedData.resume?.noQualifications || false
          },
          
          // 職務経歴書固有
          workHistory: {
            currentDate: savedData.workHistory?.currentDate || new Date().toLocaleDateString('ja-JP'),
            workExperiences: savedData.workHistory?.workExperiences || [{ period: '', company: '', position: '', description: '', technologies: '', software: '', role: '' }],
            qualifications: savedData.workHistory?.qualifications || '',
            noWorkHistory: savedData.workHistory?.noWorkHistory || false
          },
          
          // スキルシート固有
          skillSheet: {
            skills: {
              // 既存のデータを保持し、不足している部分をデフォルト値で補完
              ...savedData.skillSheet?.skills,
              // デフォルト値で不足しているスキルを補完
              'Windows': savedData.skillSheet?.skills?.['Windows'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MacOS': savedData.skillSheet?.skills?.['MacOS'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Linux': savedData.skillSheet?.skills?.['Linux'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Webサーバ（構築、運用）': savedData.skillSheet?.skills?.['Webサーバ（構築、運用）'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'メールサーバ（構築、運用）': savedData.skillSheet?.skills?.['メールサーバ（構築、運用）'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'DBサーバ（構築、運用）': savedData.skillSheet?.skills?.['DBサーバ（構築、運用）'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'DNSサーバ（構築、運用）': savedData.skillSheet?.skills?.['DNSサーバ（構築、運用）'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'N/W設計': savedData.skillSheet?.skills?.['N/W設計'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'N/W構築': savedData.skillSheet?.skills?.['N/W構築'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'N/W調査': savedData.skillSheet?.skills?.['N/W調査'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'N/W監視': savedData.skillSheet?.skills?.['N/W監視'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'DB2': savedData.skillSheet?.skills?.['DB2'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'SQL Server': savedData.skillSheet?.skills?.['SQL Server'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Oracle': savedData.skillSheet?.skills?.['Oracle'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MySQL': savedData.skillSheet?.skills?.['MySQL'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'PostgreSQL': savedData.skillSheet?.skills?.['PostgreSQL'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'プログラマ': savedData.skillSheet?.skills?.['プログラマ'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'SE': savedData.skillSheet?.skills?.['SE'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'リーダー': savedData.skillSheet?.skills?.['リーダー'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'マネージャー': savedData.skillSheet?.skills?.['マネージャー'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'C / C++': savedData.skillSheet?.skills?.['C / C++'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'C#': savedData.skillSheet?.skills?.['C#'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'VB.NET': savedData.skillSheet?.skills?.['VB.NET'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'JAVA': savedData.skillSheet?.skills?.['JAVA'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'JavaScript ': savedData.skillSheet?.skills?.['JavaScript '] || { level: '', experience: '', projects: '', evaluation: '-' },
              'PHP': savedData.skillSheet?.skills?.['PHP'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Python': savedData.skillSheet?.skills?.['Python'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Ruby': savedData.skillSheet?.skills?.['Ruby'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Swift': savedData.skillSheet?.skills?.['Swift'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Objective-C': savedData.skillSheet?.skills?.['Objective-C'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'HTML / HTML5': savedData.skillSheet?.skills?.['HTML / HTML5'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'CSS / CSS3': savedData.skillSheet?.skills?.['CSS / CSS3'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'R': savedData.skillSheet?.skills?.['R'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'ASP.NET (Web Forms)': savedData.skillSheet?.skills?.['ASP.NET (Web Forms)'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'ASP.NET (Core) MVC': savedData.skillSheet?.skills?.['ASP.NET (Core) MVC'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'jQuery': savedData.skillSheet?.skills?.['jQuery'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Bootstrap': savedData.skillSheet?.skills?.['Bootstrap'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Tailwind': savedData.skillSheet?.skills?.['Tailwind'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'ReactJS': savedData.skillSheet?.skills?.['ReactJS'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'VueJS': savedData.skillSheet?.skills?.['VueJS'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Laravel': savedData.skillSheet?.skills?.['Laravel'] || { level: '', experience: '', projects: '', evaluation: '-' },
              '要件定義': savedData.skillSheet?.skills?.['要件定義'] || { level: '', experience: '', projects: '', evaluation: '-' },
              '外部設計/基本設計': savedData.skillSheet?.skills?.['外部設計/基本設計'] || { level: '', experience: '', projects: '', evaluation: '-' },
              '内部設計/詳細設計': savedData.skillSheet?.skills?.['内部設計/詳細設計'] || { level: '', experience: '', projects: '', evaluation: '-' },
              '検証試験': savedData.skillSheet?.skills?.['検証試験'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'セキュリティ試験': savedData.skillSheet?.skills?.['セキュリティ試験'] || { level: '', experience: '', projects: '', evaluation: '-' },
              '負荷試験': savedData.skillSheet?.skills?.['負荷試験'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MS-WORD': savedData.skillSheet?.skills?.['MS-WORD'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MS-EXCEL': savedData.skillSheet?.skills?.['MS-EXCEL'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MS-Access': savedData.skillSheet?.skills?.['MS-Access'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MS-PowerPoint': savedData.skillSheet?.skills?.['MS-PowerPoint'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Photoshop': savedData.skillSheet?.skills?.['Photoshop'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Illustrator': savedData.skillSheet?.skills?.['Illustrator'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'InDesiｇn': savedData.skillSheet?.skills?.['InDesiｇn'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Dreamweaver': savedData.skillSheet?.skills?.['Dreamweaver'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Fireworks': savedData.skillSheet?.skills?.['Fireworks'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'MAYA': savedData.skillSheet?.skills?.['MAYA'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Studio Design': savedData.skillSheet?.skills?.['Studio Design'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Figma': savedData.skillSheet?.skills?.['Figma'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Visual Studio / VSCode': savedData.skillSheet?.skills?.['Visual Studio / VSCode'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Git / SVN': savedData.skillSheet?.skills?.['Git / SVN'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Backlog / Redmine': savedData.skillSheet?.skills?.['Backlog / Redmine'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Notion': savedData.skillSheet?.skills?.['Notion'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'AWS': savedData.skillSheet?.skills?.['AWS'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Azure': savedData.skillSheet?.skills?.['Azure'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'Google Cloud Platform': savedData.skillSheet?.skills?.['Google Cloud Platform'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'IBM Cloud (Bluemix)': savedData.skillSheet?.skills?.['IBM Cloud (Bluemix)'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'W3Schools': savedData.skillSheet?.skills?.['W3Schools'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'タッチタイピング': savedData.skillSheet?.skills?.['タッチタイピング'] || { level: '', experience: '', projects: '', evaluation: '-' },
              'パソコン利用歴': savedData.skillSheet?.skills?.['パソコン利用歴'] || { level: '', experience: '', projects: '', evaluation: '-', pcUsageYears: '' }
            }
          },
          selfIntroduction: savedData.selfIntroduction || '',
          personalPreference: savedData.personalPreference || '',
          contactSameAsLive: savedData.contactSameAsLive || false,
          spouse: savedData.spouse || '',
          spouseSupport: savedData.spouseSupport || '',
          certificateStatus: savedData.certificateStatus || { date: '', name: '' },
          nextJapaneseTestDate: savedData.nextJapaneseTestDate || '',
          nextJapaneseTestLevel: savedData.nextJapaneseTestLevel || '',
          whyJapan: savedData.whyJapan || '',
          whyInterestJapan: savedData.whyInterestJapan || ''
        };
        
        setDocumentData(mergedData);
        toast({
          title: t('common.success'),
          description: t('documents.loadSuccess'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('documents.loadError'),
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // コンポーネントマウント時にデータを読み込み
  useEffect(() => {
    if (!isAdminMode) {
      // 通常モード：現在のユーザーのデータを読み込み
      loadFromDatabase();
    } else if (jobSeekerData) {
      // 管理者モード：選択された求職者のデータを読み込み
      loadFromDatabaseByUserId(jobSeekerData.user_id);
    }
  }, [user, isAdminMode, jobSeekerData]);

  // フロントエンドだけでExcelファイルを生成する関数
  const generateExcelFile = async () => {
    try {
      // 文字数制限の検証
      const textValidation = validateAllTextLengths();
      if (!textValidation.isValid) {
        toast({
          title: t('documents.characterLimitError'),
          description: t('documents.excelGenerationDescription') + "\n" + textValidation.errors.join('\n'),
          variant: "destructive",
        });
        return;
      }
    
    setIsGenerating(true);
      
      // ExcelJSを使用してExcelファイルを生成
      const workbook = new ExcelJS.Workbook();
      
      // 履歴書シート - スプレッドシートを忠実に再現
      const resumeSheet = workbook.addWorksheet('履歴書');
      
      // 列幅設定
      resumeSheet.getColumn('A').width = 1.5;
      resumeSheet.getColumn('B').width = 12.83;
      resumeSheet.getColumn('C').width = 7.67;
      resumeSheet.getColumn('D').width = 29;
      resumeSheet.getColumn('E').width = 17.5;
      resumeSheet.getColumn('F').width = 10.83;
      resumeSheet.getColumn('G').width = 15;
      resumeSheet.getColumn('H').width = 4;
      resumeSheet.getColumn('I').width = 4;
      resumeSheet.getColumn('J').width = 15.33;
      resumeSheet.getColumn('K').width = 11.33;
      resumeSheet.getColumn('L').width = 25.83;
      resumeSheet.getColumn('M').width = 25.83;
      resumeSheet.getColumn('N').width = 25.83;
      resumeSheet.getColumn('O').width = 10.33;
      
      // 行高設定
      resumeSheet.getRow(1).height = 11;
      resumeSheet.getRow(2).height = 33;
      resumeSheet.getRow(3).height = 34;
      resumeSheet.getRow(4).height = 34;
      resumeSheet.getRow(5).height = 34;
      resumeSheet.getRow(6).height = 34;
      resumeSheet.getRow(7).height = 34;
      resumeSheet.getRow(8).height = 16;
      resumeSheet.getRow(9).height = 16;
      resumeSheet.getRow(10).height = 34;
      resumeSheet.getRow(11).height = 34;
      resumeSheet.getRow(12).height = 16;
      resumeSheet.getRow(13).height = 16;
      resumeSheet.getRow(14).height = 34;
      resumeSheet.getRow(15).height = 34;
      resumeSheet.getRow(16).height = 34;
      resumeSheet.getRow(17).height = 34;
      resumeSheet.getRow(18).height = 34;
      resumeSheet.getRow(19).height = 34;
      resumeSheet.getRow(20).height = 34;
      resumeSheet.getRow(21).height = 34;
      resumeSheet.getRow(22).height = 34;
      resumeSheet.getRow(23).height = 34;
      resumeSheet.getRow(24).height = 34;
      resumeSheet.getRow(25).height = 34;
      resumeSheet.getRow(26).height = 34;
      resumeSheet.getRow(27).height = 34;
      resumeSheet.getRow(28).height = 34;
      resumeSheet.getRow(29).height = 34;
      resumeSheet.getRow(30).height = 34;
      resumeSheet.getRow(31).height = 34;
      resumeSheet.getRow(32).height = 34;
      resumeSheet.getRow(33).height = 34;
      resumeSheet.getRow(34).height = 34;

      //履歴書
      // タイトル
      const titleCell = resumeSheet.getCell('B2');
      titleCell.value = '履　歴　書';
      titleCell.font = { name: 'MS Gothic', size: 18, bold: true };
      titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
      resumeSheet.mergeCells('B2:D2');
      
      // 作成日（現在の日付を使用）
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
      const dateCell = resumeSheet.getCell('F2');
      dateCell.value = `${formattedDate} 現在`;
      dateCell.font = { name: 'MS Gothic', size: 8 };
      dateCell.alignment = { horizontal: 'right' };
      
      // 基本情報
      const b3Cell = resumeSheet.getCell('B3');
b3Cell.value = 'フリガナ';
b3Cell.font = { name: 'MS Gothic', size: 8, bold: false };
b3Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('C3:E3');
const c3Cell = resumeSheet.getCell('C3');
c3Cell.value = `${documentData.kanaLastName} ${documentData.kanaFirstName}`;
c3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c3Cell.alignment = { horizontal: 'center', vertical: 'middle' };

  resumeSheet.mergeCells('F3:F5');
  const f3Cell = resumeSheet.getCell('F3');
  f3Cell.value = documentData.gender;
  f3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
  f3Cell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // 顔写真をG3:G6セルに貼り付け（元の比率を保持）
  resumeSheet.mergeCells('G3:G6');
  const g3Cell = resumeSheet.getCell('G3');
  
  if (documentData.resume.photoUrl) {
    try {
      // Base64画像をExcelに追加
      const imageId = workbook.addImage({
        base64: documentData.resume.photoUrl.split(',')[1], // data:image/jpeg;base64,の部分を除去
        extension: 'jpeg',
      });
      
      // セルのサイズを適切に設定（写真の比率を保持）
      resumeSheet.getRow(3).height = 43.32;
      resumeSheet.getRow(4).height = 43.32;
      resumeSheet.getRow(5).height = 43.32;
      resumeSheet.getRow(6).height = 43.32;
      resumeSheet.getColumn('G').width = 21.67;
      
      // 画像を配置（元の比率を保持）
      resumeSheet.addImage(imageId, 'G3:G6');
      
      // セルの背景を透明に
      g3Cell.fill = { type: 'pattern', pattern: 'none' };
    } catch (error) {
              console.error(t('documents.imageAddError'), error);
      g3Cell.value = "写真";
      g3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
      g3Cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  } else {
    g3Cell.value = "写真";
    g3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
    g3Cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

      
      resumeSheet.mergeCells('B4:B5');
const b4Cell = resumeSheet.getCell('B4');
b4Cell.value = ' 氏     名';
b4Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b4Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('C4:E5');
const c4Cell = resumeSheet.getCell('C4');
const resumeFullName = `${documentData.lastName} ${documentData.firstName}`;
const resumeNationalityText = documentData.nationality ? `（${documentData.nationality}）` : '';

// Rich Textを使用して名前と国籍を異なるスタイルで設定
const richText = [
  { text: resumeFullName, font: { name: 'MS Gothic', size: 16, bold: false } }
];

if (resumeNationalityText) {
  richText.push(
    { text: '\n', font: { name: 'MS Gothic', size: 16, bold: false } },
    { text: resumeNationalityText, font: { name: 'MS Gothic', size: 8, bold: false } }
  );
}

c4Cell.value = { richText };
c4Cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      
const b6Cell = resumeSheet.getCell('B6');
b6Cell.value = '生年月日';
b6Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b6Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('C6:F6');
const c6Cell = resumeSheet.getCell('C6');
c6Cell.value = documentData.birthDate;
c6Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c6Cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
const b7Cell = resumeSheet.getCell('B7');
b7Cell.value = 'フリガナ';
b7Cell.font = { name: 'MS Gothic', size: 8, bold: false };
b7Cell.alignment = { horizontal: 'center', vertical: 'middle' };
resumeSheet.mergeCells('C7:F7');
const c7Cell = resumeSheet.getCell('C7');
c7Cell.value = documentData.kanaLiveAddress;
c7Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c7Cell.alignment = { horizontal: 'center', vertical: 'middle' };
const g7Cell = resumeSheet.getCell('G7');
g7Cell.value = '電話：' + documentData.livePhoneNumber;
g7Cell.font = { name: 'MS Gothic', size: 8, bold: false };
g7Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const b8Cell = resumeSheet.getCell('B8');
b8Cell.value = ' 現住所';
b8Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b8Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('C8:F8');
const c8Cell = resumeSheet.getCell('C8');
c8Cell.value = '〒' + documentData.livePostNumber;
c8Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c8Cell.alignment = { horizontal: 'left', vertical: 'middle' };

const g8Cell = resumeSheet.getCell('G8');
g8Cell.value = 'E-mail';
g8Cell.font = { name: 'MS Gothic', size: 8, bold: false };
g8Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('B9:F10');
const b9Cell = resumeSheet.getCell('B9');
b9Cell.value = documentData.liveAddress;
b9Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b9Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('G9:G10');
const g9Cell = resumeSheet.getCell('G9');
g9Cell.value = documentData.liveMail;
g9Cell.font = { name: 'MS Gothic', size: 8, bold: false };
g9Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const b11Cell = resumeSheet.getCell('B11');
b11Cell.value = 'フリガナ';
b11Cell.font = { name: 'MS Gothic', size: 8, bold: false };
b11Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('C11:F11');
const c11Cell = resumeSheet.getCell('C11');
c11Cell.value = documentData.contactSameAsLive ? '' : `${documentData.kanaLastName} ${documentData.kanaFirstName}`;
c11Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c11Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const g11Cell = resumeSheet.getCell('G11');
g11Cell.value = documentData.contactSameAsLive ? '' : '電話：' + documentData.contactPhoneNumber;
g11Cell.font = { name: 'MS Gothic', size: 8, bold: false };
g11Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const b12Cell = resumeSheet.getCell('B12');
b12Cell.value = '連絡先住所';
b12Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b12Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('C12:F12');
const c12Cell = resumeSheet.getCell('C12');
c12Cell.value = documentData.contactSameAsLive ? '' : '〒' + documentData.contactPostNumber;
c12Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c12Cell.alignment = { horizontal: 'left', vertical: 'middle' };

const g12Cell = resumeSheet.getCell('G12');
g12Cell.value = 'E-mail';
g12Cell.font = { name: 'MS Gothic', size: 8, bold: false };
g12Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('B13:F14');
const b13Cell = resumeSheet.getCell('B13');
b13Cell.value = documentData.contactSameAsLive ? '上記と同じ' : documentData.contactAddress;
b13Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b13Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('G13:G14');
const g13Cell = resumeSheet.getCell('G13');
g13Cell.value = documentData.contactSameAsLive ? '' : documentData.contactMail;
g13Cell.font = { name: 'MS Gothic', size: 10, bold: false };
g13Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const b15Cell = resumeSheet.getCell('B15');
b15Cell.value = '年';
b15Cell.font = { name: 'MS Gothic', size: 10, bold: false };
b15Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const c15Cell = resumeSheet.getCell('C15');
c15Cell.value = '月';
c15Cell.font = { name: 'MS Gothic', size: 10, bold: false };
c15Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('D15:G15');
const d15Cell = resumeSheet.getCell('D15');
d15Cell.value = '学　歴・職　歴';
d15Cell.font = { name: 'MS Gothic', size: 10, bold: false };
d15Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('D16:G16');
const d16Cell = resumeSheet.getCell('D16');
d16Cell.value = '学歴';
d16Cell.font = { name: 'MS Gothic', size: 10, bold: false };
d16Cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      let currentRow = 17;
      // 学歴を出力
      documentData.resume.education.forEach((edu) => {
        if (edu.year && edu.content) {
          const eduCell1 = resumeSheet.getCell(`B${currentRow}`);
          eduCell1.value = edu.year;
          eduCell1.alignment = { vertical: 'middle', horizontal: 'center' };
          eduCell1.font = { name: 'MS Gothic', size: 10, bold: false };
        
          const eduCell2 = resumeSheet.getCell(`C${currentRow}`);
          eduCell2.value = edu.month;
          eduCell2.alignment = { vertical: 'middle', horizontal: 'center' };
          eduCell2.font = { name: 'MS Gothic', size: 10, bold: false };
        
          resumeSheet.mergeCells(`D${currentRow}:G${currentRow}`);
          const eduCell3 = resumeSheet.getCell(`D${currentRow}`);
          eduCell3.value = edu.content;
          eduCell3.alignment = { vertical: 'middle', horizontal: 'center' };
          eduCell3.font = { name: 'MS Gothic', size: 10, bold: false };
        
          currentRow++;
        }        
      });
      
      resumeSheet.mergeCells(`D${currentRow}:G${currentRow}`);
const workTitleCell = resumeSheet.getCell(`D${currentRow}`);
workTitleCell.value = 'インターン歴/職歴';
workTitleCell.font = { name: 'MS Gothic', size: 10, bold: false };
workTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;
      
      // 職歴を出力
      documentData.resume.workExperience.forEach((work) => {
        if (work.year && work.content) {
          const workCell1 = resumeSheet.getCell(`B${currentRow}`);
          workCell1.value = work.year;
          workCell1.alignment = { vertical: 'middle', horizontal: 'center' };
          workCell1.font = { name: 'MS Gothic', size: 10, bold: false };
        
          const workCell2 = resumeSheet.getCell(`C${currentRow}`);
          workCell2.value = work.month;
          workCell2.alignment = { vertical: 'middle', horizontal: 'center' };
          workCell2.font = { name: 'MS Gothic', size: 10, bold: false };
        
          resumeSheet.mergeCells(`D${currentRow}:G${currentRow}`);
          const workCell3 = resumeSheet.getCell(`D${currentRow}`);
          workCell3.value = work.content;
          workCell3.alignment = { vertical: 'middle', horizontal: 'center' };
          workCell3.font = { name: 'MS Gothic', size: 10, bold: false };
        
          currentRow++;
        }
        
      });
      
      resumeSheet.mergeCells(`D${currentRow}:G${currentRow}`);
const dCell = resumeSheet.getCell(`D${currentRow}`);
dCell.value = '以上';
dCell.font = { name: 'MS Gothic', size: 10, bold: false };
dCell.alignment = { horizontal: 'right', vertical: 'middle' };

      
// 資格情報
      const j3Cell = resumeSheet.getCell('J3');
j3Cell.value = '年';
j3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j3Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const k3Cell = resumeSheet.getCell('K3');
k3Cell.value = '月';
k3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
k3Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('L3:N3');
const l3Cell = resumeSheet.getCell('L3');
l3Cell.value = '免  許・資  格';
l3Cell.font = { name: 'MS Gothic', size: 10, bold: false };
l3Cell.alignment = { horizontal: 'center', vertical: 'middle' };

// 資格情報を出力
let currentQualificationRow = 4;
documentData.resume.qualifications.forEach((qual) => {
  if (qual.year && qual.name) {
    const qualCell1 = resumeSheet.getCell(`J${currentQualificationRow}`);
    qualCell1.value = qual.year;
    qualCell1.alignment = { vertical: 'middle', horizontal: 'center' };
    qualCell1.font = { name: 'MS Gothic', size: 10, bold: false };
  
    const qualCell2 = resumeSheet.getCell(`K${currentQualificationRow}`);
    qualCell2.value = qual.month;
    qualCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    qualCell2.font = { name: 'MS Gothic', size: 10, bold: false };
  
    resumeSheet.mergeCells(`L${currentQualificationRow}:N${currentQualificationRow}`);
    const qualCell3 = resumeSheet.getCell(`L${currentQualificationRow}`);
    qualCell3.value = qual.name;
    qualCell3.alignment = { vertical: 'middle', horizontal: 'center' };
    qualCell3.font = { name: 'MS Gothic', size: 10, bold: false };
  
    currentQualificationRow++;
  }  
});

resumeSheet.mergeCells('J8:K9');
const j8Cell = resumeSheet.getCell('J8');
j8Cell.value = '日本語資格保持状況';
j8Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j8Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('L8:N9');
const l8Cell = resumeSheet.getCell('L8');
l8Cell.value = `取得日： ${documentData.certificateStatus?.date || ''}、資格：${documentData.certificateStatus?.name || ''}`; //取得日： {XX年X月X日}、資格：{N2} という形でお願いします。N1~N5まであります。
l8Cell.font = { name: 'MS Gothic', size: 10, bold: false };
l8Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('J10:K10');
const j10Cell = resumeSheet.getCell('J10');
j10Cell.value = '次の日本語試験予定日';
j10Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j10Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('L10:N10');
const l10Cell = resumeSheet.getCell('L10');
l10Cell.value = `予定日：${documentData.nextJapaneseTestDate}、資格：${documentData.nextJapaneseTestLevel}`; //予定日：{XX年X月X日}、資格：{N2} という形でお願いします。N1~N5まであります。
l10Cell.font = { name: 'MS Gothic', size: 10, bold: false };
l10Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('J11:K15');
const j11Cell = resumeSheet.getCell('J11');
j11Cell.value = '何故日本で働きたいか？';
j11Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j11Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('L11:N15');
const l11Cell = resumeSheet.getCell('L11');
l11Cell.value = documentData.whyJapan;
l11Cell.font = { name: 'MS Gothic', size: 10, bold: false };
l11Cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

resumeSheet.mergeCells('J16:K19');
const j16Cell = resumeSheet.getCell('J16');
j16Cell.value = '何故日本に興味を持ったか？';
j16Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j16Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('L16:N19');
const l16Cell = resumeSheet.getCell('L16');
l16Cell.value = documentData.whyInterestJapan;
l16Cell.font = { name: 'MS Gothic', size: 10, bold: false };
l16Cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

resumeSheet.mergeCells('J20:K24');
const j20Cell = resumeSheet.getCell('J20');
j20Cell.value = '自己PR';
j20Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j20Cell.alignment = { horizontal: 'left', vertical: 'middle' };

resumeSheet.mergeCells('L20:N24');
const l20Cell = resumeSheet.getCell('L20');
l20Cell.value = documentData.selfIntroduction;
l20Cell.font = { name: 'MS Gothic', size: 10, bold: false };
l20Cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

const m25Cell = resumeSheet.getCell('J25:L25');
m25Cell.value = '配偶者';
m25Cell.font = { name: 'MS Gothic', size: 8, bold: false };
m25Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const n25Cell = resumeSheet.getCell('M25:N25');
n25Cell.value = ' 配偶者の扶養義務';
n25Cell.font = { name: 'MS Gothic', size: 8, bold: false };
n25Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const m26Cell = resumeSheet.getCell('J26:L26');
m26Cell.value = documentData.spouse;
m26Cell.font = { name: 'MS Gothic', size: 10, bold: false };
m26Cell.alignment = { horizontal: 'center', vertical: 'middle' };

const n26Cell = resumeSheet.getCell('M26:N26');
n26Cell.value = documentData.spouseSupport;
n26Cell.font = { name: 'MS Gothic', size: 10, bold: false };
n26Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('J27:N27');
const j27Cell = resumeSheet.getCell('J27');
j27Cell.value = '本人希望記入欄（特に待遇・職種・勤務時間・その他についての希望などがあれば記入）';
j27Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j27Cell.alignment = { horizontal: 'center', vertical: 'middle' };

resumeSheet.mergeCells('J28:N33');
const j28Cell = resumeSheet.getCell('J28');
j28Cell.value = documentData.personalPreference;
j28Cell.font = { name: 'MS Gothic', size: 10, bold: false };
j28Cell.alignment = { horizontal: 'left', vertical: 'middle' };

      
      // 職務経歴書シート
      const workHistorySheet = workbook.addWorksheet('職務経歴書');
      
      // 列幅設定
      workHistorySheet.getColumn('A').width = 1.5;
      workHistorySheet.getColumn('B').width = 40;
      workHistorySheet.getColumn('C').width = 40;
      workHistorySheet.getColumn('D').width = 40;
      workHistorySheet.getColumn('E').width = 1.5;

      workHistorySheet.getRow(1).height = 11;
      workHistorySheet.getRow(2).height = 33;
      workHistorySheet.getRow(3).height = 17;
      workHistorySheet.getRow(4).height = 17;
      workHistorySheet.getRow(5).height = 17;
      workHistorySheet.getRow(6).height = 27;

      // タイトル
      workHistorySheet.mergeCells('B2:C2');
      const workHistoryTitleCell = workHistorySheet.getCell('B2');
      workHistoryTitleCell.value = '職　務　履　歴　書';
      workHistoryTitleCell.font = { name: 'MS Gothic', size: 18, bold: false };
      workHistoryTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

      // 作成日（現在の日付を使用）
      const workHistoryCurrentDate = new Date();
      const workHistoryFormattedDate = `${workHistoryCurrentDate.getFullYear()}年${workHistoryCurrentDate.getMonth() + 1}月${workHistoryCurrentDate.getDate()}日`;
      const workHistoryDateCell = workHistorySheet.getCell('D2');
      workHistoryDateCell.value = `${workHistoryFormattedDate} 現在`;
      workHistoryDateCell.font = { name: 'MS Gothic', size: 8 };
      workHistoryDateCell.alignment = { horizontal: 'right', vertical: 'middle' };

      // 氏名
      workHistorySheet.mergeCells('B3:C5');
      const labelNameCell = workHistorySheet.getCell('B3');
      labelNameCell.value = '氏名';
      labelNameCell.font = { name: 'MS Gothic', size: 11, bold: false };
      labelNameCell.alignment = { vertical: 'middle', horizontal: 'right' };

      workHistorySheet.mergeCells('D3:D5');
      const fullNameCell = workHistorySheet.getCell('D3');
const workHistoryFullName = `${documentData.lastName} ${documentData.firstName}`;
const workHistoryNationalityText = documentData.nationality ? `（${documentData.nationality}）` : '';

// Rich Textを使用して名前と国籍を異なるスタイルで設定
const workHistoryRichText = [
  { text: workHistoryFullName, font: { name: 'MS Gothic', size: 11, bold: false } }
];

if (workHistoryNationalityText) {
  workHistoryRichText.push(
    { text: '\n', font: { name: 'MS Gothic', size: 11, bold: false } },
    { text: workHistoryNationalityText, font: { name: 'MS Gothic', size: 8, bold: false } }
  );
}

fullNameCell.value = { richText: workHistoryRichText };
fullNameCell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };

      // 職務経歴一覧
      workHistorySheet.mergeCells('B6:D6');
      const sectionHeaderCell = workHistorySheet.getCell('B6');
      sectionHeaderCell.value = '◾️職務経歴一覧';
      sectionHeaderCell.font = { name: 'MS Gothic', size: 13, bold: false };
      sectionHeaderCell.alignment = { vertical: 'middle', horizontal: 'left' };

      // 職務経歴の内容を追加
      let workHistoryRow = 7;
      documentData.workHistory.workExperiences.forEach((work) => {
                  if (work.period) {
            // 期間・概要行
            workHistorySheet.mergeCells(`B${workHistoryRow}:D${workHistoryRow}`);
            const periodCell = workHistorySheet.getCell(`B${workHistoryRow}`);
            periodCell.value = work.period;
            periodCell.font = { name: 'MS Gothic', size: 11, bold: false };
            periodCell.alignment = { vertical: 'middle', horizontal: 'left' };
            workHistorySheet.getRow(workHistoryRow).height = 20;
            workHistoryRow++;

            // 詳細行
            workHistorySheet.getCell(`B${workHistoryRow}`).value = `【作業内容】\n${work.description}`;
            workHistorySheet.getCell(`B${workHistoryRow}`).font = { name: 'MS Gothic', size: 10, bold: false };
            workHistorySheet.getCell(`B${workHistoryRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

            workHistorySheet.getCell(`C${workHistoryRow}`).value = `【使用ツール等】\n${work.technologies}`;
            workHistorySheet.getCell(`C${workHistoryRow}`).font = { name: 'MS Gothic', size: 10, bold: false };
            workHistorySheet.getCell(`C${workHistoryRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

            workHistorySheet.getCell(`D${workHistoryRow}`).value = `【役割】\n${work.role}`;
            workHistorySheet.getCell(`D${workHistoryRow}`).font = { name: 'MS Gothic', size: 10, bold: false };
            workHistorySheet.getCell(`D${workHistoryRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

            workHistorySheet.getRow(workHistoryRow).height = 110;
            workHistoryRow++;
          }
      });

      // スキルシート
      const skillsSheet = workbook.addWorksheet('スキルシート');
      
      // 列幅設定
      skillsSheet.getColumn('A').width = 1.5;
      skillsSheet.getColumn('B').width = 40;
      skillsSheet.getColumn('C').width = 8;
      skillsSheet.getColumn('D').width = 40;
      skillsSheet.getColumn('E').width = 8;
      skillsSheet.getColumn('F').width = 40;
      skillsSheet.getColumn('G').width = 8;
      skillsSheet.getColumn('H').width = 1.5;

      skillsSheet.getRow(1).height = 9;
      skillsSheet.getRow(2).height = 32;
      skillsSheet.getRow(3).height = 50;
      skillsSheet.getRow(4).height = 50;
      skillsSheet.getRow(5).height = 28;
      skillsSheet.getRow(6).height = 28;
skillsSheet.getRow(7).height = 28;
skillsSheet.getRow(8).height = 28;
skillsSheet.getRow(9).height = 28;
skillsSheet.getRow(10).height = 28;
skillsSheet.getRow(11).height = 28;
skillsSheet.getRow(12).height = 28;
skillsSheet.getRow(13).height = 28;
skillsSheet.getRow(14).height = 28;
skillsSheet.getRow(15).height = 28;
skillsSheet.getRow(16).height = 28;
skillsSheet.getRow(17).height = 28;
skillsSheet.getRow(18).height = 28;
skillsSheet.getRow(19).height = 28;
skillsSheet.getRow(20).height = 28;
skillsSheet.getRow(21).height = 28;
skillsSheet.getRow(22).height = 28;
skillsSheet.getRow(23).height = 28;
skillsSheet.getRow(24).height = 28;
skillsSheet.getRow(25).height = 28;
skillsSheet.getRow(26).height = 28;
skillsSheet.getRow(27).height = 28;
skillsSheet.getRow(28).height = 28;
skillsSheet.getRow(29).height = 28;
skillsSheet.getRow(30).height = 28;
skillsSheet.getRow(31).height = 28;
skillsSheet.getRow(32).height = 28;
skillsSheet.getRow(33).height = 28;
skillsSheet.getRow(34).height = 28;
skillsSheet.getRow(35).height = 28;
skillsSheet.getRow(36).height = 28;
skillsSheet.getRow(37).height = 28;
skillsSheet.getRow(38).height = 28;
skillsSheet.getRow(39).height = 28;
skillsSheet.getRow(40).height = 28;
skillsSheet.getRow(41).height = 9;


      
      // タイトル
      skillsSheet.mergeCells('B2:G2');
      const skillsTitleCell = skillsSheet.getCell('B2');
      skillsTitleCell.value = 'ス キ ル シ ー ト';
      skillsTitleCell.font = { name: 'MS Gothic', size: 16, bold: true };
      skillsTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      skillsSheet.mergeCells('B3:D3');
      const skillsNameCell = skillsSheet.getCell('B3');
      const skillsFullName = `${documentData.lastName} ${documentData.firstName}`;
      const skillsNationalityText = documentData.nationality ? `（${documentData.nationality}）` : '';
      
      // Rich Textを使用して名前と国籍を異なるスタイルで設定
      const skillsRichText = [
        { text: `氏名：${skillsFullName}`, font: { name: 'MS Gothic', size: 10, bold: false } }
      ];

      if (skillsNationalityText) {
        skillsRichText.push(
          { text: skillsNationalityText, font: { name: 'MS Gothic', size: 8, bold: false } }
        );
      }

      skillsNameCell.value = { richText: skillsRichText };
      skillsNameCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      skillsSheet.mergeCells('B4:G4');
      const skillsExplainCell = skillsSheet.getCell('B4');
      skillsExplainCell.value = 'レベルの基準\nA：指導レベル、実務3年以上など　B：応用レベル、実務1年以上3年未満など　C：基本レベル、実務1年未満など\nD：初歩レベル、使用したことがある　E：経験なし';
      skillsExplainCell.font = { name: 'MS Gothic', size: 9, bold: false };
      skillsExplainCell.alignment = { vertical: 'middle', horizontal: 'left' };
      
      skillsSheet.mergeCells('E3:G3');
      const skillsCurrentDate = new Date();
      const skillsFormattedDate = `${skillsCurrentDate.getFullYear()}年${skillsCurrentDate.getMonth() + 1}月${skillsCurrentDate.getDate()}日`;
      const skillsDate = skillsSheet.getCell('E3');
      skillsDate.value = '記入日：' + skillsFormattedDate;
      skillsDate.font = { name: 'MS Gothic', size: 10, bold: false };
      skillsDate.alignment = { vertical: 'middle', horizontal: 'left' };
      

// B5〜G5 - スキル・レベル
const skillHeaders = ['B5', 'C5', 'D5', 'E5', 'F5', 'G5'];
const skillTexts = ['スキル', 'レベル', 'スキル', 'レベル', 'スキル', 'レベル'];

skillHeaders.forEach((cellRef, index) => {
  skillsSheet.getCell(cellRef).value = skillTexts[index];
  skillsSheet.getCell(cellRef).font = { name: 'MS Gothic', size: 10, bold: false };
  skillsSheet.getCell(cellRef).alignment = { vertical: 'middle', horizontal: 'center' };
});

// グレー背景の見出しセル
const grayHeaders = [
  ['B6:C6', 'OS'],
  ['D6:E6', '言語'],
  ['F6:G6', 'アプリケーション'],
  ['B12:C12', 'インフラ'],
  ['F19:G19', 'ツール'],
  ['B23:C23', 'DB'],
  ['D23:E23', 'フレームワーク'],
  ['F31:G31', '情報処理系講義（職業訓練、Udemyなど）'],
  ['B32:C32', '職種'],
  ['D32:E32', '業務'],
  ['F35:G35', 'その他']
];

grayHeaders.forEach(([range, label]) => {
  skillsSheet.mergeCells(range);
  const cell = skillsSheet.getCell(range.split(':')[0]);
  cell.value = label;
  cell.font = { name: 'MS Gothic', size: 10, bold: false };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
            cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
});

const whiteCells = [
  'B7', 'B8', 'B9', 'B10',
  'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21',
  'B24', 'B25', 'B26', 'B27', 'B28', 'B29',
  'B33', 'B34', 'B35', 'B36', 'B37',
  'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16',
  'D17', 'D18', 'D19', 'D20',
  'D24', 'D25', 'D26', 'D27', 'D28', 'D29', 'D30', 'D31',
  'D33', 'D34', 'D35', 'D36', 'D37', 'D38', 'D39',
  'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16',
  'F17', 'F18', 'F20', 'F21', 'F22', 'F23', 'F24', 'F25', 'F26', 'F27', 'F28',
  'F32', 'F36', 'F37'
];

const whiteValues = {
  'B7': 'Windows',
  'B8': 'MacOS',
  'B9': 'Linux',

  'B13': 'Webサーバ（構築、運用）',
  'B14': 'メールサーバ（構築、運用）',
  'B15': 'DBサーバ（構築、運用）',
  'B16': 'DNSサーバ（構築、運用）',
  'B17': 'N/W設計',
  'B18': 'N/W構築',
  'B19': 'N/W調査',
  'B20': 'N/W監視',

  'B24': 'DB2',
  'B25': 'SQL Server',
  'B26': 'Oracle',
  'B27': 'MySQL',
  'B28': 'PostgreSQL',

  'B33': 'プログラマ',
  'B34': 'SE',
  'B35': 'リーダー',
  'B36': 'マネージャー',
  'B37': 'その他：ブリーチエンジニア',
  'D7': 'C / C++',
  'D8': 'C#',
  'D9': 'VB.NET',
  'D10': 'JAVA',
  'D11': 'JavaScript ',
  'D12': 'PHP',
  'D13': 'Python',
  'D14': 'Ruby',
  'D15': 'Swift',
  'D16': 'Objective-C',
  'D17': 'HTML / HTML5',
  'D18': 'CSS / CSS3',
  'D19': 'R',

  'D24': 'ASP.NET (Web Forms)',
  'D25': 'ASP.NET (Core) MVC',
  'D26': 'jQuery',
  'D27': 'Bootstrap',
  'D28': 'Tailwind',
  'D29': 'ReactJS',
  'D30': 'VueJS',
  'D31': 'Laravel',
  'D33': '要件定義',
  'D34': '外部設計/基本設計',
  'D35': '内部設計/詳細設計',
  'D36': '検証試験',
  'D37': 'セキュリティ試験',
  'D38': '負荷試験',

  'F7': 'MS-WORD',
  'F8': 'MS-EXCEL',
  'F9': 'MS-Access',
  'F10': 'MS-PowerPoint',
  'F11': 'Photoshop',
  'F12': 'Illustrator',
  'F13': 'InDesiｇn',
  'F14': 'Dreamweaver',
  'F15': 'Fireworks',
  'F16': 'MAYA',
  'F17': 'Studio Design',
  'F18': 'Figma',
  'F20': 'Visual Studio / VSCode',
  'F21': 'Git / SVN',
  'F22': 'Backlog / Redmine',
  'F23': 'Notion',
  'F24': 'AWS',
  'F25': 'Azure',
  'F26': 'Google Cloud Platform',
  'F27': 'IBM Cloud (Bluemix)',

  'F32': 'W3Schools',
  'F36': 'タッチタイピング',
  'F37': 'パソコン利用歴'
};

whiteCells.forEach(cell => {
  skillsSheet.getCell(cell).value = whiteValues[cell];
  skillsSheet.getCell(cell).font = { name: 'MS Gothic', size: 10, bold: false };
  skillsSheet.getCell(cell).alignment = { horizontal: 'left', vertical: 'middle' };
});

//【命令】上記スキル全てに対して右隣のセルに評価を変数として与えたい、A-Dで初期値は"-"とする、編集画面も全てのスキルに対してA-Dが入力できるようにしてほしい
//例外として"パソコン利用歴"は数値を入力させて、自然数のみのやつ

// 各スキル項目の右隣に評価を設定
const skillEvaluations = {
  'Windows': documentData.skillSheet.skills['Windows']?.evaluation || '-',
  'MacOS': documentData.skillSheet.skills['MacOS']?.evaluation || '-',
  'Linux': documentData.skillSheet.skills['Linux']?.evaluation || '-',

  'Webサーバ（構築、運用）': documentData.skillSheet.skills['Webサーバ（構築、運用）']?.evaluation || '-',
  'メールサーバ（構築、運用）': documentData.skillSheet.skills['メールサーバ（構築、運用）']?.evaluation || '-',
  'DBサーバ（構築、運用）': documentData.skillSheet.skills['DBサーバ（構築、運用）']?.evaluation || '-',
  'DNSサーバ（構築、運用）': documentData.skillSheet.skills['DNSサーバ（構築、運用）']?.evaluation || '-',
  'N/W設計': documentData.skillSheet.skills['N/W設計']?.evaluation || '-',
  'N/W構築': documentData.skillSheet.skills['N/W構築']?.evaluation || '-',
  'N/W調査': documentData.skillSheet.skills['N/W調査']?.evaluation || '-',
  'N/W監視': documentData.skillSheet.skills['N/W監視']?.evaluation || '-',
  'DB2': documentData.skillSheet.skills['DB2']?.evaluation || '-',
  'SQL Server': documentData.skillSheet.skills['SQL Server']?.evaluation || '-',
  'Oracle': documentData.skillSheet.skills['Oracle']?.evaluation || '-',
  'MySQL': documentData.skillSheet.skills['MySQL']?.evaluation || '-',
  'PostgreSQL': documentData.skillSheet.skills['PostgreSQL']?.evaluation || '-',
  'プログラマ': documentData.skillSheet.skills['プログラマ']?.evaluation || '-',
  'SE': documentData.skillSheet.skills['SE']?.evaluation || '-',
  'リーダー': documentData.skillSheet.skills['リーダー']?.evaluation || '-',
  'マネージャー': documentData.skillSheet.skills['マネージャー']?.evaluation || '-',
  'C / C++': documentData.skillSheet.skills['C / C++']?.evaluation || '-',
  'C#': documentData.skillSheet.skills['C#']?.evaluation || '-',
  'VB.NET': documentData.skillSheet.skills['VB.NET']?.evaluation || '-',
  'JAVA': documentData.skillSheet.skills['JAVA']?.evaluation || '-',
  'JavaScript ': documentData.skillSheet.skills['JavaScript ']?.evaluation || '-',
  'PHP': documentData.skillSheet.skills['PHP']?.evaluation || '-',
  'Python': documentData.skillSheet.skills['Python']?.evaluation || '-',
  'Ruby': documentData.skillSheet.skills['Ruby']?.evaluation || '-',
  'Swift': documentData.skillSheet.skills['Swift']?.evaluation || '-',
  'Objective-C': documentData.skillSheet.skills['Objective-C']?.evaluation || '-',
  'HTML / HTML5': documentData.skillSheet.skills['HTML / HTML5']?.evaluation || '-',
  'CSS / CSS3': documentData.skillSheet.skills['CSS / CSS3']?.evaluation || '-',
  'R': documentData.skillSheet.skills['R']?.evaluation || '-',
  'ASP.NET (Web Forms)': documentData.skillSheet.skills['ASP.NET (Web Forms)']?.evaluation || '-',
  'ASP.NET (Core) MVC': documentData.skillSheet.skills['ASP.NET (Core) MVC']?.evaluation || '-',
  'jQuery': documentData.skillSheet.skills['jQuery']?.evaluation || '-',
  'Bootstrap': documentData.skillSheet.skills['Bootstrap']?.evaluation || '-',
  'Tailwind': documentData.skillSheet.skills['Tailwind']?.evaluation || '-',
  'ReactJS': documentData.skillSheet.skills['ReactJS']?.evaluation || '-',
  'VueJS': documentData.skillSheet.skills['VueJS']?.evaluation || '-',
  'Laravel': documentData.skillSheet.skills['Laravel']?.evaluation || '-',
  '要件定義': documentData.skillSheet.skills['要件定義']?.evaluation || '-',
  '外部設計/基本設計': documentData.skillSheet.skills['外部設計/基本設計']?.evaluation || '-',
  '内部設計/詳細設計': documentData.skillSheet.skills['内部設計/詳細設計']?.evaluation || '-',
  '検証試験': documentData.skillSheet.skills['検証試験']?.evaluation || '-',
  'セキュリティ試験': documentData.skillSheet.skills['セキュリティ試験']?.evaluation || '-',
  '負荷試験': documentData.skillSheet.skills['負荷試験']?.evaluation || '-',
  'MS-WORD': documentData.skillSheet.skills['MS-WORD']?.evaluation || '-',
  'MS-EXCEL': documentData.skillSheet.skills['MS-EXCEL']?.evaluation || '-',
  'MS-Access': documentData.skillSheet.skills['MS-Access']?.evaluation || '-',
  'MS-PowerPoint': documentData.skillSheet.skills['MS-PowerPoint']?.evaluation || '-',
  'Photoshop': documentData.skillSheet.skills['Photoshop']?.evaluation || '-',
  'Illustrator': documentData.skillSheet.skills['Illustrator']?.evaluation || '-',
  'InDesiｇn': documentData.skillSheet.skills['InDesiｇn']?.evaluation || '-',
  'Dreamweaver': documentData.skillSheet.skills['Dreamweaver']?.evaluation || '-',
  'Fireworks': documentData.skillSheet.skills['Fireworks']?.evaluation || '-',
  'MAYA': documentData.skillSheet.skills['MAYA']?.evaluation || '-',
  'Studio Design': documentData.skillSheet.skills['Studio Design']?.evaluation || '-',
  'Figma': documentData.skillSheet.skills['Figma']?.evaluation || '-',
  'Visual Studio / VSCode': documentData.skillSheet.skills['Visual Studio / VSCode']?.evaluation || '-',
  'Git / SVN': documentData.skillSheet.skills['Git / SVN']?.evaluation || '-',
  'Backlog / Redmine': documentData.skillSheet.skills['Backlog / Redmine']?.evaluation || '-',
  'Notion': documentData.skillSheet.skills['Notion']?.evaluation || '-',
  'AWS': documentData.skillSheet.skills['AWS']?.evaluation || '-',
  'Azure': documentData.skillSheet.skills['Azure']?.evaluation || '-',
  'Google Cloud Platform': documentData.skillSheet.skills['Google Cloud Platform']?.evaluation || '-',
  'IBM Cloud (Bluemix)': documentData.skillSheet.skills['IBM Cloud (Bluemix)']?.evaluation || '-',
  'W3Schools': documentData.skillSheet.skills['W3Schools']?.evaluation || '-',
  'タッチタイピング': documentData.skillSheet.skills['タッチタイピング']?.evaluation || '-',
  'パソコン利用歴': documentData.skillSheet.skills['パソコン利用歴']?.pcUsageYears ? `${documentData.skillSheet.skills['パソコン利用歴'].pcUsageYears}年` : '-'
};

// 各スキル項目の右隣のセルに評価を設定
whiteCells.forEach(cell => {
  const skillName = whiteValues[cell];
  const evaluation = skillEvaluations[skillName];
  
  // 右隣のセルに評価を設定
  const col = cell.charAt(0);
  const row = cell.substring(1);
  const rightCell = String.fromCharCode(col.charCodeAt(0) + 1) + row;
  
  skillsSheet.getCell(rightCell).value = evaluation;
  skillsSheet.getCell(rightCell).font = { name: 'MS Gothic', size: 10, bold: false };
  skillsSheet.getCell(rightCell).alignment = { horizontal: 'center', vertical: 'middle' };
});
      
    
      // Excelファイルをダウンロード
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `履歴書_職務経歴書_スキルシート_${documentData.lastName}${documentData.firstName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "成功",
        description: "Excelファイルが正常に生成されました",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Excel生成エラー:', error);
      toast({
        title: t('common.error'),
        description: t('documents.excelGenerationError'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 既存のgenerateDocuments関数を削除し、新しいgenerateExcelFile関数を使用
  const generateDocuments = generateExcelFile;



  return (
    <div className="space-y-6">
      
      {/* 固定位置の円状完成度メーター */}
      {!isAdminMode && (
        <div className="fixed top-4 right-4 z-50">
          <div className="relative w-16 h-16 bg-white rounded-full shadow-lg border-2 border-blue-200 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${completionRate * 1.131}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-xs font-bold text-blue-600">{completionRate}</div>
              <Percent className="h-3 w-3 text-blue-500" />
            </div>
          </div>
        </div>
      )}
      
      {/* ヘッダー：戻るボタンと言語切り替え */}
      {!isAdminMode && (
        <div className="flex justify-between items-center">
          <Button
            onClick={() => navigate('/jobseeker/my-page')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('documents.backToMyPage')}
          </Button>
          
          {/* 言語切り替えボタン */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-md border border-gray-200">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Language:</span>
            <LanguageToggle />
          </div>
        </div>
      )}
      
      {/* プロフィール完成度表示（管理者モード以外で表示） */}
      {!isAdminMode && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">{t('documents.completionRate')}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
                <div className="text-sm text-blue-600">
                  {completionRate < 30 && "初回入力が必要です"}
                  {completionRate >= 30 && completionRate < 70 && "もう少し頑張りましょう"}
                  {completionRate >= 70 && completionRate < 100 && "ほぼ完成です"}
                  {completionRate === 100 && "完璧です！"}
                </div>
              </div>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="mt-2 text-sm text-blue-700">
              {completionRate < 30 && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{t('documents.completionLow')}</span>
                </div>
              )}
              {completionRate >= 30 && completionRate < 70 && (
                <span>{t('documents.completionMedium')}</span>
              )}
              {completionRate >= 70 && (
                <span>{t('documents.completionHigh')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resume">{t('documents.resume')}</TabsTrigger>
          <TabsTrigger value="workHistory">{t('documents.jobHistory')}</TabsTrigger>
          <TabsTrigger value="skills">{t('documents.skillSheet')}</TabsTrigger>
        </TabsList>

        {/* 履歴書タブ */}
        <TabsContent value="resume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('documents.basicInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('auth.lastName')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.lastName}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('auth.lastNamePlaceholder')}
                    className="h-10"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('documents.firstName')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.firstName}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('documents.firstNamePlaceholder')}
                    className="h-10"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.lastNameKana')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.kanaLastName}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 何でも入力可能（保存時にエラーチェック）
                      setDocumentData(prev => ({ ...prev, kanaLastName: value }));
                    }}
                    placeholder={t('documents.lastNameKanaPlaceholder')}
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('documents.kanaHelp')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('documents.firstNameKana')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.kanaFirstName}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 何でも入力可能（保存時にエラーチェック）
                      setDocumentData(prev => ({ ...prev, kanaFirstName: value }));
                    }}
                    placeholder={t('documents.firstNameKanaPlaceholder')}
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('documents.kanaHelp')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.birthDate')} <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={documentData.birthDate}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="h-10"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('documents.gender')} <span className="text-red-500">*</span></Label>
                  <Select value={documentData.gender} onValueChange={(value) => setDocumentData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('documents.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男性">{t('documents.male')}</SelectItem>
                      <SelectItem value="女性">{t('documents.female')}</SelectItem>
                      <SelectItem value="その他">{t('documents.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('documents.currentAddress')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.postalCode')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.livePostNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (validatePostNumber(value) || value === '') {
                        const formatted = formatPostNumber(value);
                        setDocumentData(prev => ({ ...prev, livePostNumber: formatted }));
                      }
                    }}
                    placeholder={t('documents.postalCodePlaceholder')}
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('documents.postalCodeHelp')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('documents.address')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.liveAddress}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, liveAddress: e.target.value }))}
                    placeholder={t('documents.addressPlaceholder')}
                    className="h-10"
                    required
                  />
                </div>
              </div>
                                <div>
                    <Label className="text-sm font-medium">{t('documents.addressKana')} <span className="text-red-500">*</span></Label>
                    <Input
                      value={documentData.kanaLiveAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 何でも入力可能（保存時にエラーチェック）
                        setDocumentData(prev => ({ ...prev, kanaLiveAddress: value }));
                      }}
                      placeholder={t('documents.addressKanaPlaceholder')}
                      className="h-10"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('documents.addressKanaHelp')}</p>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.phoneNumber')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.livePhoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (validatePhoneNumber(value) || value === '') {
                        const formatted = formatPhoneNumber(value);
                        setDocumentData(prev => ({ ...prev, livePhoneNumber: formatted }));
                      }
                    }}
                    placeholder={t('documents.phoneNumberPlaceholder')}
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('documents.phoneHelp')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('documents.emailAddress')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.liveMail}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, liveMail: e.target.value }))}
                    placeholder={t('documents.emailPlaceholder')}
                    type="email"
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('documents.emailHelp')}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">{t('documents.nationality')} <span className="text-red-500">*</span></Label>
                <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={nationalityOpen}
                      className="h-10 w-full justify-between"
                    >
                      {documentData.nationality
                        ? getNationalityName(documentData.nationality)
                        : t('documents.selectNationality')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder={t('documents.countrySearch')} />
                      <CommandList>
                        <CommandEmpty>{t('documents.noCountriesFound')}</CommandEmpty>
                        <CommandGroup>
                          {UN_MEMBER_COUNTRIES.map((country) => (
                            <CommandItem
                              key={country}
                              value={country}
                              onSelect={(currentValue) => {
                                setDocumentData(prev => ({ 
                                  ...prev, 
                                  nationality: currentValue === documentData.nationality ? "" : currentValue 
                                }));
                                setNationalityOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  documentData.nationality === country ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {getNationalityName(country)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500 mt-1">{t('documents.nationalityHelp')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('documents.contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="contactSameAsLive"
                  checked={documentData.contactSameAsLive}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, contactSameAsLive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="contactSameAsLive" className="text-sm">{t('documents.sameAsCurrentAddress')}</Label>
              </div>
              
              {!documentData.contactSameAsLive && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                                        <Label className="text-sm font-medium">{t('documents.contactPostalCode')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.contactPostNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (validatePostNumber(value) || value === '') {
                        const formatted = formatPostNumber(value);
                        setDocumentData(prev => ({ ...prev, contactPostNumber: formatted }));
                      }
                    }}
                    placeholder={t('documents.contactPostalCodePlaceholder')}
                    className="h-10"
                    required
                  />
                      <p className="text-xs text-gray-500 mt-1">{t('documents.postalCodeFormatHelp')}</p>
                    </div>
                    <div>
                                        <Label className="text-sm font-medium">{t('documents.contactAddress')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={documentData.contactAddress}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, contactAddress: e.target.value }))}
                    placeholder={t('documents.contactAddressPlaceholder')}
                    className="h-10"
                    required
                  />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('documents.contactAddressKana')} <span className="text-red-500">*</span></Label>
                    <Input
                      value={documentData.kanaContactAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 何でも入力可能（保存時にエラーチェック）
                        setDocumentData(prev => ({ ...prev, kanaContactAddress: value }));
                      }}
                      placeholder={t('documents.contactAddressKanaPlaceholder')}
                      className="h-10"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('documents.addressKanaFormatHelp')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{t('documents.contactPhone')} <span className="text-red-500">*</span></Label>
                      <Input
                        value={documentData.contactPhoneNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (validatePhoneNumber(value) || value === '') {
                            const formatted = formatPhoneNumber(value);
                            setDocumentData(prev => ({ ...prev, contactPhoneNumber: formatted }));
                          }
                        }}
                        placeholder={t('documents.contactPhonePlaceholder')}
                        className="h-10"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('documents.phoneFormatHelp')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('documents.contactEmail')} <span className="text-red-500">*</span></Label>
                      <Input
                        value={documentData.contactMail}
                        onChange={(e) => setDocumentData(prev => ({ ...prev, contactMail: e.target.value }))}
                        placeholder={t('documents.contactEmailPlaceholder')}
                        type="email"
                        className="h-10"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">有効なメールアドレスを入力してください（例：example@email.com）</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t('documents.photo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 写真アップロード部分 */}
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    {documentData.resume.photoUrl ? (
                      <div className="relative">
                        <img
                          src={documentData.resume.photoUrl}
                          alt={t('documents.photo')}
                          className="w-32 h-40 object-cover border rounded"
                        />
                        <Button
                          onClick={() => setDocumentData(prev => ({ ...prev, resume: { ...prev.resume, photoUrl: '' } }))}
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-sm">{t('documents.noPhoto')}</span>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button onClick={triggerFileInput} variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        {t('documents.uploadPhoto')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 証明写真の参考 */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 text-center">{t('documents.photoReference')}</h4>
                  <div className="flex justify-center mb-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <img
                          src="/images/reference/male-photo-reference.png"
                          alt={t('documents.maleExample')}
                          className="w-24 h-32 border rounded mb-1 mx-auto bg-white object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-24 h-32 bg-gray-200 border rounded mb-1 flex items-center justify-center hidden mx-auto">
                          <span className="text-xs text-gray-500">{t('documents.maleExample')}</span>
                        </div>
                        <p className="text-xs text-gray-600">{t('documents.maleExample')}</p>
                      </div>
                      <div className="text-center">
                        <img
                          src="/images/reference/female-photo-reference.png"
                          alt={t('documents.femaleExample')}
                          className="w-24 h-32 border rounded mb-1 mx-auto bg-white object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-24 h-32 bg-gray-200 border rounded mb-1 flex items-center justify-center hidden mx-auto">
                          <span className="text-xs text-gray-500">{t('documents.femaleExample')}</span>
                        </div>
                        <p className="text-xs text-gray-600">{t('documents.femaleExample')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-700 leading-relaxed text-center">
                      {t('documents.photoTips')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t('documents.education')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="noEducation"
                  checked={documentData.resume.noEducation}
                  onCheckedChange={(checked) => {
                    console.log('学歴チェックボックス変更:', checked);
                    setDocumentData(prev => ({ 
                      ...prev, 
                      resume: { 
                        ...prev.resume, 
                        noEducation: checked as boolean,
                        // チェックが入った場合は学歴データをクリア
                        education: checked ? [] : prev.resume.education
                      } 
                    }));
                  }}
                />
                <Label htmlFor="noEducation" className="text-sm">
                  {t('documents.noEducationCheck')}
                </Label>
              </div>
              {!documentData.resume.noEducation && (
                <>
                  {documentData.resume.education.map((edu, index) => (
                    <div key={index} className="relative grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded">
                      <Input
                        value={edu.year}
                        onChange={(e) => handleResumeInputChange('education', { year: e.target.value }, index)}
                        placeholder={t('documents.educationYear')}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={edu.month}
                        onChange={(e) => handleResumeInputChange('education', { month: e.target.value }, index)}
                        placeholder={t('documents.educationDuration')}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={edu.content}
                        onChange={(e) => handleResumeInputChange('education', { content: e.target.value }, index)}
                        placeholder={t('documents.educationExample')}
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 p-0 text-xs"
                        onClick={() => removeEducation(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button 
                    onClick={addEducation} 
                    variant="outline" 
                    size="sm"
                    disabled={documentData.resume.noEducation || documentData.resume.education.length + documentData.resume.workExperience.length >= 15}
                  >
                    {t('documents.addEducation')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t('documents.jobHistory')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="noWorkExperience"
                  checked={documentData.resume.noWorkExperience}
                  onCheckedChange={(checked) => {
                    console.log('職歴チェックボックス変更:', checked);
                    setDocumentData(prev => ({ 
                      ...prev, 
                      resume: { 
                        ...prev.resume, 
                        noWorkExperience: checked as boolean,
                        // チェックが入った場合は職歴データをクリア
                        workExperience: checked ? [] : prev.resume.workExperience
                      } 
                    }));
                  }}
                />
                <Label htmlFor="noWorkExperience" className="text-sm">
                  {t('documents.noWorkExperienceCheck')}
                </Label>
              </div>
              {!documentData.resume.noWorkExperience && (
                <>
                  {documentData.resume.workExperience.map((work, index) => (
                    <div key={index} className="relative grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded">
                      <Input
                        value={work.year}
                        onChange={(e) => handleResumeInputChange('workExperience', { year: e.target.value }, index)}
                        placeholder={t('documents.workYear')}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={work.month}
                        onChange={(e) => handleResumeInputChange('workExperience', { month: e.target.value }, index)}
                        placeholder={t('documents.workDuration')}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={work.content}
                        onChange={(e) => handleResumeInputChange('workExperience', { content: e.target.value }, index)}
                                                    placeholder={t('documents.educationPlaceholder')}
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 p-0 text-xs"
                        onClick={() => removeWorkExperience(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button 
                    onClick={addWorkExperience} 
                    variant="outline" 
                    size="sm"
                    disabled={documentData.resume.noWorkExperience || documentData.resume.education.length + documentData.resume.workExperience.length >= 15}
                  >
                    {t('documents.addWorkHistory')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('documents.qualificationsSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="noQualifications"
                  checked={documentData.resume.noQualifications}
                  onCheckedChange={(checked) => {
                    console.log('資格チェックボックス変更:', checked);
                    setDocumentData(prev => ({ 
                      ...prev, 
                      resume: { 
                        ...prev.resume, 
                        noQualifications: checked as boolean,
                        // チェックが入った場合は資格データをクリア
                        qualifications: checked ? [] : prev.resume.qualifications
                      } 
                    }));
                  }}
                />
                <Label htmlFor="noQualifications" className="text-sm">
                  {t('documents.noQualificationsCheck')}
                </Label>
              </div>
              {!documentData.resume.noQualifications && (
                <>
                  {documentData.resume.qualifications.map((qual, index) => (
                    <div key={index} className="relative grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded">
                      <Input
                        value={qual.year}
                        onChange={(e) => handleResumeInputChange('qualifications', { year: e.target.value }, index)}
                        placeholder={t('documents.qualificationYear')}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={qual.month}
                        onChange={(e) => handleResumeInputChange('qualifications', { month: e.target.value }, index)}
                        placeholder={t('documents.qualificationDuration')}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={qual.name}
                        onChange={(e) => handleResumeInputChange('qualifications', { name: e.target.value }, index)}
                        placeholder={t('documents.qualificationExample')}
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 p-0 text-xs"
                        onClick={() => removeQualification(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button 
                    onClick={addQualification} 
                    variant="outline" 
                    size="sm"
                    disabled={documentData.resume.noQualifications || documentData.resume.qualifications.length >= 4}
                  >
                    {t('documents.addQualification')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('documents.additionalInformation')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t('documents.selfPR')} <span className="text-red-500">*</span></Label>
                <Textarea
                  value={documentData.selfIntroduction}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, selfIntroduction: e.target.value }))}
                  placeholder={t('documents.selfPRPlaceholder')}
                  rows={6}
                  className="text-sm"
                  required
                />
                <p className={`text-xs mt-1 ${
                  validateTextLength(documentData.selfIntroduction).isValid 
                    ? 'text-green-600' 
                    : 'text-red-500'
                }`}>
                  {validateTextLength(documentData.selfIntroduction).message}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.spouse')} <span className="text-red-500">*</span></Label>
                  <Select value={documentData.spouse} onValueChange={(value) => setDocumentData(prev => ({ ...prev, spouse: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('documents.spousePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="あり">あり</SelectItem>
                      <SelectItem value="なし">なし</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('documents.spouseSupport')} <span className="text-red-500">*</span></Label>
                  <Select value={documentData.spouseSupport} onValueChange={(value) => setDocumentData(prev => ({ ...prev, spouseSupport: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('documents.spouseSupportPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="あり">あり</SelectItem>
                      <SelectItem value="なし">なし</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t('documents.japaneseQualifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.currentJapaneseQualification')}</Label>
                  <Select value={documentData.certificateStatus.name} onValueChange={(value) => {
                    console.log('日本語資格変更:', value);
                    setDocumentData(prev => ({ 
                      ...prev, 
                      certificateStatus: { 
                        ...prev.certificateStatus, 
                        name: value,
                        // "なし"の場合は取得日を空欄にする
                        date: value === 'なし' ? '' : prev.certificateStatus.date
                      } 
                    }));
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('documents.selectLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="なし">なし</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N5">N5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                                      <Label className="text-sm font-medium">{t('documents.acquisitionDate')}</Label>
                  <Input
                    type="date"
                    value={documentData.certificateStatus.date}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, certificateStatus: { ...prev.certificateStatus, date: e.target.value } }))}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('documents.plannedJapaneseQualification')}</Label>
                  <Select value={documentData.nextJapaneseTestLevel} onValueChange={(value) => setDocumentData(prev => ({ ...prev, nextJapaneseTestLevel: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('documents.selectLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="未定">未定</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N5">N5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                                      <Label className="text-sm font-medium">{t('documents.nextExamDate')}</Label>
                  <Input
                    type="date"
                    value={documentData.nextJapaneseTestDate}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, nextJapaneseTestDate: e.target.value }))}
                    className="h-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('documents.whyJapan')} <span className="text-red-500">*</span></Label>
                <Textarea
                  value={documentData.whyJapan}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, whyJapan: e.target.value }))}
                                      placeholder={t('documents.whyJapan') + t('documents.whyJapanPlaceholder')}
                  rows={6}
                  className="text-sm"
                  required
                />
                <p className={`text-xs mt-1 ${
                  validateTextLength(documentData.whyJapan).isValid 
                    ? 'text-green-600' 
                    : 'text-red-500'
                }`}>
                  {validateTextLength(documentData.whyJapan).message}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('documents.whyInterestJapan')} <span className="text-red-500">*</span></Label>
                <Textarea
                  value={documentData.whyInterestJapan}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, whyInterestJapan: e.target.value }))}
                                      placeholder={t('documents.whyInterestJapan') + t('documents.whyInterestJapanPlaceholder')}
                  rows={6}
                  className="text-sm"
                  required
                />
                <p className={`text-xs mt-1 ${
                  validateTextLength(documentData.whyInterestJapan).isValid 
                    ? 'text-green-600' 
                    : 'text-red-500'
                }`}>
                  {validateTextLength(documentData.whyInterestJapan).message}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('documents.personalPreference')}</Label>
                <Textarea
                  value={documentData.personalPreference}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, personalPreference: e.target.value }))}
                  placeholder={t('documents.personalPreferencePlaceholder')}
                  rows={4}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('documents.personalPreferenceDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 職務経歴書タブ */}
        <TabsContent value="workHistory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('documents.workHistory')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documentData.workHistory.workExperiences.map((work, index) => (
                <div key={index} className="relative space-y-3 p-3 border rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{t('documents.period')}</Label>
                      <Input
                        value={work.period}
                        onChange={(e) => handleWorkHistoryInputChange('workExperiences', { period: e.target.value }, index)}
                                                  placeholder={t('documents.workHistoryPlaceholder')}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                                              <Label className="text-xs">{t('documents.role')}</Label>
                      <Input
                        value={work.role}
                        onChange={(e) => handleWorkHistoryInputChange('workExperiences', { role: e.target.value }, index)}
                        placeholder={t('documents.rolePlaceholder')}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{t('documents.workContent')}</Label>
                    <Textarea
                      value={work.description}
                      onChange={(e) => handleWorkHistoryInputChange('workExperiences', { description: e.target.value }, index)}
                      placeholder={t('documents.workContentPlaceholder')}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('documents.toolsUsed')}</Label>
                    <Textarea
                      value={work.technologies}
                      onChange={(e) => handleWorkHistoryInputChange('workExperiences', { technologies: e.target.value }, index)}
                      placeholder={t('skills.toolsPlaceholder')}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-5 w-5 p-0 text-xs"
                    onClick={() => removeWorkHistoryExperience(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button 
                onClick={addWorkHistoryExperience} 
                variant="outline" 
                size="sm"
                disabled={documentData.workHistory.noWorkHistory}
              >
                {t('documents.addWorkHistory')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                              <CardTitle className="text-base">{t('documents.noWorkExperience')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noWorkHistory"
                  checked={documentData.workHistory.noWorkHistory}
                  onCheckedChange={(checked) => {
                    console.log('職務経歴書チェックボックス変更:', checked);
                    setDocumentData(prev => ({ 
                      ...prev, 
                      workHistory: { 
                        ...prev.workHistory, 
                        noWorkHistory: checked as boolean,
                        // チェックが入った場合は職務経歴データをクリア
                        workExperiences: checked ? [] : prev.workHistory.workExperiences
                      } 
                    }));
                  }}
                />
                <Label htmlFor="noWorkHistory" className="text-sm">
                  {t('documents.noWorkHistory')}
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* スキルシートタブ */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t('documents.skillSheet')}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                                  <span dangerouslySetInnerHTML={{ __html: t('documents.skillLevelGuide') }} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OS・システム */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.os')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['Windows', 'MacOS', 'Linux'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* サーバー・インフラ */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.server')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['Webサーバ（構築、運用）', 'メールサーバ（構築、運用）', 'DBサーバ（構築、運用）', 'DNSサーバ（構築、運用）', 'N/W設計', 'N/W構築', 'N/W調査', 'N/W監視'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* データベース */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.database')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['DB2', 'SQL Server', 'Oracle', 'MySQL', 'PostgreSQL'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* 職種・役割 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.role')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['プログラマ', 'SE', 'リーダー', 'マネージャー'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* プログラミング言語 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.programming')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['C / C++', 'C#', 'VB.NET', 'JAVA', 'JavaScript ', 'PHP', 'Python', 'Ruby', 'Swift', 'Objective-C', 'HTML / HTML5', 'CSS / CSS3', 'R'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{category}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* フレームワーク・ライブラリ */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.framework')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['ASP.NET (Web Forms)', 'ASP.NET (Core) MVC', 'jQuery', 'Bootstrap', 'Tailwind', 'ReactJS', 'VueJS', 'Laravel'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{category}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* 開発工程 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.process')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['要件定義', '外部設計/基本設計', '内部設計/詳細設計', '検証試験', 'セキュリティ試験', '負荷試験'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Officeアプリケーション */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.office')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['MS-WORD', 'MS-EXCEL', 'MS-Access', 'MS-PowerPoint'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* デザイン・グラフィック */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.design')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['Photoshop', 'Illustrator', 'InDesiｇn', 'Dreamweaver', 'Fireworks', 'MAYA', 'Studio Design', 'Figma'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* 開発ツール */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.tools')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['Visual Studio / VSCode', 'Git / SVN', 'Backlog / Redmine', 'Notion'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{category}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* クラウドサービス */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.cloud')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['AWS', 'Azure', 'Google Cloud Platform', 'IBM Cloud (Bluemix)'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{category}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* その他スキル */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.other')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => ['W3Schools', 'タッチタイピング'].includes(category))
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Select value={skill.evaluation} onValueChange={(value) => handleSkillSheetInputChange(category, 'evaluation', value)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* パソコン利用歴 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">{t('skills.category.pc')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(documentData.skillSheet.skills)
                    .filter(([category]) => category === 'パソコン利用歴')
                    .map(([category, skill]) => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium truncate flex-1 mr-2">{getSkillDisplayName(category)}</span>
                      <Input
                        type="number"
                        min="0"
                        value={skill.pcUsageYears || ''}
                        onChange={(e) => handleSkillSheetInputChange(category, 'pcUsageYears', e.target.value)}
                        placeholder={t('skills.yearsPlaceholder')}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* アクションボタン */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* データベース保存ボタン */}
            <Button
              onClick={saveToDatabase}
              disabled={isSaving || (!isAdminMode && !user) || !validateAllTextLengths().isValid}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {isSaving ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('documents.saveToDatabase')}
                </>
              )}
            </Button>
            
            <Button
              onClick={generateExcelFile} 
              disabled={isGenerating || !documentData.lastName || !documentData.firstName || !validateAllTextLengths().isValid}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('documents.generating')}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t('documents.generateResume')}
                </>
              )}
            </Button>
            
            {/* 管理者モードで閉じるボタンを表示 */}
            {isAdminMode && onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                size="lg"
                className="w-full"
              >
                閉じる
              </Button>
            )}
          </div>
          
          {/* 文字数エラーメッセージ */}
          {!validateAllTextLengths().isValid && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">{t('documents.characterLimitError')}</h4>
                  <p className="text-sm text-red-700 mb-2">{t('documents.characterLimitDescription')}</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validateAllTextLengths().errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {!isAdminMode && !user && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              データベース保存にはログインが必要です
            </p>
          )}
          {isAdminMode && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              管理者モード：求職者データを更新します
            </p>
          )}
          {(!documentData.lastName || !documentData.firstName) && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {t('documents.nameRequired')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentGenerator; 