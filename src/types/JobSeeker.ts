
export interface JobSeeker {
  id: string;
  user_id: string;
  fullName: string;
  full_name: string;
  dateOfBirth: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  user_email: string;
  phone: string;
  address: string;
  desiredJobTitle: string;
  desired_job_title: string;
  experience: number;
  experience_years: number;
  skills: string[];
  resumeFile?: File;
  selfIntroduction: string;
  self_introduction: string;
  registeredAt: string;
  created_at: string;
  updated_at: string;
  
  // AdminJobSeekers.tsxで使用される追加プロパティ
  nationality?: string | null;
  spouse: string | null;
  spouse_support: string | null;
  commuting_time: string | null;
  family_number?: string | null;
  profile_photo?: string | null;
  kana_first_name?: string | null;
  kana_last_name?: string | null;
  japanese_level?: string;
  japaneseLevel?: string;
  japanese_certificate_level?: string;
  detailed_info?: {
    japaneseLevel: string;
    nextJapaneseTest: string;
    selfIntroduction: string;
    hasSelfIntroduction: boolean;
    documentData?: any;
  };
  certificateStatus?: {
    name: string;
    date: string;
  };
  skillLevels?: {
    [skill: string]: 'A' | 'B' | 'C' | 'D';
  };
  age?: number;
  interviewEnabled?: boolean;
}

export interface JobSeekerFormData {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  desiredJobTitle: string;
  experience: number;
  skills: string;
  resumeFile?: File;
  selfIntroduction: string;
}
