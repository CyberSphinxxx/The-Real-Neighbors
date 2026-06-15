export type VocabTier = 'basic' | 'medium' | 'hard';

export interface VocabularyItem {
  id: string;
  tier: VocabTier;
  english: string;
  romaji: string;
  hiragana: string;
  fragments: string[];
}

export const VOCABULARY_DATA: VocabularyItem[] = [
  // --- BASIC (2-3 chars, survival/barkada words) ---
  { id: 'b1', tier: 'basic', english: 'Cat', romaji: 'neko', hiragana: 'ねこ', fragments: ['ね', 'こ'] },
  { id: 'b2', tier: 'basic', english: 'Dog', romaji: 'inu', hiragana: 'いぬ', fragments: ['い', 'ぬ'] },
  { id: 'b3', tier: 'basic', english: 'Idiot / Fool', romaji: 'baka', hiragana: 'ばか', fragments: ['ば', 'か'] },
  { id: 'b4', tier: 'basic', english: 'Autumn', romaji: 'aki', hiragana: 'あき', fragments: ['あ', 'き'] },
  { id: 'b5', tier: 'basic', english: 'Morning', romaji: 'asa', hiragana: 'あさ', fragments: ['あ', 'さ'] },
  { id: 'b6', tier: 'basic', english: 'Water', romaji: 'mizu', hiragana: 'みず', fragments: ['み', 'ず'] },
  { id: 'b7', tier: 'basic', english: 'Meat', romaji: 'niku', hiragana: 'にく', fragments: ['に', 'く'] },
  { id: 'b8', tier: 'basic', english: 'Love', romaji: 'ai', hiragana: 'あい', fragments: ['あ', 'い'] },
  { id: 'b9', tier: 'basic', english: 'Dream', romaji: 'yume', hiragana: 'ゆめ', fragments: ['ゆ', 'め'] },
  { id: 'b10', tier: 'basic', english: 'Friend', romaji: 'tomo', hiragana: 'とも', fragments: ['と', 'も'] },
  { id: 'b11', tier: 'basic', english: 'Sea', romaji: 'umi', hiragana: 'うみ', fragments: ['う', 'み'] },
  { id: 'b12', tier: 'basic', english: 'Sky', romaji: 'sora', hiragana: 'そら', fragments: ['そ', 'ら'] },
  { id: 'b13', tier: 'basic', english: 'Now', romaji: 'ima', hiragana: 'いま', fragments: ['い', 'ま'] },
  { id: 'b14', tier: 'basic', english: 'Snow', romaji: 'yuki', hiragana: 'ゆき', fragments: ['ゆ', 'き'] },
  { id: 'b15', tier: 'basic', english: 'Moon', romaji: 'tsuki', hiragana: 'つき', fragments: ['つ', 'き'] },
  { id: 'b16', tier: 'basic', english: 'Mountain', romaji: 'yama', hiragana: 'やま', fragments: ['や', 'ま'] },
  { id: 'b17', tier: 'basic', english: 'Star', romaji: 'hoshi', hiragana: 'ほし', fragments: ['ほ', 'し'] },

  // --- MEDIUM (Verbs & Adjectives) ---
  { id: 'm1', tier: 'medium', english: 'To eat', romaji: 'taberu', hiragana: 'たべる', fragments: ['た', 'べ', 'る'] },
  { id: 'm2', tier: 'medium', english: 'Delicious', romaji: 'oishii', hiragana: 'おいしい', fragments: ['お', 'い', 'し', 'い'] },
  { id: 'm3', tier: 'medium', english: 'Crazy / Dangerous', romaji: 'yabai', hiragana: 'やばい', fragments: ['や', 'ば', 'い'] },
  { id: 'm4', tier: 'medium', english: 'Cute', romaji: 'kawaii', hiragana: 'かわいい', fragments: ['か', 'わ', 'い', 'い'] },
  { id: 'm5', tier: 'medium', english: 'Amazing', romaji: 'sugoi', hiragana: 'すごい', fragments: ['す', 'ご', 'い'] },
  { id: 'm6', tier: 'medium', english: 'To drink', romaji: 'nomu', hiragana: 'のむ', fragments: ['の', 'む'] },
  { id: 'm7', tier: 'medium', english: 'To sleep', romaji: 'neru', hiragana: 'ねる', fragments: ['ね', 'る'] },
  { id: 'm8', tier: 'medium', english: 'To see / watch', romaji: 'miru', hiragana: 'みる', fragments: ['み', 'る'] },
  { id: 'm9', tier: 'medium', english: 'To listen / hear', romaji: 'kiku', hiragana: 'きく', fragments: ['き', 'く'] },
  { id: 'm10', tier: 'medium', english: 'To read', romaji: 'yomu', hiragana: 'よむ', fragments: ['よ', 'む'] },
  { id: 'm11', tier: 'medium', english: 'To speak', romaji: 'hanasu', hiragana: 'はなす', fragments: ['は', 'な', 'す'] },
  { id: 'm12', tier: 'medium', english: 'To write', romaji: 'kaku', hiragana: 'かく', fragments: ['か', 'く'] },
  { id: 'm13', tier: 'medium', english: 'To buy', romaji: 'kau', hiragana: 'かう', fragments: ['か', 'う'] },
  { id: 'm14', tier: 'medium', english: 'Fast / Early', romaji: 'hayai', hiragana: 'はやい', fragments: ['は', 'や', 'い'] },
  { id: 'm15', tier: 'medium', english: 'Slow / Late', romaji: 'osoi', hiragana: 'おそい', fragments: ['お', 'そ', 'い'] },
  { id: 'm16', tier: 'medium', english: 'Hot', romaji: 'atsui', hiragana: 'あつい', fragments: ['あ', 'つ', 'い'] },
  { id: 'm17', tier: 'medium', english: 'Cold', romaji: 'samui', hiragana: 'さむい', fragments: ['さ', 'む', 'い'] },

  // --- HARD / SENTENCES (Anime Quotes & Phrases) ---
  { id: 'h1', tier: 'hard', english: 'You are already dead', romaji: 'omae wa mou shindeiru', hiragana: 'おまえはもうしんでいる', fragments: ['おまえ', 'は', 'もう', 'しんでいる'] },
  { id: 'h2', tier: 'hard', english: 'Run away!', romaji: 'nigerundayo', hiragana: 'にげるんだよ', fragments: ['にげる', 'んだ', 'よ'] },
  { id: 'h3', tier: 'hard', english: 'Good morning', romaji: 'ohayou gozaimasu', hiragana: 'おはようございます', fragments: ['おはよう', 'ございます'] },
  { id: 'h4', tier: 'hard', english: 'Thank you', romaji: 'arigatou gozaimasu', hiragana: 'ありがとうございます', fragments: ['ありがとう', 'ございます'] },
  { id: 'h5', tier: 'hard', english: 'I will become the pirate king!', romaji: 'kaizoku ou ni ore wa naru', hiragana: 'かいぞくおうにおれはなる', fragments: ['かいぞくおう', 'に', 'おれ', 'は', 'なる'] },
  { id: 'h6', tier: 'hard', english: 'It cannot be helped', romaji: 'shikata ga nai', hiragana: 'しかたがない', fragments: ['しかた', 'が', 'ない'] },
  { id: 'h7', tier: 'hard', english: 'I understand', romaji: 'wakarimashita', hiragana: 'わかりました', fragments: ['わかり', 'ました'] },
  { id: 'h8', tier: 'hard', english: 'Please wait a moment', romaji: 'chotto matte kudasai', hiragana: 'ちょっとまってください', fragments: ['ちょっと', 'まって', 'ください'] },
  { id: 'h9', tier: 'hard', english: 'Long time no see', romaji: 'ohisashiburi desu', hiragana: 'おひさしぶりです', fragments: ['おひさしぶり', 'です'] },
  { id: 'h10', tier: 'hard', english: 'Nice to meet you', romaji: 'hajimemashite', hiragana: 'はじめまして', fragments: ['はじめ', 'まして'] },
  { id: 'h11', tier: 'hard', english: 'I love you', romaji: 'aishiteiru', hiragana: 'あいしている', fragments: ['あい', 'している'] },
  { id: 'h12', tier: 'hard', english: 'What is this?', romaji: 'kore wa nan desu ka', hiragana: 'これはなんですか', fragments: ['これ', 'は', 'なん', 'ですか'] },
  { id: 'h13', tier: 'hard', english: 'Where is the bathroom?', romaji: 'toire wa doko desu ka', hiragana: 'といれはどこですか', fragments: ['といれ', 'は', 'どこ', 'ですか'] },
  { id: 'h14', tier: 'hard', english: 'I am sorry', romaji: 'gomen nasai', hiragana: 'ごめんなさい', fragments: ['ごめん', 'なさい'] },
  { id: 'h15', tier: 'hard', english: 'Excuse me', romaji: 'sumimasen', hiragana: 'すみません', fragments: ['すみ', 'ません'] },
  { id: 'h16', tier: 'hard', english: 'It was delicious', romaji: 'gochisousama deshita', hiragana: 'ごちそうさまでした', fragments: ['ごちそうさま', 'でした'] },
];
