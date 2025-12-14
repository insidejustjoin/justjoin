"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
class OpenAITtsService {
    constructor() {
        this.client = null;
        try {
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey) {
                this.client = new openai_1.default({
                    apiKey: apiKey,
                });
                console.log('✅ OpenAI TTS client initialized');
            }
            else {
                console.warn('⚠️ OpenAI API key not found, TTS will use fallback');
            }
        }
        catch (error) {
            console.error('❌ Failed to initialize OpenAI TTS client:', error);
        }
    }
    static getInstance() {
        if (!OpenAITtsService.instance) {
            OpenAITtsService.instance = new OpenAITtsService();
        }
        return OpenAITtsService.instance;
    }
    /**
     * テキストを音声に変換（OpenAI TTS API）
     * 高品質な日本語音声を生成
     */
    async synthesizeSpeech(text, languageCode = 'ja') {
        if (!this.client) {
            console.warn('OpenAI TTS client not available, returning null');
            return null;
        }
        try {
            // Apple Siriレベルの高品質音声を生成
            // 'nova' ボイスはより自然でSiriに近い音質を提供
            // 'shimmer' も高品質だが、novaの方がより柔らかく自然
            const voice = 'nova'; // Siriのような自然な女性ボイス
            const response = await this.client.audio.speech.create({
                model: 'tts-1-hd', // 最高品質モデル（HD品質）
                voice: voice,
                input: text,
                speed: 1.0, // 自然な速度（Siriはやや速めで自然）
            });
            // Response bodyをBufferに変換
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        catch (error) {
            console.error('❌ OpenAI TTS synthesis error:', error);
            return null;
        }
    }
    /**
     * 音声をBase64エンコードして返す（クライアント側で再生用）
     */
    async synthesizeSpeechAsBase64(text, languageCode = 'ja') {
        const audioBuffer = await this.synthesizeSpeech(text, languageCode);
        if (audioBuffer) {
            return audioBuffer.toString('base64');
        }
        return null;
    }
}
exports.default = OpenAITtsService.getInstance();
//# sourceMappingURL=openaiTtsService.js.map