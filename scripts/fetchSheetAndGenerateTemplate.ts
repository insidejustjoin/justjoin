import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '1dsdDtCsfXZL_BiXbfhvVUOOkzFn4kjvKoad_6dSQADs';
const SHEET_NAME = '履歴書'; // 必要に応じて変更
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const KEYFILE = path.join(__dirname, 'job-match-platform-464305-ff6aeda1c296.json');

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // セル値取得
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
  });
  const values = res.data.values || [];

  // セル結合・書式情報取得
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    ranges: [SHEET_NAME],
    includeGridData: true,
  });
  const grid = meta.data.sheets?.[0]?.data?.[0];

  // セル結合情報抽出
  const merges = meta.data.sheets?.[0]?.merges || [];

  // テンプレートJSONとして保存
  fs.writeFileSync(
    path.join(__dirname, 'resume_template.json'),
    JSON.stringify({ values, merges, grid }, null, 2)
  );
  console.log('テンプレートJSONを出力しました');
}

main().catch(console.error); 