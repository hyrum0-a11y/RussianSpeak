# RussianSpeak

An Android-first Expo app for practicing spoken Russian: memorizing phrases, pronunciation, and answering questions out loud.

## Features

- **Three decks.** About 90 everyday phrases, 20 famous sayings (пословицы) with literal translations, and 19 iconic lines from classic Soviet and Russian films. Every phrase has stress marks.
- **Phrase review.** By default the card shows the Cyrillic. You read it aloud and work out the meaning yourself. English stays hidden behind a "Peek" tap, except for sayings and movie lines, which show their meaning automatically. You can switch to English-first in Settings. A spaced-repetition scheduler (simplified SM-2) decides when each phrase comes back.
- **Pronunciation.** Native text-to-speech (normal and slow speeds). You can record yourself, play your recording back, or play the native voice followed by your recording.
- **Respond to prompts.** The app asks a question out loud. You answer out loud, record it, and compare with sample answers and a grammar hint.
- **More decks.** Poetry and folk songs (Pushkin, Lermontov, Tyutchev, Yesenin, Blok, folk songs; all public domain) and everyday slang.
- **My phrases.** Add your own phrases in the Phrase library. Type `'` after a vowel to mark stress. Long-press a phrase to delete it.
- **Speech check.** Say a phrase and Android's speech recognizer shows which words it understood. Russian offline recognition may need to be added in the Google app.
- **Dictation.** Hear a phrase with no text, type it, and see a word-by-word comparison.
- **Fill in the blank.** One word is removed from a phrase and you type it. Good for cases and verb endings.
- **Sing along.** Pick a song from a built-in list of popular Russian artists (or search any song), then add its YouTube video or an audio file on your phone. The app finds timed lyrics online (from LRCLIB, a free lyrics library), so each line lights up as it's sung. Play at 0.5×–1.25× and pause anytime. If the lyrics run early or late, nudge them with Earlier / Later.
- **Practice by grade.** The home screen shows how many cards you last marked Again, Hard, Good or Easy. Tap one to drill just those (your schedule isn't changed, but the new grade is remembered).
- **Difficult.** A page listing every card you last marked Again or Hard. Mark one Good or Easy and it leaves the list.
- **Ask AI.** On any card or dictionary word, tap 🤖 Спросить ИИ to write a question in Russian (add your own if you like) and send it to any AI app through the share menu, or copy it.
- **Словарь.** A Russian-only dictionary of every word in your cards, searchable. Tap a word for its meanings from Викисловарь (Russian Wiktionary), or search any word.
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

## Build the app from your phone (no computer needed)

An APK is the Android app-install file, like an .exe on Windows.

1. On GitHub (the app or the website), open this repo and go to **Actions → Build Android APK → Run workflow**. It also runs automatically after every merge to `main`.
2. Wait about 10–15 minutes for it to turn green.
3. Open **Releases** and pick the newest "RussianSpeak build". Download the `.apk` file and open it.
4. Android will ask you to allow installs from your browser or the GitHub app. Allow it, then tap Install.

To update later, tap **Download & install** on the home screen when an update shows. The app downloads the APK itself and opens Android's installer (the first time, allow RussianSpeak to install apps). Your progress is kept.

## Build an APK with EAS (alternative)

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
