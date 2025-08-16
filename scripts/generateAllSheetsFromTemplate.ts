import { google } from 'googleapis';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '1dsdDtCsfXZL_BiXbfhvVUOOkzFn4kjvKoad_6dSQADs';
const SHEET_NAMES = ['履歴書', '職務経歴書', 'スキルシート'];
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const KEYFILE = path.join(__dirname, 'job-match-platform-464305-ff6aeda1c296.json');
const OUTPUT_DIR = path.join(__dirname, '../sample/output');

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

  return { values, merges };
}

async function createWorksheet(workbook: ExcelJS.Workbook, sheetName: string, data: any) {
  const { values, merges } = data;
  const worksheet = workbook.addWorksheet(sheetName);

  // 列幅設定（シート別に調整）
  const columnWidths = {
    'A': 3, 'B': 15, 'C': 25, 'D': 35, 'E': 8, 'F': 8, 'G': 12,
    'H': 3, 'I': 3, 'J': 15, 'K': 8, 'L': 15, 'M': 8, 'N': 15,
    'O': 3, 'P': 3, 'Q': 3, 'R': 3, 'S': 3, 'T': 3, 'U': 3,
    'V': 3, 'W': 3, 'X': 3, 'Y': 3, 'Z': 3
  };
  Object.keys(columnWidths).forEach(col => {
    worksheet.getColumn(col).width = columnWidths[col];
  });

  // 行高設定
  for (let i = 1; i <= values.length; i++) {
    worksheet.getRow(i).height = 20;
  }

  // セル値設定（テンプレートJSONから忠実に再現）
  values.forEach((rowData: any[], rowIndex: number) => {
    const row = worksheet.getRow(rowIndex + 1);
    rowData.forEach((cellValue, colIndex) => {
      if (cellValue !== undefined && cellValue !== '') {
        const cell = row.getCell(colIndex + 1);
        cell.value = cellValue;
        
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
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  // セル結合設定（テンプレートJSONから忠実に再現）
  merges.forEach((merge: any) => {
    const startCell = worksheet.getCell(merge.startRowIndex + 1, merge.startColumnIndex + 1);
    const endCell = worksheet.getCell(merge.endRowIndex, merge.endColumnIndex);
    worksheet.mergeCells(startCell.address + ':' + endCell.address);
  });

  console.log(`✅ ${sheetName}シート作成完了 (${values.length}行, ${merges.length}箇所のセル結合)`);
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
  const outputPath = path.join(OUTPUT_DIR, '履歴書_スキルシート_職務経歴書_GoogleSheets完全再現版.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`\n🎉 完全再現版Excelファイルを生成しました: ${outputPath}`);
  console.log(`📁 出力先: ${OUTPUT_DIR}`);
  console.log(`📊 シート数: ${workbook.worksheets.length}`);
}

main().catch(console.error); 