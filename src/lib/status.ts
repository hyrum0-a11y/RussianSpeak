import type { CardState } from './srs';

export type Status = 'new' | 'due' | 'learning' | 'learned';

export const STATUS_LABEL: Record<Status, string> = {
  due: 'Пора́',
  learning: 'В проце́ссе',
  learned: 'Вы́учено',
  new: 'Но́вое',
};

export const STATUS_EN: Record<Status, string> = {
  due: 'Due now',
  learning: 'Learning',
  learned: 'Learned',
  new: 'New',
};

/** "Learned" once it has survived three reviews in a row. */
export function statusOf(c: CardState | undefined, now: number): Status {
  if (!c) return 'new';
  if (c.due <= now) return 'due';
  return c.reps >= 3 ? 'learned' : 'learning';
}
