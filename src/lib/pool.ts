import { allPhrases, type Phrase } from '../data/phrases';
import type { Progress } from './storage';

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Phrases for a practice session: ones you've already seen first (so practice
 * reinforces what you're learning), topped up with unseen ones.
 */
export function practicePool(p: Progress, n: number, filter: (x: Phrase) => boolean = () => true): Phrase[] {
  const all = allPhrases(p.custom).filter(filter);
  const seen = shuffle(all.filter((x) => p.cards[x.id]));
  const unseen = shuffle(all.filter((x) => !p.cards[x.id]));
  return [...seen, ...unseen].slice(0, n);
}
