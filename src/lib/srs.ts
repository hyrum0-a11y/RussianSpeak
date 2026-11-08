// Simplified SM-2 spaced repetition. Pure functions so they can be unit-tested.

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type CardState = {
  reps: number; // successful reviews in a row
  interval: number; // days until next review
  ease: number; // multiplier, starts at 2.5
  due: number; // epoch ms
  lapses: number;
  last?: Grade; // the most recent grade you gave
};

export const DAY = 24 * 60 * 60 * 1000;
export const MIN = 60 * 1000;

export function newCard(now: number): CardState {
  return { reps: 0, interval: 0, ease: 2.5, due: now, lapses: 0 };
}

export function schedule(card: CardState, grade: Grade, now: number): CardState {
  let { reps, interval, ease, lapses } = card;

  if (grade === 'again') {
    return {
      reps: 0,
      interval: 0,
      ease: Math.max(1.3, ease - 0.2),
      due: now + 10 * MIN,
      lapses: lapses + 1,
      last: 'again',
    };
  }

  if (grade === 'hard') ease = Math.max(1.3, ease - 0.15);
  if (grade === 'easy') ease = ease + 0.15;

  if (reps === 0) {
    interval = grade === 'easy' ? 4 : 1;
  } else if (reps === 1) {
    interval = grade === 'hard' ? 3 : grade === 'easy' ? 8 : 6;
  } else {
    const mult = grade === 'hard' ? 1.2 : grade === 'easy' ? ease * 1.3 : ease;
    interval = Math.max(interval + 1, Math.round(interval * mult));
  }

  return { reps: reps + 1, interval, ease, due: now + interval * DAY, lapses, last: grade };
}

/** Human-friendly preview of when a grade would schedule the card next. */
export function previewInterval(card: CardState, grade: Grade, now: number): string {
  const ms = schedule(card, grade, now).due - now;
  if (ms < 60 * MIN) return `${Math.round(ms / MIN)}m`;
  const days = Math.round(ms / DAY);
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

/** Order: overdue cards first (oldest due first), then up to `newLimit` unseen ids. */
export function buildQueue(
  ids: string[],
  states: Record<string, CardState>,
  now: number,
  newLimit: number,
): string[] {
  const due = ids
    .filter((id) => states[id] && states[id].due <= now)
    .sort((a, b) => states[a].due - states[b].due);
  const fresh = ids.filter((id) => !states[id]).slice(0, Math.max(0, newLimit));
  return [...due, ...fresh];
}

/** Hard, Good or Easy. ("Again" from older versions counts as Hard.) */
export type Level = 'hard' | 'good' | 'easy';

/** How the three grades are shown: Учу (still learning), Почти (almost), Знаю (I know it). */
export const LEVEL_NAMES: Record<Level, { ru: string; en: string }> = {
  hard: { ru: 'Учу́', en: "Still learning: I want to practice it" },
  good: { ru: 'Почти́', en: 'Almost: I got it, but not confident yet' },
  easy: { ru: 'Зна́ю', en: "I know it: it's memorized" },
};

/** How well you know a card: your last grade, or a guess from its history for older cards. */
export function gradeOf(card: CardState): Level {
  if (card.last) return card.last === 'again' ? 'hard' : card.last;
  if (card.reps === 0) return 'hard';
  if (card.ease < 2.4) return 'hard';
  if (card.ease > 2.6) return 'easy';
  return 'good';
}
