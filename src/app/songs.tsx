import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { addSong, removeSong, useSongs } from '../lib/songs';
import { Button, Card, colors, Row } from '../components/ui';

export default function Songs() {
  const [songs, reload] = useSongs();
  const [adding, setAdding] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Sing along to songs you like. Pick an audio file from your phone, paste the lyrics, and play it slower while
        the lyrics follow along.
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
      {songs?.map((s) => {
        const synced = s.times.filter((t) => t != null).length;
        return (
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
            <Text style={styles.icon}>🎵</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.meta}>
                {s.lines.length} lines · {synced === s.lines.length && synced ? 'synced ✓' : synced ? `${synced} synced` : 'not synced yet'}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {songs?.length ? <Text style={styles.empty}>Long-press a song to delete it.</Text> : null}
    </ScrollView>
  );
}

function AddSong({ onDone }: { onDone: (id?: string) => void }) {
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [saving, setSaving] = useState(false);
  const ok = !!file && lyrics.trim().length > 0 && !saving;

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setFile({ uri: a.uri, name: a.name });
    if (!title) setTitle(a.name.replace(/\.[a-z0-9]{2,5}$/i, ''));
  }

  async function save() {
    if (!file) return;
    setSaving(true);
    try {
      const s = await addSong(title, file.uri, file.name, lyrics);
      onDone(s.id);
    } catch (e) {
      setSaving(false);
      Alert.alert("Couldn't add the song", String(e));
    }
  }

  return (
    <Card style={{ gap: 10 }}>
      <Text style={styles.formTitle}>New song</Text>
      <Button label={file ? `🎵 ${file.name}` : '📂 Choose audio file'} variant="outline" onPress={pick} style={{ flex: 0 }} />
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.lyrics]}
        placeholder={'Paste the lyrics here, one line per line'}
        value={lyrics}
        onChangeText={setLyrics}
        multiline
        textAlignVertical="top"
      />
      <Row>
        <Button label="Cancel" variant="outline" onPress={() => onDone()} />
        <Button label={saving ? 'Saving…' : 'Save'} disabled={!ok} onPress={save} />
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
  lyrics: { minHeight: 180 },
});
