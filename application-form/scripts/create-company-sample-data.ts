import 'dotenv/config';
import { query } from '../src/integrations/postgres';

interface User {
  id: string;
  email: string;
}

interface Company {
  id: string;
  user_id: string;
  company_name: string;
}

async function createCompanySampleData() {
  console.log('Creating company and job posting sample data for GCP Cloud SQL...');
  
  try {
    // 企業用のサンプルユーザーを作成
    const companyUsers = [
      { email: 'hr@techcorp.com' },
      { email: 'recruit@startupinc.com' },
      { email: 'jobs@designstudio.com' },
      { email: 'careers@datatech.com' },
      { email: 'hr@productlab.com' }
    ];

    const createdCompanyUsers: User[] = [];
    for (const user of companyUsers) {
      const result = await query(`
        INSERT INTO users (email) VALUES ($1) 
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id, email
      `, [user.email]);
      createdCompanyUsers.push(result.rows[0] as User);
      console.log(`Created company user: ${user.email}`);
    }

    // サンプル企業を作成
    const companies = [
      {
        user_id: createdCompanyUsers[0].id,
        company_name: 'TechCorp株式会社',
        industry: 'IT・ソフトウェア',
        company_size: 'large' as const,
        founded_year: 2010,
        website: 'https://techcorp.com',
        description: '大手IT企業として、革新的なソリューションを提供しています。',
        address: '東京都新宿区西新宿1-1-1',
        phone: '+81-3-1234-5678',
        email: 'hr@techcorp.com',
        logo_url: 'https://example.com/techcorp-logo.png'
      },
      {
        user_id: createdCompanyUsers[1].id,
        company_name: 'StartupInc',
        industry: 'フィンテック',
        company_size: 'startup' as const,
        founded_year: 2020,
        website: 'https://startupinc.com',
        description: '次世代のフィンテックソリューションを開発するスタートアップです。',
        address: '東京都渋谷区神南1-1-1',
        phone: '+81-3-9876-5432',
        email: 'recruit@startupinc.com',
        logo_url: 'https://example.com/startupinc-logo.png'
      },
      {
        user_id: createdCompanyUsers[2].id,
        company_name: 'DesignStudio',
        industry: 'デザイン・クリエイティブ',
        company_size: 'medium' as const,
        founded_year: 2015,
        website: 'https://designstudio.com',
        description: 'ユーザー体験を重視したデザインサービスを提供しています。',
        address: '大阪府大阪市北区梅田1-1-1',
        phone: '+81-6-1111-2222',
        email: 'jobs@designstudio.com',
        logo_url: 'https://example.com/designstudio-logo.png'
      },
      {
        user_id: createdCompanyUsers[3].id,
        company_name: 'DataTech Solutions',
        industry: 'データ・AI',
        company_size: 'medium' as const,
        founded_year: 2018,
        website: 'https://datatech.com',
        description: 'AIとデータ分析を活用したビジネスソリューションを提供しています。',
        address: '神奈川県横浜市西区みなとみらい1-1-1',
        phone: '+81-45-3333-4444',
        email: 'careers@datatech.com',
        logo_url: 'https://example.com/datatech-logo.png'
      },
      {
        user_id: createdCompanyUsers[4].id,
        company_name: 'ProductLab',
        industry: 'プロダクト・SaaS',
        company_size: 'small' as const,
        founded_year: 2022,
        website: 'https://productlab.com',
        description: '革新的なプロダクト開発に取り組むチームです。',
        address: '福岡県福岡市博多区博多駅前1-1-1',
        phone: '+81-92-5555-6666',
        email: 'hr@productlab.com',
        logo_url: 'https://example.com/productlab-logo.png'
      }
    ];

    const createdCompanies: Company[] = [];
    for (const company of companies) {
      const result = await query(`
        INSERT INTO companies (
          user_id, company_name, industry, company_size, founded_year,
          website, description, address, phone, email, logo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          industry = EXCLUDED.industry,
          company_size = EXCLUDED.company_size,
          founded_year = EXCLUDED.founded_year,
          website = EXCLUDED.website,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          logo_url = EXCLUDED.logo_url
        RETURNING id, user_id, company_name
      `, [
        company.user_id, company.company_name, company.industry, company.company_size,
        company.founded_year, company.website, company.description, company.address,
        company.phone, company.email, company.logo_url
      ]);
      createdCompanies.push(result.rows[0] as Company);
      console.log(`Created company: ${company.company_name}`);
    }

    // サンプル求人情報を作成
    const jobPostings = [
      {
        company_id: createdCompanies[0].id,
        title: 'シニアフロントエンドエンジニア',
        description: 'React、TypeScriptを使用した大規模Webアプリケーションの開発を担当していただきます。',
        requirements: ['React', 'TypeScript', 'Node.js', '5年以上の経験'],
        salary_min: 600000,
        salary_max: 900000,
        location: '東京都新宿区',
        job_type: 'full_time' as const,
        remote_work: true,
        status: 'active' as const
      },
      {
        company_id: createdCompanies[0].id,
        title: 'バックエンドエンジニア',
        description: 'Python、Djangoを使用したAPI開発を担当していただきます。',
        requirements: ['Python', 'Django', 'PostgreSQL', '3年以上の経験'],
        salary_min: 500000,
        salary_max: 800000,
        location: '東京都新宿区',
        job_type: 'full_time' as const,
        remote_work: false,
        status: 'active' as const
      },
      {
        company_id: createdCompanies[1].id,
        title: 'フルスタックエンジニア',
        description: 'スタートアップでの幅広い技術スタックでの開発を担当していただきます。',
        requirements: ['JavaScript', 'React', 'Node.js', 'スタートアップ経験歓迎'],
        salary_min: 400000,
        salary_max: 600000,
        location: '東京都渋谷区',
        job_type: 'full_time' as const,
        remote_work: true,
        status: 'active' as const
      },
      {
        company_id: createdCompanies[2].id,
        title: 'UI/UXデザイナー',
        description: 'ユーザー体験を重視したデザインを担当していただきます。',
        requirements: ['Figma', 'Adobe Creative Suite', 'プロトタイピング', '3年以上の経験'],
        salary_min: 450000,
        salary_max: 700000,
        location: '大阪府大阪市',
        job_type: 'full_time' as const,
        remote_work: true,
        status: 'active' as const
      },
      {
        company_id: createdCompanies[3].id,
        title: 'データサイエンティスト',
        description: '機械学習モデルの開発とデータ分析を担当していただきます。',
        requirements: ['Python', 'R', 'SQL', '機械学習', '2年以上の経験'],
        salary_min: 500000,
        salary_max: 750000,
        location: '神奈川県横浜市',
        job_type: 'full_time' as const,
        remote_work: true,
        status: 'active' as const
      },
      {
        company_id: createdCompanies[4].id,
        title: 'プロダクトマネージャー',
        description: 'プロダクト戦略とユーザーリサーチを担当していただきます。',
        requirements: ['プロダクト戦略', 'Agile', 'ユーザーリサーチ', '5年以上の経験'],
        salary_min: 600000,
        salary_max: 900000,
        location: '福岡県福岡市',
        job_type: 'full_time' as const,
        remote_work: true,
        status: 'active' as const
      }
    ];

    for (const jobPosting of jobPostings) {
      await query(`
        INSERT INTO job_postings (
          company_id, title, description, requirements, salary_min,
          salary_max, location, job_type, remote_work, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        jobPosting.company_id, jobPosting.title, jobPosting.description, jobPosting.requirements,
        jobPosting.salary_min, jobPosting.salary_max, jobPosting.location, jobPosting.job_type,
        jobPosting.remote_work, jobPosting.status
      ]);
      console.log(`Created job posting: ${jobPosting.title}`);
    }

    // データ確認
    const companyCount = await query('SELECT COUNT(*) as count FROM companies');
    const jobPostingCount = await query('SELECT COUNT(*) as count FROM job_postings');
    
    console.log('\n✅ Company and job posting sample data created successfully!');
    console.log(`Companies: ${companyCount.rows[0].count}`);
    console.log(`Job Postings: ${jobPostingCount.rows[0].count}`);
    
    // サンプルデータの表示
    const allJobPostings = await query(`
      SELECT jp.*, c.company_name 
      FROM job_postings jp 
      JOIN companies c ON jp.company_id = c.id 
      ORDER BY jp.created_at DESC
    `);
    
    console.log('\n📋 Sample Job Postings:');
    allJobPostings.rows.forEach((posting: any, index: number) => {
      console.log(`${index + 1}. ${posting.title} at ${posting.company_name} (${posting.salary_min}万円〜${posting.salary_max}万円)`);
    });

  } catch (error) {
    console.error('❌ Error creating company sample data:', error);
    process.exit(1);
  }
}

createCompanySampleData(); 