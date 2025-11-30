import { google } from 'googleapis';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '1dsdDtCsfXZL_BiXbfhvVUOOkzFn4kjvKoad_6dSQADs';
const SHEET_NAMES = ['履歴書', '職務経歴書', 'スキルシート'];
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const KEYFILE = path.join(__dirname, 'job-match-platform-464305-ff6aeda1c296.json');
const OUTPUT_DIR = path.join(__dirname, '../sample/output');

// 変数判定ロジック
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

async function createWorksheet(workbook: ExcelJS.Workbook, sheetName: string, data: any) {
  const { values, merges, gridData } = data;
  const worksheet = workbook.addWorksheet(sheetName);

  // 列幅設定（gridDataから取得）
  if (gridData?.columnMetadata) {
    gridData.columnMetadata.forEach((col: any, index: number) => {
      if (col.pixelSize) {
        const colLetter = String.fromCharCode(65 + index); // A, B, C...
        worksheet.getColumn(colLetter).width = col.pixelSize / 7; // ピクセルをExcelの幅に変換
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

  // 行高設定（gridDataから取得）
  if (gridData?.rowMetadata) {
    gridData.rowMetadata.forEach((row: any, index: number) => {
      if (row.pixelSize) {
        worksheet.getRow(index + 1).height = row.pixelSize * 0.75; // ピクセルをポイントに変換
      } else {
        worksheet.getRow(index + 1).height = 20;
      }
    });
  } else {
    // フォールバック: デフォルト行高
    for (let i = 1; i <= values.length; i++) {
      worksheet.getRow(i).height = 20;
    }
  }

  // セル値設定（テンプレートJSONから忠実に再現）
  values.forEach((rowData: any[], rowIndex: number) => {
    const row = worksheet.getRow(rowIndex + 1);
    rowData.forEach((cellValue, colIndex) => {
      if (cellValue !== undefined && cellValue !== '') {
        const cell = row.getCell(colIndex + 1);
        cell.value = cellValue;
        
        // 変数判定
        const isVariable = isVariableCell(cellValue, rowIndex, colIndex);
        
        // スタイル設定（サンプルに合わせて）
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
        
        // 罫線設定（gridDataから取得）
        if (gridData?.rowData?.[rowIndex]?.values?.[colIndex]?.userEnteredFormat?.borders) {
          const borders = gridData.rowData[rowIndex].values[colIndex].userEnteredFormat.borders;
          cell.border = {
            top: borders.top ? { style: borders.top.style, color: { argb: borders.top.color?.rgbColor?.hex || 'FF000000' } } : undefined,
            left: borders.left ? { style: borders.left.style, color: { argb: borders.left.color?.rgbColor?.hex || 'FF000000' } } : undefined,
            bottom: borders.bottom ? { style: borders.bottom.style, color: { argb: borders.bottom.color?.rgbColor?.hex || 'FF000000' } } : undefined,
            right: borders.right ? { style: borders.right.style, color: { argb: borders.right.color?.rgbColor?.hex || 'FF000000' } } : undefined
          };
        } else {
          // フォールバック: デフォルト罫線
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        
        // 変数セルに背景色を設定
        if (isVariable) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2EFFF' } // #e2efff
          };
        }
        
        // 背景色設定（gridDataから取得）
        if (gridData?.rowData?.[rowIndex]?.values?.[colIndex]?.userEnteredFormat?.backgroundColor) {
          const bgColor = gridData.rowData[rowIndex].values[colIndex].userEnteredFormat.backgroundColor;
          if (bgColor.rgbColor?.hex && !isVariable) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF' + bgColor.rgbColor.hex }
            };
          }
        }
      }
    });
  });

  // セル結合設定（テンプレートJSONから忠実に再現）
  merges.forEach((merge: any) => {
    const startCell = worksheet.getCell(merge.startRowIndex + 1, merge.startColumnIndex + 1);
    const endCell = worksheet.getCell(merge.endRowIndex, merge.endColumnIndex);
    worksheet.mergeCells(startCell.address + ':' + endCell.address);
  });

  // 変数セル数をカウント
  let variableCount = 0;
  values.forEach((rowData: any[], rowIndex: number) => {
    rowData.forEach((cellValue, colIndex) => {
      if (isVariableCell(cellValue, rowIndex, colIndex)) {
        variableCount++;
      }
    });
  });

  console.log(`✅ ${sheetName}シート作成完了 (${values.length}行, ${merges.length}箇所のセル結合, ${variableCount}個の変数セル)`);
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
  workbook.lastModifiedBy = 'Google Sheets API';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 各シートのデータを取得してワークシート作成
  for (const sheetName of SHEET_NAMES) {
    try {
      const data = await fetchSheetData(sheets, sheetName);
      await createWorksheet(workbook, sheetName, data);
    } catch (error) {
      console.error(`❌ ${sheetName}シートの処理でエラー:`, error);
    }
  }

  // ファイル出力
  const outputPath = path.join(OUTPUT_DIR, '履歴書_スキルシート_職務経歴書_変数ハイライト版.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`\n🎉 変数ハイライト版Excelファイルを生成しました: ${outputPath}`);
  console.log(`📁 出力先: ${OUTPUT_DIR}`);
  console.log(`📊 シート数: ${workbook.worksheets.length}`);
  console.log(`💡 背景色#e2efffのセルが変数（ユーザー入力）として判定されたセルです`);
}

main().catch(console.error); 