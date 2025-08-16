import { GoogleGenerativeAI } from '@google/generative-ai';
// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export class TranslationService {
    static instance;
    model;
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
    static getInstance() {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService();
        }
        return TranslationService.instance;
    }
    /**
     * テキストを翻訳する
     */
    async translateText(request) {
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
        }
        catch (error) {
            console.error('翻訳エラー:', error);
            throw new Error('翻訳に失敗しました');
        }
    }
    /**
     * ブログ記事の全体的な翻訳を行う
     */
    async translateBlogPost(postData) {
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
            let metaKeywordsTranslation = [];
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
        }
        catch (error) {
            console.error('ブログ記事翻訳エラー:', error);
            throw new Error('ブログ記事の翻訳に失敗しました');
        }
    }
    /**
     * 翻訳プロンプトを構築する
     */
    buildTranslationPrompt(text, from, to) {
        const languageMap = {
            ja: '日本語',
            en: '英語'
        };
        return `
以下の${languageMap[from]}のテキストを${languageMap[to]}に翻訳してください。

翻訳のルール:
1. 自然で自然な${languageMap[to]}に翻訳してください
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
    generateSlug(title) {
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
