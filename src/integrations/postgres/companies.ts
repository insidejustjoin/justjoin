// ブラウザ環境では実行しない
const isServer = typeof window === 'undefined';

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large';
  founded_year?: number;
  website?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyData {
  user_id: string;
  company_name: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large';
  founded_year?: number;
  website?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

export interface UpdateCompanyData {
  company_name?: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large';
  founded_year?: number;
  website?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

// ブラウザ環境用のモックデータ
const mockCompanies: Company[] = [
  {
    id: '1',
    user_id: 'company-1',
    company_name: '株式会社サンプル',
    industry: 'IT・ソフトウェア',
    company_size: 'medium',
    founded_year: 2010,
    website: 'https://example.com',
    description: '革新的なソフトウェア開発企業',
    address: '東京都新宿区',
    phone: '03-1234-5678',
    email: 'info@example.com',
    logo_url: 'https://example.com/logo.png',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const companiesRepository = {
  // 企業を作成
  async create(data: CreateCompanyData): Promise<Company> {
    if (!isServer) {
      console.log('Creating company (mock):', data);
      const newCompany: Company = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockCompanies.push(newCompany);
      return newCompany;
    }

    const { query } = await import('./client.js');
    const result = await query(`
      INSERT INTO companies (
        user_id, company_name, industry, company_size, founded_year,
        website, description, address, phone, email, logo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      data.user_id, data.company_name, data.industry, data.company_size,
      data.founded_year, data.website, data.description, data.address,
      data.phone, data.email, data.logo_url
    ]);
    
    return result.rows[0];
  },

  // ユーザーIDで企業を取得
  async getByUserId(userId: string): Promise<Company | null> {
    if (!isServer) {
      return mockCompanies.find(company => company.user_id === userId) || null;
    }

    const { query } = await import('./client.js');
    const result = await query(`
      SELECT * FROM companies WHERE user_id = $1
    `, [userId]);
    
    return result.rows[0] || null;
  },

  // 企業を更新
  async update(userId: string, data: UpdateCompanyData): Promise<Company | null> {
    if (!isServer) {
      const index = mockCompanies.findIndex(company => company.user_id === userId);
      if (index === -1) return null;
      
      mockCompanies[index] = {
        ...mockCompanies[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return mockCompanies[index];
    }

    const { query } = await import('./client.js');
    const result = await query(`
      UPDATE companies SET
        company_name = COALESCE($2, company_name),
        industry = COALESCE($3, industry),
        company_size = COALESCE($4, company_size),
        founded_year = COALESCE($5, founded_year),
        website = COALESCE($6, website),
        description = COALESCE($7, description),
        address = COALESCE($8, address),
        phone = COALESCE($9, phone),
        email = COALESCE($10, email),
        logo_url = COALESCE($11, logo_url)
      WHERE user_id = $1
      RETURNING *
    `, [
      userId, data.company_name, data.industry, data.company_size,
      data.founded_year, data.website, data.description, data.address,
      data.phone, data.email, data.logo_url
    ]);
    
    return result.rows[0] || null;
  },

  // 企業を削除
  async delete(userId: string): Promise<boolean> {
    if (!isServer) {
      const index = mockCompanies.findIndex(company => company.user_id === userId);
      if (index === -1) return false;
      
      mockCompanies.splice(index, 1);
      return true;
    }

    const { query } = await import('./client.js');
    const result = await query(`
      DELETE FROM companies WHERE user_id = $1
    `, [userId]);
    
    return result.rowCount > 0;
  },

  // 全企業を取得
  async getAll(): Promise<Company[]> {
    if (!isServer) {
      return [...mockCompanies];
    }

    const { query } = await import('./client.js');
    const result = await query(`
      SELECT * FROM companies ORDER BY created_at DESC
    `);
    
    return result.rows;
  },

  // 業界で企業を検索
  async getByIndustry(industry: string): Promise<Company[]> {
    if (!isServer) {
      return mockCompanies.filter(company => 
        company.industry?.toLowerCase().includes(industry.toLowerCase())
      );
    }

    const { query } = await import('./client.js');
    const result = await query(`
      SELECT * FROM companies WHERE industry ILIKE $1 ORDER BY created_at DESC
    `, [`%${industry}%`]);
    
    return result.rows;
  }
}; 