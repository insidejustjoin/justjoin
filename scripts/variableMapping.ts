import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '1dsdDtCsfXZL_BiXbfhvVUOOkzFn4kjvKoad_6dSQADs';
const SHEET_NAMES = ['履歴書', '職務経歴書', 'スキルシート'];
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const KEYFILE = path.join(__dirname, 'job-match-platform-464305-ff6aeda1c296.json');
const OUTPUT_DIR = path.join(__dirname, '../sample/output');

// 変数判定ロジック（generateExcelWithVariableHighlight.tsと同じ）
function isVariableCell(cellValue: string, rowIndex: number, colIndex: number): boolean {
  if (!cellValue || cellValue.trim() === '') return false;
  
  const value = cellValue.trim();
  
  // 明らかに固定値のラベル
  const fixedLabels = [
    '履歴書', 'フリガナ', '氏名', '生年月日', '現住所', '電話', 'E-mail',
    '学歴', '職歴', '以上', '通勤時間', '扶養家族', '配偶者', '配偶者の扶養義務',
    '本人希望記入欄', '年', '月', '免許・資格', 'photo', '男・女', '有・無'
  ];
  
  if (fixedLabels.some(label => value.includes(label))) return false;
  
  // 変数と判定するパターン
  const variablePatterns = [
    // 人名（英語・日本語）
    /^[A-Za-z\s]+$/, // 英語名
    /^[ぁ-んァ-ン一-龯\s]+$/, // 日本語名（ひらがな・カタカナ・漢字）
    
    // 住所
    /^[A-Za-z\s,]+$/, // 英語住所
    /^[ぁ-んァ-ン一-龯\s０-９]+$/, // 日本語住所
    
    // 日付
    /^\d{4}年\s*\d{1,2}月\s*\d{1,2}日生/, // 生年月日形式
    
    // 電話番号・メール
    /^[\d\-]+$/, // 電話番号
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // メールアドレス
    
    // 学校名・会社名
    /University/, /School/, /Company/, /株式会社/, /大学/, /学科/,
    
    // 自己PR・備考
    /^.{50,}$/, // 長文（50文字以上）
    
    // 具体的な値（サンプルから）
    'Sardor Abudrkayumov',
    'サリドル　アブドゥルカユモフ',
    '２００３年　　０１月　　２４日生　（満２１歳）',
    'Uzbekistan, Tashkent, Olmazor District, Urazboyev Street 10',
    'Westminster International University in Tashkent, BIS学科　入学',
    'Westminster International University in Tashkent, BIS学科　卒業',
    'Mars IT School (Uzbekistan, Tashkent) 入社',
    '先生として従事',
    '同じ会社のIT部門でモバイルソフトエンジニアとして働き、現在に至る',
    '約　　　時間　　　分',
    '５人',
    '日本育ちで８年ぐらい日本で住んで小学校２年生までそこで学びました。話す事なら普通に話せると思います。仕事については一二歳の時からコードィングしています。初めはC++でPCアプリ作りました、その後はJavaでモバイルアプリとか作ってみました。そして今はFlutterでモバイルアプリを書いています。大学ではC#.NETでアプリとかUnityでゲームとか作っていました。'
  ];
  
  return variablePatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return value.includes(pattern);
    }
    return pattern.test(value);
  });
}

// 変数セルの種類を判定
function getVariableType(cellValue: string, rowIndex: number, colIndex: number): string {
  const value = cellValue.trim();
  
  // 英語名
  if (/^[A-Za-z\s]+$/.test(value)) return 'fullName';
  
  // 日本語名（フリガナ）
  if (/^[ぁ-んァ-ン一-龯\s]+$/.test(value) && value.length < 20) return 'furigana';
  
  // 生年月日
  if (/^\d{4}年\s*\d{1,2}月\s*\d{1,2}日生/.test(value)) return 'dateOfBirth';
  
  // 住所
  if (/^[A-Za-z\s,]+$/.test(value) || /^[ぁ-んァ-ン一-龯\s０-９]+$/.test(value)) return 'address';
  
  // 電話番号
  if (/^[\d\-]+$/.test(value)) return 'phone';
  
  // メールアドレス
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  
  // 学歴・職歴
  if (value.includes('入学') || value.includes('卒業') || value.includes('入社')) return 'educationWorkHistory';
  
  // 自己PR
  if (value.length > 50) return 'selfIntroduction';
  
  // 通勤時間
  if (value.includes('時間') && value.includes('分')) return 'commuteTime';
  
  // 扶養家族数
  if (value.includes('人')) return 'dependents';
  
  // その他
  return 'other';
}

async function fetchSheetData(sheets: any, sheetName: string) {
  console.log(`📊 ${sheetName}シートのデータを取得中...`);
  
  // セル値取得
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: sheetName,
  });
  const values = res.data.values || [];

  return { values };
}

async function analyzeVariables(sheetName: string, data: any) {
  const { values } = data;
  const variables: any[] = [];
  
  values.forEach((rowData: any[], rowIndex: number) => {
    rowData.forEach((cellValue, colIndex) => {
      if (isVariableCell(cellValue, rowIndex, colIndex)) {
        const variableType = getVariableType(cellValue, rowIndex, colIndex);
        variables.push({
          sheet: sheetName,
          row: rowIndex + 1,
          col: colIndex + 1,
          address: `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`,
          value: cellValue,
          type: variableType,
          description: getVariableDescription(variableType, cellValue)
        });
      }
    });
  });
  
  return variables;
}

function getVariableDescription(type: string, value: string): string {
  switch (type) {
    case 'fullName': return '氏名（英語）';
    case 'furigana': return 'フリガナ';
    case 'dateOfBirth': return '生年月日';
    case 'address': return '住所';
    case 'phone': return '電話番号';
    case 'email': return 'メールアドレス';
    case 'educationWorkHistory': return '学歴・職歴';
    case 'selfIntroduction': return '自己PR・備考';
    case 'commuteTime': return '通勤時間';
    case 'dependents': return '扶養家族数';
    default: return 'その他';
  }
}

async function main() {
  // Google Sheets API認証
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const allVariables: any[] = [];

  // 各シートの変数を分析
  for (const sheetName of SHEET_NAMES) {
    try {
      const data = await fetchSheetData(sheets, sheetName);
      const variables = await analyzeVariables(sheetName, data);
      allVariables.push(...variables);
      console.log(`✅ ${sheetName}: ${variables.length}個の変数セルを検出`);
    } catch (error) {
      console.error(`❌ ${sheetName}シートの処理でエラー:`, error);
    }
  }

  // TypeScript型定義を生成
  const typeDefinition = `
// 履歴書・職務経歴書・スキルシートの変数型定義
export interface ResumeVariables {
  // 基本情報
  fullName?: string;           // 氏名（英語）
  furigana?: string;           // フリガナ
  dateOfBirth?: string;        // 生年月日
  gender?: 'male' | 'female';  // 性別
  photo?: string;              // 顔写真（base64）
  address?: string;            // 住所
  phone?: string;              // 電話番号
  email?: string;              // メールアドレス
  
  // 学歴・職歴
  education?: Array<{
    year: string;
    month: string;
    description: string;
  }>;
  workHistory?: Array<{
    year: string;
    month: string;
    description: string;
    projectName?: string;
    period?: string;
    task?: string;
    role?: string;
    technologies?: string;
  }>;
  
  // その他
  commuteTime?: string;        // 通勤時間
  dependents?: string;         // 扶養家族数
  spouse?: '有' | '無';        // 配偶者
  spouseSupport?: '有' | '無'; // 配偶者の扶養義務
  preferences?: string;        // 本人希望記入欄
  selfIntroduction?: string;   // 自己PR・備考
  
  // スキルシート
  skills?: Array<{
    category: string;
    name: string;
    level: 'A' | 'B' | 'C' | 'D' | 'none';
    years?: string;
    description?: string;
  }>;
  computerExperience?: string; // パソコン利用歴
  qualifications?: string[];   // 免許・資格
}

// 変数セルの位置情報
export interface VariableCell {
  sheet: string;               // シート名
  row: number;                 // 行番号
  col: number;                 // 列番号
  address: string;             // セルアドレス（A1形式）
  value: string;               // サンプル値
  type: string;                // 変数タイプ
  description: string;         // 説明
}

// 検出された変数セル一覧
export const VARIABLE_CELLS: VariableCell[] = ${JSON.stringify(allVariables, null, 2)};
`;

  // 変数マッピングファイルを出力
  const mappingPath = path.join(OUTPUT_DIR, 'variableMapping.ts');
  fs.writeFileSync(mappingPath, typeDefinition);
  
  console.log(`\n🎉 変数マッピングファイルを生成しました: ${mappingPath}`);
  console.log(`📊 総変数セル数: ${allVariables.length}`);
  console.log(`📋 シート別変数数:`);
  
  const sheetCounts = allVariables.reduce((acc, v) => {
    acc[v.sheet] = (acc[v.sheet] || 0) + 1;
    return acc;
  }, {} as any);
  
  Object.entries(sheetCounts).forEach(([sheet, count]) => {
    console.log(`   ${sheet}: ${count}個`);
  });
  
  console.log(`\n💡 使用方法:`);
  console.log(`   1. variableMapping.tsをsrc/types/にコピー`);
  console.log(`   2. DocumentGenerator.tsxでResumeVariables型を使用`);
  console.log(`   3. VARIABLE_CELLS配列で変数セルの位置を参照`);
}

main().catch(console.error); 