// ブラウザ環境では実行しない
const isServer = typeof window === 'undefined';
// ブラウザ環境用のモックデータ
const mockJobSeekers = [
    {
        id: '1',
        user_id: 'user-1',
        full_name: '山田 太郎',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone: '090-1234-5678',
        address: '東京都渋谷区',
        desired_job_title: 'フロントエンドエンジニア',
        experience_years: 5,
        skills: ['React', 'TypeScript', 'JavaScript'],
        self_introduction: 'Webアプリケーション開発の経験があります',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }
];
export const jobSeekersRepository = {
    // 求職者プロフィールを作成
    async create(data) {
        if (!isServer) {
            console.log('Creating job seeker (mock):', data);
            const newJobSeeker = {
                id: Date.now().toString(),
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            mockJobSeekers.push(newJobSeeker);
            return newJobSeeker;
        }
        const { query } = await import('./client.js');
        const result = await query(`
      INSERT INTO job_seekers (
        user_id, full_name, date_of_birth, gender, phone, address, nationality,
        desired_job_title, experience_years, skills, self_introduction, age
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
            data.user_id, data.full_name, data.date_of_birth, data.gender,
            data.phone, data.address, data.nationality, data.desired_job_title,
            data.experience_years, data.skills, data.self_introduction, data.age
        ]);
        return result.rows[0];
    },
    // ユーザーIDで求職者プロフィールを取得
    async getByUserId(userId) {
        if (!isServer) {
            return mockJobSeekers.find(seeker => seeker.user_id === userId) || null;
        }
        const { query } = await import('./client.js');
        const result = await query(`
      SELECT * FROM job_seekers WHERE user_id = $1
    `, [userId]);
        return result.rows[0] || null;
    },
    // 求職者プロフィールを更新
    async update(userId, data) {
        if (!isServer) {
            const index = mockJobSeekers.findIndex(seeker => seeker.user_id === userId);
            if (index === -1)
                return null;
            mockJobSeekers[index] = {
                ...mockJobSeekers[index],
                ...data,
                updated_at: new Date().toISOString()
            };
            return mockJobSeekers[index];
        }
        const { query } = await import('./client.js');
        const result = await query(`
      UPDATE job_seekers SET
        full_name = COALESCE($2, full_name),
        date_of_birth = COALESCE($3, date_of_birth),
        gender = COALESCE($4, gender),
        phone = COALESCE($5, phone),
        address = COALESCE($6, address),
        nationality = COALESCE($7, nationality),
        desired_job_title = COALESCE($8, desired_job_title),
        experience_years = COALESCE($9, experience_years),
        skills = COALESCE($10, skills),
        self_introduction = COALESCE($11, self_introduction),
        age = COALESCE($12, age)
      WHERE user_id = $1
      RETURNING *
    `, [
            userId, data.full_name, data.date_of_birth, data.gender,
            data.phone, data.address, data.nationality, data.desired_job_title,
            data.experience_years, data.skills, data.self_introduction, data.age
        ]);
        return result.rows[0] || null;
    },
    // 求職者プロフィールを削除
    async delete(userId) {
        if (!isServer) {
            const index = mockJobSeekers.findIndex(seeker => seeker.user_id === userId);
            if (index === -1)
                return false;
            mockJobSeekers.splice(index, 1);
            return true;
        }
        const { query } = await import('./client.js');
        const result = await query(`
      DELETE FROM job_seekers WHERE user_id = $1
    `, [userId]);
        return result.rowCount > 0;
    },
    // 全求職者を取得（管理者用）
    async getAll() {
        if (!isServer) {
            return [...mockJobSeekers];
        }
        try {
            const { query } = await import('./client.js');
            const result = await query(`
        SELECT 
          js.*,
          u.email as user_email,
          u.status as user_status,
          ud.document_data
        FROM job_seekers js
        LEFT JOIN users u ON js.user_id = u.id
        LEFT JOIN (
          SELECT DISTINCT ON (user_id) 
            user_id, 
            document_data,
            created_at
          FROM user_documents 
          ORDER BY user_id, created_at DESC
        ) ud ON js.user_id = ud.user_id
        ORDER BY js.created_at DESC
      `);
            // skillsフィールドを配列に変換し、document_dataから詳細情報を抽出
            const processedRows = result.rows.map(row => {
                if (row.skills && typeof row.skills === 'string') {
                    try {
                        row.skills = JSON.parse(row.skills);
                    }
                    catch (e) {
                        console.warn('Skills JSON parse error:', e);
                        row.skills = [];
                    }
                }
                else if (!row.skills) {
                    row.skills = [];
                }
                // document_dataから詳細情報を抽出
                if (row.document_data) {
                    try {
                        const docData = row.document_data;
                        // 写真URLを取得
                        if (docData.resume && docData.resume.photoUrl) {
                            row.profile_photo = docData.resume.photoUrl;
                        }
                        // 日本語レベル（受験予定資格）を取得
                        if (docData.japaneseInfo && docData.japaneseInfo.nextJapaneseTestLevel) {
                            row.japanese_level = docData.japaneseInfo.nextJapaneseTestLevel;
                        }
                        else if (docData.nextJapaneseTestLevel) {
                            row.japanese_level = docData.nextJapaneseTestLevel;
                        }
                        // ★日本語資格レベル（certificateStatus.name）を取得
                        if (docData.japaneseInfo && docData.japaneseInfo.certificateStatus && docData.japaneseInfo.certificateStatus.name) {
                            row.japanese_certificate_level = docData.japaneseInfo.certificateStatus.name;
                        }
                        else if (docData.certificateStatus && docData.certificateStatus.name) {
                            row.japanese_certificate_level = docData.certificateStatus.name;
                        }
                        // 自己紹介を取得（document_dataの方が優先）
                        if (docData.selfIntroduction) {
                            row.self_introduction = docData.selfIntroduction;
                        }
                        // 生年月日を取得（document_dataの方が詳細）
                        if (docData.birthDate) {
                            row.date_of_birth = docData.birthDate;
                        }
                        // 電話番号を取得（document_dataの方が詳細）
                        if (docData.livePhoneNumber) {
                            row.phone = docData.livePhoneNumber;
                        }
                        // 住所を取得（document_dataの方が詳細）
                        if (docData.liveAddress) {
                            row.address = docData.liveAddress;
                        }
                        // フルネームを取得（document_dataの方が詳細）
                        if (docData.lastName && docData.firstName) {
                            row.full_name = `${docData.lastName} ${docData.firstName}`;
                        }
                        console.log(`User ${row.user_id} document data processed:`, {
                            photo: row.profile_photo ? 'Found' : 'Not found',
                            japanese_level: row.japanese_level || 'Not set',
                            japanese_certificate_level: row.japanese_certificate_level || 'Not set',
                            self_introduction: row.self_introduction ? 'Found' : 'Not found'
                        });
                    }
                    catch (e) {
                        console.warn('Document data parse error for user', row.user_id, e);
                    }
                }
                return row;
            });
            return processedRows;
        }
        catch (error) {
            console.error('Error fetching all job seekers:', error);
            throw error;
        }
    }
};
