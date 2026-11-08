import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { addSong, keepFile, removeSong, searchFromFileName, useSongs, youtubeId, type Lyrics } from '../lib/songs';
import { LyricsFinder } from '../components/LyricsFinder';
import { Button, Card, colors, Row } from '../components/ui';

export default function Songs() {
  const [songs, reload] = useSongs();
  const [adding, setAdding] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Sing along to songs you like. Add a YouTube video or an audio file from your phone. The lyrics light up as
        they're sung, and you can slow the song down.
      </Text>

      {adding ? (
        <AddSong
          onDone={(id) => {
            setAdding(false);
            reload();
            if (id) router.push({ pathname: '/song', params: { id } });
          }}
        />
      ) : (
        <Button label="＋ Add a song" onPress={() => setAdding(true)} style={{ flex: 0 }} />
      )}

      {songs?.length === 0 && !adding ? <Text style={styles.empty}>No songs yet.</Text> : null}
      {songs?.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push({ pathname: '/song', params: { id: s.id } })}
          onLongPress={() =>
            Alert.alert('Delete song?', s.title, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => removeSong(s.id).then(reload) },
            ])
          }
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.icon}>{s.source.kind === 'youtube' ? '▶️' : '🎵'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.meta}>
              {s.source.kind === 'youtube' ? 'YouTube' : 'File'} ·{' '}
              {s.times.some((t) => t != null) ? 'lyrics highlight' : 'lyrics only'}
            </Text>
          </View>
        </Pressable>
      ))}
      {songs?.length ? <Text style={styles.empty}>Long-press a song to delete it.</Text> : null}
    </ScrollView>
  );
}

function AddSong({ onDone }: { onDone: (id?: string) => void }) {
  const [kind, setKind] = useState<'youtube' | 'file'>('youtube');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);
  const [step, setStep] = useState<'source' | 'lyrics'>('source');
  const [saving, setSaving] = useState(false);
  const vid = youtubeId(link);
  const ready = kind === 'youtube' ? !!vid : !!file;

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setFile({ uri: res.assets[0].uri, name: res.assets[0].name });
  }

  async function save(lyrics: Lyrics) {
    setSaving(true);
    try {
      const source =
        kind === 'youtube'
          ? { kind: 'youtube' as const, videoId: vid! }
          : { kind: 'file' as const, uri: await keepFile(file!.uri, file!.name) };
      const title = lyrics.label === 'Pasted lyrics' ? (file ? searchFromFileName(file.name) : 'Song') : lyrics.label;
      const s = await addSong(title, source, lyrics);
      onDone(s.id);
    } catch (e) {
      setSaving(false);
      Alert.alert("Couldn't add the song", String(e));
    }
  }

  if (step === 'lyrics') {
    return (
      <Card style={{ gap: 10 }}>
        <Text style={styles.formTitle}>{saving ? 'Saving…' : 'Lyrics'}</Text>
        <LyricsFinder initialQuery={file ? searchFromFileName(file.name) : ''} onPick={save} />
        <Button label="Cancel" variant="outline" onPress={() => onDone()} style={{ flex: 0 }} />
      </Card>
    );
  }

  return (
    <Card style={{ gap: 10 }}>
      <Text style={styles.formTitle}>New song</Text>
      <View style={styles.tabs}>
        {(['youtube', 'file'] as const).map((k) => (
          <Pressable key={k} onPress={() => setKind(k)} style={[styles.chip, kind === k && styles.chipOn]}>
            <Text style={[styles.chipText, kind === k && styles.chipTextOn]}>
              {k === 'youtube' ? '▶️ YouTube link' : '📂 File on phone'}
            </Text>
          </Pressable>
        ))}
      </View>
      {kind === 'youtube' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Paste a YouTube link"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.help}>In YouTube, tap Share → Copy link, then paste it here.</Text>
          {link && !vid ? <Text style={styles.error}>That doesn't look like a YouTube link.</Text> : null}
        </>
      ) : (
        <Button label={file ? `🎵 ${file.name}` : 'Choose audio file'} variant="outline" onPress={pick} style={{ flex: 0 }} />
      )}
      <Row>
        <Button label="Cancel" variant="outline" onPress={() => onDone()} />
        <Button label="Next: lyrics" disabled={!ready} onPress={() => setStep('lyrics')} />
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
  tabs: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
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
