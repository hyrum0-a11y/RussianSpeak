import * as Speech from 'expo-speech';
import { forSpeech, isRussian, pickRussianVoice, type VoiceInfo } from './speechText';
import { wordAtChar } from './follow';

export { forSpeech };

// The voice to use. Set from Settings via setPreferredVoice; resolved lazily.
let preferredId: string | undefined;
let resolved: string | undefined;
let resolving: Promise<void> | null = null;

export async function getRussianVoices(): Promise<VoiceInfo[]> {
  try {
    return (await Speech.getAvailableVoicesAsync()).filter(isRussian);
  } catch {
    return [];
  }
}

async function resolveVoice() {
  const voices = await getRussianVoices();
  resolved = pickRussianVoice(voices, preferredId)?.identifier;
}

export function setPreferredVoice(id: string | undefined) {
  preferredId = id;
  resolving = resolveVoice();
}

export function speakRu(text: string, rate = 0.9, onDone?: () => void) {
  Speech.stop();
  if (!resolving) resolving = resolveVoice();
  resolving.then(() => {
    // Passing an explicit Russian voice stops the engine from reading Cyrillic with an English voice.
    Speech.speak(forSpeech(text), { language: 'ru-RU', voice: resolved, rate, onDone });
  });
}

export function stopSpeaking() {
  Speech.stop();
}

/** True if the device has at least one Russian TTS voice installed. */
export async function hasRussianVoice(): Promise<boolean> {
  try {
    return (await getRussianVoices()).length > 0;
  } catch {
    return true; // can't tell; don't nag
  }
}

/**
 * Speak and report which word is being said. Uses the engine's word positions when the
 * voice provides them; the caller falls back to timing estimates when it doesn't.
 */
export function speakFollow(
  text: string,
  rate: number,
  on: { start?: () => void; done?: () => void; word?: (i: number) => void },
) {
  Speech.stop();
  if (!resolving) resolving = resolveVoice();
  const spoken = forSpeech(text);
  resolving.then(() => {
    Speech.speak(spoken, {
      language: 'ru-RU',
      voice: resolved,
      rate,
      onStart: on.start,
      onDone: on.done,
      onBoundary: (ev: { charIndex: number }) => on.word?.(wordAtChar(spoken, ev.charIndex)),
    });
  });
}
