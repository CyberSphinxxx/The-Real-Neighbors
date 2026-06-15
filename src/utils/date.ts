export function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return '';

  let date: Date;

  // Handle Firestore Timestamp objects (they have .toDate() or .seconds)
  if (typeof timestamp === 'object' && timestamp !== null && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'object' && timestamp !== null && typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  // Guard against invalid dates
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function getDaysUntilBirthday(birthdate: string): number {
  if (!birthdate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, month, day] = birthdate.split('-').map(Number);
  let nextBday = new Date(today.getFullYear(), month - 1, day);
  if (nextBday.getTime() < today.getTime()) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }
  const diffTime = Math.abs(nextBday.getTime() - today.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateAgeTurning(birthdate: string): number {
  if (!birthdate) return 0;
  const [year, month, day] = birthdate.split('-').map(Number);
  const today = new Date();
  let nextBday = new Date(today.getFullYear(), month - 1, day);
  if (nextBday.getTime() < today.setHours(0, 0, 0, 0)) {
    return today.getFullYear() + 1 - year;
  }
  return today.getFullYear() - year;
}

export function isBirthdayToday(birthdate: string): boolean {
  if (!birthdate) return false;
  const [, month, day] = birthdate.split('-');
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');
  return month === currentMonth && day === currentDay;
}

