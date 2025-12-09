"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const text_to_speech_1 = require("@google-cloud/text-to-speech");
class TextToSpeechService {
    constructor() {
        this.client = null;
        try {
            // GCP認証情報の確認
            // Cloud Runではサービスアカウントの認証情報が自動的に使用される
            const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'justjoin-platform';
            this.client = new text_to_speech_1.TextToSpeechClient({
                projectId,
                // Cloud Runでは認証情報は自動的に取得される
                // ローカル開発時のみGOOGLE_APPLICATION_CREDENTIALSが必要
            });
            console.log('✅ Google Cloud Text-to-Speech client initialized');
            console.log('📋 Project ID:', projectId);
        }
        catch (error) {
            console.error('❌ Failed to initialize Text-to-Speech client:', error);
            console.warn('⚠️ Text-to-Speech will use fallback (Web Speech API)');
        }
    }
    static getInstance() {
        if (!TextToSpeechService.instance) {
            TextToSpeechService.instance = new TextToSpeechService();
        }
        return TextToSpeechService.instance;
    }
    /**
     * テキストを音声に変換
     */
    async synthesizeSpeech(text, languageCode = 'ja-JP') {
        if (!this.client) {
            console.warn('Text-to-Speech client not available, returning null');
            return null;
        }
        try {
            const request = {
                input: { text },
                voice: {
                    languageCode,
                    name: this.getBestVoice(languageCode),
                    ssmlGender: 'FEMALE', // 女性の声
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.9, // 少しゆっくりめ
                    pitch: 0, // 自然なピッチ
                    volumeGainDb: 0, // 通常の音量
                },
            };
            const [response] = await this.client.synthesizeSpeech(request);
            if (response.audioContent) {
                return Buffer.from(response.audioContent);
            }
            return null;
        }
        catch (error) {
            console.error('❌ Text-to-Speech synthesis error:', error);
            return null;
        }
    }
    /**
     * 最適な音声を選択
     */
    getBestVoice(languageCode) {
        // 日本語の高品質な女性音声（Neural2は最新の高品質音声）
        if (languageCode.startsWith('ja')) {
            // ja-JP-Neural2-C: 自然な女性音声
            // ja-JP-Wavenet-C: より高品質だが少し古い
            return 'ja-JP-Neural2-C';
        }
        // 英語
        if (languageCode.startsWith('en')) {
            return 'en-US-Neural2-F';
        }
        // ロシア語
        if (languageCode.startsWith('ru')) {
            return 'ru-RU-Wavenet-E'; // 女性音声
        }
        // ウズベク語（利用可能な音声を選択）
        if (languageCode.startsWith('uz')) {
            return 'uz-UZ-Standard-A'; // デフォルト
        }
        // その他の言語はデフォルト
        return `${languageCode}-Standard-A`;
    }
    /**
     * 音声をBase64エンコードして返す（クライアント側で再生用）
     */
    async synthesizeSpeechAsBase64(text, languageCode = 'ja-JP') {
        const audioBuffer = await this.synthesizeSpeech(text, languageCode);
        if (audioBuffer) {
            return audioBuffer.toString('base64');
        }
        return null;
    }
}
exports.default = TextToSpeechService.getInstance();
//# sourceMappingURL=textToSpeechService.js.map