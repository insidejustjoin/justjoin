
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
export const VARIABLE_CELLS: VariableCell[] = [
  {
    "sheet": "履歴書",
    "row": 2,
    "col": 2,
    "address": "B2",
    "value": "履　歴　書",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "履歴書",
    "row": 3,
    "col": 3,
    "address": "C3",
    "value": "サリドル　アブドゥルカユモフ",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "履歴書",
    "row": 4,
    "col": 2,
    "address": "B4",
    "value": " 氏     名",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "履歴書",
    "row": 4,
    "col": 3,
    "address": "C4",
    "value": "Sardor Abudrkayumov",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "履歴書",
    "row": 9,
    "col": 2,
    "address": "B9",
    "value": "Uzbekistan, Tashkent, Olmazor District, Urazboyev Street 10",
    "type": "selfIntroduction",
    "description": "自己PR・備考"
  },
  {
    "sheet": "履歴書",
    "row": 17,
    "col": 2,
    "address": "B17",
    "value": "2020",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 17,
    "col": 3,
    "address": "C17",
    "value": "9",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 17,
    "col": 4,
    "address": "D17",
    "value": " Westminster International University in Tashkent, BIS学科　入学",
    "type": "educationWorkHistory",
    "description": "学歴・職歴"
  },
  {
    "sheet": "履歴書",
    "row": 18,
    "col": 2,
    "address": "B18",
    "value": "2024",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 18,
    "col": 3,
    "address": "C18",
    "value": "4",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 18,
    "col": 4,
    "address": "D18",
    "value": " Westminster International University in Tashkent, BIS学科　卒業",
    "type": "educationWorkHistory",
    "description": "学歴・職歴"
  },
  {
    "sheet": "履歴書",
    "row": 20,
    "col": 2,
    "address": "B20",
    "value": "2023",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 20,
    "col": 3,
    "address": "C20",
    "value": "1",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 20,
    "col": 4,
    "address": "D20",
    "value": " Mars IT School (Uzbekistan, Tashkent) 入社",
    "type": "educationWorkHistory",
    "description": "学歴・職歴"
  },
  {
    "sheet": "履歴書",
    "row": 21,
    "col": 4,
    "address": "D21",
    "value": "先生として従事",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "履歴書",
    "row": 22,
    "col": 2,
    "address": "B22",
    "value": "2024",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 22,
    "col": 3,
    "address": "C22",
    "value": "2",
    "type": "phone",
    "description": "電話番号"
  },
  {
    "sheet": "履歴書",
    "row": 22,
    "col": 4,
    "address": "D22",
    "value": "同じ会社のIT部門でモバイルソフトエンジニアとして働き、現在に至る",
    "type": "other",
    "description": "その他"
  },
  {
    "sheet": "履歴書",
    "row": 26,
    "col": 10,
    "address": "J26",
    "value": "約　　　時間　　　分",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "履歴書",
    "row": 26,
    "col": 12,
    "address": "L26",
    "value": "５人",
    "type": "address",
    "description": "住所"
  },
  {
    "sheet": "職務経歴書",
    "row": 2,
    "col": 4,
    "address": "D2",
    "value": "職 務 経 歴 書",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "職務経歴書",
    "row": 17,
    "col": 2,
    "address": "B17",
    "value": "・2023.9　WIUT大学で存在するJapanese Clubの部長として活動",
    "type": "other",
    "description": "その他"
  },
  {
    "sheet": "職務経歴書",
    "row": 19,
    "col": 2,
    "address": "B19",
    "value": "なし",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 6,
    "col": 2,
    "address": "B6",
    "value": "スキル",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 6,
    "col": 3,
    "address": "C6",
    "value": "レベル",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 6,
    "col": 4,
    "address": "D6",
    "value": "スキル",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 6,
    "col": 5,
    "address": "E6",
    "value": "レベル",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 6,
    "col": 6,
    "address": "F6",
    "value": "スキル",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 6,
    "col": 7,
    "address": "G6",
    "value": "レベル",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 7,
    "col": 4,
    "address": "D7",
    "value": "言語",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 8,
    "col": 2,
    "address": "B8",
    "value": "Windows",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 8,
    "col": 3,
    "address": "C8",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 8,
    "col": 7,
    "address": "G8",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 9,
    "col": 2,
    "address": "B9",
    "value": "MacOS",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 9,
    "col": 5,
    "address": "E9",
    "value": "D",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 9,
    "col": 7,
    "address": "G9",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 10,
    "col": 2,
    "address": "B10",
    "value": "Linux",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 10,
    "col": 7,
    "address": "G10",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 11,
    "col": 4,
    "address": "D11",
    "value": "JAVA",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 11,
    "col": 7,
    "address": "G11",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 12,
    "col": 4,
    "address": "D12",
    "value": "JavaScript ",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 12,
    "col": 5,
    "address": "E12",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 12,
    "col": 6,
    "address": "F12",
    "value": "Photoshop",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 12,
    "col": 7,
    "address": "G12",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 13,
    "col": 2,
    "address": "B13",
    "value": "インフラ",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 13,
    "col": 4,
    "address": "D13",
    "value": "PHP",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 13,
    "col": 5,
    "address": "E13",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 13,
    "col": 6,
    "address": "F13",
    "value": "Illustrator",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 13,
    "col": 7,
    "address": "G13",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 14,
    "col": 3,
    "address": "C14",
    "value": "C",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 14,
    "col": 4,
    "address": "D14",
    "value": "Python",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 14,
    "col": 5,
    "address": "E14",
    "value": "D",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 14,
    "col": 7,
    "address": "G14",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 15,
    "col": 4,
    "address": "D15",
    "value": "Ruby",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 15,
    "col": 6,
    "address": "F15",
    "value": "Dreamweaver",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 16,
    "col": 4,
    "address": "D16",
    "value": "Swift",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 16,
    "col": 6,
    "address": "F16",
    "value": "Fireworks",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 17,
    "col": 6,
    "address": "F17",
    "value": "MAYA",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 18,
    "col": 5,
    "address": "E18",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 18,
    "col": 7,
    "address": "G18",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 19,
    "col": 5,
    "address": "E19",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 19,
    "col": 6,
    "address": "F19",
    "value": "Figma",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 19,
    "col": 7,
    "address": "G19",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 20,
    "col": 4,
    "address": "D20",
    "value": "R",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 21,
    "col": 7,
    "address": "G21",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 22,
    "col": 7,
    "address": "G22",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 23,
    "col": 7,
    "address": "G23",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 24,
    "col": 2,
    "address": "B24",
    "value": "DB",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 24,
    "col": 6,
    "address": "F24",
    "value": "Notion",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 25,
    "col": 6,
    "address": "F25",
    "value": "AWS",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 25,
    "col": 7,
    "address": "G25",
    "value": "C",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 26,
    "col": 2,
    "address": "B26",
    "value": "SQL Server",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 26,
    "col": 6,
    "address": "F26",
    "value": "Azure",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 27,
    "col": 2,
    "address": "B27",
    "value": "Oracle",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 27,
    "col": 4,
    "address": "D27",
    "value": "jQuery",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 27,
    "col": 6,
    "address": "F27",
    "value": "Google Cloud Platform",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 28,
    "col": 2,
    "address": "B28",
    "value": "MySQL",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 28,
    "col": 3,
    "address": "C28",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 28,
    "col": 4,
    "address": "D28",
    "value": "Bootstrap",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 28,
    "col": 5,
    "address": "E28",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 29,
    "col": 2,
    "address": "B29",
    "value": "PostgreSQL",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 29,
    "col": 3,
    "address": "C29",
    "value": "C",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 29,
    "col": 5,
    "address": "E29",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 30,
    "col": 4,
    "address": "D30",
    "value": "ReactJS",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 30,
    "col": 5,
    "address": "E30",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 31,
    "col": 4,
    "address": "D31",
    "value": "VueJS",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 31,
    "col": 5,
    "address": "E31",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 32,
    "col": 4,
    "address": "D32",
    "value": "Laravel",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 32,
    "col": 5,
    "address": "E32",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 33,
    "col": 2,
    "address": "B33",
    "value": "職種",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 33,
    "col": 4,
    "address": "D33",
    "value": "業務",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 33,
    "col": 6,
    "address": "F33",
    "value": "W3Schools",
    "type": "other",
    "description": "その他"
  },
  {
    "sheet": "スキルシート",
    "row": 33,
    "col": 7,
    "address": "G33",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 34,
    "col": 2,
    "address": "B34",
    "value": "プログラマ",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 34,
    "col": 3,
    "address": "C34",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 34,
    "col": 4,
    "address": "D34",
    "value": "要件定義",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 34,
    "col": 5,
    "address": "E34",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 35,
    "col": 2,
    "address": "B35",
    "value": "SE",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 35,
    "col": 5,
    "address": "E35",
    "value": "C",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 36,
    "col": 3,
    "address": "C36",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 36,
    "col": 5,
    "address": "E36",
    "value": "C",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 37,
    "col": 3,
    "address": "C37",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 37,
    "col": 4,
    "address": "D37",
    "value": "検証試験",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 37,
    "col": 7,
    "address": "G37",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 38,
    "col": 3,
    "address": "C38",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 38,
    "col": 4,
    "address": "D38",
    "value": "セキュリティ試験",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 38,
    "col": 7,
    "address": "G38",
    "value": "A",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 39,
    "col": 4,
    "address": "D39",
    "value": "負荷試験",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 39,
    "col": 6,
    "address": "F39",
    "value": "その他",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 40,
    "col": 6,
    "address": "F40",
    "value": "タッチタイピング",
    "type": "furigana",
    "description": "フリガナ"
  },
  {
    "sheet": "スキルシート",
    "row": 40,
    "col": 7,
    "address": "G40",
    "value": "B",
    "type": "fullName",
    "description": "氏名（英語）"
  },
  {
    "sheet": "スキルシート",
    "row": 41,
    "col": 6,
    "address": "F41",
    "value": "パソコン利用歴",
    "type": "furigana",
    "description": "フリガナ"
  }
];
