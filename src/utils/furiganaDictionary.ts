// 求職者マイページ専用の軽量ふりがな辞書
// 実際にページで使用される漢字のみを定義

export const furiganaDictionary: Record<string, string> = {
  // 基本用語
  '求職者': 'きゅうしょくしゃ',
  'マイページ': 'まいぺーじ',
  'プロフィール': 'ぷろふぃーる',
  '書類作成': 'しょるいさくせい',
  '面接': 'めんせつ',
  '通知': 'つうち',
  '設定': 'せってい',
  '編集': 'へんしゅう',
  '完了': 'かんりょう',
  '進行中': 'しんこうちゅう',
  '未受験': 'みじゅけん',
  '中断': 'ちゅうだん',
  '推薦': 'すいせん',
  '要検討': 'ようけんとう',
  '非推薦': 'ひすいせん',
  '強く推薦': 'つよくすいせん',
  '強く非推薦': 'つよくひすいせん',
  
  // プロフィール関連
  '氏名': 'しめい',
  'メールアドレス': 'めーるあどれす',
  '登録日': 'とうろくび',
  '完成度': 'かんせいど',
  '初期入力': 'しょきにゅうりょく',
  '未完了': 'みかんりょう',
  'ほぼ完了': 'ほぼかんりょう',
  '完了済み': 'かんりょうずみ',
  '完了を推奨': 'かんりょうをすいせん',
  '基本的な入力完了': 'きほんてきなにゅうりょくかんりょう',
  'あと少しで完了': 'あとすこしでかんりょう',
  '完璧': 'かんぺき',
  
  // AI面接関連
  'AI面接': 'えーあいめんせつ',
  '面接開始': 'めんせつかいし',
  '面接完了': 'めんせつかんりょう',
  '面接準備中': 'めんせつじゅんびちゅう',
  '面接情報': 'めんせつじょうほう',
  '面接ステータス': 'めんせつすてーたす',
  '受験回数': 'じゅけんかいすう',
  '最新の面接結果': 'さいしんのめんせつけっか',
  '完了日時': 'かんりょうにちじ',
  '総合スコア': 'そうごうすこあ',
  '1次面接': 'いちじめんせつ',
  '受験済み': 'じゅけんずみ',
  '1回限り': 'いっかいかぎり',
  '面接を開始中': 'めんせつをかいしちゅう',
  '面接を開始できませんでした': 'めんせつをかいしできませんでした',
  '面接情報を読み込み中': 'めんせつじょうほうをよみこみちゅう',
  '面接履歴': 'めんせつりれき',
  '面接結果': 'めんせつけっか',
  '面接分析': 'めんせつぶんせき',
  
  // 通知関連
  '未読通知': 'みどくつうち',
  '通知センター': 'つうちせんたー',
  '通知設定': 'つうちせってい',
  '通知履歴': 'つうちりれき',
  
  // エラー・状態
  'エラー': 'えらー',
  '読み込み中': 'よみこみちゅう',
  '再読み込み': 'さいよみこみ',
  '認証情報': 'にんしょうじょうほう',
  '無効': 'むこう',
  '再度ログイン': 'さいどろぐいん',
  'ログインページ': 'ろぐいんぺーじ',
  'リダイレクト中': 'りだいれくとちゅう',
  
  // 開発・テスト関連
  'テスト用': 'てすとよう',
  '開発環境': 'かいはつかんきょう',
  '動作確認': 'どうさかくにん',
  'デバッグ': 'でばっぐ',
  '認証クリア': 'にんしょうくりあ',
  
  // その他
  '後で': 'あとで',
  '今すぐ': 'いますぐ',
  '言語切り替え': 'げんごきりかえ',
  '日本語': 'にほんご',
  '英語': 'えいご',
  '切り替え': 'きりかえ',
  '表示': 'ひょうじ',
  '非表示': 'ひひょうじ',
  'ふりがな': 'ふりがな',
  'ふりがな表示': 'ふりがなひょうじ',
  'ふりがな非表示': 'ふりがなひひょうじ',
  'ふりがなの表示/非表示を切り替え': 'ふりがなのひょうじひひょうじをきりかえ'
};

// 漢字判定の正規表現
export const kanjiRegex = /[\u4e00-\u9faf]/;

// テキストを解析してふりがなを適用する関数
export function applyFurigana(text: string): Array<{text: string, reading?: string, isKanji: boolean}> {
  if (!text) return [{ text: '', isKanji: false }];
  
  const segments: Array<{text: string, reading?: string, isKanji: boolean}> = [];
  let currentText = '';
  let currentIsKanji = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isKanji = kanjiRegex.test(char);
    
    if (i === 0) {
      currentText = char;
      currentIsKanji = isKanji;
    } else if (isKanji === currentIsKanji) {
      currentText += char;
    } else {
      // セグメントを追加
      if (currentIsKanji && furiganaDictionary[currentText]) {
        segments.push({
          text: currentText,
          reading: furiganaDictionary[currentText],
          isKanji: true
        });
      } else {
        segments.push({
          text: currentText,
          isKanji: currentIsKanji
        });
      }
      
      currentText = char;
      currentIsKanji = isKanji;
    }
  }
  
  // 最後のセグメントを追加
  if (currentText) {
    if (currentIsKanji && furiganaDictionary[currentText]) {
      segments.push({
        text: currentText,
        reading: furiganaDictionary[currentText],
        isKanji: true
      });
    } else {
      segments.push({
        text: currentText,
        isKanji: currentIsKanji
      });
    }
  }
  
  return segments;
} 