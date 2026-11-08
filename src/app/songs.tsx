import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { addSong, keepFile, removeSong, searchFromFileName, useSongs, youtubeId, type Lyrics } from '../lib/songs';
import { LyricsFinder } from '../components/LyricsFinder';
import { Button, Card, colors, Row, T } from '../components/ui';

export default function Songs() {
  const [songs, reload] = useSongs();
  const [adding, setAdding] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <T style={styles.intro} en="Sing along to Russian songs. Find a song, add its YouTube video (or a file on your phone), and the lyrics light up as they're sung. Slow it down anytime.">
        Пойте вместе с русскими песнями. Найдите песню, добавьте видео с YouTube (или файл с телефона), и текст
        подсвечивается, пока звучит. Скорость можно менять.
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
        <Button label="＋ Добавить песню" en="Add a song" onPress={() => setAdding(true)} style={{ flex: 0 }} />
      )}

      {songs?.length === 0 && !adding ? <T style={styles.empty} en="No songs yet.">Песен пока нет.</T> : null}
      {songs?.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push({ pathname: '/song', params: { id: s.id } })}
          onLongPress={() =>
            Alert.alert('Удалить песню?', s.title, [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Удалить', style: 'destructive', onPress: () => removeSong(s.id).then(reload) },
            ])
          }
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.icon}>{s.source.kind === 'youtube' ? '▶️' : '🎵'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.meta}>
              {s.source.kind === 'youtube' ? 'YouTube' : 'Файл'} ·{' '}
              {s.times.some((t) => t != null) ? 'текст с подсветкой' : 'только текст'}
            </Text>
          </View>
        </Pressable>
      ))}
      {songs?.length ? <T style={styles.empty} en="Long-press a song to delete it.">Удерживайте песню, чтобы удалить её.</T> : null}
    </ScrollView>
  );
}

function AddSong({ onDone }: { onDone: (id?: string) => void }) {
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [link, setLink] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const vid = youtubeId(link);
  const linkRef = useRef(link);
  linkRef.current = link;

  // Coming back from YouTube with a copied link: fill it in automatically.
  useEffect(() => {
    if (!lyrics) return;
    const sub = AppState.addEventListener('change', async (st) => {
      if (st !== 'active' || youtubeId(linkRef.current)) return;
      const text = await Clipboard.getStringAsync().catch(() => '');
      if (youtubeId(text)) {
        setLink(text);
        setFile(null);
      }
    });
    return () => sub.remove();
  }, [lyrics]);

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setFile({ uri: res.assets[0].uri, name: res.assets[0].name });
    setLink('');
  }

  async function save() {
    if (!lyrics) return;
    setSaving(true);
    try {
      const source = file
        ? { kind: 'file' as const, uri: await keepFile(file.uri, file.name) }
        : { kind: 'youtube' as const, videoId: vid! };
      const title = lyrics.label === 'Свой текст' ? (file ? searchFromFileName(file.name) : 'Моя песня') : lyrics.label;
      const s = await addSong(title, source, lyrics);
      onDone(s.id);
    } catch (e) {
      setSaving(false);
      Alert.alert('Не получилось добавить песню', String(e));
    }
  }

  if (!lyrics) {
    return (
      <Card style={{ gap: 10 }}>
        <T style={styles.formTitle} en="1. Find a song">1. Найдите песню</T>
        <LyricsFinder initialQuery="" browse onPick={setLyrics} />
        <Button label="Отмена" en="Cancel" variant="outline" onPress={() => onDone()} style={{ flex: 0 }} />
      </Card>
    );
  }

  const ytSearch = lyrics.label === 'Свой текст' ? '' : lyrics.label;
  return (
    <Card style={{ gap: 10 }}>
      <T style={styles.formTitle} en="2. Add the music">2. Добавьте музыку</T>
      <Text style={styles.songName}>🎵 {lyrics.label}</Text>
      <Button
        label="▶️ Найти на YouTube" en="Find it on YouTube"
        color={colors.again}
        onPress={() =>
          Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(ytSearch || 'русские песни')}`)
        }
        style={{ flex: 0 }}
      />
      <T style={styles.help} en="Pick a video, tap Share → Copy link, then come back here. The link fills in by itself.">Выберите видео, нажмите «Поделиться» → «Копировать ссылку» и вернитесь сюда. Ссылка вставится сама.</T>
      <TextInput
        style={styles.input}
        placeholder="…или вставьте ссылку YouTube"
        value={link}
        onChangeText={(t) => {
          setLink(t);
          if (t) setFile(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {link && !vid ? <T style={styles.error} en="That doesn't look like a YouTube link.">Это не похоже на ссылку YouTube.</T> : null}
      {vid ? <T style={styles.ok} en="✓ YouTube video ready">✓ Видео YouTube готово</T> : null}
      <Button
        label={file ? `📂 ${file.name}` : '📂 Или аудиофайл с телефона'}
        variant="outline"
        onPress={pick}
        style={{ flex: 0 }}
      />
      <Row>
        <Button label="Назад" en="Back" variant="outline" onPress={() => setLyrics(null)} />
        <Button label={saving ? 'Сохраняю…' : 'Сохранить песню'} en="Save song" disabled={!(vid || file) || saving} onPress={save} />
      </Row>
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
