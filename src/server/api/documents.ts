import express from 'express';
import { query } from '../../integrations/postgres/client.js';
import { authenticate, AuthenticatedRequest } from '../authenticate.js';
import { logger } from '../../services/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テストエンドポイント
router.get('/test', (req: express.Request, res: express.Response): any => {
  res.json({ message: 'Documents API is working!' });
});

// スプレッドシートを忠実に再現した書類生成
router.post('/generate-documents', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { documentData } = req.body;
    
    if (!documentData) {
      return res.status(400).json({ error: 'documentDataが必要です' });
    }
    
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    // 履歴書シート - セルレベル完全再現
    const resumeSheet = workbook.addWorksheet('履歴書');
    
    // 履歴書の列幅設定（スプレッドシート完全一致）
    resumeSheet.getColumn('A').width = 3;
    resumeSheet.getColumn('B').width = 3;
    resumeSheet.getColumn('C').width = 3;
    resumeSheet.getColumn('D').width = 15;
    resumeSheet.getColumn('E').width = 15;
    resumeSheet.getColumn('F').width = 15;
    resumeSheet.getColumn('G').width = 15;
    resumeSheet.getColumn('H').width = 3;
    resumeSheet.getColumn('I').width = 3;
    resumeSheet.getColumn('J').width = 15;
    resumeSheet.getColumn('K').width = 15;
    resumeSheet.getColumn('L').width = 15;
    resumeSheet.getColumn('M').width = 15;
    resumeSheet.getColumn('N').width = 15;
    resumeSheet.getColumn('O').width = 3;
    resumeSheet.getColumn('P').width = 3;
    resumeSheet.getColumn('Q').width = 15;
    resumeSheet.getColumn('R').width = 15;
    resumeSheet.getColumn('S').width = 15;
    resumeSheet.getColumn('T').width = 15;
    resumeSheet.getColumn('U').width = 15;
    resumeSheet.getColumn('V').width = 3;
    resumeSheet.getColumn('W').width = 3;
    resumeSheet.getColumn('X').width = 15;
    resumeSheet.getColumn('Y').width = 15;
    resumeSheet.getColumn('Z').width = 15;
    
    // 履歴書のセル配置（スプレッドシート完全再現）
    // タイトル
    const titleCell = resumeSheet.getCell('D2');
    titleCell.value = '履 歴 書';
    titleCell.font = { name: 'MS Gothic', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    resumeSheet.mergeCells('D2:G2');
    
    // 基本情報
    resumeSheet.getCell('B4').value = '氏名';
    resumeSheet.getCell('D4').value = documentData.fullName;
    resumeSheet.getCell('J4').value = '生年月日';
    resumeSheet.getCell('L4').value = documentData.birthDate;
    
    resumeSheet.getCell('B5').value = 'フリガナ';
    resumeSheet.getCell('D5').value = '';
    resumeSheet.getCell('J5').value = '年齢';
    resumeSheet.getCell('L5').value = '';
    
    resumeSheet.getCell('B6').value = '住所';
    resumeSheet.getCell('D6').value = documentData.address;
    resumeSheet.getCell('J6').value = '性別';
    resumeSheet.getCell('L6').value = documentData.gender;
    
    resumeSheet.getCell('B7').value = '電話番号';
    resumeSheet.getCell('D7').value = documentData.phone;
    resumeSheet.getCell('J7').value = 'メールアドレス';
    resumeSheet.getCell('L7').value = documentData.email;
    
    // 学歴
    resumeSheet.getCell('B9').value = '学歴';
    resumeSheet.getCell('B9').font = { name: 'MS Gothic', size: 12, bold: true };
    
    let currentRow = 10;
    documentData.resume.education.forEach((edu: any, index: number) => {
      resumeSheet.getCell(`B${currentRow}`).value = edu.period;
      resumeSheet.getCell('D9').value = edu.school;
      resumeSheet.getCell('F9').value = edu.major;
      currentRow++;
    });
    
    // 職歴
    resumeSheet.getCell(`B${currentRow}`).value = '職歴';
    resumeSheet.getCell(`B${currentRow}`).font = { name: 'MS Gothic', size: 12, bold: true };
    currentRow++;
    
    documentData.resume.workExperience.forEach((work: any, index: number) => {
      resumeSheet.getCell(`B${currentRow}`).value = work.period;
      resumeSheet.getCell('D9').value = work.company;
      resumeSheet.getCell('F9').value = work.position;
      currentRow++;
    });
    
    // 自己PR
    resumeSheet.getCell(`B${currentRow}`).value = '自己PR';
    resumeSheet.getCell(`B${currentRow}`).font = { name: 'MS Gothic', size: 12, bold: true };
    currentRow++;
    
    resumeSheet.getCell(`B${currentRow}`).value = documentData.resume.selfPR;
    resumeSheet.mergeCells(`B${currentRow}:G${currentRow + 4}`);
    
    // 職務経歴書シート - セルレベル完全再現
    const workHistorySheet = workbook.addWorksheet('職務経歴書');
    
    // 職務経歴書の列幅設定
    workHistorySheet.getColumn('A').width = 3;
    workHistorySheet.getColumn('B').width = 25;
    workHistorySheet.getColumn('C').width = 25;
    workHistorySheet.getColumn('D').width = 25;
    workHistorySheet.getColumn('E').width = 25;
    workHistorySheet.getColumn('F').width = 25;
    workHistorySheet.getColumn('G').width = 25;
    
    // 職務経歴書のセル配置
    workHistorySheet.getCell('D2').value = '職 務 経 歴 書';
    workHistorySheet.getCell('D2').font = { name: 'MS Gothic', size: 16, bold: true };
    workHistorySheet.getCell('D2').alignment = { horizontal: 'center', vertical: 'middle' };
    workHistorySheet.mergeCells('D2:F2');
    
    // 現在の日付を使用
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
    workHistorySheet.getCell('F4').value = formattedDate;
    workHistorySheet.getCell('F4').alignment = { horizontal: 'right' };
    
    workHistorySheet.getCell('E5').value = `氏名　${documentData.fullName}`;
    workHistorySheet.mergeCells('E5:F5');
    
    workHistorySheet.getCell('B7').value = '■コワーク経歴';
    workHistorySheet.getCell('B7').font = { name: 'MS Gothic', size: 12, bold: true };
    
    currentRow = 9;
    documentData.workHistory.workExperiences.forEach((work: any, index: number) => {
      workHistorySheet.getCell(`B${currentRow}`).value = work.period;
      workHistorySheet.mergeCells(`B${currentRow}:F${currentRow}`);
      currentRow++;
      
      workHistorySheet.getCell(`B${currentRow}`).value = '【作業内容】' + work.description;
      workHistorySheet.mergeCells(`B${currentRow}:D${currentRow}`);
      
      workHistorySheet.getCell(`E${currentRow}`).value = '【OS/ 言語/ DB など】\n' + work.technologies + '\n【使用ソフトウェアなど】\n' + work.software;
      workHistorySheet.getCell(`F${currentRow}`).value = '役割：' + work.role;
      currentRow++;
    });
    
    // その他情報
    if (documentData.workHistory.otherExperience) {
      workHistorySheet.getCell(`B${currentRow}`).value = '■その他職務経歴';
      workHistorySheet.getCell(`B${currentRow}`).font = { name: 'MS Gothic', size: 12, bold: true };
      currentRow++;
      
      workHistorySheet.getCell(`B${currentRow}`).value = documentData.workHistory.otherExperience;
      currentRow++;
    }
    
    if (documentData.workHistory.valuableExperience) {
      workHistorySheet.getCell(`B${currentRow}`).value = '■活かせる経験・知識・技術';
      workHistorySheet.getCell(`B${currentRow}`).font = { name: 'MS Gothic', size: 12, bold: true };
      currentRow++;
      
      workHistorySheet.getCell(`B${currentRow}`).value = documentData.workHistory.valuableExperience;
      currentRow++;
    }
    
    if (documentData.workHistory.qualifications) {
      workHistorySheet.getCell(`B${currentRow}`).value = '■資格など';
      workHistorySheet.getCell(`B${currentRow}`).font = { name: 'MS Gothic', size: 12, bold: true };
      currentRow++;
      
      workHistorySheet.getCell(`B${currentRow}`).value = documentData.workHistory.qualifications;
    }
    
    // スキルシート - セルレベル完全再現
    const skillsSheet = workbook.addWorksheet('スキルシート');
    
    // 列幅設定（スプレッドシート完全一致）
    skillsSheet.getColumn('A').width = 25;
    skillsSheet.getColumn('B').width = 8;
    skillsSheet.getColumn('C').width = 25;
    skillsSheet.getColumn('D').width = 8;
    skillsSheet.getColumn('E').width = 25;
    skillsSheet.getColumn('F').width = 8;
    skillsSheet.getColumn('G').width = 25;
    skillsSheet.getColumn('H').width = 8;
    skillsSheet.getColumn('I').width = 25;
    skillsSheet.getColumn('J').width = 8;
    skillsSheet.getColumn('K').width = 25;
    skillsSheet.getColumn('L').width = 8;
    
    // スキルシートのセル配置
    skillsSheet.getCell('D2').value = 'ス キ ル シ ー ト';
    skillsSheet.getCell('D2').font = { name: 'MS Gothic', size: 16, bold: true };
    skillsSheet.getCell('D2').alignment = { horizontal: 'center', vertical: 'middle' };
    skillsSheet.mergeCells('D2:G2');
    
    skillsSheet.getCell('B4').value = '氏名：' + documentData.fullName;
    skillsSheet.getCell('B4').font = { name: 'MS Gothic', size: 12 };
    
    let skillRow = 6;
    Object.entries(documentData.skillSheet.skills).forEach(([skill, level]) => {
      skillsSheet.getCell(`B${skillRow}`).value = skill;
      skillsSheet.getCell(`C${skillRow}`).value = String(level);
      skillRow++;
    });
    
    // 罫線設定
    [resumeSheet, workHistorySheet, skillsSheet].forEach(sheet => {
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    });
    
    // Excelファイルを生成
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${documentData.fullName}_書類一式.xlsx"`);
    res.send(Buffer.from(buffer));
    
    console.log('書類生成完了');
    
  } catch (error) {
    console.error('書類生成エラー:', error);
    logger.error('書類生成エラー:', error);
    res.status(500).json({ error: '書類生成中にエラーが発生しました' });
  }
});

// 書類データ保存APIエンドポイント
router.post('/', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { userId, documentType, documentData, timestamp } = req.body;

    if (!userId || !documentType || !documentData) {
      logger.warn('書類保存API: 必須パラメータ不足', { userId, documentType }, undefined, 'api_validation');
      return res.status(400).json({
        success: false,
        message: 'ユーザーID、書類タイプ、書類データは必須です'
      });
    }

    // データベースに保存（メインストレージ）
    try {
      const checkQuery = 'SELECT id FROM user_documents WHERE user_id = $1';
      const checkResult = await query(checkQuery, [userId]);

      if (checkResult.rows.length > 0) {
        // 既存データを更新
        const updateQuery = `
          UPDATE user_documents 
          SET document_data = $1, document_type = $2, updated_at = $3 
          WHERE user_id = $4
        `;
        await query(updateQuery, [JSON.stringify(documentData), documentType, timestamp || new Date().toISOString(), userId]);
      } else {
        // 新規データを挿入
        const insertQuery = `
          INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5)
        `;
        const now = timestamp || new Date().toISOString();
        await query(insertQuery, [userId, documentType, JSON.stringify(documentData), now, now]);
      }

      // 完成度を計算して更新
      let completionRate = 0;
      if (documentType === 'resume') {
        completionRate = calculateCompletionRate(documentData);
        
        // job_seekersテーブルのcompletion_rateを更新
        await query(
          'UPDATE job_seekers SET completion_rate = $1, updated_at = NOW() WHERE user_id = $2',
          [completionRate, userId]
        );
      }

      logger.info('書類保存成功（データベース）', { userId, documentType, completionRate }, undefined, 'api_success');
    } catch (dbError) {
      logger.error('データベース保存エラー', { userId, documentType, error: dbError.message }, undefined, 'db_error');
      throw new Error(`データベース保存に失敗しました: ${dbError.message}`);
    }

    res.status(200).json({
      success: true,
      message: '書類データが正常に保存されました'
    });
  } catch (error) {
    console.error('書類保存エラー:', error);
    logger.error('書類保存APIエラー', { error: error.message }, undefined, 'api_error');
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// 書類データ読み込みAPIエンドポイント（パスパラメータ版）
router.get('/:userId', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { documentType = 'all' } = req.query;

    if (!userId) {
      logger.warn('書類取得API: 必須パラメータ不足', { userId, documentType }, undefined, 'api_validation');
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDは必須です'
      });
    }

    // データベースから取得
    try {
      const queryText = 'SELECT document_data, created_at, updated_at FROM user_documents WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1';
      const result = await query(queryText, [userId]);

      if (result.rows.length > 0) {
        const documentData = result.rows[0].document_data;
        logger.info('書類取得成功（データベース）', { userId, documentType }, undefined, 'api_success');
        
        return res.json({
          success: true,
          data: documentData,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at
        });
      }
    } catch (dbError) {
      logger.error('データベース読み込みエラー', { userId, documentType, error: dbError.message }, undefined, 'db_error');
    }

    // データが見つからない場合
    logger.warn('書類取得API: 書類が見つかりません', { userId, documentType }, undefined, 'api_failure');
    return res.status(404).json({
      success: false,
      message: '書類が見つかりません'
    });
  } catch (error) {
    console.error('書類読み込みエラー:', error);
    logger.error('書類取得APIエラー', { error: error.message }, undefined, 'api_error');
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// 書類データ読み込みAPIエンドポイント（クエリパラメータ版）
router.get('/', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { userId, documentType = 'all' } = req.query;

    if (!userId) {
      logger.warn('書類取得API: 必須パラメータ不足', { userId, documentType }, undefined, 'api_validation');
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDは必須です'
      });
    }

    // データベースから取得
    try {
      const queryText = 'SELECT document_data, created_at, updated_at FROM user_documents WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1';
      const result = await query(queryText, [userId]);

      if (result.rows.length > 0) {
        const documentData = result.rows[0].document_data;
        logger.info('書類取得成功（データベース）', { userId, documentType }, undefined, 'api_success');
        
        return res.json({
          success: true,
          data: documentData,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at
        });
      }
    } catch (dbError) {
      logger.error('データベース読み込みエラー', { userId, documentType, error: dbError.message }, undefined, 'db_error');
    }

    // データが見つからない場合
    logger.warn('書類取得API: 書類が見つかりません', { userId, documentType }, undefined, 'api_failure');
    return res.status(404).json({
      success: false,
      message: '書類が見つかりません'
    });
  } catch (error) {
    console.error('書類読み込みエラー:', error);
    logger.error('書類取得APIエラー', { error: error.message }, undefined, 'api_error');
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// 書類データ削除APIエンドポイント
router.delete('/:userId', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      });
    }

    // データベースから削除
    try {
      const deleteQuery = 'DELETE FROM user_documents WHERE user_id = $1';
      await query(deleteQuery, [userId]);
      logger.info('書類削除成功（データベース）', { userId }, undefined, 'api_success');
    } catch (dbError) {
      logger.warn('データベース削除に失敗', { userId, error: dbError.message }, undefined, 'db_error');
    }

    // ファイルシステムからも削除
    const documentsDir = path.join(__dirname, '../../../documents');
    if (fs.existsSync(documentsDir)) {
      const files = fs.readdirSync(documentsDir);
      const userFiles = files.filter(file => file.startsWith(`${userId}_`) && file.endsWith('.json'));
      
      userFiles.forEach(file => {
        const filePath = path.join(documentsDir, file);
        try {
          fs.unlinkSync(filePath);
          logger.info('書類ファイル削除成功', { userId, fileName: file }, undefined, 'file_cleanup');
        } catch (error) {
          logger.warn('書類ファイル削除に失敗', { userId, fileName: file, error }, undefined, 'file_cleanup_error');
        }
      });
    }

    res.json({
      success: true,
      message: '書類データが正常に削除されました'
    });
  } catch (error) {
    console.error('書類削除エラー:', error);
    logger.error('書類削除APIエラー', { error: error.message }, undefined, 'api_error');
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// 入力率計算関数
const calculateCompletionRate = (documentData: any): number => {
  
  const requiredFields = [
    // 基本情報
    documentData.lastName, documentData.firstName, 
    documentData.kanaLastName, documentData.kanaFirstName,
    documentData.birthDate, documentData.gender,
    // 現住所情報
    documentData.livePostNumber, documentData.liveAddress,
    documentData.kanaLiveAddress, documentData.livePhoneNumber,
    documentData.liveMail, documentData.nationality,
    // 連絡先情報（現住所と同じ場合は完了とみなす）
    documentData.contactSameAsLive ? true : documentData.contactPostNumber,
    documentData.contactSameAsLive ? true : documentData.contactAddress,
    documentData.contactSameAsLive ? true : documentData.kanaContactAddress,
    documentData.contactSameAsLive ? true : documentData.contactPhoneNumber,
    documentData.contactSameAsLive ? true : documentData.contactMail,
    // 履歴書（selfIntroductionを使用）
    documentData.selfIntroduction,
    // 学歴（ない場合はチェックボックスで完了とみなす）
    documentData.resume?.noEducation ? true : (documentData.resume?.education && documentData.resume.education.length > 0),
    // 職歴（ない場合はチェックボックスで完了とみなす）
    documentData.resume?.noWorkExperience ? true : (documentData.resume?.workExperience && documentData.resume.workExperience.length > 0),
    // 資格（ない場合はチェックボックスで完了とみなす）
    documentData.resume?.noQualifications ? true : (documentData.resume?.qualifications && documentData.resume?.qualifications.length > 0),
    // 職務経歴書（ない場合はチェックボックスで完了とみなす）
    documentData.workHistory?.noWorkHistory ? true : (documentData.workHistory?.workExperiences && documentData.workHistory?.workExperiences.length > 0),
    // スキルシート（主要スキル）- 評価が設定されているかチェック
    documentData.skillSheet?.skills?.Windows?.evaluation && documentData.skillSheet?.skills?.Windows?.evaluation !== '-',
    documentData.skillSheet?.skills?.MacOS?.evaluation && documentData.skillSheet?.skills?.MacOS?.evaluation !== '-',
    documentData.skillSheet?.skills?.Linux?.evaluation && documentData.skillSheet?.skills?.Linux?.evaluation !== '-',
    // 日本語関連（300文字以上の場合のみ完了とみなす）
    documentData.certificateStatus?.name, 
    documentData.whyJapan && documentData.whyJapan.length >= 300 ? true : false,
    documentData.whyInterestJapan && documentData.whyInterestJapan.length >= 300 ? true : false,
    // 追加情報（300文字以上の場合のみ完了とみなす）
    documentData.selfIntroduction && documentData.selfIntroduction.length >= 300 ? true : false,
    documentData.spouse, documentData.spouseSupport
  ];

  // デバッグ用：各フィールドの状態をログ出力
  console.log('=== サーバー側入力率計算デバッグ ===');
  console.log('基本情報:', {
    lastName: !!documentData.lastName,
    firstName: !!documentData.firstName,
    kanaLastName: !!documentData.kanaLastName,
    kanaFirstName: !!documentData.kanaFirstName,
    birthDate: !!documentData.birthDate,
    gender: !!documentData.gender,
    nationality: !!documentData.nationality
  });
  console.log('現住所情報:', {
    livePostNumber: !!documentData.livePostNumber,
    liveAddress: !!documentData.liveAddress,
    kanaLiveAddress: !!documentData.kanaLiveAddress,
    livePhoneNumber: !!documentData.livePhoneNumber,
    liveMail: !!documentData.liveMail
  });
  console.log('連絡先情報:', {
    contactSameAsLive: documentData.contactSameAsLive,
    contactPostNumber: !!documentData.contactPostNumber,
    contactAddress: !!documentData.contactAddress,
    kanaContactAddress: !!documentData.kanaContactAddress,
    contactPhoneNumber: !!documentData.contactPhoneNumber,
    contactMail: !!documentData.contactMail
  });
  console.log('履歴書:', {
    selfPR: !!documentData.resume?.selfPR,
    noEducation: documentData.resume?.noEducation,
    noWorkExperience: documentData.resume?.noWorkExperience,
    noQualifications: documentData.resume?.noQualifications,
    education: documentData.resume?.education?.length || 0,
    workExperience: documentData.resume?.workExperience?.length || 0,
    qualifications: documentData.resume?.qualifications?.length || 0
  });
  console.log('職務経歴書:', {
    noWorkHistory: documentData.workHistory?.noWorkHistory,
    workExperiences: documentData.workHistory?.workExperiences?.length || 0
  });
  console.log('スキルシート:', {
    Windows: documentData.skillSheet?.skills?.Windows?.evaluation,
    MacOS: documentData.skillSheet?.skills?.MacOS?.evaluation,
    Linux: documentData.skillSheet?.skills?.Linux?.evaluation
  });
  console.log('日本語関連:', {
    certificateStatus: !!documentData.certificateStatus?.name,
    whyJapan: documentData.whyJapan && documentData.whyJapan.length >= 300,
    whyInterestJapan: documentData.whyInterestJapan && documentData.whyInterestJapan.length >= 300
  });
  console.log('追加情報:', {
    selfIntroduction: documentData.selfIntroduction && documentData.selfIntroduction.length >= 300,
    spouse: !!documentData.spouse,
    spouseSupport: !!documentData.spouseSupport
  });

  const filledFields = requiredFields.filter((field: any) => {
    if (typeof field === 'string') {
      return field && field.trim() !== '';
    }
    if (typeof field === 'boolean') {
      return field === true;
    }
    if (Array.isArray(field)) {
      return (field as any[]).length > 0;
    }
    return field;
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
};

// 書類データ保存APIエンドポイント
router.post('/jobseekers/documents', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { userId, documentData } = req.body;
    
    if (!userId || !documentData) {
      return res.status(400).json({ error: 'userIdとdocumentDataが必要です' });
    }
    
    // 入力率を計算
    const completionRate = calculateCompletionRate(documentData);
    
    // 既存のデータを確認
    const existingData = await query(
      'SELECT * FROM user_documents WHERE user_id = $1 AND document_type = $2',
      [userId, 'jobseeker_documents']
    );
    
    if (existingData.rows.length > 0) {
      // 既存データを更新
      await query(
        'UPDATE user_documents SET document_data = $1, updated_at = NOW() WHERE user_id = $2 AND document_type = $3',
        [JSON.stringify(documentData), userId, 'jobseeker_documents']
      );
    } else {
      // 新規データを挿入
      await query(
        'INSERT INTO user_documents (user_id, document_type, document_data, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [userId, 'jobseeker_documents', JSON.stringify(documentData)]
      );
    }
    
    // job_seekersテーブルのcompletion_rateを更新
    await query(
      'UPDATE job_seekers SET completion_rate = $1, updated_at = NOW() WHERE user_id = $2',
      [completionRate, userId]
    );
    
    res.json({ success: true, message: '書類データを保存しました', completionRate });
  } catch (error) {
    console.error('書類データ保存エラー:', error);
    res.status(500).json({ error: '書類データの保存に失敗しました' });
  }
});

// 入力率取得APIエンドポイント
router.get('/jobseekers/completion-rate/:userId', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userIdが必要です' });
    }
    
    const result = await query(
      'SELECT completion_rate FROM job_seekers WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length > 0) {
      res.json({ 
        success: true, 
        completionRate: result.rows[0].completion_rate || 0 
      });
    } else {
      res.json({ 
        success: true, 
        completionRate: 0 
      });
    }
  } catch (error) {
    console.error('入力率取得エラー:', error);
    res.status(500).json({ error: '入力率の取得に失敗しました' });
  }
});

// 面接履歴取得エンドポイント
router.get('/interview-history/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // 面接URLの状態を確認
    const urlQuery = `
      SELECT is_used, created_at, interview_token
      FROM interview_urls
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const urlResult = await query(urlQuery, [userId]);
    
    // 面接履歴を取得
    let interviewData = {
      hasInterview: false,
      totalInterviews: 0,
      canTakeInterview: true,
      status: 'not_taken',
      interviewUrl: null
    };
    
    if (urlResult.rows.length > 0) {
      const urlData = urlResult.rows[0];
      
      if (urlData.is_used) {
        // 面接完了済み
        interviewData = {
          hasInterview: true,
          totalInterviews: 1,
          canTakeInterview: false,
          status: 'completed',
          interviewUrl: null
        };
      } else {
        // 面接URLが有効
        interviewData = {
          hasInterview: false,
          totalInterviews: 0,
          canTakeInterview: true,
          status: 'available',
          interviewUrl: `https://interview.justjoin.jp?token=${urlData.interview_token}`
        };
      }
    }
    
    res.json({
      success: true,
      data: interviewData
    });

  } catch (error) {
    console.error('面接履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接履歴を取得できませんでした'
    });
  }
});

// 面接開始用トークン生成エンドポイント
router.post('/interview-token/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // ユーザー情報を取得
    const userQuery = `
      SELECT u.id, u.email, js.full_name, js.desired_job_title, js.experience_years, js.skills
      FROM users u
      LEFT JOIN job_seekers js ON u.id = js.user_id
      WHERE u.id = $1 AND u.user_type = 'job_seeker'
    `;
    
    const userResult = await query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'ユーザーが見つかりません'
      });
    }

    const user = userResult.rows[0];
    
    // 既に面接を受けているかチェック
    const urlCheckQuery = `
      SELECT is_used
      FROM interview_urls
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const urlCheckResult = await query(urlCheckQuery, [userId]);
    
    if (urlCheckResult.rows.length > 0 && urlCheckResult.rows[0].is_used) {
      return res.status(400).json({
        success: false,
        error: 'INTERVIEW_ALREADY_TAKEN',
        message: '1次面接は既に受験済みです'
      });
    }

    // 面接開始用のセッショントークンを生成
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      type: 'interview_start'
    })).toString('base64');

    // AI面接開始通知を送信
    try {
      const { sendNotificationToUser } = await import('../../integrations/postgres/notifications.js');
      await sendNotificationToUser(
        user.id,
        'AI面接が開始しました！',
        'AI面接が開始しました！面接を受験して、採用担当者にあなたの魅力をアピールしましょう。',
        'info'
      );
    } catch (notificationError) {
      console.error('AI面接開始通知送信エラー:', notificationError);
    }

    // Base64エンコードしてトークンとして返す
    const tokenString = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.full_name,
      position: user.desired_job_title,
      timestamp: Date.now()
    })).toString('base64');

    // 面接URLを生成
    const interviewUrl = `https://interview.justjoin.jp?token=${tokenString}`;

    // 面接URLをデータベースに保存
    const saveUrlQuery = `
      INSERT INTO interview_urls (user_id, interview_token, interview_url, expires_at, is_used)
      VALUES ($1, $2, $3, NULL, FALSE)
      ON CONFLICT (user_id) DO UPDATE SET
        interview_token = EXCLUDED.interview_token,
        interview_url = EXCLUDED.interview_url,
        expires_at = NULL,
        is_used = FALSE,
        updated_at = NOW()
    `;
    
    await query(saveUrlQuery, [user.id, tokenString, interviewUrl]);

    // 面接受験回数を更新
    const updateAttemptsQuery = `
      INSERT INTO interview_attempts (user_id, attempt_count, first_attempt_at, last_attempt_at)
      VALUES ($1, 1, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        attempt_count = interview_attempts.attempt_count + 1,
        last_attempt_at = NOW(),
        updated_at = NOW()
    `;
    
    await query(updateAttemptsQuery, [user.id]);

    res.json({
      success: true,
      data: {
        token: tokenString,
        interviewUrl: interviewUrl,
        userData: {
          name: user.full_name,
          email: user.email,
          position: user.desired_job_title
        }
      }
    });

  } catch (error) {
    console.error('面接トークン生成エラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接を開始できませんでした',
      details: error.message
    });
  }
});

// 管理者用：求職者の面接状態を取得するエンドポイント
router.get('/admin/interview-status/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // 求職者の面接有効化状態を取得
    const jobSeekerQuery = `
      SELECT js.interview_enabled
      FROM job_seekers js
      WHERE js.user_id = $1
    `;
    
    const jobSeekerResult = await query(jobSeekerQuery, [userId]);
    
    if (jobSeekerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'JOB_SEEKER_NOT_FOUND',
        message: '求職者が見つかりません'
      });
    }
    
    const interviewEnabled = jobSeekerResult.rows[0].interview_enabled;
    
    if (!interviewEnabled) {
      return res.json({
        success: true,
        data: {
          status: 'not_public',
          message: '1次面接が公開前の場合は対象外'
        }
      });
    }
    
    // 面接URLの状態を取得
    const urlQuery = `
      SELECT is_used, created_at
      FROM interview_urls
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const urlResult = await query(urlQuery, [userId]);
    
    // 面接受験回数を取得
    const attemptsQuery = `
      SELECT attempt_count, first_attempt_at, last_attempt_at
      FROM interview_attempts
      WHERE user_id = $1
    `;
    
    const attemptsResult = await query(attemptsQuery, [userId]);
    const attemptsData = attemptsResult.rows.length > 0 ? attemptsResult.rows[0] : { attempt_count: 0, first_attempt_at: null, last_attempt_at: null };
    
    if (urlResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          status: 'not_created',
          message: '1次面接が公開中の場合は受験前',
          attemptCount: attemptsData.attempt_count,
          firstAttemptAt: attemptsData.first_attempt_at,
          lastAttemptAt: attemptsData.last_attempt_at
        }
      });
    }
    
    const urlData = urlResult.rows[0];
    
    if (urlData.is_used) {
      return res.json({
        success: true,
        data: {
          status: 'completed',
          message: '1次面接を受験しURLがなくなった場合は受験完了',
          completedAt: urlData.created_at,
          attemptCount: attemptsData.attempt_count,
          firstAttemptAt: attemptsData.first_attempt_at,
          lastAttemptAt: attemptsData.last_attempt_at
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          status: 'available',
          message: '1次面接が公開中の場合は受験前',
          attemptCount: attemptsData.attempt_count,
          firstAttemptAt: attemptsData.first_attempt_at,
          lastAttemptAt: attemptsData.last_attempt_at
        }
      });
    }
    
  } catch (error) {
    console.error('面接状態取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接状態を取得できませんでした'
    });
  }
});

// 面接完了後の処理エンドポイント
router.post('/interview-completed/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { sessionId, score, recommendation } = req.body;
    
    // 面接URLを使用済みに設定
    const updateUrlQuery = `
      UPDATE interview_urls 
      SET is_used = TRUE, updated_at = NOW()
      WHERE user_id = $1 AND is_used = FALSE
    `;
    
    await query(updateUrlQuery, [userId]);
    
    // 面接受験回数を更新（完了時）
    const updateAttemptsQuery = `
      UPDATE interview_attempts 
      SET last_attempt_at = NOW(), updated_at = NOW()
      WHERE user_id = $1
    `;
    
    await query(updateAttemptsQuery, [userId]);
    
    // 面接完了通知を送信
    try {
      const { sendNotificationToUser } = await import('../../integrations/postgres/notifications.js');
      await sendNotificationToUser(
        userId,
        'AI面接が完了しました！',
        `AI面接が完了しました！結果は管理者に送信されました。スコア: ${score || 'N/A'}, 推奨レベル: ${recommendation || 'N/A'}`,
        'success'
      );
    } catch (notificationError) {
      console.error('面接完了通知送信エラー:', notificationError);
    }
    
    res.json({
      success: true,
      message: '面接完了処理が完了しました'
    });
    
  } catch (error) {
    console.error('面接完了処理エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接完了処理に失敗しました'
    });
  }
});

// 管理者用：面接URLを再有効化するエンドポイント
router.post('/admin/interview-reset/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // 管理者権限チェック
    const adminCheckQuery = `
      SELECT u.user_type
      FROM users u
      WHERE u.id = $1
    `;
    
    const adminResult = await query(adminCheckQuery, [req.user.id]);
    
    if (adminResult.rows.length === 0 || !['admin', 'super_admin'].includes(adminResult.rows[0].user_type)) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '管理者権限が必要です'
      });
    }
    
    // 既存の面接URLを削除
    const deleteUrlQuery = `
      DELETE FROM interview_urls 
      WHERE user_id = $1
    `;
    
    await query(deleteUrlQuery, [userId]);
    
    // 面接受験回数をリセット
    const resetAttemptsQuery = `
      UPDATE interview_attempts 
      SET attempt_count = 0, updated_at = NOW()
      WHERE user_id = $1
    `;
    
    await query(resetAttemptsQuery, [userId]);
    
    // 面接履歴をリセット
    try {
      const resetHistoryQuery = `
        UPDATE interview_applicants 
        SET total_interviews = 0, updated_at = NOW()
        WHERE email = (SELECT email FROM users WHERE id = $1)
      `;
      
      await query(resetHistoryQuery, [userId]);
    } catch (error) {
      console.error('面接履歴リセットエラー（無視）:', error);
    }
    
    // 面接再開通知を送信
    try {
      const { sendNotificationToUser } = await import('../../integrations/postgres/notifications.js');
      await sendNotificationToUser(
        userId,
        'AI面接が再開されました！',
        'AI面接が再開されました！再度面接を受験できます。',
        'info'
      );
    } catch (notificationError) {
      console.error('面接再開通知送信エラー:', notificationError);
    }
    
    res.json({
      success: true,
      message: '面接URLが再有効化されました'
    });
    
  } catch (error) {
    console.error('面接再有効化エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接再有効化に失敗しました'
    });
  }
});

// 面接開始時に面接URLを使用済みにするエンドポイント
router.post('/interview-start/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params;
    
    // Base64デコード
    let decodedToken;
    try {
      const tokenData = Buffer.from(token, 'base64').toString();
      decodedToken = JSON.parse(tokenData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: '無効なトークンです'
      });
    }

    // 面接URLを使用済みにする
    const updateUrlQuery = `
      UPDATE interview_urls 
      SET is_used = TRUE 
      WHERE interview_token = $1
    `;
    
    await query(updateUrlQuery, [token]);

    res.json({
      success: true,
      message: '面接が開始されました'
    });

  } catch (error) {
    console.error('面接開始エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '面接を開始できませんでした'
    });
  }
});

// 面接トークン検証エンドポイント
router.get('/interview-verify/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params;
    
    // Base64デコード
    let decodedToken;
    try {
      const tokenData = Buffer.from(token, 'base64').toString();
      decodedToken = JSON.parse(tokenData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: '無効なトークンです'
      });
    }
    
    // トークンの有効期限チェック
    if (Date.now() > decodedToken.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'トークンの有効期限が切れています'
      });
    }
    
    // ユーザーが存在するかチェック
    const userQuery = `
      SELECT u.id, u.email, u.user_type, js.full_name
      FROM users u
      LEFT JOIN job_seekers js ON u.id = js.user_id
      WHERE u.id = $1
    `;
    
    const userResult = await query(userQuery, [decodedToken.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'ユーザーが見つかりません'
      });
    }
    
    const userData = userResult.rows[0];
    
    // 求職者ユーザーのみ許可
    if (userData.user_type !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: '求職者ユーザーのみアクセス可能です'
      });
    }
    
    // 既に面接を受けているかチェック
    const interviewCheckQuery = `
      SELECT COUNT(*) as interview_count
      FROM interview_applicants ia
      JOIN interview_sessions isr ON ia.id = isr.applicant_id
      WHERE ia.email = $1
    `;
    
    const checkResult = await query(interviewCheckQuery, [userData.email]);
    const interviewCount = parseInt(checkResult.rows[0].interview_count) || 0;
    
    if (interviewCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'INTERVIEW_ALREADY_TAKEN',
        message: '1次面接は既に受験済みです'
      });
    }
    
    res.json({
      success: true,
      data: {
        userId: userData.id,
        email: userData.email,
        name: userData.full_name,
        position: decodedToken.position,
        token: token
      }
    });
    
  } catch (error) {
    console.error('面接トークン検証エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'トークンの検証に失敗しました'
    });
  }
});

// 書類データを保存
router.post('/documents', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, documentType, documentData } = req.body;

    const result = await query(
      'INSERT INTO user_documents (user_id, document_type, document_data) VALUES ($1, $2, $3) ON CONFLICT (user_id, document_type) DO UPDATE SET document_data = $3, updated_at = NOW() RETURNING *',
      [userId, documentType, JSON.stringify(documentData)]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('書類保存エラー:', error);
    res.status(500).json({ success: false, message: '書類の保存に失敗しました' });
  }
});

// 書類データを取得
router.get('/documents/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { documentType } = req.query;

    let sql = 'SELECT * FROM user_documents WHERE user_id = $1';
    const params = [userId];

    if (documentType) {
      sql += ' AND document_type = $2';
      params.push(documentType as string);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('書類取得エラー:', error);
    res.status(500).json({ success: false, message: '書類の取得に失敗しました' });
  }
});

// 書類データを削除
router.delete('/documents/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { documentType } = req.query;

    let sql = 'DELETE FROM user_documents WHERE user_id = $1';
    const params = [userId];

    if (documentType) {
      sql += ' AND document_type = $2';
      params.push(documentType as string);
    }

    await query(sql, params);

    res.json({ success: true, message: '書類を削除しました' });
  } catch (error) {
    console.error('書類削除エラー:', error);
    res.status(500).json({ success: false, message: '書類の削除に失敗しました' });
  }
});

// 面接表示設定更新エンドポイント
router.put('/admin/jobseekers/:id/interview-visibility', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // 管理者権限チェック
    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '管理者権限が必要です'
      });
    }

    const { id } = req.params;
    const { interviewEnabled } = req.body;
    
    if (typeof interviewEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'interviewEnabledパラメータが必要です'
      });
    }

    // 求職者の面接表示設定を更新
    const updateQuery = `
      UPDATE job_seekers 
      SET interview_enabled = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, interview_enabled
    `;
    
    const result = await query(updateQuery, [interviewEnabled, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '求職者が見つかりません'
      });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        interviewEnabled: result.rows[0].interview_enabled
      },
      message: `面接表示設定を${interviewEnabled ? '有効' : '無効'}にしました`
    });

  } catch (error) {
    console.error('面接表示設定更新エラー:', error);
    res.status(500).json({
      success: false,
      error: '面接表示設定の更新に失敗しました'
    });
  }
});

export default router;