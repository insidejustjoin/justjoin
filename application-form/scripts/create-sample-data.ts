import 'dotenv/config';
import { query } from '../src/integrations/postgres';

interface User {
  id: string;
  email: string;
}

async function createSampleData() {
  console.log('Creating sample data for GCP Cloud SQL...');
  
  try {
    // サンプルユーザーを作成
    const users = [
      { email: 'john.doe@example.com' },
      { email: 'jane.smith@example.com' },
      { email: 'mike.johnson@example.com' },
      { email: 'sarah.wilson@example.com' },
      { email: 'david.brown@example.com' }
    ];

    const createdUsers: User[] = [];
    for (const user of users) {
      const result = await query(`
        INSERT INTO users (email) VALUES ($1) 
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id, email
      `, [user.email]);
      createdUsers.push(result.rows[0] as User);
      console.log(`Created user: ${user.email}`);
    }

    // サンプル求職者プロフィールを作成
    const jobSeekers = [
      {
        user_id: createdUsers[0].id,
        full_name: 'John Doe',
        date_of_birth: '1990-05-15',
        gender: 'male' as const,
        email: 'john.doe@example.com',
        phone: '+81-90-1234-5678',
        address: '東京都渋谷区1-1-1',
        desired_job_title: 'フロントエンドエンジニア',
        experience_years: 5,
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        self_introduction: '5年間のフロントエンド開発経験があります。ReactとTypeScriptを中心に、ユーザーフレンドリーなWebアプリケーションの開発に携わってきました。'
      },
      {
        user_id: createdUsers[1].id,
        full_name: 'Jane Smith',
        date_of_birth: '1988-12-03',
        gender: 'female' as const,
        email: 'jane.smith@example.com',
        phone: '+81-80-9876-5432',
        address: '大阪府大阪市2-2-2',
        desired_job_title: 'UI/UXデザイナー',
        experience_years: 7,
        skills: ['Figma', 'Adobe Creative Suite', 'Sketch', 'Prototyping'],
        self_introduction: '7年間のデザイン経験があり、ユーザー中心のデザイン思考を大切にしています。Figmaを使ったプロトタイピングが得意です。'
      },
      {
        user_id: createdUsers[2].id,
        full_name: 'Mike Johnson',
        date_of_birth: '1992-08-20',
        gender: 'male' as const,
        email: 'mike.johnson@example.com',
        phone: '+81-70-5555-1234',
        address: '神奈川県横浜市3-3-3',
        desired_job_title: 'バックエンドエンジニア',
        experience_years: 4,
        skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
        self_introduction: 'PythonとDjangoを使ったバックエンド開発が専門です。スケーラブルなシステム設計に興味があります。'
      },
      {
        user_id: createdUsers[3].id,
        full_name: 'Sarah Wilson',
        date_of_birth: '1995-03-10',
        gender: 'female' as const,
        email: 'sarah.wilson@example.com',
        phone: '+81-60-7777-8888',
        address: '愛知県名古屋市4-4-4',
        desired_job_title: 'データサイエンティスト',
        experience_years: 3,
        skills: ['Python', 'R', 'SQL', 'Machine Learning'],
        self_introduction: 'データ分析と機械学習が専門です。ビジネス課題をデータドリブンに解決することに情熱を持っています。'
      },
      {
        user_id: createdUsers[4].id,
        full_name: 'David Brown',
        date_of_birth: '1985-11-25',
        gender: 'male' as const,
        email: 'david.brown@example.com',
        phone: '+81-50-9999-0000',
        address: '福岡県福岡市5-5-5',
        desired_job_title: 'プロダクトマネージャー',
        experience_years: 8,
        skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'],
        self_introduction: '8年間のプロダクトマネジメント経験があります。ユーザー価値の最大化とビジネス成長の両立を目指しています。'
      }
    ];

    for (const jobSeeker of jobSeekers) {
      await query(`
        INSERT INTO job_seekers (
          user_id, full_name, date_of_birth, gender, email, phone, address,
          desired_job_title, experience_years, skills, self_introduction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          date_of_birth = EXCLUDED.date_of_birth,
          gender = EXCLUDED.gender,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          desired_job_title = EXCLUDED.desired_job_title,
          experience_years = EXCLUDED.experience_years,
          skills = EXCLUDED.skills,
          self_introduction = EXCLUDED.self_introduction
      `, [
        jobSeeker.user_id, jobSeeker.full_name, jobSeeker.date_of_birth, jobSeeker.gender,
        jobSeeker.email, jobSeeker.phone, jobSeeker.address, jobSeeker.desired_job_title,
        jobSeeker.experience_years, jobSeeker.skills, jobSeeker.self_introduction
      ]);
      console.log(`Created job seeker profile: ${jobSeeker.full_name}`);
    }

    // データ確認
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const jobSeekerCount = await query('SELECT COUNT(*) as count FROM job_seekers');
    
    console.log('\n✅ Sample data created successfully!');
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Job Seekers: ${jobSeekerCount.rows[0].count}`);
    
    // サンプルデータの表示
    const allJobSeekers = await query(`
      SELECT js.*, u.email as user_email 
      FROM job_seekers js 
      JOIN users u ON js.user_id = u.id 
      ORDER BY js.created_at DESC
    `);
    
    console.log('\n📋 Sample Job Seekers:');
    allJobSeekers.rows.forEach((seeker: any, index: number) => {
      console.log(`${index + 1}. ${seeker.full_name} - ${seeker.desired_job_title} (${seeker.experience_years}年経験)`);
    });

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData(); 