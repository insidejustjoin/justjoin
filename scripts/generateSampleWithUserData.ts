import { google } from 'googleapis';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '1dsdDtCsfXZL_BiXbfhvVUOOkzFn4kjvKoad_6dSQADs';
const SHEET_NAMES = ['履歴書', '職務経歴書', 'スキルシート'];
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const KEYFILE = path.join(__dirname, 'job-match-platform-464305-ff6aeda1c296.json');
const OUTPUT_DIR = path.join(__dirname, '../sample/output');

// サンプルユーザーデータ（実際のUIから入力される想定）
const sampleUserData = {
  // 基本情報
  fullName: '田中 太郎',
  furigana: 'タナカ タロウ',
  dateOfBirth: '1995年 03月 15日生 （満29歳）',
  gender: 'male' as const,
  photo: null, // 実際はbase64画像データ
  address: '東京都渋谷区神南1-1-1',
  phone: '090-1234-5678',
  email: 'tanaka.taro@example.com',
  
  // 学歴
  education: [
    { year: '2014', month: '4', description: '東京大学 工学部 情報工学科 入学' },
    { year: '2018', month: '3', description: '東京大学 工学部 情報工学科 卒業' }
  ],
  
  // 職歴
  workHistory: [
    { 
      year: '2018', 
      month: '4', 
      description: '株式会社テックソリューションズ 入社',
      projectName: 'ECサイト開発プロジェクト',
      period: '2018年4月～2019年3月',
      task: 'フロントエンド開発、API設計、データベース設計',
      role: 'プログラマー',
      technologies: 'React, TypeScript, Node.js, PostgreSQL'
    },
    { 
      year: '2020', 
      month: '4', 
      description: '同社でリーダーとして従事',
      projectName: 'モバイルアプリ開発プロジェクト',
      period: '2020年4月～2021年3月',
      task: 'プロジェクト管理、要件定義、設計、開発',
      role: 'プロジェクトリーダー',
      technologies: 'React Native, TypeScript, AWS, Docker'
    }
  ],
  
  // その他
  commuteTime: '約1時間30分',
  dependents: '3人',
  spouse: '無' as const,
  spouseSupport: '無' as const,
  preferences: 'リモートワーク可能な環境で、技術的なチャレンジができる職場を希望します。',
  selfIntroduction: '大学時代からプログラミングに興味を持ち、現在までWebアプリケーション開発に従事しています。React、TypeScript、Node.jsを中心としたフルスタック開発が得意です。チーム開発での経験も豊富で、リーダーとしてプロジェクトを成功に導いた実績があります。',
  
  // スキルシート
  skills: [
    { category: 'OS', name: 'Windows', level: 'A', years: '8', description: '8年間使用' },
    { category: 'OS', name: 'MacOS', level: 'B', years: '5', description: '5年間使用' },
    { category: '言語', name: 'JavaScript', level: 'A', years: '6', description: '6年間使用' },
    { category: '言語', name: 'TypeScript', level: 'A', years: '4', description: '4年間使用' },
    { category: '言語', name: 'Python', level: 'B', years: '3', description: '3年間使用' },
    { category: 'フレームワーク', name: 'React', level: 'A', years: '5', description: '5年間使用' },
    { category: 'フレームワーク', name: 'React Native', level: 'B', years: '2', description: '2年間使用' },
    { category: 'DB', name: 'PostgreSQL', level: 'B', years: '4', description: '4年間使用' },
    { category: 'ツール', name: 'Git', level: 'A', years: '6', description: '6年間使用' },
    { category: '職種', name: 'プログラマ', level: 'A', years: '6', description: '6年間使用' },
    { category: '職種', name: 'リーダー', level: 'B', years: '2', description: '2年間使用' },
    { category: '業務', name: '要件定義', level: 'B', years: '3', description: '3年間使用' },
    { category: '業務', name: '外部設計/基本設計', level: 'B', years: '3', description: '3年間使用' },
    { category: '業務', name: '内部設計/詳細設計', level: 'A', years: '5', description: '5年間使用' },
    { category: '業務', name: '検証試験', level: 'B', years: '4', description: '4年間使用' }
  ],
  
  computerExperience: '8年',
  qualifications: ['基本情報技術者', '応用情報技術者', 'AWS認定ソリューションアーキテクト']
};

// 変数セルの位置情報（variableMapping.tsから取得）
const VARIABLE_CELLS = [
  // 履歴書の変数セル（主要なもののみ）
  { sheet: '履歴書', row: 3, col: 3, address: 'C3', type: 'furigana', description: 'フリガナ' },
  { sheet: '履歴書', row: 4, col: 3, address: 'C4', type: 'fullName', description: '氏名（英語）' },
  { sheet: '履歴書', row: 6, col: 3, address: 'C6', type: 'dateOfBirth', description: '生年月日' },
  { sheet: '履歴書', row: 9, col: 2, address: 'B9', type: 'address', description: '住所' },
  { sheet: '履歴書', row: 11, col: 4, address: 'D11', type: 'phone', description: '電話番号' },
  { sheet: '履歴書', row: 12, col: 4, address: 'D12', type: 'email', description: 'メールアドレス' },
  { sheet: '履歴書', row: 11, col: 7, address: 'G11', type: 'selfIntroduction', description: '自己PR・備考' },
  { sheet: '履歴書', row: 25, col: 11, address: 'K25', type: 'commuteTime', description: '通勤時間' },
  { sheet: '履歴書', row: 25, col: 13, address: 'M25', type: 'dependents', description: '扶養家族数' },
  { sheet: '履歴書', row: 25, col: 14, address: 'N25', type: 'spouse', description: '配偶者' },
  { sheet: '履歴書', row: 25, col: 15, address: 'O25', type: 'spouseSupport', description: '配偶者の扶養義務' },
  { sheet: '履歴書', row: 26, col: 2, address: 'B26', type: 'preferences', description: '本人希望記入欄' }
];

async function fetchSheetData(sheets: any, sheetName: string) {
  console.log(`📊 ${sheetName}シートのデータを取得中...`);
  
  // セル値取得
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: sheetName,
  });
  const values = res.data.values || [];

  // セル結合・書式情報取得
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    ranges: [sheetName],
    includeGridData: true,
  });
  const merges = meta.data.sheets?.[0]?.merges || [];
  const gridData = meta.data.sheets?.[0]?.data?.[0];

  return { values, merges, gridData };
}

// ユーザーデータをセル値に埋め込む
function fillUserData(values: any[][], userData: any): any[][] {
  const filledValues = values.map(row => [...row]); // ディープコピー
  
  VARIABLE_CELLS.forEach(cell => {
    if (cell.sheet === '履歴書') {
      const rowIndex = cell.row - 1;
      const colIndex = cell.col - 1;
      
      if (filledValues[rowIndex] && filledValues[rowIndex][colIndex] !== undefined) {
        switch (cell.type) {
          case 'furigana':
            if (cell.address === 'C3') filledValues[rowIndex][colIndex] = userData.furigana;
            break;
          case 'fullName':
            filledValues[rowIndex][colIndex] = userData.fullName;
            break;
          case 'dateOfBirth':
            filledValues[rowIndex][colIndex] = userData.dateOfBirth;
            break;
          case 'address':
            filledValues[rowIndex][colIndex] = userData.address;
            break;
          case 'phone':
            filledValues[rowIndex][colIndex] = userData.phone;
            break;
          case 'email':
            filledValues[rowIndex][colIndex] = userData.email;
            break;
          case 'selfIntroduction':
            filledValues[rowIndex][colIndex] = userData.selfIntroduction;
            break;
          case 'commuteTime':
            filledValues[rowIndex][colIndex] = userData.commuteTime;
            break;
          case 'dependents':
            filledValues[rowIndex][colIndex] = userData.dependents;
            break;
          case 'spouse':
            filledValues[rowIndex][colIndex] = userData.spouse;
            break;
          case 'spouseSupport':
            filledValues[rowIndex][colIndex] = userData.spouseSupport;
            break;
          case 'preferences':
            filledValues[rowIndex][colIndex] = userData.preferences;
            break;
        }
      }
    }
  });
  
  // 学歴・職歴の動的追加
  const educationStartRow = 17;
  const workHistoryStartRow = 20;
  
  // 学歴を埋め込む
  userData.education.forEach((edu: any, index: number) => {
    const rowIndex = educationStartRow + index;
    if (filledValues[rowIndex]) {
      filledValues[rowIndex][1] = edu.year; // B列
      filledValues[rowIndex][2] = edu.month; // C列
      filledValues[rowIndex][3] = edu.description; // D列
    }
  });
  
  // 職歴を埋め込む
  userData.workHistory.forEach((work: any, index: number) => {
    const rowIndex = workHistoryStartRow + index * 2; // 職歴は2行で1セット
    if (filledValues[rowIndex]) {
      filledValues[rowIndex][1] = work.year; // B列
      filledValues[rowIndex][2] = work.month; // C列
      filledValues[rowIndex][3] = work.description; // D列
    }
  });
  
  return filledValues;
}

async function createWorksheet(workbook: ExcelJS.Workbook, sheetName: string, data: any, userData: any) {
  const { values, merges, gridData } = data;
  const worksheet = workbook.addWorksheet(sheetName);

  // ユーザーデータを埋め込む
  const filledValues = fillUserData(values, userData);

  // 列幅設定（gridDataから取得）
  if (gridData?.columnMetadata) {
    gridData.columnMetadata.forEach((col: any, index: number) => {
      if (col.pixelSize) {
        const colLetter = String.fromCharCode(65 + index);
        worksheet.getColumn(colLetter).width = col.pixelSize / 7;
      }
    });
  } else {
    // フォールバック: デフォルト列幅
    const columnWidths = {
      'A': 3, 'B': 15, 'C': 25, 'D': 35, 'E': 8, 'F': 8, 'G': 12,
      'H': 3, 'I': 3, 'J': 15, 'K': 8, 'L': 15, 'M': 8, 'N': 15,
      'O': 3, 'P': 3, 'Q': 3, 'R': 3, 'S': 3, 'T': 3, 'U': 3,
      'V': 3, 'W': 3, 'X': 3, 'Y': 3, 'Z': 3
    };
    Object.keys(columnWidths).forEach(col => {
      worksheet.getColumn(col).width = columnWidths[col];
    });
  }

  // 行高設定
  for (let i = 1; i <= filledValues.length; i++) {
    worksheet.getRow(i).height = 20;
  }

  // セル値設定（ユーザーデータ埋め込み済み）
  filledValues.forEach((rowData: any[], rowIndex: number) => {
    const row = worksheet.getRow(rowIndex + 1);
    rowData.forEach((cellValue, colIndex) => {
      if (cellValue !== undefined && cellValue !== '') {
        const cell = row.getCell(colIndex + 1);
        cell.value = cellValue;
        
        // スタイル設定
        cell.font = { 
          name: 'MS Gothic', 
          size: rowIndex === 1 ? 14 : 10,
          bold: rowIndex === 1 
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: rowIndex === 1 ? 'center' : 'left',
          wrapText: true 
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  // セル結合設定
  merges.forEach((merge: any) => {
    const startCell = worksheet.getCell(merge.startRowIndex + 1, merge.startColumnIndex + 1);
    const endCell = worksheet.getCell(merge.endRowIndex, merge.endColumnIndex);
    worksheet.mergeCells(startCell.address + ':' + endCell.address);
  });

  console.log(`✅ ${sheetName}シート作成完了 (ユーザーデータ埋め込み済み)`);
}

async function main() {
  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Google Sheets API認証
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // ワークブック作成
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Whoami Inc.';
  workbook.lastModifiedBy = 'Google Sheets API + User Data';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 各シートのデータを取得してワークシート作成（ユーザーデータ埋め込み）
  for (const sheetName of SHEET_NAMES) {
    try {
      const data = await fetchSheetData(sheets, sheetName);
      await createWorksheet(workbook, sheetName, data, sampleUserData);
    } catch (error) {
      console.error(`❌ ${sheetName}シートの処理でエラー:`, error);
    }
  }

  // ファイル出力
  const outputPath = path.join(OUTPUT_DIR, `${sampleUserData.fullName}_履歴書_スキルシート_職務経歴書_サンプル版.xlsx`);
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`\n🎉 サンプルユーザーデータ埋め込み版Excelファイルを生成しました: ${outputPath}`);
  console.log(`📁 出力先: ${OUTPUT_DIR}`);
  console.log(`👤 サンプルユーザー: ${sampleUserData.fullName}`);
  console.log(`📊 シート数: ${workbook.worksheets.length}`);
  console.log(`💡 このファイルは実際のユーザー入力データをテンプレートに埋め込んだサンプルです`);
}

main().catch(console.error); 