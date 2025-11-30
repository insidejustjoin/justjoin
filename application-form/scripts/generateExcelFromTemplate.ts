import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const TEMPLATE_PATH = path.join(__dirname, 'resume_template.json');
const OUTPUT_DIR = path.join(__dirname, '../sample/output');

async function main() {
  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // テンプレートJSON読み込み
  const templateData = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  const { values, merges } = templateData;

  // ワークブック作成
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('履歴書');

  // 列幅設定（サンプルに合わせて調整）
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

  // ファイル出力
  const outputPath = path.join(OUTPUT_DIR, '履歴書_GoogleSheets完全再現版.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`✅ Excelファイルを生成しました: ${outputPath}`);
  console.log(`📊 セル数: ${values.length}行`);
  console.log(`🔗 セル結合: ${merges.length}箇所`);
}

main().catch(console.error); 