export type HiraganaChar = {
  character: string;
  romaji: string;
  alternates: string[];
  group: string;
  type: 'basic' | 'dakuten' | 'combination';
};

export const BASIC_HIRAGANA: HiraganaChar[] = [
  // A-row
  { character: 'あ', romaji: 'a', alternates: [], group: 'A-row', type: 'basic' },
  { character: 'い', romaji: 'i', alternates: ['yi'], group: 'A-row', type: 'basic' },
  { character: 'う', romaji: 'u', alternates: ['wu'], group: 'A-row', type: 'basic' },
  { character: 'え', romaji: 'e', alternates: [], group: 'A-row', type: 'basic' },
  { character: 'お', romaji: 'o', alternates: [], group: 'A-row', type: 'basic' },
  // KA-row
  { character: 'か', romaji: 'ka', alternates: [], group: 'KA-row', type: 'basic' },
  { character: 'き', romaji: 'ki', alternates: [], group: 'KA-row', type: 'basic' },
  { character: 'く', romaji: 'ku', alternates: [], group: 'KA-row', type: 'basic' },
  { character: 'け', romaji: 'ke', alternates: [], group: 'KA-row', type: 'basic' },
  { character: 'こ', romaji: 'ko', alternates: [], group: 'KA-row', type: 'basic' },
  // SA-row
  { character: 'さ', romaji: 'sa', alternates: [], group: 'SA-row', type: 'basic' },
  { character: 'し', romaji: 'shi', alternates: ['si'], group: 'SA-row', type: 'basic' },
  { character: 'す', romaji: 'su', alternates: [], group: 'SA-row', type: 'basic' },
  { character: 'せ', romaji: 'se', alternates: [], group: 'SA-row', type: 'basic' },
  { character: 'そ', romaji: 'so', alternates: [], group: 'SA-row', type: 'basic' },
  // TA-row
  { character: 'た', romaji: 'ta', alternates: [], group: 'TA-row', type: 'basic' },
  { character: 'ち', romaji: 'chi', alternates: ['ti'], group: 'TA-row', type: 'basic' },
  { character: 'つ', romaji: 'tsu', alternates: ['tu'], group: 'TA-row', type: 'basic' },
  { character: 'て', romaji: 'te', alternates: [], group: 'TA-row', type: 'basic' },
  { character: 'と', romaji: 'to', alternates: [], group: 'TA-row', type: 'basic' },
  // NA-row
  { character: 'な', romaji: 'na', alternates: [], group: 'NA-row', type: 'basic' },
  { character: 'に', romaji: 'ni', alternates: [], group: 'NA-row', type: 'basic' },
  { character: 'ぬ', romaji: 'nu', alternates: [], group: 'NA-row', type: 'basic' },
  { character: 'ね', romaji: 'ne', alternates: [], group: 'NA-row', type: 'basic' },
  { character: 'の', romaji: 'no', alternates: [], group: 'NA-row', type: 'basic' },
  // HA-row
  { character: 'は', romaji: 'ha', alternates: [], group: 'HA-row', type: 'basic' },
  { character: 'ひ', romaji: 'hi', alternates: [], group: 'HA-row', type: 'basic' },
  { character: 'ふ', romaji: 'fu', alternates: ['hu'], group: 'HA-row', type: 'basic' },
  { character: 'へ', romaji: 'he', alternates: [], group: 'HA-row', type: 'basic' },
  { character: 'ほ', romaji: 'ho', alternates: [], group: 'HA-row', type: 'basic' },
  // MA-row
  { character: 'ま', romaji: 'ma', alternates: [], group: 'MA-row', type: 'basic' },
  { character: 'み', romaji: 'mi', alternates: [], group: 'MA-row', type: 'basic' },
  { character: 'む', romaji: 'mu', alternates: [], group: 'MA-row', type: 'basic' },
  { character: 'め', romaji: 'me', alternates: [], group: 'MA-row', type: 'basic' },
  { character: 'も', romaji: 'mo', alternates: [], group: 'MA-row', type: 'basic' },
  // YA-row
  { character: 'や', romaji: 'ya', alternates: [], group: 'YA-row', type: 'basic' },
  { character: 'ゆ', romaji: 'yu', alternates: [], group: 'YA-row', type: 'basic' },
  { character: 'よ', romaji: 'yo', alternates: [], group: 'YA-row', type: 'basic' },
  // RA-row
  { character: 'ら', romaji: 'ra', alternates: [], group: 'RA-row', type: 'basic' },
  { character: 'り', romaji: 'ri', alternates: [], group: 'RA-row', type: 'basic' },
  { character: 'る', romaji: 'ru', alternates: [], group: 'RA-row', type: 'basic' },
  { character: 'れ', romaji: 're', alternates: [], group: 'RA-row', type: 'basic' },
  { character: 'ろ', romaji: 'ro', alternates: [], group: 'RA-row', type: 'basic' },
  // WA-row
  { character: 'わ', romaji: 'wa', alternates: [], group: 'WA-row', type: 'basic' },
  { character: 'を', romaji: 'wo', alternates: ['o'], group: 'WA-row', type: 'basic' },
  // N
  { character: 'ん', romaji: 'n', alternates: ['nn', 'xn'], group: 'N', type: 'basic' },
];

export const DAKUTEN_HIRAGANA: HiraganaChar[] = [
  // GA-row
  { character: 'が', romaji: 'ga', alternates: [], group: 'GA-row', type: 'dakuten' },
  { character: 'ぎ', romaji: 'gi', alternates: [], group: 'GA-row', type: 'dakuten' },
  { character: 'ぐ', romaji: 'gu', alternates: [], group: 'GA-row', type: 'dakuten' },
  { character: 'げ', romaji: 'ge', alternates: [], group: 'GA-row', type: 'dakuten' },
  { character: 'ご', romaji: 'go', alternates: [], group: 'GA-row', type: 'dakuten' },
  // ZA-row
  { character: 'ざ', romaji: 'za', alternates: [], group: 'ZA-row', type: 'dakuten' },
  { character: 'じ', romaji: 'ji', alternates: ['zi'], group: 'ZA-row', type: 'dakuten' },
  { character: 'ず', romaji: 'zu', alternates: [], group: 'ZA-row', type: 'dakuten' },
  { character: 'ぜ', romaji: 'ze', alternates: [], group: 'ZA-row', type: 'dakuten' },
  { character: 'ぞ', romaji: 'zo', alternates: [], group: 'ZA-row', type: 'dakuten' },
  // DA-row
  { character: 'だ', romaji: 'da', alternates: [], group: 'DA-row', type: 'dakuten' },
  { character: 'ぢ', romaji: 'di', alternates: ['ji'], group: 'DA-row', type: 'dakuten' },
  { character: 'づ', romaji: 'du', alternates: ['zu'], group: 'DA-row', type: 'dakuten' },
  { character: 'で', romaji: 'de', alternates: [], group: 'DA-row', type: 'dakuten' },
  { character: 'ど', romaji: 'do', alternates: [], group: 'DA-row', type: 'dakuten' },
  // BA-row
  { character: 'ば', romaji: 'ba', alternates: [], group: 'BA-row', type: 'dakuten' },
  { character: 'び', romaji: 'bi', alternates: [], group: 'BA-row', type: 'dakuten' },
  { character: 'ぶ', romaji: 'bu', alternates: [], group: 'BA-row', type: 'dakuten' },
  { character: 'べ', romaji: 'be', alternates: [], group: 'BA-row', type: 'dakuten' },
  { character: 'ぼ', romaji: 'bo', alternates: [], group: 'BA-row', type: 'dakuten' },
  // PA-row
  { character: 'ぱ', romaji: 'pa', alternates: [], group: 'PA-row', type: 'dakuten' },
  { character: 'ぴ', romaji: 'pi', alternates: [], group: 'PA-row', type: 'dakuten' },
  { character: 'ぷ', romaji: 'pu', alternates: [], group: 'PA-row', type: 'dakuten' },
  { character: 'ぺ', romaji: 'pe', alternates: [], group: 'PA-row', type: 'dakuten' },
  { character: 'ぽ', romaji: 'po', alternates: [], group: 'PA-row', type: 'dakuten' },
];

export const COMBINATION_HIRAGANA: HiraganaChar[] = [
  // KY-group
  { character: 'きゃ', romaji: 'kya', alternates: [], group: 'KY-group', type: 'combination' },
  { character: 'きゅ', romaji: 'kyu', alternates: [], group: 'KY-group', type: 'combination' },
  { character: 'きょ', romaji: 'kyo', alternates: [], group: 'KY-group', type: 'combination' },
  // SH-group
  { character: 'しゃ', romaji: 'sha', alternates: ['sya'], group: 'SH-group', type: 'combination' },
  { character: 'しゅ', romaji: 'shu', alternates: ['syu'], group: 'SH-group', type: 'combination' },
  { character: 'しょ', romaji: 'sho', alternates: ['syo'], group: 'SH-group', type: 'combination' },
  // CH-group
  { character: 'ちゃ', romaji: 'cha', alternates: ['tya'], group: 'CH-group', type: 'combination' },
  { character: 'ちゅ', romaji: 'chu', alternates: ['tyu'], group: 'CH-group', type: 'combination' },
  { character: 'ちょ', romaji: 'cho', alternates: ['tyo'], group: 'CH-group', type: 'combination' },
  // NY-group
  { character: 'にゃ', romaji: 'nya', alternates: [], group: 'NY-group', type: 'combination' },
  { character: 'にゅ', romaji: 'nyu', alternates: [], group: 'NY-group', type: 'combination' },
  { character: 'にょ', romaji: 'nyo', alternates: [], group: 'NY-group', type: 'combination' },
  // HY-group
  { character: 'ひゃ', romaji: 'hya', alternates: [], group: 'HY-group', type: 'combination' },
  { character: 'ひゅ', romaji: 'hyu', alternates: [], group: 'HY-group', type: 'combination' },
  { character: 'ひょ', romaji: 'hyo', alternates: [], group: 'HY-group', type: 'combination' },
  // MY-group
  { character: 'みゃ', romaji: 'mya', alternates: [], group: 'MY-group', type: 'combination' },
  { character: 'みゅ', romaji: 'myu', alternates: [], group: 'MY-group', type: 'combination' },
  { character: 'みょ', romaji: 'myo', alternates: [], group: 'MY-group', type: 'combination' },
  // RY-group
  { character: 'りゃ', romaji: 'rya', alternates: [], group: 'RY-group', type: 'combination' },
  { character: 'りゅ', romaji: 'ryu', alternates: [], group: 'RY-group', type: 'combination' },
  { character: 'りょ', romaji: 'ryo', alternates: [], group: 'RY-group', type: 'combination' },
  // GY-group
  { character: 'ぎゃ', romaji: 'gya', alternates: [], group: 'GY-group', type: 'combination' },
  { character: 'ぎゅ', romaji: 'gyu', alternates: [], group: 'GY-group', type: 'combination' },
  { character: 'ぎょ', romaji: 'gyo', alternates: [], group: 'GY-group', type: 'combination' },
  // J-group
  { character: 'じゃ', romaji: 'ja', alternates: ['jya', 'zya'], group: 'J-group', type: 'combination' },
  { character: 'じゅ', romaji: 'ju', alternates: ['jyu', 'zyu'], group: 'J-group', type: 'combination' },
  { character: 'じょ', romaji: 'jo', alternates: ['jyo', 'zyo'], group: 'J-group', type: 'combination' },
  // BY-group
  { character: 'びゃ', romaji: 'bya', alternates: [], group: 'BY-group', type: 'combination' },
  { character: 'びゅ', romaji: 'byu', alternates: [], group: 'BY-group', type: 'combination' },
  { character: 'びょ', romaji: 'byo', alternates: [], group: 'BY-group', type: 'combination' },
  // PY-group
  { character: 'ぴゃ', romaji: 'pya', alternates: [], group: 'PY-group', type: 'combination' },
  { character: 'ぴゅ', romaji: 'pyu', alternates: [], group: 'PY-group', type: 'combination' },
  { character: 'ぴょ', romaji: 'pyo', alternates: [], group: 'PY-group', type: 'combination' },
];

export const ALL_HIRAGANA: HiraganaChar[] = [
  ...BASIC_HIRAGANA,
  ...DAKUTEN_HIRAGANA,
  ...COMBINATION_HIRAGANA
];

export function getCharacterSet(includeDakuten: boolean, includeCombinations: boolean): HiraganaChar[] {
  const set = [...BASIC_HIRAGANA];
  if (includeDakuten) {
    set.push(...DAKUTEN_HIRAGANA);
  }
  if (includeCombinations) {
    set.push(...COMBINATION_HIRAGANA);
  }
  return set;
}
