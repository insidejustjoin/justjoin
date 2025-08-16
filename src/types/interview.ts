export interface InterviewSession {
  id: string;
  applicant_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  language: 'ja' | 'en';
  current_question_index: number;
  started_at: string | null;
  completed_at: string | null;
  total_duration: number | null;
  consent_given: boolean;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface InterviewSummary {
  id: number;
  session_id: string;
  applicant_id: string;
  total_questions: number;
  answered_questions: number;
  total_duration: number;
  average_response_time: number;
  completion_rate: number;
  key_insights: string[];
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  notes: string | null;
  created_at: string;
}

export interface InterviewApplicant {
  id: string;
  email: string;
  name: string;
  position: string;
  experience_years: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewData {
  session: InterviewSession;
  summary: InterviewSummary | null;
  applicant: InterviewApplicant;
}

export interface InterviewNotification {
  id: string;
  user_id: string;
  type: 'interview_completed' | 'interview_scheduled' | 'interview_reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
} 