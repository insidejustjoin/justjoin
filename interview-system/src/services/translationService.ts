import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI((import.meta as any).env?.VITE_GEMINI_API_KEY || '');

export interface TranslationRequest {
  text: string;
  from: 'ja' | 'en';
  to: 'ja' | 'en';
}

export interface TranslationResponse {
  translatedText: string;
  confidence?: number;
}

export class TranslationService {
  private static instance: TranslationService;
  private model: any;

  private constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * テキストを翻訳する
   */
  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { text, from, to } = request;
      
      if (!text || text.trim().length === 0) {
        return { translatedText: '' };
      }

      const prompt = this.buildTranslationPrompt(text, from, to);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      return {
        translatedText,
        confidence: 0.9 // Gemini APIは信頼度を返さないため固定値
      };
    } catch (error) {
      console.error('翻訳エラー:', error);
      throw new Error('翻訳に失敗しました');
    }
  }

  /**
   * 翻訳プロンプトを構築する
   */
  private buildTranslationPrompt(text: string, from: string, to: string): string {
    const languageMap = {
      ja: '日本語',
      en: '英語'
    };

    return `
以下の${languageMap[from as keyof typeof languageMap]}のテキストを${languageMap[to as keyof typeof languageMap]}に翻訳してください。

翻訳のルール:
1. 自然で自然な${languageMap[to as keyof typeof languageMap]}に翻訳してください
2. 専門用語や技術用語は適切に翻訳してください
3. 文体やトーンを保持してください
4. 翻訳のみを返してください（説明やコメントは不要）

原文:
${text}

翻訳:
`;
  }
}

export default TranslationService; 