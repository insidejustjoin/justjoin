// ブラウザ環境では実行しない
const isServer = typeof window === 'undefined';

export interface JobPosting {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  requirements?: string[];
  salary_min?: number;
  salary_max?: number;
  location?: string;
  job_type?: 'full_time' | 'part_time' | 'contract' | 'internship';
  remote_work?: boolean;
  status?: 'active' | 'inactive' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CreateJobPostingData {
  company_id: string;
  title: string;
  description?: string;
  requirements?: string[];
  salary_min?: number;
  salary_max?: number;
  location?: string;
  job_type?: 'full_time' | 'part_time' | 'contract' | 'internship';
  remote_work?: boolean;
  status?: 'active' | 'inactive' | 'closed';
}

export interface UpdateJobPostingData {
  title?: string;
  description?: string;
  requirements?: string[];
  salary_min?: number;
  salary_max?: number;
  location?: string;
  job_type?: 'full_time' | 'part_time' | 'contract' | 'internship';
  remote_work?: boolean;
  status?: 'active' | 'inactive' | 'closed';
}

// ブラウザ環境用のモックデータ
const mockJobPostings: JobPosting[] = [
  {
    id: '1',
    company_id: 'company-1',
    title: 'フロントエンドエンジニア',
    description: 'React、TypeScriptを使用したWebアプリケーション開発',
    requirements: ['React', 'TypeScript', '3年以上の経験'],
    salary_min: 500000,
    salary_max: 800000,
    location: '東京都',
    job_type: 'full_time',
    remote_work: true,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    company_id: 'company-2',
    title: 'バックエンドエンジニア',
    description: 'Node.js、PostgreSQLを使用したAPI開発',
    requirements: ['Node.js', 'PostgreSQL', '2年以上の経験'],
    salary_min: 600000,
    salary_max: 900000,
    location: '大阪府',
    job_type: 'full_time',
    remote_work: false,
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

export const jobPostingsRepository = {
  // 求人情報を作成
  async create(data: CreateJobPostingData): Promise<JobPosting> {
    if (!isServer) {
      console.log('Creating job posting (mock):', data);
      const newJobPosting: JobPosting = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockJobPostings.push(newJobPosting);
      return newJobPosting;
    }

    const { query } = await import('./client.js');
    const result = await query(`
      INSERT INTO job_postings (
        company_id, title, description, requirements, salary_min,
        salary_max, location, job_type, remote_work, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.company_id, data.title, data.description, data.requirements,
      data.salary_min, data.salary_max, data.location, data.job_type,
      data.remote_work, data.status
    ]);
    
    return result.rows[0];
  },

  // IDで求人情報を取得
  async getById(id: string): Promise<JobPosting | null> {
    if (!isServer) {
      return mockJobPostings.find(job => job.id === id) || null;
    }

    const { query } = await import('./client.js');
    const result = await query(`
      SELECT * FROM job_postings WHERE id = $1
    `, [id]);
    
    return result.rows[0] || null;
  },

  // 企業IDで求人情報を取得
  async getByCompanyId(companyId: string): Promise<JobPosting[]> {
    if (!isServer) {
      return mockJobPostings.filter(job => job.company_id === companyId);
    }

    const { query } = await import('./client.js');
    const result = await query(`
      SELECT * FROM job_postings WHERE company_id = $1 ORDER BY created_at DESC
    `, [companyId]);
    
    return result.rows;
  },

  // 求人情報を更新
  async update(id: string, data: UpdateJobPostingData): Promise<JobPosting | null> {
    if (!isServer) {
      const index = mockJobPostings.findIndex(job => job.id === id);
      if (index === -1) return null;
      
      mockJobPostings[index] = {
        ...mockJobPostings[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return mockJobPostings[index];
    }

    const { query } = await import('./client.js');
    const result = await query(`
      UPDATE job_postings SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        requirements = COALESCE($4, requirements),
        salary_min = COALESCE($5, salary_min),
        salary_max = COALESCE($6, salary_max),
        location = COALESCE($7, location),
        job_type = COALESCE($8, job_type),
        remote_work = COALESCE($9, remote_work),
        status = COALESCE($10, status)
      WHERE id = $1
      RETURNING *
    `, [
      id, data.title, data.description, data.requirements,
      data.salary_min, data.salary_max, data.location, data.job_type,
      data.remote_work, data.status
    ]);
    
    return result.rows[0] || null;
  },

  // 求人情報を削除
  async delete(id: string): Promise<boolean> {
    if (!isServer) {
      const index = mockJobPostings.findIndex(job => job.id === id);
      if (index === -1) return false;
      
      mockJobPostings.splice(index, 1);
      return true;
    }

    const { query } = await import('./client.js');
    const result = await query(`
      DELETE FROM job_postings WHERE id = $1
    `, [id]);
    
    return result.rowCount > 0;
  },

  // アクティブな求人情報を取得
  async getActive(): Promise<JobPosting[]> {
    if (!isServer) {
      return mockJobPostings.filter(job => job.status === 'active');
    }

    const { query } = await import('./client');
    const result = await query(`
      SELECT * FROM job_postings WHERE status = 'active' ORDER BY created_at DESC
    `);
    
    return result.rows;
  },

  // 求人情報を検索
  async search(params: {
    title?: string;
    location?: string;
    job_type?: string;
    remote_work?: boolean;
  }): Promise<JobPosting[]> {
    if (!isServer) {
      return mockJobPostings.filter(job => {
        if (job.status !== 'active') return false;
        if (params.title && !job.title.toLowerCase().includes(params.title.toLowerCase())) return false;
        if (params.location && !job.location?.toLowerCase().includes(params.location.toLowerCase())) return false;
        if (params.job_type && job.job_type !== params.job_type) return false;
        if (params.remote_work !== undefined && job.remote_work !== params.remote_work) return false;
        return true;
      });
    }

    const { query } = await import('./client');
    let conditions = ["status = 'active'"];
    let values: any[] = [];
    let valueIndex = 1;

    if (params.title) {
      conditions.push(`title ILIKE $${valueIndex}`);
      values.push(`%${params.title}%`);
      valueIndex++;
    }

    if (params.location) {
      conditions.push(`location ILIKE $${valueIndex}`);
      values.push(`%${params.location}%`);
      valueIndex++;
    }

    if (params.job_type) {
      conditions.push(`job_type = $${valueIndex}`);
      values.push(params.job_type);
      valueIndex++;
    }

    if (params.remote_work !== undefined) {
      conditions.push(`remote_work = $${valueIndex}`);
      values.push(params.remote_work);
      valueIndex++;
    }

    const result = await query(`
      SELECT * FROM job_postings 
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `, values);
    
    return result.rows;
  }
}; 