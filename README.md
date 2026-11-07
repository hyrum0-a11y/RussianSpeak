# RussianSpeak

An Android-first Expo app for practicing spoken Russian: memorizing phrases, pronunciation, and answering questions out loud.

## Features

- **Phrase review.** About 90 everyday phrases with stress marks. You see the English, say the Russian out loud, reveal it, and grade yourself. A spaced-repetition scheduler (simplified SM-2) decides when each phrase comes back.
- **Pronunciation.** Native text-to-speech (normal and slow speeds). You can record yourself, play your recording back, or play the native voice followed by your recording.
- **Respond to prompts.** The app asks a question out loud. You answer out loud, record it, and compare with sample answers and a grammar hint.
- **Phrase library.** Browse by category and tap a phrase to hear it.
- **Local progress.** Everything is saved on the phone (AsyncStorage). There is no account.

## Run it on your Android phone

1. Install **Expo Go** from the Play Store.
2. On a computer with Node 20 or newer:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go.

**Russian voice:** If the speech sounds wrong or silent, install the Russian voice. Open Settings → System → Languages → Text-to-speech output, tap the gear next to Speech Services by Google, choose Install voice data, then Russian.

## Build an installable APK (optional)

```bash
npx eas-cli@latest build --platform android --profile preview
```

This needs a free Expo account. It gives you an APK you can install directly.

## Development

```bash
npm run typecheck   # TypeScript
npm test            # SRS scheduler unit tests
```

- Screens live in `src/app/` (Expo Router).
- Phrase and prompt content is in `src/data/`. Mark stress with a combining acute accent (U+0301) after the vowel. The stress marks are stripped before the text is spoken.
- The scheduler is in `src/lib/srs.ts` and storage is in `src/lib/storage.ts`.
