export function calculateWPM(chars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  // (chars / 5) / (seconds / 60)
  const minutes = seconds / 60;
  return Math.round((chars / 5) / minutes);
}

export function calculateNetWPM(rawWPM: number, errors: number, seconds: number): number {
  if (seconds <= 0) return 0;
  const minutes = seconds / 60;
  const net = Math.round(rawWPM - (errors / minutes));
  return Math.max(0, net);
}

export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars === 0) return 100;
  const acc = (correctChars / totalChars) * 100;
  // Round to 1 decimal place
  return Math.round(acc * 10) / 10;
}

export function calculateConsistency(wpmHistory: { second: number; wpm: number }[]): number {
  if (wpmHistory.length < 2) return 100;
  
  const values = wpmHistory.map(h => h.wpm);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  if (mean === 0) return 0;
  
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Consistency formula: 100 - Coefficient of Variation
  const cv = (stdDev / mean) * 100;
  return Math.max(0, Math.round(100 - cv));
}

export function getSpeedLabel(wpm: number): { label: string; color: string } {
  if (wpm < 30) return { label: 'Beginner', color: '#ef4444' };
  if (wpm < 50) return { label: 'Average', color: '#f97316' };
  if (wpm < 70) return { label: 'Good', color: '#eab308' };
  if (wpm < 90) return { label: 'Fast', color: '#22c55e' };
  if (wpm < 120) return { label: 'Pro', color: '#3b82f6' };
  return { label: 'Insane', color: '#8b5cf6' };
}

export function generateGhostTimings(text: string, wpm: number): number[] {
  if (wpm <= 0) return Array(text.length).fill(0);
  
  // ms per character for this WPM
  // WPM = (chars / 5) / minutes => chars/min = WPM * 5
  // chars/ms = (WPM * 5) / 60000 => ms/char = 60000 / (WPM * 5)
  const msPerChar = 60000 / (wpm * 5);
  
  const timings: number[] = [];
  let currentMs = 0;
  
  for (let i = 0; i < text.length; i++) {
    // Add ±15% jitter to make it feel human
    const jitter = msPerChar * (0.85 + Math.random() * 0.3);
    currentMs += jitter;
    timings.push(Math.round(currentMs));
  }
  
  return timings;
}

export function getLeaderboardKey(mode: string, pack: string, length: string): string {
  if (mode === 'timed') {
    return `timed_${length}`;
  }
  if (mode === 'quote') {
    return `quote_${pack}`;
  }
  if (mode === 'zen') {
    return 'zen'; // Though zen shouldn't submit to leaderboard
  }
  // Words
  return `words_${pack}_${length}`;
}
