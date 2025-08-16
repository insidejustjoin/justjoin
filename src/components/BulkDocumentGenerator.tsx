import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

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
  nationality: string;
  
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
        evaluation: string;
        pcUsageYears?: string;
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

interface BulkDocumentGeneratorProps {
  // 一括作成用のプロパティ
  selectedJobSeekers: {
    id: string;
    user_id: string;
    fullName?: string;
    full_name?: string;
    email?: string;
    user_email?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    spouse?: string;
    spouse_support?: string;
    self_introduction?: string;
    kana_last_name?: string;
    kana_first_name?: string;
  }[];
  onClose: () => void;
  onComplete: () => void;
}



const BulkDocumentGenerator: React.FC<BulkDocumentGeneratorProps> = ({ 
  selectedJobSeekers, 
  onClose,
  onComplete
}) => {

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
      selfPR: '',
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
  const [progress, setProgress] = useState(0);
  const [currentJobSeeker, setCurrentJobSeeker] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<{[key: string]: Blob}>({});
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();



  // 一括作成用の関数
  const generateBulkDocuments = async () => {
    if (selectedJobSeekers.length === 0) {
      toast({
        title: "エラー",
        description: "選択された求職者がいません",
        variant: "destructive"
      });
      return;
    }

    console.log('=== 一括書類生成開始 ===');
    console.log('selectedJobSeekers:', selectedJobSeekers);
    selectedJobSeekers.forEach((js, index) => {
      console.log(`${index + 1}. ID: ${js.id}, user_id: ${js.user_id}, fullName: ${js.fullName}, full_name: ${js.full_name}`);
    });

    setIsGenerating(true);
    setProgress(0);
    setErrors([]);
    setGeneratedFiles({});

    try {
      const totalSteps = selectedJobSeekers.length;
      let currentStep = 0;
      const localGeneratedFiles: {[key: string]: Blob} = {};

      for (const jobSeeker of selectedJobSeekers) {
        console.log('現在の求職者データ:', jobSeeker);
        const currentName = jobSeeker.fullName || jobSeeker.full_name || `ID: ${jobSeeker.id}`;
        console.log('設定される名前:', currentName);
        setCurrentJobSeeker(currentName);
        
        try {
          // 選択された求職者のデータを取得
          const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://justjoin.jp';
          const apiUserId = jobSeeker.user_id || jobSeeker.id;
          const response = await fetch(`${apiUrl}/api/documents/${apiUserId}`);
          
          let documentData = null;
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              documentData = result.data.document_data || result.data;
            }
          }
          
          // データが取得できない場合は、求職者の基本情報から基本データを作成
          if (!documentData) {
            documentData = {
              lastName: jobSeeker.fullName?.split(' ')[0] || jobSeeker.full_name?.split(' ')[0] || '',
              firstName: jobSeeker.fullName?.split(' ').slice(1).join(' ') || jobSeeker.full_name?.split(' ').slice(1).join(' ') || '',
              kanaLastName: jobSeeker.kana_last_name || '',
              kanaFirstName: jobSeeker.kana_first_name || '',
              birthDate: jobSeeker.date_of_birth || '2000-01-01',
              gender: jobSeeker.gender === 'male' ? '男性' : jobSeeker.gender === 'female' ? '女性' : 'その他',
              livePostNumber: '',
              liveAddress: jobSeeker.address || '',
              kanaLiveAddress: '',
              livePhoneNumber: jobSeeker.phone || '',
              liveMail: jobSeeker.email || jobSeeker.user_email || '',
              contactPostNumber: '',
              contactAddress: '',
              kanaContactAddress: '',
              contactPhoneNumber: '',
              contactMail: '',
              contactSameAsLive: true,
              nationality: jobSeeker.nationality || '',
              resume: {
                photoUrl: '',
                education: [{ year: '', month: '', content: '' }],
                workExperience: [{ year: '', month: '', content: '' }],
                qualifications: [{ year: '', month: '', name: '' }],
                skills: [{ category: '', level: '' }],
                selfPR: jobSeeker.self_introduction || '自己紹介が入力されていません。',
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
                  'Linux': { level: '', experience: '', projects: '', evaluation: '-' }
                }
              },
              selfIntroduction: jobSeeker.self_introduction || '自己紹介が入力されていません。',
              personalPreference: '',
              spouse: jobSeeker.spouse || '',
              spouseSupport: jobSeeker.spouse_support || '',
              certificateStatus: {
                date: '',
                name: 'なし'
              },
              nextJapaneseTestDate: '',
              nextJapaneseTestLevel: '',
              whyJapan: '',
              whyInterestJapan: ''
            };
          }
          
          // Excelファイルを生成（DocumentGenerator.tsxの内容を完全に踏襲）
          console.log(`求職者ID ${jobSeeker.id} のExcelファイル生成開始...`);
          const blob = await generateExcelFile(jobSeeker.id, documentData);
          
          // ローカル変数に保存
          if (blob) {
            console.log(`求職者ID ${jobSeeker.id} のExcelファイル生成成功 - サイズ: ${blob.size} bytes`);
            localGeneratedFiles[jobSeeker.id] = blob;
          } else {
            console.error(`求職者ID ${jobSeeker.id} のExcelファイル生成失敗 - blobがnull`);
          }
          
        } catch (error) {
          console.error(`求職者ID ${jobSeeker.id} の処理でエラー:`, error);
          setErrors(prev => [...prev, `求職者 ${jobSeeker.fullName || jobSeeker.full_name || jobSeeker.id} の処理でエラーが発生しました: ${error}`]);
        }
        
        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // 完了後、ローカル変数をステートに設定
      setGeneratedFiles(localGeneratedFiles);
      
      console.log('=== 一括生成完了 ===');
      console.log('生成されたファイル数:', Object.keys(localGeneratedFiles).length);
      console.log('生成されたファイル:', Object.keys(localGeneratedFiles));
      console.log('エラー数:', errors.length);
      
      const successCount = Object.keys(localGeneratedFiles).length;
      const errorCount = errors.length;
      
      if (successCount > 0) {
        // 生成されたファイルがある場合はZIPダウンロード
        await downloadBulkDocuments(localGeneratedFiles);
        
        toast({
          title: "完了",
          description: `${successCount}件の書類を生成しました。${errorCount > 0 ? `（${errorCount}件でエラーが発生）` : ''}`,
        });
      } else {
        toast({
          title: "エラー",
          description: "書類の生成に失敗しました",
          variant: "destructive"
        });
      }
      
      onComplete();
      
    } catch (error) {
      console.error('一括生成エラー:', error);
      toast({
        title: "エラー",
        description: "一括生成でエラーが発生しました",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 一括ダウンロード用の関数
  const downloadBulkDocuments = async (files: {[key: string]: Blob}) => {
    try {
      console.log('ZIP作成開始 - ファイル数:', Object.keys(files).length);
      console.log('selectedJobSeekers:', selectedJobSeekers);
      
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // 生成されたファイルをZIPに追加
      for (const [jobSeekerId, blob] of Object.entries(files)) {
        console.log(`ZIPに追加: 求職者ID ${jobSeekerId}, ファイルサイズ: ${blob.size} bytes`);
        console.log('検索対象のjobSeekerId:', jobSeekerId);
        console.log('selectedJobSeekersの内容:', selectedJobSeekers.map(js => ({ id: js.id, user_id: js.user_id, fullName: js.fullName, full_name: js.full_name })));
        
        // jobSeekerIdが数値の場合は文字列に変換して比較
        const jobSeekerIdStr = String(jobSeekerId);
        const jobSeeker = selectedJobSeekers.find(js => String(js.id) === jobSeekerIdStr || String(js.user_id) === jobSeekerIdStr);
        console.log('見つかった求職者:', jobSeeker);
        // 求職者の名前を取得（姓+名の形式）
        let fullName = '';
        if (jobSeeker) {
          console.log('=== ファイル名生成デバッグ ===');
          console.log('jobSeeker:', jobSeeker);
          console.log('jobSeeker.fullName:', jobSeeker.fullName);
          console.log('jobSeeker.full_name:', jobSeeker.full_name);
          console.log('jobSeeker.kana_last_name:', jobSeeker.kana_last_name);
          console.log('jobSeeker.kana_first_name:', jobSeeker.kana_first_name);
          
          // より柔軟な名前取得ロジック
          if (jobSeeker.fullName && jobSeeker.fullName.trim()) {
            fullName = jobSeeker.fullName.trim();
          } else if (jobSeeker.full_name && jobSeeker.full_name.trim()) {
            fullName = jobSeeker.full_name.trim();
          } else if (jobSeeker.kana_last_name && jobSeeker.kana_first_name) {
            fullName = `${jobSeeker.kana_last_name.trim()} ${jobSeeker.kana_first_name.trim()}`;
          } else if (jobSeeker.kana_last_name) {
            fullName = jobSeeker.kana_last_name.trim();
          } else if (jobSeeker.kana_first_name) {
            fullName = jobSeeker.kana_first_name.trim();
          }
          
          console.log('最終的なfullName:', fullName);
        } else {
          console.log('❌ 求職者が見つかりませんでした！');
          console.log('jobSeekerId:', jobSeekerId);
          console.log('selectedJobSeekers:', selectedJobSeekers);
        }
        
        // ファイル名を生成（名前が取得できない場合はIDを使用）
        const fileName = fullName ? `${fullName}_履歴書_職務経歴書_スキルシート.xlsx` : `求職者_${jobSeekerId}_履歴書_職務経歴書_スキルシート.xlsx`;
        console.log('生成されたファイル名:', fileName);
        zip.file(fileName, blob);
      }
      
      console.log('ZIPファイル生成中...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('ZIPファイル生成完了 - サイズ:', zipBlob.size, 'bytes');
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `求職者書類_一括生成_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "ダウンロード完了", description: "ZIPファイルのダウンロードが完了しました" });
    } catch (error) {
      console.error('ZIPダウンロードエラー:', error);
      setErrors(prev => [...prev, `ZIPファイルのダウンロードでエラーが発生しました: ${error}`]);
    }
  };



  // フロントエンドだけでExcelファイルを生成する関数
  const generateExcelFile = async (jobSeekerId: string, documentData: any) => {
    try {
      
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
        
    
      // ExcelファイルをBlobとして保存（個別ダウンロードは行わない）
      console.log(`求職者ID ${jobSeekerId} のExcelファイル生成中...`);
      const buffer = await workbook.xlsx.writeBuffer();
      console.log(`求職者ID ${jobSeekerId} のbuffer生成完了 - サイズ: ${buffer.byteLength} bytes`);
      
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      console.log(`求職者ID ${jobSeekerId} のblob生成完了 - サイズ: ${blob.size} bytes, タイプ: ${blob.type}`);
      
      // Blobの内容を確認
      if (blob.size === 0) {
        console.error(`求職者ID ${jobSeekerId} のblobサイズが0です`);
        return null;
      }
      
      console.log(`求職者ID ${jobSeekerId} のExcelファイルを生成しました`);
      
      // Blobを返す
      return blob;
      
    } catch (error) {
      console.error('Excel生成エラー:', error);
      toast({
        title: "エラー",
        description: "Excelファイルの生成に失敗しました",
        variant: "destructive",
      });
      return null;
    }
  };






  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">一括書類生成</h3>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            閉じる
          </Button>
              </div>
        
        {/* 選択された求職者数 */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            選択された求職者: {selectedJobSeekers.length}名
          </p>
            </div>
            
        {/* 一括生成ボタン */}
            <div className="mb-4">
          <Button
            onClick={generateBulkDocuments}
            disabled={isGenerating || selectedJobSeekers.length === 0}
            className="w-full"
          >
            {isGenerating ? '生成中...' : '一括書類生成開始'}
          </Button>
            </div>

            {/* 進捗表示 */}
            {isGenerating && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">進捗</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
              </div>
            {currentJobSeeker && (
              <p className="text-sm text-gray-600 mt-2">
                処理中: {currentJobSeeker}
              </p>
            )}
            </div>
        )}
        
        {/* エラー表示 */}
        {errors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-600 mb-2">エラー</h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
              </div>
                    </div>
        )}
        
        {/* 生成完了メッセージ */}
        {!isGenerating && Object.keys(generatedFiles).length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              {Object.keys(generatedFiles).length}件の書類が生成されました。
              ZIPファイルのダウンロードが自動的に開始されます。
            </div>
                </div>
                )}
        {/* 完了メッセージ */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-blue-700">
              一括書類生成が完了しました
          </div>
                </div>
        </div>
      </div>
    </div>
  );
};


export default BulkDocumentGenerator; 