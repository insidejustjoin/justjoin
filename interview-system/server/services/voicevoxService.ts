/**
 * VOICEVOX音声合成サービス
 * VOICEVOX Engine APIを使用して高品質な日本語音声を生成
 * 
 * VOICEVOXエンジンは別途起動が必要です
 * デフォルト: http://localhost:50021
 */

class VoicevoxService {
  private baseUrl: string;
  private static instance: VoicevoxService;
  private defaultSpeakerId: number = 1; // ずんだもん（デフォルト）

  private constructor() {
    // 環境変数からVOICEVOXのURLを取得（デフォルトはlocalhost）
    this.baseUrl = process.env.VOICEVOX_URL || 'http://localhost:50021';
    console.log('✅ VOICEVOX Service initialized');
    console.log('📋 VOICEVOX URL:', this.baseUrl);
  }

  public static getInstance(): VoicevoxService {
    if (!VoicevoxService.instance) {
      VoicevoxService.instance = new VoicevoxService();
    }
    return VoicevoxService.instance;
  }

  /**
   * VOICEVOXエンジンが利用可能かチェック
   * タイムアウトを設定して高速にチェック
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒でタイムアウト
      
      const response = await fetch(`${this.baseUrl}/speakers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('VOICEVOXエンジンのチェックがタイムアウトしました');
      } else {
        console.warn('VOICEVOXエンジンが利用できません:', error);
      }
      return false;
    }
  }

  /**
   * 利用可能な話者一覧を取得
   */
  async getSpeakers(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/speakers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('話者一覧の取得に失敗:', error);
      return [];
    }
  }

  /**
   * テキストを音声に変換（VOICEVOX API）
   * 
   * @param text 音声化するテキスト
   * @param speakerId 話者ID（デフォルト: 1 = ずんだもん）
   * @returns 音声データ（WAV形式のBuffer）
   */
  async synthesizeSpeech(text: string, speakerId: number = 1): Promise<Buffer | null> {
    try {
      // 1. テキストを音声クエリに変換
      const queryResponse = await fetch(
        `${this.baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!queryResponse.ok) {
        console.error('音声クエリの生成に失敗:', queryResponse.statusText);
        return null;
      }

      const audioQuery = await queryResponse.json();

      // 2. 音声クエリから音声を生成
      const synthesisResponse = await fetch(
        `${this.baseUrl}/synthesis?speaker=${speakerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(audioQuery),
        }
      );

      if (!synthesisResponse.ok) {
        console.error('音声合成に失敗:', synthesisResponse.statusText);
        return null;
      }

      // 3. 音声データ（WAV形式）を取得
      const audioArrayBuffer = await synthesisResponse.arrayBuffer();
      return Buffer.from(audioArrayBuffer);
    } catch (error) {
      console.error('❌ VOICEVOX音声合成エラー:', error);
      return null;
    }
  }

  /**
   * 音声をBase64エンコードして返す（クライアント側で再生用）
   */
  async synthesizeSpeechAsBase64(text: string, speakerId: number = 1): Promise<string | null> {
    const audioBuffer = await this.synthesizeSpeech(text, speakerId);
    if (audioBuffer) {
      return audioBuffer.toString('base64');
    }
    return null;
  }

  /**
   * 最適な話者IDを取得（女性の声を優先）
   */
  async getBestSpeakerId(): Promise<number> {
    try {
      const speakers = await this.getSpeakers();
      
      // 女性の声を優先的に探す
      const femaleSpeakers = [
        'ずんだもん', '四国めたん', '春日部つむぎ', '雨晴はう', 
        '波音リツ', '玄野武宏', '白上虎太郎', '青山龍星',
        '冥鳴ひまり', '九州そら', 'もち子さん', '剣崎雌雄'
      ];

      for (const speakerName of femaleSpeakers) {
        for (const speaker of speakers) {
          if (speaker.name === speakerName && speaker.styles && speaker.styles.length > 0) {
            return speaker.styles[0].id;
          }
        }
      }

      // デフォルトの話者IDを返す
      return this.defaultSpeakerId;
    } catch (error) {
      console.warn('話者IDの取得に失敗、デフォルトを使用:', error);
      return this.defaultSpeakerId;
    }
  }
}

export default VoicevoxService.getInstance();

