// 面接セッションの状態
export type InterviewStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

// 質問の種類
export type QuestionType = 'introduction' | 'experience' | 'achievement' | 'teamwork' | 'motivation' | 'strength_weakness' | 'technical' | 'problem_solving' | 'career_vision' | 'questions'

// 言語設定
export type Language = 'ja' | 'en'

// 応募者情報（メインプラットフォームの求職者データと統合）
export interface Applicant {
  id: string
  name?: string
  email?: string
  position?: string
  experienceYears?: number
  skills?: string[]
  selfIntroduction?: string
  nationality?: string
  createdAt: Date
  updatedAt: Date
}

// 質問定義
export interface Question {
  id: string
  type: QuestionType
  text: {
    ja: string
    en: string
  }
  order: number
  isRequired: boolean
  maxLength?: number
  estimatedTime: number // 秒
}

// 回答
export interface Answer {
  id: string
  questionId: string
  sessionId: string
  applicantId: string
  text: string
  responseTime: number // 秒
  timestamp: Date
  wordCount: number
  sentimentScore?: number
}

// 面接セッション（データベース統合対応）
export interface InterviewSession {
  id: string
  applicantId: string
  status: InterviewStatus
  language: Language
  currentQuestionIndex: number
  startedAt?: Date | null
  completedAt?: Date | null
  totalDuration?: number // 秒
  answers?: Answer[]
  consentGiven: boolean
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// AI面接官の応答
export interface AIInterviewerResponse {
  message: string
  nextQuestion?: Question
  isComplete: boolean
  sessionId: string
  timestamp: Date
}

// 面接結果のサマリー
export interface InterviewSummary {
  sessionId: string
  applicantId: string
  totalQuestions: number
  answeredQuestions: number
  totalDuration: number
  averageResponseTime: number
  completionRate: number
  keyInsights: string[]
  overallScore?: number
  strengths: string[]
  areas_for_improvement: string[]
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no'
  notes: string
  createdAt: Date
}

// GCP保存用データ
export interface StorageData {
  sessionId: string
  applicantId: string
  type: 'session' | 'answer' | 'summary'
  data: InterviewSession | Answer | InterviewSummary
  timestamp: Date
  filePath: string
}

// 面接設定
export interface InterviewConfig {
  maxDuration: number // 秒
  maxQuestions: number
  timeoutDuration: number // 秒
  enableRecording: boolean
  enableSentimentAnalysis: boolean
  supportedLanguages: Language[]
  defaultLanguage: Language
} 