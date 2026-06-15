import { type HiraganaChar, BASIC_HIRAGANA, DAKUTEN_HIRAGANA, COMBINATION_HIRAGANA } from './hiraganaData';

export function shuffleArray<T>(arr: T[]): T[] {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function generateChoices(correct: HiraganaChar, allChars: HiraganaChar[], numChoices: number = 4): string[] {
  const choices = new Set<string>();
  choices.add(correct.romaji);

  // Group other chars
  const otherGroups = allChars.filter(c => c.group !== correct.group && c.romaji !== correct.romaji);
  const sameGroup = allChars.filter(c => c.group === correct.group && c.romaji !== correct.romaji);
  
  // Prefer taking from other groups
  const pool = shuffleArray(otherGroups.length >= 3 ? otherGroups : [...otherGroups, ...sameGroup]);

  for (const char of pool) {
    if (choices.size >= numChoices) break;
    // Don't include alternates of correct answer
    if (char.romaji !== correct.romaji && !correct.alternates.includes(char.romaji)) {
      choices.add(char.romaji);
    }
  }

  // If still not full, fallback to random roman letters
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  while (choices.size < numChoices) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    if (!choices.has(randomLetter) && !correct.alternates.includes(randomLetter)) {
      choices.add(randomLetter);
    }
  }

  return shuffleArray(Array.from(choices));
}

// Level 6-10 Lookalikes configuration
export const LOOKALIKE_GROUPS: string[][] = [
  ['さ', 'き', 'ち'],
  ['め', 'ぬ', 'あ'],
  ['れ', 'ね', 'わ'],
  ['は', 'ほ', 'ま'],
  ['る', 'ろ'],
  ['い', 'り', 'こ'],
  ['た', 'に'],
  ['ツ', 'シ', 'ソ', 'ン'], // Future proofing for Katakana
  ['シ', 'ツ'], // Future proofing
];

export function generateAdaptiveCard(level: number, _settings: { includeDakuten: boolean, includeCombinations: boolean }): { card: HiraganaChar, choices: string[] } {
  let numChoices = 4;
  if (level > 5) numChoices = 6;
  if (level > 10) numChoices = 8;

  // Level 1-5 (0-24 correct): Basic only
  if (level <= 5) {
    const basicPool = BASIC_HIRAGANA;
    const card = basicPool[Math.floor(Math.random() * basicPool.length)];
    return { card, choices: generateChoices(card, basicPool, numChoices) };
  }

  // Level 6-10 (25-49 correct): Lookalikes only
  if (level <= 10) {
    // Pick a random lookalike group
    const hiraganaLookalikes = LOOKALIKE_GROUPS.filter(g => g.every(char => BASIC_HIRAGANA.some(bc => bc.character === char)));
    const group = hiraganaLookalikes[Math.floor(Math.random() * hiraganaLookalikes.length)];
    const cardChar = group[Math.floor(Math.random() * group.length)];
    const card = BASIC_HIRAGANA.find(c => c.character === cardChar)!;
    
    // Generate choices specifically from this lookalike group
    const choices = new Set<string>();
    choices.add(card.romaji);
    
    // Add other members of the group
    const otherGroupChars = group.filter(c => c !== cardChar);
    for (const charStr of otherGroupChars) {
      const charObj = BASIC_HIRAGANA.find(c => c.character === charStr);
      if (charObj) choices.add(charObj.romaji);
    }
    
    // Fill up if the group is smaller
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    while (choices.size < numChoices) {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      if (!choices.has(randomLetter)) choices.add(randomLetter);
    }
    
    return { card, choices: shuffleArray(Array.from(choices)) };
  }

  // Level 11+ (50+ correct): Hell Mode
  const hellPool = [...DAKUTEN_HIRAGANA, ...COMBINATION_HIRAGANA];
  
  // If user disabled both, just fall back to everything
  if (hellPool.length === 0) {
    hellPool.push(...BASIC_HIRAGANA);
  }
  
  const card = hellPool[Math.floor(Math.random() * hellPool.length)];
  return { card, choices: generateChoices(card, [...BASIC_HIRAGANA, ...DAKUTEN_HIRAGANA, ...COMBINATION_HIRAGANA], numChoices) };
}

export function isCorrectAnswer(input: string, char: HiraganaChar): boolean {
  const cleanInput = input.toLowerCase().trim();
  return cleanInput === char.romaji || char.alternates.includes(cleanInput);
}

export function calculateSpeedScore(timeLeftMs: number, totalTimeMs: number): number {
  if (timeLeftMs <= 0) return 0;
  const ratio = timeLeftMs / totalTimeMs;
  if (ratio > 0.7) return 100;
  if (ratio > 0.4) return 75;
  return 50;
}

export function calculateTypeScore(timeLeftMs: number, totalTimeMs: number): number {
  if (timeLeftMs <= 0) return 0;
  const ratio = timeLeftMs / totalTimeMs;
  if (ratio > 0.7) return 150;
  if (ratio > 0.4) return 112;
  return 75;
}

export function getScoreLabel(score: number, mode: string, totalCards?: number): string {
  if (mode === 'all') {
    const maxScore = totalCards || 46;
    const ratio = score / (maxScore * 10); // score in 'all' is correctCount * 10
    if (ratio === 1) return "完璧! (Kanpeki!) Perfect! 🏆";
    if (ratio >= 0.8) return "すごい! (Sugoi!) Amazing! 🔥";
    if (ratio >= 0.6) return "いいね! (Ii ne!) Good job! 👍";
    if (ratio >= 0.4) return "まあまあ (Maa maa) Not bad... 😅";
    return "もっと練習! (Motto renshuu!) Keep practicing! 💀";
  } else {
    // Speed (out of 1000) or Type (out of 1500)
    const maxScore = mode === 'speed' ? 1000 : 1500;
    const ratio = score / maxScore;
    if (ratio >= 0.9) return "完璧! Perfect! 🏆";
    if (ratio >= 0.7) return "すごい! Amazing! 🔥";
    if (ratio >= 0.5) return "いいね! Good! 👍";
    if (ratio >= 0.3) return "まあまあ Not bad 😅";
    return "もっと練習! Keep practicing! 💀";
  }
}

export function getWrongAnswerGroups(wrongAnswers: { char: HiraganaChar }[]): Record<string, HiraganaChar[]> {
  const groups: Record<string, HiraganaChar[]> = {};
  for (const { char } of wrongAnswers) {
    if (!groups[char.group]) {
      groups[char.group] = [];
    }
    // Avoid duplicates in the same group if it happens
    if (!groups[char.group].some(c => c.character === char.character)) {
      groups[char.group].push(char);
    }
  }
  return groups;
}
