import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type Language = 'ja' | 'en' | 'ru';

export interface TranslationRequest {
  text: string;
  from: Language;
  to: Language;
}

export interface TranslationResponse {
  translatedText: string;
  confidence?: number;
}

export interface TranslateAndSummarizeRequest {
  text: string;
  sourceLanguage: Language;
}

export interface TranslateAndSummarizeResponse {
  ja: string;  // 日本語版（翻訳・要約）
  en: string;  // 英語版（翻訳・要約）
  ru: string;  // ロシア語版（翻訳・要約）
}

export class TranslationService {
  private static instance: TranslationService;
  private model: any;

  private constructor() {
    // Gemini 1.5 Proを使用（より高品質な翻訳と要約のため）
    this.model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest'
    });
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

      // 同じ言語の場合はそのまま返す
      if (from === to) {
        return { translatedText: text };
      }

      const prompt = this.buildTranslationPrompt(text, from, to);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      // マークダウン形式のフォーマットを除去
      const cleanedText = translatedText
        .replace(/```[\w]*\n?/g, '')
        .replace(/```/g, '')
        .trim();

      return {
        translatedText: cleanedText,
        confidence: 0.9 // Gemini APIは信頼度を返さないため固定値
      };
    } catch (error) {
      console.error('翻訳エラー:', error);
      // エラーが発生した場合は、元のテキストを返す
      if (request.from === request.to) {
        return { translatedText: request.text };
      }
      throw new Error('翻訳に失敗しました');
    }
  }

  /**
   * ブログ記事の全体的な翻訳を行う
   */
  async translateBlogPost(postData: {
    title_ja: string;
    content_ja: string;
    excerpt_ja?: string;
    meta_title_ja?: string;
    meta_description_ja?: string;
    meta_keywords_ja?: string[];
  }): Promise<{
    title_en: string;
    content_en: string;
    excerpt_en?: string;
    meta_title_en?: string;
    meta_description_en?: string;
    meta_keywords_en?: string[];
    slug_en: string;
  }> {
    try {
      // タイトルの翻訳
      const titleTranslation = await this.translateText({
        text: postData.title_ja,
        from: 'ja',
        to: 'en'
      });

      // 本文の翻訳
      const contentTranslation = await this.translateText({
        text: postData.content_ja,
        from: 'ja',
        to: 'en'
      });

      // 抜粋の翻訳（存在する場合）
      let excerptTranslation = { translatedText: '' };
      if (postData.excerpt_ja) {
        excerptTranslation = await this.translateText({
          text: postData.excerpt_ja,
          from: 'ja',
          to: 'en'
        });
      }

      // メタタイトルの翻訳（存在する場合）
      let metaTitleTranslation = { translatedText: '' };
      if (postData.meta_title_ja) {
        metaTitleTranslation = await this.translateText({
          text: postData.meta_title_ja,
          from: 'ja',
          to: 'en'
        });
      }

      // メタ説明の翻訳（存在する場合）
      let metaDescriptionTranslation = { translatedText: '' };
      if (postData.meta_description_ja) {
        metaDescriptionTranslation = await this.translateText({
          text: postData.meta_description_ja,
          from: 'ja',
          to: 'en'
        });
      }

      // メタキーワードの翻訳（存在する場合）
      let metaKeywordsTranslation: string[] = [];
      if (postData.meta_keywords_ja && postData.meta_keywords_ja.length > 0) {
        const keywordsText = postData.meta_keywords_ja.join(', ');
        const keywordsTranslation = await this.translateText({
          text: keywordsText,
          from: 'ja',
          to: 'en'
        });
        metaKeywordsTranslation = keywordsTranslation.translatedText
          .split(',')
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0);
      }

      // スラグの生成（英語タイトルから）
      const slugEn = this.generateSlug(titleTranslation.translatedText);

      return {
        title_en: titleTranslation.translatedText,
        content_en: contentTranslation.translatedText,
        excerpt_en: excerptTranslation.translatedText || undefined,
        meta_title_en: metaTitleTranslation.translatedText || undefined,
        meta_description_en: metaDescriptionTranslation.translatedText || undefined,
        meta_keywords_en: metaKeywordsTranslation.length > 0 ? metaKeywordsTranslation : undefined,
        slug_en: slugEn
      };
    } catch (error) {
      console.error('ブログ記事翻訳エラー:', error);
      throw new Error('ブログ記事の翻訳に失敗しました');
    }
  }

  /**
   * テキストを翻訳・要約して3言語（日本語、英語、ロシア語）で返す
   * 履歴書の長文項目（自己PR、日本で働きたい理由など）用
   */
  async translateAndSummarizeForDocuments(
    request: TranslateAndSummarizeRequest
  ): Promise<TranslateAndSummarizeResponse> {
    const { text, sourceLanguage } = request;

    if (!text || text.trim().length === 0) {
      return {
        ja: '',
        en: '',
        ru: ''
      };
    }

    try {
      console.log(`📝 翻訳・要約開始: sourceLanguage=${sourceLanguage}, textLength=${text.length}`);

      // 並列で3言語の翻訳・要約を実行
      const [jaResult, enResult, ruResult] = await Promise.all([
        this.translateAndSummarizeToLanguage(text, sourceLanguage, 'ja'),
        this.translateAndSummarizeToLanguage(text, sourceLanguage, 'en'),
        this.translateAndSummarizeToLanguage(text, sourceLanguage, 'ru')
      ]);

      return {
        ja: jaResult,
        en: enResult,
        ru: ruResult
      };
    } catch (error) {
      console.error('❌ 翻訳・要約エラー:', error);
      // エラーが発生した場合は、元のテキストをそのまま返す（ソース言語のみ）
      return {
        ja: sourceLanguage === 'ja' ? text : '',
        en: sourceLanguage === 'en' ? text : '',
        ru: sourceLanguage === 'ru' ? text : ''
      };
    }
  }

  /**
   * テキストを指定された言語に翻訳・要約する
   */
  private async translateAndSummarizeToLanguage(
    text: string,
    from: Language,
    to: Language
  ): Promise<string> {
    try {
      // ソース言語とターゲット言語が同じ場合は、要約のみ実行
      if (from === to) {
        return await this.summarizeText(text, to);
      }

      // 翻訳と要約を一度に実行
      const prompt = this.buildTranslateAndSummarizePrompt(text, from, to);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      // マークダウン形式のフォーマットを除去（```で囲まれた部分など）
      const cleanedText = translatedText
        .replace(/```[\w]*\n?/g, '')
        .replace(/```/g, '')
        .trim();

      return cleanedText;
    } catch (error) {
      console.error(`❌ 翻訳・要約エラー (${from} → ${to}):`, error);
      // エラーが発生した場合は、元のテキストを返す（ソース言語が同じ場合のみ）
      return from === to ? text : '';
    }
  }

  /**
   * テキストを要約する
   */
  private async summarizeText(text: string, language: Language): Promise<string> {
    try {
      const languageNames = {
        ja: '日本語',
        en: '英語',
        ru: 'ロシア語'
      };

      const prompt = `
以下の${languageNames[language]}のテキストを要約してください。

要約のルール:
1. 重要なポイントを保ちながら、簡潔に要約してください
2. 原文の意味や意図を正確に保持してください
3. 履歴書に記載する内容として適切な長さ（300-500文字程度）にしてください
4. 要約のみを返してください（説明やコメントは不要）

原文:
${text}

要約:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summarizedText = response.text().trim();

      return summarizedText.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    } catch (error) {
      console.error(`❌ 要約エラー (${language}):`, error);
      return text; // エラー時は元のテキストを返す
    }
  }

  /**
   * 翻訳・要約プロンプトを構築する
   */
  private buildTranslateAndSummarizePrompt(
    text: string,
    from: Language,
    to: Language
  ): string {
    const languageMap = {
      ja: '日本語',
      en: '英語',
      ru: 'ロシア語'
    };

    const fromLang = languageMap[from];
    const toLang = languageMap[to];

    return `
以下の${fromLang}のテキストを${toLang}に翻訳し、履歴書に記載する適切な長さ（300-500文字程度）に要約してください。

翻訳・要約のルール:
1. ${toLang}に自然で正確に翻訳してください
2. 重要なポイントを保ちながら、簡潔に要約してください
3. 原文の意味や意図を正確に保持してください
4. 履歴書に記載する内容として適切な文体で記載してください
5. 翻訳・要約されたテキストのみを返してください（説明やコメントは不要）

原文（${fromLang}）:
${text}

翻訳・要約（${toLang}）:
`;
  }

  /**
   * 翻訳プロンプトを構築する
   */
  private buildTranslationPrompt(text: string, from: Language, to: Language): string {
    const languageMap = {
      ja: '日本語',
      en: '英語',
      ru: 'ロシア語'
    };

    return `
以下の${languageMap[from]}のテキストを${languageMap[to]}に翻訳してください。

翻訳のルール:
1. 自然で正確な${languageMap[to]}に翻訳してください
2. 専門用語や技術用語は適切に翻訳してください
3. 文体やトーンを保持してください
4. 翻訳のみを返してください（説明やコメントは不要）

原文:
${text}

翻訳:
`;
  }

  /**
   * 英語タイトルからスラグを生成する
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 特殊文字を除去
      .replace(/\s+/g, '-') // スペースをハイフンに変換
      .replace(/-+/g, '-') // 連続するハイフンを1つに
      .trim()
      .replace(/^-|-$/g, ''); // 先頭と末尾のハイフンを除去
  }
}

export default TranslationService; 