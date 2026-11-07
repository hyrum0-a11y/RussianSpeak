import * as Speech from 'expo-speech';

const STRESS = /́/g;

/** Remove stress marks (and ellipses) so text-to-speech reads the text naturally. */
export function forSpeech(text: string): string {
  return text.replace(STRESS, '').replace(/…/g, '.');
}

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
