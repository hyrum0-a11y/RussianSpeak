import * as Speech from 'expo-speech';

import { forSpeech } from './speechText';

export { forSpeech };

export function speakRu(text: string, rate = 0.9, onDone?: () => void) {
  Speech.stop();
  Speech.speak(forSpeech(text), { language: 'ru-RU', rate, onDone });
}

export function stopSpeaking() {
  Speech.stop();
}

/** True if the device has at least one Russian TTS voice installed. */
export async function hasRussianVoice(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.some((v) => v.language.toLowerCase().startsWith('ru'));
  } catch {
    return true; // can't tell; don't nag
  }
}
