// Text clean-up before it goes to the phone's text-to-speech engine.
// Pure (no Expo imports) so it can be unit-tested.

const STRESS = /́/g;

/**
 * Some phone voices pronounce letters that Russians leave silent
 * (здраВствуйте, чуВствовать, соЛнце…). Respell those clusters the way they sound.
 * Each entry: [written stem, spoken stem]. Matching ignores case and keeps the first letter's case.
 */
const SILENT_CONSONANTS: [string, string][] = [
  ['здравств', 'здраств'],
  ['чувств', 'чуств'],
  ['солнц', 'сонц'],
  ['сердц', 'серц'],
  ['праздн', 'празн'],
  ['поздн', 'позн'],
  ['звёздн', 'звёзн'],
  ['лестн', 'лесн'],
  ['честн', 'чесн'],
  ['местн', 'месн'],
  ['грустн', 'грусн'],
  ['счастлив', 'щаслив'],
];

const RESPELL = SILENT_CONSONANTS.map(([from, to]) => ({ re: new RegExp(from, 'gi'), to }));

function matchCase(original: string, replacement: string): string {
  const first = original[0];
  return first === first.toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
}

/** Strip stress marks and ellipses, and respell silent consonants. */
export function forSpeech(text: string): string {
  let out = text.replace(STRESS, '').replace(/…/g, '.').replace(/\s*\/\s*/g, ', ');
  for (const { re, to } of RESPELL) out = out.replace(re, (m) => matchCase(m, to));
  return out;
}

export type VoiceInfo = { identifier: string; name: string; language: string; quality?: string };

/** Normalize Android ("ru-RU", "ru_RU", "rus") and iOS language tags. */
export function isRussian(v: VoiceInfo): boolean {
  return /^ru(s)?([-_]|$)/i.test(v.language);
}

/**
 * Choose which Russian voice to use: the one picked in Settings if it still exists,
 * otherwise prefer on-device voices (Android names end in "-local"; "-network" ones
 * silently fall back to another voice when offline), then enhanced quality.
 */
export function pickRussianVoice(voices: VoiceInfo[], preferredId?: string): VoiceInfo | undefined {
  const ru = voices.filter(isRussian);
  if (preferredId) {
    const chosen = ru.find((v) => v.identifier === preferredId);
    if (chosen) return chosen;
  }
  const score = (v: VoiceInfo) =>
    (/local/i.test(v.identifier) ? 4 : 0) + (/network/i.test(v.identifier) ? -2 : 0) + (v.quality === 'Enhanced' ? 1 : 0);
  return [...ru].sort((a, b) => score(b) - score(a))[0];
}
