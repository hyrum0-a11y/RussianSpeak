import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { addSong, keepFile, removeSong, searchFromFileName, useSongs, type Lyrics, type SongSource } from '../lib/songs';
import { MusicFiles, type MusicFile } from '../components/MusicFiles';
import { YouTubePicker } from '../components/YouTubePicker';
import { LyricsFinder } from '../components/LyricsFinder';
import { Button, Card, colors, Row, T } from '../components/ui';

export default function Songs() {
  const [songs, reload] = useSongs();
  const [adding, setAdding] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <T style={styles.intro} en="Sing along to Russian songs. Add a song from your phone's music or from YouTube, and the lyrics light up as they're sung. Slow it down anytime.">
        По́йте вме́сте с ру́сскими пе́снями. Доба́вьте пе́сню из му́зыки на телефо́не и́ли с YouTube, и текст
        подсве́чивается, пока́ звучи́т. Ско́рость мо́жно меня́ть.
      </T>

      {adding ? (
        <AddSong
          onDone={(id) => {
            setAdding(false);
            reload();
            if (id) router.push({ pathname: '/song', params: { id } });
          }}
        />
      ) : (
        <Button label="＋ Доба́вить пе́сню" en="Add a song" onPress={() => setAdding(true)} style={{ flex: 0 }} />
      )}

      {songs?.length === 0 && !adding ? <T style={styles.empty} en="No songs yet.">Пе́сен пока́ нет.</T> : null}
      {songs?.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push({ pathname: '/song', params: { id: s.id } })}
          onLongPress={() =>
            Alert.alert('Удали́ть пе́сню?', s.title, [
              { text: 'Отме́на', style: 'cancel' },
              { text: 'Удали́ть', style: 'destructive', onPress: () => removeSong(s.id).then(reload) },
            ])
          }
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.icon}>{s.source.kind === 'youtube' ? '▶️' : '🎵'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.meta}>
              {s.source.kind === 'youtube' ? 'YouTube' : 'Файл'} ·{' '}
              {s.times.some((t) => t != null) ? 'текст с подсве́ткой' : 'то́лько текст'}
            </Text>
          </View>
        </Pressable>
      ))}
      {songs?.length ? <T style={styles.empty} en="Long-press a song to delete it.">Уде́рживайте пе́сню, что́бы удали́ть её.</T> : null}
    </ScrollView>
  );
}

function AddSong({ onDone }: { onDone: (id?: string) => void }) {
  const [mode, setMode] = useState<'file' | 'youtube' | null>(null);
  const [file, setFile] = useState<MusicFile & { copy?: boolean } | null>(null);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(source: SongSource, l: Lyrics, fallbackTitle: string) {
    setSaving(true);
    try {
      const title = l.label === 'Свой текст' ? fallbackTitle : l.label;
      const s = await addSong(title, source, l);
      onDone(s.id);
    } catch (e) {
      setSaving(false);
      Alert.alert('Не получи́лось доба́вить пе́сню', String(e));
    }
  }

  async function pickOther() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setFile({ uri: res.assets[0].uri, name: res.assets[0].name, copy: true });
  }

  async function saveFile(l: Lyrics) {
    if (!file) return;
    // Files from the music folder are played where they are; picked files are copied into the app.
    const uri = file.copy ? await keepFile(file.uri, file.name) : file.uri;
    await save({ kind: 'file', uri }, l, searchFromFileName(file.name));
  }

  const cancel = <Button label="Отме́на" en="Cancel" variant="outline" onPress={() => onDone()} style={{ flex: 0 }} />;

  if (saving) return <Card><T style={styles.help} en="Saving…">Сохраня́ю…</T></Card>;

  if (!mode) {
    return (
      <Card style={{ gap: 10 }}>
        <T style={styles.formTitle} en="Where is the song?">Отку́да пе́сня?</T>
        <Button label="🎵 Из му́зыки на телефо́не" en="From music files on your phone" onPress={() => setMode('file')} style={{ flex: 0 }} />
        <Button label="▶️ С YouTube" en="From YouTube" color={colors.again} onPress={() => setMode('youtube')} style={{ flex: 0 }} />
        {cancel}
      </Card>
    );
  }

  if (mode === 'file') {
    if (!file) {
      return (
        <Card style={{ gap: 10 }}>
          <T style={styles.formTitle} en="1. Choose a file">1. Вы́берите файл</T>
          <MusicFiles onPick={setFile} onOther={pickOther} />
          {cancel}
        </Card>
      );
    }
    return (
      <Card style={{ gap: 10 }}>
        <T style={styles.formTitle} en="2. Pick the lyrics">2. Вы́берите текст</T>
        <Text style={styles.songName}>🎵 {searchFromFileName(file.name)}</Text>
        <LyricsFinder initialQuery={searchFromFileName(file.name)} onPick={saveFile} />
        <Button label="Наза́д" en="Back" variant="outline" onPress={() => setFile(null)} style={{ flex: 0 }} />
      </Card>
    );
  }

  // YouTube: choose the lyrics, then tap the video.
  if (!lyrics) {
    return (
      <Card style={{ gap: 10 }}>
        <T style={styles.formTitle} en="1. Find the song">1. Найди́те пе́сню</T>
        <LyricsFinder initialQuery="" browse onPick={setLyrics} />
        {cancel}
      </Card>
    );
  }
  const query = lyrics.label === 'Свой текст' ? 'ру́сские пе́сни' : lyrics.label;
  return (
    <Card style={{ gap: 10 }}>
      <T style={styles.formTitle} en="2. Tap the video">2. Нажми́те на ви́део</T>
      <Text style={styles.songName}>🎵 {lyrics.label}</Text>
      <YouTubePicker
        query={query.replace(/́/g, '')}
        onPick={(videoId) => save({ kind: 'youtube', videoId }, lyrics, 'Моя́ пе́сня')}
        onClose={() => setLyrics(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { color: colors.text, fontSize: 15, lineHeight: 21 },
  empty: { color: colors.muted, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  icon: { fontSize: 24 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  songName: { fontSize: 16, fontWeight: '600', color: colors.primary },
  ok: { color: colors.good, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  help: { color: colors.muted, fontSize: 13 },
  error: { color: colors.again },
});
