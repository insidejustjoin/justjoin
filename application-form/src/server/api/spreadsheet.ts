import express from 'express';
import { spreadsheetService } from '../../services/spreadsheetService.js';

const router = express.Router();

// スプレッドシート情報取得
router.get('/info/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const info = await spreadsheetService.getSpreadsheetInfo(spreadsheetId);
    res.json(info);
  } catch (error) {
    console.error('スプレッドシート情報取得エラー:', error);
    res.status(500).json({ error: 'スプレッドシート情報の取得に失敗しました' });
  }
});

// シートデータ取得
router.get('/sheet/:spreadsheetId/:sheetName', async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.params;
    const data = await spreadsheetService.getSheetData(spreadsheetId, sheetName);
    res.json(data);
  } catch (error) {
    console.error('シートデータ取得エラー:', error);
    res.status(500).json({ error: 'シートデータの取得に失敗しました' });
  }
});

// セル詳細取得
router.get('/cells/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range } = req.query;
    
    if (!range || typeof range !== 'string') {
      return res.status(400).json({ error: 'rangeパラメータが必要です' });
    }
    
    const cells = await spreadsheetService.getCellDetails(spreadsheetId, range);
    res.json(cells);
  } catch (error) {
    console.error('セル詳細取得エラー:', error);
    res.status(500).json({ error: 'セル詳細の取得に失敗しました' });
  }
});

// スキルシートテンプレート解析
router.get('/template/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const template = await spreadsheetService.parseSkillSheetTemplate(spreadsheetId);
    res.json(template);
  } catch (error) {
    console.error('テンプレート解析エラー:', error);
    res.status(500).json({ error: 'テンプレートの解析に失敗しました' });
  }
});

// 全シートデータ取得
router.get('/all/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const data = await spreadsheetService.getAllSheetsData(spreadsheetId);
    res.json(data);
  } catch (error) {
    console.error('全シートデータ取得エラー:', error);
    res.status(500).json({ error: '全シートデータの取得に失敗しました' });
  }
});

export default router; 