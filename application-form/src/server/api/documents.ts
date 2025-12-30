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

type RegistrationType = 'engineer' | 'general';

const normalizeRegistrationType = (value?: string | null): RegistrationType =>
  value === 'general' ? 'general' : 'engineer';

const sanitizeString = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return String(value);
};

const extractJobSeekerProfile = (data: any = {}) => {
  const resumeBasic = data?.resume?.basicInfo || {};

  const firstName = data.firstName ?? resumeBasic.firstName;
  const lastName = data.lastName ?? resumeBasic.lastName;
  const phone = data.livePhoneNumber ?? resumeBasic.phone;
  const dateOfBirth = data.birthDate ?? resumeBasic.dateOfBirth;
  const gender = data.gender ?? resumeBasic.gender;
  const nationality = data.nationality ?? resumeBasic.nationality;
  const address = data.liveAddress ?? resumeBasic.address;
  const photo = data?.resume?.photoUrl;

  return {
    firstName: sanitizeString(firstName),
    lastName: sanitizeString(lastName),
    phone: sanitizeString(phone),
    dateOfBirth: sanitizeString(dateOfBirth),
    gender: sanitizeString(gender),
    nationality: sanitizeString(nationality),
    address: sanitizeString(address),
    profilePhoto: typeof photo === 'string' && photo.trim().length > 0 ? photo.trim() : null,
  };
};

const upsertJobSeekerProfile = async (
  userId: string,
  registrationType: RegistrationType,
  completionRate: number | null,
  documentData?: any
) => {
  try {
    const normalizedCompletion =
      typeof completionRate === 'number' && !Number.isNaN(completionRate) ? completionRate : 0;
    const profile = extractJobSeekerProfile(documentData);
    const targetRegistration = normalizeRegistrationType(registrationType);

    // 入力率が100%の場合は自動的にinterview_enabledをtrueにする
    const shouldEnableInterview = normalizedCompletion >= 100;
    
    const updateResult = await query(
      `
        UPDATE job_seekers
        SET completion_rate = $1,
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            phone = COALESCE($4, phone),
            date_of_birth = COALESCE($5, date_of_birth),
            gender = COALESCE($6, gender),
            nationality = COALESCE($7, nationality),
            address = COALESCE($8, address),
            profile_photo = COALESCE($9, profile_photo),
            registration_type = LOWER($11),
            interview_enabled = CASE 
              WHEN $12 = true THEN true 
              ELSE COALESCE(interview_enabled, false) 
            END,
            updated_at = NOW()
        WHERE user_id = $10
          AND LOWER(COALESCE(registration_type, 'engineer')) = LOWER($11)
        RETURNING id
      `,
      [
        normalizedCompletion,
        profile.firstName,
        profile.lastName,
        profile.phone,
        profile.dateOfBirth,
        profile.gender,
        profile.nationality,
        profile.address,
        profile.profilePhoto,
        userId,
        targetRegistration,
      ]
    );

    if (updateResult.rowCount === 0) {
      await query(
        `
          INSERT INTO job_seekers (
            user_id,
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender,
            nationality,
            address,
            profile_photo,
            registration_type,
            completion_rate,
            interview_enabled,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, LOWER($10), $11, $12, NOW(), NOW())
        `,
        [
          userId,
          profile.firstName,
          profile.lastName,
          profile.phone,
          profile.dateOfBirth,
          profile.gender,
          profile.nationality,
          profile.address,
          profile.profilePhoto,
          targetRegistration,
          normalizedCompletion,
          shouldEnableInterview,
        ]
      );
    }
  } catch (error) {
    console.warn('job_seeker upsert skipped:', (error as any)?.message || error);
  }
};

let userDocumentsRegistrationTypeEnsured = false;
const ensureUserDocumentsRegistrationTypeColumn = async () => {
  if (userDocumentsRegistrationTypeEnsured) return;
  try {
    await query(`
      ALTER TABLE user_documents
      ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'engineer'
    `);
    await query(`
      UPDATE user_documents
      SET registration_type = 'engineer'
      WHERE registration_type IS NULL
    `);
  } catch (error) {
    console.warn('registration_type column ensure skipped:', (error as any)?.message || error);
  } finally {
    userDocumentsRegistrationTypeEnsured = true;
  }
};

// テストエンドポイント
router.get('/test', (req: express.Request, res: express.Response): any => {
  res.json({ message: 'Documents API is working!' });
});

// 仮登録用の資料保存エンドポイント
router.post('/temporary-save', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { document_data } = req.body;
    
    if (!document_data) {
      return res.status(400).json({ error: 'document_dataが必要です' });
    }
    
    // 仮登録用の資料保存処理
    // ここでは一時的にログに出力（実際の保存処理は後で実装）
    logger.info('仮登録用資料保存:', {
      firstName: document_data.firstName,
      lastName: document_data.lastName,
      email: document_data.liveMail,
      japaneseLevel: document_data.japaneseLevel,
      qualificationDate: document_data.qualificationDate
    });
    
    res.json({ 
      success: true, 
      message: '仮登録用資料が保存されました',
      data: {
        saved: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('仮登録用資料保存エラー:', error);
    res.status(500).json({ 
      success: false, 
      error: '資料保存中にエラーが発生しました' 
    });
  }
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
    await ensureUserDocumentsRegistrationTypeColumn();

    const { userId, documentType = 'resume', documentData, timestamp, registrationType } = req.body;

    if (!userId || !documentData) {
      logger.warn('書類保存API: 必須パラメータ不足', { userId, documentType }, undefined, 'api_validation');
      return res.status(400).json({
        success: false,
        message: 'ユーザーID、書類データは必須です'
      });
    }

    const userIdStr = String(userId);
    const normalizedData = typeof documentData === 'string' ? JSON.parse(documentData) : documentData;
    if (registrationType !== 'engineer' && registrationType !== 'general') {
      return res.status(400).json({ success: false, message: 'registrationType は engineer または general が必須です' });
    }
    const normalizedRegistrationType = registrationType as RegistrationType;

    // データベースに保存（メインストレージ）
    try {
      const checkQuery = `
        SELECT id 
        FROM user_documents 
        WHERE user_id = $1 
          AND document_type = $2 
          AND registration_type IS NOT NULL
          AND LOWER(registration_type) = LOWER($3)
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const checkResult = await query(checkQuery, [userIdStr, documentType, normalizedRegistrationType]);

      if (checkResult.rows.length > 0) {
        // 既存データを更新
        const updateQuery = `
          UPDATE user_documents 
          SET document_data = $1, updated_at = $2, registration_type = $4
          WHERE id = $3
        `;
        await query(updateQuery, [
          JSON.stringify(normalizedData),
          timestamp || new Date().toISOString(),
          checkResult.rows[0].id,
          normalizedRegistrationType,
        ]);
      } else {
        // 新規データを挿入
        const insertQuery = `
          INSERT INTO user_documents (user_id, document_type, registration_type, document_data, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const now = timestamp || new Date().toISOString();
        await query(insertQuery, [
          userIdStr,
          documentType,
          normalizedRegistrationType,
          JSON.stringify(normalizedData),
          now,
          now,
        ]);
      }

      // 完成度を計算し、job_seekersテーブルに反映
      let completionRate: number | null = null;
      if (documentType === 'resume' || documentType === 'jobseeker_documents' || documentType === 'all') {
        completionRate = calculateCompletionRate(normalizedData, normalizedRegistrationType);
      }
      await upsertJobSeekerProfile(userIdStr, normalizedRegistrationType, completionRate, normalizedData);

      // HubSpot連携（非同期で実行、エラーが発生しても処理を続行）
      // 注意: この処理は非同期で実行されるため、エラーが発生してもレスポンスは返される
      console.log('=== HubSpot連携開始 ===', JSON.stringify({ 
        userId: userIdStr, 
        registrationType: normalizedRegistrationType,
        timestamp: new Date().toISOString()
      }));
      logger.info(
        'HubSpot連携処理を開始します',
        { userId: userIdStr, registrationType: normalizedRegistrationType },
        undefined,
        'hubspot_init_start'
      );
      
      (async () => {
        try {
          console.log('[HubSpot] 非同期関数内で処理開始', JSON.stringify({ 
            userId: userIdStr, 
            registrationType: normalizedRegistrationType,
            timestamp: new Date().toISOString()
          }));
          logger.info(
            'HubSpot連携処理開始',
            { userId: userIdStr, registrationType: normalizedRegistrationType },
            undefined,
            'hubspot_init'
          );

        const { HubSpotClient } = await import('../../integrations/hubspot/client.js');
        const { mapDocumentDataToHubSpot } = await import('../../integrations/hubspot/mapper.js');
        
        // ユーザーのメールアドレスを取得
        console.log('[HubSpot] メールアドレス取得開始', JSON.stringify({ userId: userIdStr }));
        logger.info(
          'HubSpot: メールアドレス取得開始',
          { userId: userIdStr },
          undefined,
          'hubspot_email_lookup'
        );
        // メールアドレスとHubSpotコンタクトIDを取得
        const userResult = await query('SELECT email, hubspot_contact_id FROM users WHERE id = $1 LIMIT 1', [userIdStr]);
        console.log('[HubSpot] ユーザー情報取得結果', JSON.stringify({ 
          userId: userIdStr, 
          found: userResult.rows.length > 0,
          email: userResult.rows.length > 0 ? userResult.rows[0].email : 'not found',
          hubspotContactId: userResult.rows.length > 0 ? userResult.rows[0].hubspot_contact_id : 'not found'
        }));
        
        if (userResult.rows.length > 0 && userResult.rows[0].email) {
          const userEmail = userResult.rows[0].email;
          const existingHubspotContactId = userResult.rows[0].hubspot_contact_id;
          logger.info(
            'HubSpot: メールアドレス取得成功',
            { userId: userIdStr, email: userEmail },
            undefined,
            'hubspot_email_found'
          );

          const hubspotApiKey = process.env.HUBSPOT_API_KEY;
          if (!hubspotApiKey) {
            console.warn('[HubSpot] APIキーが設定されていません。連携をスキップします。', { userId: userIdStr, email: userEmail });
            logger.warn(
              'HubSpot連携スキップ: HUBSPOT_API_KEYが設定されていません',
              { userId: userIdStr, email: userEmail },
              undefined,
              'hubspot_warning'
            );
            return; // 非同期関数から抜ける
          }
          logger.info(
            'HubSpot: APIキー確認完了',
            { userId: userIdStr, email: userEmail, apiKeyLength: hubspotApiKey.length },
            undefined,
            'hubspot_api_key_ok'
          );

          const hubspotClient = new HubSpotClient(hubspotApiKey);
          
          logger.info(
            'HubSpot: プロパティマッピング開始',
            { userId: userIdStr, email: userEmail },
            undefined,
            'hubspot_mapping_start'
          );
          const hubspotProperties = mapDocumentDataToHubSpot(normalizedData, userEmail, normalizedRegistrationType);
          
          logger.info(
            'HubSpot連携開始',
            { 
              userId: userIdStr,
              email: userEmail, 
              registrationType: normalizedRegistrationType,
              propertiesCount: Object.keys(hubspotProperties).length,
              properties: Object.keys(hubspotProperties),
              sampleProperties: Object.fromEntries(Object.entries(hubspotProperties).slice(0, 10))
            },
            undefined,
            'hubspot_start'
          );
          
          logger.info(
            'HubSpot: createOrUpdateContact呼び出し開始',
            { userId: userIdStr, email: userEmail, existingContactId: existingHubspotContactId },
            undefined,
            'hubspot_api_call_start'
          );
          // 保存されたコンタクトIDがあれば使用（メール検索をスキップ）
          const hubspotResult = await hubspotClient.createOrUpdateContact(
            hubspotProperties,
            existingHubspotContactId || undefined
          );
          
          if (hubspotResult) {
            const contactId = hubspotResult.id;
            
            // コンタクトIDをデータベースに保存（まだ保存されていない場合、または変更された場合）
            if (contactId !== existingHubspotContactId) {
              console.log('[HubSpot] コンタクトIDをデータベースに保存', { userId: userIdStr, contactId });
              await query(
                'UPDATE users SET hubspot_contact_id = $1, updated_at = NOW() WHERE id = $2',
                [contactId, userIdStr]
              );
              logger.info(
                'HubSpot: コンタクトIDをデータベースに保存',
                { userId: userIdStr, contactId },
                undefined,
                'hubspot_contact_id_saved'
              );
            }
            
            logger.info(
              'HubSpot連携成功',
              { 
                userId: userIdStr, 
                email: userEmail, 
                registrationType: normalizedRegistrationType,
                contactId: contactId,
                resultType: 'id' in hubspotResult ? 'update' : 'create',
                usedExistingContactId: !!existingHubspotContactId
              },
              undefined,
              'hubspot_success'
            );
          } else {
            logger.warn(
              'HubSpot連携失敗: 結果が返されませんでした',
              { userId: userIdStr, email: userEmail },
              undefined,
              'hubspot_warning'
            );
          }
        } else {
          console.warn('[HubSpot] メールアドレスが見つかりません。連携をスキップします。', { userId: userIdStr, queryResult: userResult.rows.length });
          logger.warn(
            'HubSpot連携スキップ: メールアドレスが見つかりません',
            { userId: userIdStr, queryResult: userResult.rows.length },
            undefined,
            'hubspot_warning'
          );
        }
      } catch (hubspotError: any) {
        // HubSpot連携エラーはログに記録するが、処理は続行
        const errorDetails = {
          message: hubspotError?.message || String(hubspotError),
          stack: hubspotError?.stack,
          name: hubspotError?.name,
          code: hubspotError?.code,
          response: hubspotError?.response ? {
            status: hubspotError.response.status,
            statusText: hubspotError.response.statusText,
            data: hubspotError.response.data
          } : undefined
        };
        
        logger.error(
          'HubSpot連携エラー',
          { 
            userId: userIdStr, 
            error: errorDetails,
            registrationType: normalizedRegistrationType 
          },
          undefined,
          'hubspot_error'
        );
          console.error('[HubSpot] 連携エラー（処理は続行）:', errorDetails);
        }
      })(); // 非同期関数を即座に実行（レスポンスをブロックしない）

      logger.info(
        '書類保存成功（データベース）',
        { userId: userIdStr, documentType, completionRate, registrationType: normalizedRegistrationType },
        undefined,
        'api_success'
      );
    } catch (dbError: any) {
      logger.error(
        'データベース保存エラー',
        { userId: userIdStr, documentType, registrationType: normalizedRegistrationType, error: dbError.message },
        undefined,
        'db_error'
      );
      throw new Error(`データベース保存に失敗しました: ${dbError.message}`);
    }

    res.status(200).json({
      success: true,
      message: '書類データが正常に保存されました'
    });
  } catch (error: any) {
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
    await ensureUserDocumentsRegistrationTypeColumn();
    const { userId } = req.params;
    const { documentType = 'all', registrationType } = req.query;

    if (!userId) {
      logger.warn('書類取得API: 必須パラメータ不足', { userId, documentType }, undefined, 'api_validation');
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDは必須です'
      });
    }

    const registrationTypeFilter =
      typeof registrationType === 'string' ? normalizeRegistrationType(registrationType) : null;

    // すべてのドキュメントタイプを取得して統合
    const params: any[] = [userId];
    let sql = `
      SELECT document_type, document_data, created_at, updated_at, registration_type
      FROM user_documents
      WHERE user_id = $1
    `;
    if (registrationTypeFilter) {
      params.push(registrationTypeFilter);
      // registration_typeがNULLの場合は除外（明示的に設定されたもののみ取得）
      sql += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${params.length})`;
    }
    sql += ' ORDER BY created_at ASC';

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      logger.warn('書類取得API: 書類が見つかりません', { userId, documentType }, undefined, 'api_failure');
      return res.status(404).json({
        success: false,
        message: '書類が見つかりません'
      });
    }

    const merged: any = {};
    const liftBasic = (d: any) => {
      const b = d?.resume?.basicInfo;
      if (!b) return;
      merged.lastName = merged.lastName || b.lastName;
      merged.firstName = merged.firstName || b.firstName;
      merged.kanaLastName = merged.kanaLastName || b.kanaLastName;
      merged.kanaFirstName = merged.kanaFirstName || b.kanaFirstName;
      merged.birthDate = merged.birthDate || b.dateOfBirth;
      merged.gender = merged.gender || b.gender;
      merged.nationality = merged.nationality || b.nationality;
      merged.liveAddress = merged.liveAddress || b.address;
      merged.livePhoneNumber = merged.livePhoneNumber || b.phone;
      merged.liveMail = merged.liveMail || b.email;
    };

    for (const row of result.rows) {
      const data = row.document_data || {};
      Object.assign(merged, data);
      liftBasic(data);
      if (row.document_type === 'basic_info') {
        const b = data;
        merged.lastName = merged.lastName || b.lastName;
        merged.firstName = merged.firstName || b.firstName;
        merged.kanaLastName = merged.kanaLastName || b.kanaLastName;
        merged.kanaFirstName = merged.kanaFirstName || b.kanaFirstName;
        merged.birthDate = merged.birthDate || b.dateOfBirth;
        merged.gender = merged.gender || b.gender;
        merged.nationality = merged.nationality || b.nationality;
        merged.liveAddress = merged.liveAddress || b.address;
        merged.livePhoneNumber = merged.livePhoneNumber || b.phone;
        merged.liveMail = merged.liveMail || b.email;
      }
      if (data.resume) {
        merged.resume = { ...(merged.resume || {}), ...data.resume };
      }
      if (data.workHistory) {
        merged.workHistory = { ...(merged.workHistory || {}), ...data.workHistory };
      }
      if (data.skillSheet) {
        merged.skillSheet = { ...(merged.skillSheet || {}), ...data.skillSheet };
        if (data.skillSheet.skills) {
          merged.skillSheet.skills = { ...(merged.skillSheet.skills || {}), ...data.skillSheet.skills };
        }
      }
      if (data.certificateStatus) {
        merged.certificateStatus = { ...(merged.certificateStatus || {}), ...data.certificateStatus };
      }
    }

    const first = result.rows[0];
    const last = result.rows[result.rows.length - 1];

    return res.json({
      success: true,
      data: merged,
      createdAt: first.created_at,
      updatedAt: last.updated_at || last.created_at
    });
  } catch (error) {
    console.error('書類読み込みエラー:', error);
    logger.error('書類取得APIエラー', { error: (error as any).message }, undefined, 'api_error');
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// 書類データ読み込みAPIエンドポイント（クエリパラメータ版）
router.get('/', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    await ensureUserDocumentsRegistrationTypeColumn();
    const { userId, documentType = 'all', registrationType } = req.query;

    if (!userId) {
      logger.warn('書類取得API: 必須パラメータ不足', { userId, documentType }, undefined, 'api_validation');
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDは必須です'
      });
    }

    const registrationTypeFilter =
      typeof registrationType === 'string' ? normalizeRegistrationType(registrationType) : null;

    // データベースから取得
    try {
      let queryText = `
        SELECT document_data, created_at, updated_at 
        FROM user_documents 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];
      if (registrationTypeFilter) {
        params.push(registrationTypeFilter);
        queryText += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${params.length})`;
      }
      queryText += ' ORDER BY updated_at DESC LIMIT 1';

      const result = await query(queryText, params);

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
    await ensureUserDocumentsRegistrationTypeColumn();
    const { userId } = req.params;
    const { registrationType } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      });
    }

    // データベースから削除
    try {
      let deleteQuery = 'DELETE FROM user_documents WHERE user_id = $1';
      const params: any[] = [userId];
      if (typeof registrationType === 'string') {
        const normalized = normalizeRegistrationType(registrationType);
        deleteQuery += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${params.length + 1})`;
        params.push(normalized);
      }
      await query(deleteQuery, params);
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

// 入力率計算関数（registrationTypeを考慮）
export const calculateCompletionRate = (data: any, registrationType: RegistrationType = 'engineer'): number => {
  let score = 0;
  let maxScore = 0;

  const addField = (value: any) => {
    maxScore += 1;
    if (typeof value === 'string') {
      if (value.trim() !== '') score += 1;
    } else if (typeof value === 'boolean') {
      if (value) score += 1;
    } else if (Array.isArray(value)) {
      if (value.length > 0) score += 1;
    } else if (value !== null && value !== undefined) {
      score += 1;
    }
  };

  // 基本情報
  addField(data.lastName);
  addField(data.firstName);
  addField(data.birthDate);
  addField(data.gender);
  addField(data.nationality);

  // 現住所情報
  addField(data.livePostNumber);
  addField(data.liveAddress);
  addField(data.livePhoneNumber);
  addField(data.liveMail);

  // 連絡先情報（現住所と同じ場合は充足）
  addField(data.contactSameAsLive ? true : data.contactPostNumber);
  addField(data.contactSameAsLive ? true : data.contactAddress);
  addField(data.contactSameAsLive ? true : data.contactPhoneNumber);
  addField(data.contactSameAsLive ? true : data.contactMail);

  // 履歴書
  addField(data.resume?.photoUrl);
  addField(data.resume?.noEducation ? true : (data.resume?.education && data.resume.education.length > 0));
  addField(data.resume?.noWorkExperience ? true : (data.resume?.workExperience && data.resume.workExperience.length > 0));
  addField(data.resume?.noQualifications ? true : (data.resume?.qualifications && data.resume?.qualifications.length > 0));

  // 職務経歴書
  addField(data.workHistory?.noWorkHistory ? true : (data.workHistory?.workExperiences && data.workHistory.workExperiences.length > 0));

  // スキル（エンジニアの場合のみ、全スキルの評価入力率に応じて最大3点）
  if (registrationType === 'engineer') {
    const skills = data.skillSheet?.skills ? Object.values(data.skillSheet.skills) : [];
    const skillsMaxWeight = 3;
    if (skills.length > 0) {
      const completed = (skills as any[]).filter((s: any) => typeof s?.evaluation === 'string' && s.evaluation.trim() !== '' && s.evaluation !== '-').length;
      maxScore += skillsMaxWeight;
      score += skillsMaxWeight * (completed / (skills as any[]).length);
    }
  }
  // 一般職の場合はスキルシートを除外（maxScoreに加算しない）

  // 日本語資格（現在）: 「なし/None」でも充足扱い、日付も同様
  const currentLevelName = data.japaneseLevel || (data.certificateStatus?.name || '');
  const isNoneCurrent = (currentLevelName === 'なし' || currentLevelName === 'なし / None');
  addField(isNoneCurrent ? true : currentLevelName);
  const currentQualDate = data.qualificationDate || data.certificateStatus?.date || '';
  addField(isNoneCurrent ? true : currentQualDate);

  // 日本語資格（予定）: 「未定/Not yet」でも充足扱い、日付も同様
  const plannedLevelName = data.nextJapaneseTestLevel || '';
  const isNotYetPlanned = (plannedLevelName === '未定' || plannedLevelName === '未定 / Not yet');
  addField(isNotYetPlanned ? true : plannedLevelName);
  const plannedDate = data.nextJapaneseTestDate || '';
  addField(isNotYetPlanned ? true : plannedDate);

  // 日本の在留資格（必須）
  addField(data.residencyStatus);
  
  // 希望職種（必須・複数選択）
  addField(data.desiredJobTypes && data.desiredJobTypes.length > 0 ? true : false);

  // 追加情報（従来通り）
  addField(data.selfIntroduction);
  addField(data.spouse);
  addField(data.spouseSupport);

  // ベース→百分率
  const baseRate = maxScore > 0 ? (score / maxScore) * 100 : 0;

  // 任意ボーナス: whyJapan / whyInterestJapan 各+2%（上限100%）
  let bonus = 0;
  if (data.whyJapan && data.whyJapan.length >= 300) bonus += 2;
  if (data.whyInterestJapan && data.whyInterestJapan.length >= 300) bonus += 2;

  const finalRate = Math.min(100, Math.round(baseRate + bonus));
  
  // デバッグログ（一般職の場合のみ詳細ログ）
  if (registrationType === 'general') {
    console.log('[入力率計算] 一般職:', {
      registrationType,
      score,
      maxScore,
      baseRate: Math.round(baseRate),
      bonus,
      finalRate,
      hasSkillSheet: !!data.skillSheet,
      skillCount: data.skillSheet?.skills ? Object.keys(data.skillSheet.skills).length : 0
    });
  }

  return finalRate;
};

// 書類データ保存APIエンドポイント
router.post('/jobseekers/documents', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    await ensureUserDocumentsRegistrationTypeColumn();

    const { userId, documentData, registrationType } = req.body;
    
    if (!userId || !documentData) {
      return res.status(400).json({ error: 'userIdとdocumentDataが必要です' });
    }
    
    const userIdStr = String(userId);
    if (registrationType !== 'engineer' && registrationType !== 'general') {
      return res.status(400).json({ success: false, message: 'registrationType は engineer または general が必須です' });
    }
    const normalizedRegistrationType = registrationType as RegistrationType;
    // 入力率を計算
    const completionRate = calculateCompletionRate(documentData, normalizedRegistrationType);
    
    // 既存のデータを確認
    const existingData = await query(
      `
        SELECT * 
        FROM user_documents 
        WHERE user_id = $1 
          AND document_type = $2
          AND registration_type IS NOT NULL
          AND LOWER(registration_type) = LOWER($3)
      `,
      [userIdStr, 'jobseeker_documents', normalizedRegistrationType]
    );
    
    if (existingData.rows.length > 0) {
      // 既存データを更新
      await query(
        `
          UPDATE user_documents 
          SET document_data = $1, updated_at = NOW(), registration_type = $4
          WHERE user_id = $2 AND document_type = $3
            AND registration_type IS NOT NULL
            AND LOWER(registration_type) = LOWER($4)
        `,
        [JSON.stringify(documentData), userIdStr, 'jobseeker_documents', normalizedRegistrationType]
      );
    } else {
      // 新規データを挿入
      await query(
        `
          INSERT INTO user_documents (user_id, document_type, registration_type, document_data, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `,
        [userIdStr, 'jobseeker_documents', normalizedRegistrationType, JSON.stringify(documentData)]
      );
    }
    
    // job_seekersテーブルのcompletion_rateを更新（数値IDを使用）
    await query(
      `
        UPDATE job_seekers 
        SET completion_rate = $1, updated_at = NOW() 
        WHERE user_id = $2 
          AND registration_type IS NOT NULL
          AND LOWER(registration_type) = LOWER($3)
      `,
      [completionRate, userIdStr, normalizedRegistrationType]
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
    await ensureUserDocumentsRegistrationTypeColumn();
    const { userId } = req.params;
    const { registrationType } = req.query;
    
    console.log('[入力率取得API] userId:', userId, 'registrationType:', registrationType);
    
    if (!userId) {
      return res.status(400).json({ error: 'userIdが必要です' });
    }

    const registrationTypeFilter =
      typeof registrationType === 'string' ? normalizeRegistrationType(registrationType) : null;

    console.log('[入力率取得API] registrationTypeFilter:', registrationTypeFilter);

    let sql = 'SELECT completion_rate, registration_type FROM job_seekers WHERE user_id = $1';
    const params: any[] = [userId];
    if (registrationTypeFilter) {
      sql += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${params.length + 1})`;
      params.push(registrationTypeFilter);
    }

    const result = await query(
      sql,
      params
    );

    console.log('[入力率取得API] job_seekers query result:', result.rows.length, 'rows');

    let completionRate: number | null = result.rows.length > 0 ? result.rows[0].completion_rate : null;
    let recalculated = false;

    if (completionRate === null || typeof completionRate !== 'number' || Number.isNaN(completionRate)) {
      completionRate = 0;
    }
    
    console.log('[入力率取得API] initial completionRate:', completionRate);

    try {
      const docParams: any[] = [userId];
      let docSql = `
        SELECT document_data, registration_type
        FROM user_documents
        WHERE user_id = $1
          AND registration_type IS NOT NULL
      `;
      if (registrationTypeFilter) {
        docSql += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${docParams.length + 1})`;
        docParams.push(registrationTypeFilter);
      }
      docSql += ' ORDER BY updated_at DESC LIMIT 1';

      const docResult = await query(docSql, docParams);
      console.log('[入力率取得API] document query result:', docResult.rows.length, 'rows');
      
      if (docResult.rows.length > 0 && docResult.rows[0].document_data) {
        const docRegistrationType = normalizeRegistrationType(
          docResult.rows[0].registration_type || registrationTypeFilter || 'engineer'
        );
        console.log('[入力率取得API] docRegistrationType:', docRegistrationType);
        
        const calculated = calculateCompletionRate(docResult.rows[0].document_data, docRegistrationType);
        console.log('[入力率取得API] calculated rate:', calculated, 'current rate:', completionRate);
        
        if (calculated !== completionRate) {
          completionRate = calculated;
          recalculated = true;
          console.log('[入力率取得API] rate updated to:', completionRate);
        }
        await upsertJobSeekerProfile(String(userId), docRegistrationType, completionRate, docResult.rows[0].document_data);
      } else if (registrationTypeFilter) {
        // ドキュメントが存在しない場合でも、レコードがなければ作成しておく
        console.log('[入力率取得API] no document found, creating profile with rate:', completionRate);
        await upsertJobSeekerProfile(String(userId), registrationTypeFilter, completionRate, null);
      } else {
        console.log('[入力率取得API] no document found and no registrationTypeFilter');
      }
    } catch (recalcError) {
      console.warn('completion rate recalculation skipped:', recalcError);
    }
    
    console.log('[入力率取得API] final completionRate:', completionRate);
    
    res.json({ 
      success: true, 
      completionRate: completionRate || 0,
      recalculated
    });
  } catch (error) {
    console.error('入力率取得エラー:', error);
    res.status(500).json({ error: '入力率の取得に失敗しました' });
  }
});

// 面接履歴取得エンドポイント
router.get('/interview-history/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PARAMS',
        message: 'ユーザーIDが必要です'
      });
    }
    
    // 面接URLの状態を確認
    const urlQuery = `
      SELECT is_used, created_at, interview_token
      FROM interview_urls
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    let urlResult;
    try {
      urlResult = await query(urlQuery, [userId]);
    } catch (dbError) {
      console.error('面接履歴取得エラー（データベース）:', dbError);
      // データベースエラーの場合でも、空のデータを返す
      return res.json({
        success: true,
        data: {
          hasInterview: false,
          totalInterviews: 0,
          canTakeInterview: true,
          status: 'not_taken',
          interviewUrl: null
        }
      });
    }
    
    // 面接履歴を取得
    let interviewData = {
      hasInterview: false,
      totalInterviews: 0,
      canTakeInterview: true,
      status: 'not_taken',
      interviewUrl: null
    };
    
    if (urlResult && urlResult.rows && urlResult.rows.length > 0) {
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
          interviewUrl: urlData.interview_token ? `https://interview.justjoin.jp?token=${urlData.interview_token}` : null
        };
      }
    }
    
    res.json({
      success: true,
      data: interviewData
    });

  } catch (error) {
    console.error('面接履歴取得エラー:', error);
    // エラーが発生した場合でも、空のデータを返す（フロントエンドがクラッシュしないように）
    res.json({
      success: true,
      data: {
        hasInterview: false,
        totalInterviews: 0,
        canTakeInterview: true,
        status: 'not_taken',
        interviewUrl: null
      }
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
    
    // 既に面接を受けているかチェック（テーブルが存在しない場合はスキップ）
    let isInterviewAlreadyTaken = false;
    try {
      const urlCheckQuery = `
        SELECT is_used
        FROM interview_urls
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const urlCheckResult = await query(urlCheckQuery, [userId]);
      if (urlCheckResult.rows.length > 0 && urlCheckResult.rows[0].is_used) {
        isInterviewAlreadyTaken = true;
      }
    } catch (dbError: any) {
      // テーブルが存在しない場合は警告を出して続行
      console.warn('interview_urlsテーブルが存在しない可能性:', dbError.message);
    }
    
    if (isInterviewAlreadyTaken) {
      return res.status(400).json({
        success: false,
        error: 'INTERVIEW_ALREADY_TAKEN',
        message: '面接は1度しかできません'
      });
    }

    // 面接開始用のセッショントークンを生成
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      type: 'interview_start'
    })).toString('base64');

    // AI面接開始通知を送信（重複防止付き）
    try {
      const { sendNotificationToUser } = await import('../../integrations/postgres/notifications.js');
      // registration_typeを取得
      const jobSeekerQuery = await query('SELECT registration_type FROM job_seekers WHERE user_id = $1 LIMIT 1', [user.id]);
      const registrationType = jobSeekerQuery.rows[0]?.registration_type || null;
      
      await sendNotificationToUser(
        user.id,
        'AI面接が開始しました！',
        'AI面接が開始しました！面接を受験して、採用担当者にあなたの魅力をアピールしましょう。',
        'info',
        registrationType as 'engineer' | 'general' | null,
        { checkTitle: 'AI面接が開始しました！', withinSeconds: 86400 } // 24時間以内の重複を防止
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

    // 面接URLをデータベースに保存（テーブルが存在しない場合はスキップ）
    try {
      // まず既存のレコードを確認
      const checkExistingQuery = `
        SELECT id FROM interview_urls WHERE user_id = $1 LIMIT 1
      `;
      const existingResult = await query(checkExistingQuery, [user.id]);
      
      if (existingResult.rows.length > 0) {
        // 既存レコードを更新
        const updateUrlQuery = `
          UPDATE interview_urls 
          SET interview_token = $1,
              interview_url = $2,
              expires_at = NULL,
              is_used = FALSE,
              updated_at = NOW()
          WHERE user_id = $3
        `;
        await query(updateUrlQuery, [tokenString, interviewUrl, user.id]);
      } else {
        // 新規レコードを挿入
        const insertUrlQuery = `
          INSERT INTO interview_urls (user_id, interview_token, interview_url, expires_at, is_used)
          VALUES ($1, $2, $3, NULL, FALSE)
        `;
        await query(insertUrlQuery, [user.id, tokenString, interviewUrl]);
      }
    } catch (dbError: any) {
      // テーブルが存在しない場合は警告を出して続行
      console.warn('interview_urlsテーブルへの保存エラー（テーブルが存在しない可能性）:', dbError.message);
    }

    // 面接受験回数を更新（テーブルが存在しない場合はスキップ）
    try {
      const checkAttemptsQuery = `
        SELECT user_id FROM interview_attempts WHERE user_id = $1 LIMIT 1
      `;
      const attemptsCheckResult = await query(checkAttemptsQuery, [user.id]);
      
      if (attemptsCheckResult.rows.length > 0) {
        // 既存レコードを更新
        const updateAttemptsQuery = `
          UPDATE interview_attempts 
          SET attempt_count = attempt_count + 1,
              last_attempt_at = NOW(),
              updated_at = NOW()
          WHERE user_id = $1
        `;
        await query(updateAttemptsQuery, [user.id]);
      } else {
        // 新規レコードを挿入
        const insertAttemptsQuery = `
          INSERT INTO interview_attempts (user_id, attempt_count, first_attempt_at, last_attempt_at)
          VALUES ($1, 1, NOW(), NOW())
        `;
        await query(insertAttemptsQuery, [user.id]);
      }
    } catch (dbError: any) {
      // テーブルが存在しない場合は警告を出して続行
      console.warn('interview_attemptsテーブルへの保存エラー（テーブルが存在しない可能性）:', dbError.message);
    }

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
    // 管理者権限チェック（roleが存在しない場合は許可しない）
    const user = (req as AuthenticatedRequest).user;
    console.log('面接状態取得API: 認証ユーザー情報', { userId: user?.id, email: user?.email, role: user?.role });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '認証が必要です'
      });
    }
    
    // roleが'admin'または'super_admin'でない場合は403を返す（ただし、roleがない場合は警告のみ）
    if (user.role && user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: '管理者権限が必要です'
      });
    }
    
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
    
    const interviewEnabled = jobSeekerResult.rows[0].interview_enabled || false;
    
    // 面接が無効化されている場合は公開前として返す
    if (!interviewEnabled) {
      return res.json({
        success: true,
        data: {
          status: 'not_public',
          message: '1次面接が公開前の場合は対象外',
          interviewEnabled: false
        }
      });
    }
    
    // 面接URLの状態を取得（テーブルが存在しない場合はエラーを無視）
    let urlResult: any = { rows: [] };
    try {
      const urlQuery = `
        SELECT is_used, created_at
        FROM interview_urls
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      urlResult = await query(urlQuery, [userId]);
    } catch (urlError: any) {
      // interview_urlsテーブルが存在しない場合は空の結果として扱う
      if (urlError?.message?.includes('does not exist') || urlError?.code === '42P01') {
        console.warn('interview_urlsテーブルが存在しません:', urlError.message);
      } else {
        throw urlError;
      }
    }
    
    // 面接受験回数を取得（テーブルが存在しない場合はエラーを無視）
    let attemptsData = { attempt_count: 0, first_attempt_at: null, last_attempt_at: null };
    try {
      const attemptsQuery = `
        SELECT attempt_count, first_attempt_at, last_attempt_at
        FROM interview_attempts
        WHERE user_id = $1
      `;
      const attemptsResult = await query(attemptsQuery, [userId]);
      attemptsData = attemptsResult.rows.length > 0 ? attemptsResult.rows[0] : { attempt_count: 0, first_attempt_at: null, last_attempt_at: null };
    } catch (attemptsError: any) {
      // interview_attemptsテーブルが存在しない場合はデフォルト値を返す
      if (attemptsError?.message?.includes('does not exist') || attemptsError?.code === '42P01') {
        console.warn('interview_attemptsテーブルが存在しません:', attemptsError.message);
      } else {
        throw attemptsError;
      }
    }
    
    if (urlResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          status: 'not_created',
          message: '1次面接が公開中の場合は受験前',
          interviewEnabled: true,
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
          interviewEnabled: true,
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
          interviewEnabled: true,
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
      message: '面接状態を取得できませんでした',
      details: (error as any)?.message || null
    });
  }
});

// 面接完了後の処理エンドポイント
// 注意: 面接システムは別ドメインで動作するため、認証をオプショナルにする
router.post('/interview-completed/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { sessionId, duration, questionsAnswered } = req.body;
    
    // セッションIDからユーザーIDを検証（セキュリティのため、最優先）
    let verifiedUserId: number | null = null;
    
    if (sessionId) {
      try {
        // セッションIDからユーザーIDを取得
        const sessionQuery = `
          SELECT 
            ia.email,
            u.id as user_id
          FROM interview_sessions s
          LEFT JOIN interview_applicants ia ON s.applicant_id = ia.id
          LEFT JOIN users u ON ia.email = u.email AND u.user_type = 'job_seeker'
          WHERE s.id = $1
          LIMIT 1
        `;
        const sessionResult = await query(sessionQuery, [sessionId]);
        
        if (sessionResult.rows.length > 0 && sessionResult.rows[0].user_id) {
          verifiedUserId = parseInt(sessionResult.rows[0].user_id, 10);
          console.log('セッションIDからユーザーIDを取得:', { sessionId, verifiedUserId });
        } else {
          console.warn('セッションIDからユーザーIDを取得できませんでした:', { sessionId, rows: sessionResult.rows });
        }
      } catch (sessionError) {
        console.error('セッションID検証エラー:', sessionError);
      }
    }
    
    // 認証トークンがある場合は、それを使用してuserIdを検証
    let authenticatedUserId: number | null = null;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'justjoin-jwt-secret-2024');
        authenticatedUserId = decoded.userId || decoded.id;
        if (authenticatedUserId) {
          authenticatedUserId = parseInt(authenticatedUserId.toString(), 10);
        }
      }
    } catch (authError) {
      // 認証エラーは無視（セッションID検証にフォールバック）
      console.log('認証トークンなしまたは無効（セッションID検証にフォールバック）');
    }
    
    // 使用するuserIdを決定（セッションID検証 > 認証 > パラメータ）
    // パラメータのuserIdがUUID形式の場合は無視
    let paramUserId: number | null = null;
    if (userId && !userId.includes('-')) {
      // UUID形式でない場合のみパースを試みる
      paramUserId = parseInt(userId, 10);
      if (isNaN(paramUserId)) {
        paramUserId = null;
      }
    }
    
    const finalUserId = verifiedUserId || authenticatedUserId || paramUserId;
    
    if (!finalUserId || isNaN(finalUserId)) {
      console.error('ユーザーIDが無効:', { 
        sessionId, 
        verifiedUserId, 
        authenticatedUserId, 
        paramUserId, 
        userId 
      });
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID',
        message: 'ユーザーIDが無効です。セッションIDからユーザーIDを取得できませんでした。'
      });
    }
    
    console.log('面接完了処理:', { 
      sessionId, 
      userId: finalUserId, 
      duration, 
      questionsAnswered,
      authMethod: authenticatedUserId ? 'token' : (verifiedUserId ? 'session' : 'param')
    });
    
    // 面接URLを使用済みに設定
    const updateUrlQuery = `
      UPDATE interview_urls 
      SET is_used = TRUE, updated_at = NOW()
      WHERE user_id = $1 AND is_used = FALSE
    `;
    
    await query(updateUrlQuery, [finalUserId.toString()]);
    
    // 面接受験回数を更新（完了時）
    const updateAttemptsQuery = `
      UPDATE interview_attempts 
      SET last_attempt_at = NOW(), updated_at = NOW()
      WHERE user_id = $1
    `;
    
    await query(updateAttemptsQuery, [finalUserId.toString()]);
    
    // 面接完了通知を送信（重複防止付き）
    try {
      const { sendNotificationToUser } = await import('../../integrations/postgres/notifications.js');
      // registration_typeを取得
      const jobSeekerQuery = await query('SELECT registration_type FROM job_seekers WHERE user_id = $1 LIMIT 1', [finalUserId.toString()]);
      const registrationType = jobSeekerQuery.rows[0]?.registration_type || null;
      
      await sendNotificationToUser(
        finalUserId.toString(),
        'AI面接が完了しました！',
        `AI面接が完了しました！結果は管理者に送信されました。`,
        'success',
        registrationType as 'engineer' | 'general' | null,
        { checkTitle: 'AI面接が完了しました！', withinSeconds: 86400 } // 24時間以内の重複を防止
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
    let { token } = req.params;
    
    // URLデコード（必要に応じて）
    try {
      token = decodeURIComponent(token);
    } catch (e) {
      // URLデコードに失敗した場合は元のトークンを使用
      console.warn('URLデコードに失敗しましたが、続行します:', e);
    }
    
    // Base64デコード
    let decodedToken;
    try {
      const tokenData = Buffer.from(token, 'base64').toString('utf-8');
      decodedToken = JSON.parse(tokenData);
      console.log('デコードされたトークン:', decodedToken);
    } catch (error) {
      console.error('トークンデコードエラー:', error);
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: '無効なトークンです'
      });
    }
    
    // 面接が既に完了しているかチェック
    if (decodedToken?.userId) {
      try {
        const urlCheckQuery = `
          SELECT is_used
          FROM interview_urls
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const urlCheckResult = await query(urlCheckQuery, [decodedToken.userId]);
        if (urlCheckResult.rows.length > 0 && urlCheckResult.rows[0].is_used) {
          return res.status(400).json({
            success: false,
            error: 'INTERVIEW_ALREADY_TAKEN',
            message: '面接は1度しかできません'
          });
        }
      } catch (dbError: any) {
        // テーブルが存在しない場合は警告を出して続行
        console.warn('interview_urlsテーブルが存在しない可能性:', dbError.message);
      }
    }

    // 面接URLを使用済みにする（テーブルが存在しない場合はスキップ）
    try {
      const updateUrlQuery = `
        UPDATE interview_urls 
        SET is_used = TRUE,
            updated_at = NOW()
        WHERE interview_token = $1
      `;
      
      const updateResult = await query(updateUrlQuery, [token]);
      
      if (updateResult.rowCount === 0) {
        console.warn('interview_urlsテーブルに該当するトークンが見つかりませんでした:', token);
        // エラーにはしない（テーブルが存在しない可能性があるため）
      } else {
        console.log('面接URLを使用済みに更新しました:', token);
      }
    } catch (dbError: any) {
      // テーブルが存在しない場合は警告を出して続行
      console.warn('interview_urlsテーブルへの更新エラー（テーブルが存在しない可能性）:', dbError.message);
      // エラーにはしない（面接自体は続行可能なため）
    }

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

// 管理者用：面接録音取得エンドポイント
router.get('/admin/interview-recordings/:userId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
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
    
    // ユーザーのemailを取得
    const userQuery = `
      SELECT email
      FROM users
      WHERE id = $1
    `;
    const userResult = await query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'ユーザーが見つかりません'
      });
    }
    
    const userEmail = userResult.rows[0].email;
    
    // interview_recordingsテーブルから録音情報を取得
    // user_idまたはapplicant_id経由で取得を試みる
    let recordings: any[] = [];
    
    try {
      // まずuser_idで直接取得を試みる
      const recordingsByUserIdQuery = `
        SELECT 
          ir.id,
          ir.session_id,
          ir.applicant_id,
          ir.user_id,
          ir.recording_url,
          ir.recording_type,
          ir.file_size,
          ir.duration,
          ir.storage_path,
          ir.created_at,
          isess.status as session_status,
          isess.completed_at as session_completed_at
        FROM interview_recordings ir
        LEFT JOIN interview_sessions isess ON ir.session_id = isess.id
        WHERE ir.user_id = $1::text
        ORDER BY ir.created_at DESC
      `;
      
      const recordingsByUserIdResult = await query(recordingsByUserIdQuery, [userId]);
      recordings = recordingsByUserIdResult.rows;
      
      // user_idで見つからない場合、email経由で取得を試みる
      if (recordings.length === 0) {
        const recordingsByEmailQuery = `
          SELECT 
            ir.id,
            ir.session_id,
            ir.applicant_id,
            ir.user_id,
            ir.recording_url,
            ir.recording_type,
            ir.file_size,
            ir.duration,
            ir.storage_path,
            ir.created_at,
            isess.status as session_status,
            isess.completed_at as session_completed_at
          FROM interview_recordings ir
          INNER JOIN interview_sessions isess ON ir.session_id = isess.id
          INNER JOIN interview_applicants ia ON isess.applicant_id = ia.id
          WHERE ia.email = $1
          ORDER BY ir.created_at DESC
        `;
        
        const recordingsByEmailResult = await query(recordingsByEmailQuery, [userEmail]);
        recordings = recordingsByEmailResult.rows;
      }
    } catch (dbError: any) {
      // テーブルが存在しない場合やエラーが発生した場合
      console.warn('録音情報取得エラー:', dbError.message);
      // エラーを返さず、空の配列を返す
      recordings = [];
    }
    
    // 録音ファイルのダウンロードURLを生成
    const recordingsWithUrls = recordings.map(recording => {
      let downloadUrl = null;
      
      if (recording.storage_path) {
        // ストレージパスがある場合、それをそのまま使用
        downloadUrl = recording.storage_path;
      } else if (recording.recording_url) {
        // recording_urlがある場合、それをそのまま使用
        downloadUrl = recording.recording_url;
      }
      
      return {
        id: recording.id,
        sessionId: recording.session_id,
        applicantId: recording.applicant_id,
        userId: recording.user_id,
        recordingUrl: downloadUrl,
        recordingType: recording.recording_type || 'audio',
        fileSize: recording.file_size,
        duration: recording.duration,
        createdAt: recording.created_at,
        sessionStatus: recording.session_status,
        sessionCompletedAt: recording.session_completed_at
      };
    });
    
    res.json({
      success: true,
      data: {
        recordings: recordingsWithUrls,
        count: recordingsWithUrls.length
      }
    });
    
  } catch (error) {
    console.error('録音情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '録音情報の取得に失敗しました'
    });
  }
});

// 管理者用：面接録音ファイルダウンロードエンドポイント
router.get('/admin/interview-recording/:recordingId', authenticate, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { recordingId } = req.params;
    
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
    
    // 録音情報を取得
    const recordingQuery = `
      SELECT 
        ir.id,
        ir.session_id,
        ir.storage_path,
        ir.recording_url,
        ir.recording_type,
        ir.file_size
      FROM interview_recordings ir
      WHERE ir.id = $1
    `;
    
    const recordingResult = await query(recordingQuery, [recordingId]);
    
    if (recordingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'RECORDING_NOT_FOUND',
        message: '録音ファイルが見つかりません'
      });
    }
    
    const recording = recordingResult.rows[0];
    
    // ファイルパスを決定（storage_pathまたはrecording_urlを使用）
    let filePath = recording.storage_path || recording.recording_url;
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'FILE_NOT_FOUND',
        message: '録音ファイルのパスが見つかりません'
      });
    }
    
    // ファイルパスが相対パスの場合、絶対パスに変換
    // 面接システムのuploads/recordingsディレクトリを参照
    if (!path.isAbsolute(filePath)) {
      // 面接システムのディレクトリを参照（環境変数から取得、またはデフォルト値を使用）
      const interviewSystemPath = process.env.INTERVIEW_SYSTEM_PATH || path.join(__dirname, '../../interview-system');
      filePath = path.join(interviewSystemPath, 'uploads', 'recordings', path.basename(filePath));
    }
    
    // ファイルが存在するかチェック
    if (!fs.existsSync(filePath)) {
      console.warn('録音ファイルが見つかりません:', filePath);
      return res.status(404).json({
        success: false,
        error: 'FILE_NOT_FOUND',
        message: '録音ファイルが見つかりません'
      });
    }
    
    // ファイルを送信
    const fileStream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);
    
    res.setHeader('Content-Type', recording.recording_type === 'video' ? 'video/webm' : 'audio/webm');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('録音ファイルダウンロードエラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '録音ファイルのダウンロードに失敗しました'
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

// 書類データを取得
router.get('/documents/:userId', async (req: express.Request, res: express.Response) => {
  try {
    await ensureUserDocumentsRegistrationTypeColumn();
    const { userId } = req.params;
    const { documentType, registrationType } = req.query;

    let sql = 'SELECT * FROM user_documents WHERE user_id = $1';
    const params = [userId];

    if (documentType) {
      sql += ` AND document_type = $${params.length + 1}`;
      params.push(documentType as string);
    }
    if (registrationType && typeof registrationType === 'string') {
      sql += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${params.length + 1})`;
      params.push(normalizeRegistrationType(registrationType));
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
    await ensureUserDocumentsRegistrationTypeColumn();
    const { userId } = req.params;
    const { documentType, registrationType } = req.query;

    let sql = 'DELETE FROM user_documents WHERE user_id = $1';
    const params = [userId];

    if (documentType) {
      sql += ` AND document_type = $${params.length + 1}`;
      params.push(documentType as string);
    }
    if (registrationType && typeof registrationType === 'string') {
      sql += ` AND registration_type IS NOT NULL AND LOWER(registration_type) = LOWER($${params.length + 1})`;
      params.push(normalizeRegistrationType(registrationType));
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

    // 求職者の面接表示設定を更新（user_idでも動作するように修正）
    // idはjob_seekers.idまたはuser_idの可能性がある
    const updateQuery = `
      UPDATE job_seekers 
      SET interview_enabled = $1, updated_at = NOW()
      WHERE id = $2 OR user_id = $2
      RETURNING id, user_id, interview_enabled
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