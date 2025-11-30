import { google } from 'googleapis';

export interface SpreadsheetData {
  spreadsheetId: string;
  title: string;
  sheets: SheetData[];
}

export interface SheetData {
  sheetId: number;
  title: string;
  data: string[][];
  properties: {
    gridProperties: {
      rowCount: number;
      columnCount: number;
    };
  };
}

export interface CellData {
  row: number;
  col: number;
  address: string;
  value: string;
  formattedValue?: string;
  backgroundColor?: string;
  fontColor?: string;
  isBold?: boolean;
  fontSize?: number;
  alignment?: {
    horizontal?: string;
    vertical?: string;
  };
  border?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
}

export interface SkillSheetTemplate {
  title: string;
  personalInfo: {
    name: string;
    date: string;
  };
  levelCriteria: string;
  skills: {
    category: string;
    items: Array<{
      name: string;
      level: string;
      row: number;
      col: number;
    }>;
  }[];
  additionalInfo: {
    typingSpeed: string;
    computerExperience: string;
  };
}

export class SpreadsheetService {
  private auth: any;
  private sheets: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Google Sheets APIの認証設定
      this.auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './google-credentials.json'
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Google Sheets API初期化エラー:', error);
      throw error;
    }
  }

  // スプレッドシートの基本情報を取得
  async getSpreadsheetInfo(spreadsheetId: string): Promise<SpreadsheetData> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false
      });

      return {
        spreadsheetId: response.data.spreadsheetId,
        title: response.data.properties.title,
        sheets: response.data.sheets.map((sheet: any) => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title,
          data: [],
          properties: sheet.properties
        }))
      };
    } catch (error) {
      console.error('スプレッドシート情報取得エラー:', error);
      throw error;
    }
  }

  // 特定のシートのデータを取得
  async getSheetData(spreadsheetId: string, sheetName: string): Promise<SheetData> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName
      });

      const data = response.data.values || [];
      
      return {
        sheetId: 0,
        title: sheetName,
        data: data,
        properties: {
          gridProperties: {
            rowCount: data.length,
            columnCount: data.length > 0 ? data[0].length : 0
          }
        }
      };
    } catch (error) {
      console.error('シートデータ取得エラー:', error);
      throw error;
    }
  }

  // セルの詳細情報を取得（書式、スタイルなど）
  async getCellDetails(spreadsheetId: string, range: string): Promise<CellData[]> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [range],
        includeGridData: true
      });

      const cells: CellData[] = [];
      const gridData = response.data.sheets[0].data[0];

      if (gridData && gridData.rowData) {
        gridData.rowData.forEach((row: any, rowIndex: number) => {
          if (row.values) {
            row.values.forEach((cell: any, colIndex: number) => {
              const cellData: CellData = {
                row: rowIndex + 1,
                col: colIndex + 1,
                address: this.getCellAddress(rowIndex + 1, colIndex + 1),
                value: cell.formattedValue || '',
                formattedValue: cell.formattedValue
              };

              // セルの書式情報を取得
              if (cell.effectiveFormat) {
                const format = cell.effectiveFormat;
                
                // 背景色
                if (format.backgroundColor) {
                  cellData.backgroundColor = this.rgbToHex(
                    format.backgroundColor.red || 0,
                    format.backgroundColor.green || 0,
                    format.backgroundColor.blue || 0
                  );
                }

                // フォント情報
                if (format.textFormat) {
                  cellData.isBold = format.textFormat.bold || false;
                  cellData.fontSize = format.textFormat.fontSize || 10;
                }

                // 配置
                if (format.horizontalAlignment) {
                  cellData.alignment = {
                    horizontal: format.horizontalAlignment,
                    vertical: format.verticalAlignment || 'BOTTOM'
                  };
                }
              }

              cells.push(cellData);
            });
          }
        });
      }

      return cells;
    } catch (error) {
      console.error('セル詳細取得エラー:', error);
      throw error;
    }
  }

  // スキルシートの正確なテンプレートを解析
  async parseSkillSheetTemplate(spreadsheetId: string): Promise<SkillSheetTemplate> {
    try {
      const skillSheet = await this.getSheetData(spreadsheetId, 'スキルシート');
      const cellDetails = await this.getCellDetails(spreadsheetId, 'スキルシート!A1:H50');

      const template: SkillSheetTemplate = {
        title: 'スキルシート',
        personalInfo: {
          name: '',
          date: ''
        },
        levelCriteria: '',
        skills: [],
        additionalInfo: {
          typingSpeed: '',
          computerExperience: ''
        }
      };

      // データを解析
      skillSheet.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell && cell.trim()) {
            const cellDetail = cellDetails.find(c => c.row === rowIndex + 1 && c.col === colIndex + 1);
            
            // タイトル
            if (rowIndex === 1 && colIndex === 0) {
              template.title = cell;
            }
            
            // 氏名
            if (rowIndex === 3 && colIndex === 0 && cell.includes('氏名')) {
              template.personalInfo.name = skillSheet.data[rowIndex][1] || '';
            }
            
            // 記入日
            if (rowIndex === 3 && colIndex === 1 && cell.includes('記入日')) {
              template.personalInfo.date = cell;
            }
            
            // レベルの基準
            if (rowIndex === 4 && colIndex === 0) {
              template.levelCriteria = cell;
            }
            
            // スキルカテゴリとスキル項目
            if (rowIndex >= 6) {
              this.parseSkillRow(row, rowIndex, template, cellDetails);
            }
          }
        });
      });

      return template;
    } catch (error) {
      console.error('スキルシートテンプレート解析エラー:', error);
      throw error;
    }
  }

  // スキル行を解析
  private parseSkillRow(row: string[], rowIndex: number, template: SkillSheetTemplate, cellDetails: CellData[]) {
    // カテゴリヘッダー（太字で背景色がある行）
    const cellDetail = cellDetails.find(c => c.row === rowIndex + 1 && c.col === 1);
    if (cellDetail && cellDetail.isBold && cellDetail.backgroundColor) {
      const category = row[0];
      if (category && !template.skills.find(s => s.category === category)) {
        template.skills.push({
          category,
          items: []
        });
      }
    }

    // スキル項目
    if (row[0] && !row[0].includes('氏名') && !row[0].includes('記入日') && !row[0].includes('レベルの基準')) {
      const skillName = row[0];
      const level = row[1] || '';
      
      // 最後のカテゴリに追加
      if (template.skills.length > 0) {
        const lastCategory = template.skills[template.skills.length - 1];
        lastCategory.items.push({
          name: skillName,
          level,
          row: rowIndex + 1,
          col: 1
        });
      }
    }

    // 追加情報
    if (row[0] && row[0].includes('タッチタイピング')) {
      template.additionalInfo.typingSpeed = row[1] || '';
    }
    if (row[0] && row[0].includes('パソコン利用歴')) {
      template.additionalInfo.computerExperience = row[1] || '';
    }
  }

  // セルアドレスを生成（A1形式）
  private getCellAddress(row: number, col: number): string {
    let address = '';
    while (col > 0) {
      col--;
      address = String.fromCharCode(65 + (col % 26)) + address;
      col = Math.floor(col / 26);
    }
    return address + row;
  }

  // RGB値を16進数に変換
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // 全シートのデータを取得
  async getAllSheetsData(spreadsheetId: string): Promise<SpreadsheetData> {
    try {
      const info = await this.getSpreadsheetInfo(spreadsheetId);
      
      const sheetsData = await Promise.all(
        info.sheets.map(async (sheet) => {
          const sheetData = await this.getSheetData(spreadsheetId, sheet.title);
          return {
            ...sheet,
            data: sheetData.data
          };
        })
      );

      return {
        ...info,
        sheets: sheetsData
      };
    } catch (error) {
      console.error('全シートデータ取得エラー:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const spreadsheetService = new SpreadsheetService(); 