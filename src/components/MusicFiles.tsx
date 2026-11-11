import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import { Button, colors, hint, T } from './ui';

export type MusicFile = { uri: string; name: string };

/** Folder the app looks in first. Files there stay on the phone even if the app is removed. */
export const SONG_FOLDER = 'Music/RussianSpeak';

/** Audio files already on the phone (Music, Download, …), with the RussianSpeak folder first. */
export function MusicFiles({ onPick, onOther }: { onPick: (f: MusicFile) => void; onOther: () => void }) {
  const [files, setFiles] = useState<MediaLibrary.Asset[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const perm = await MediaLibrary.requestPermissionsAsync(false, ['audio']).catch(() => null);
      if (!perm?.granted) {
        setDenied(true);
        return;
      }
      const page = await MediaLibrary.getAssetsAsync({ mediaType: 'audio', first: 1000, sortBy: [[MediaLibrary.SortBy.modificationTime, false]] });
      const inFolder = (a: MediaLibrary.Asset) => (a.uri.includes('/RussianSpeak/') ? 0 : 1);
      // Skip ringtones and notification sounds.
      setFiles(page.assets.filter((a) => a.duration >= 45).sort((a, b) => inFolder(a) - inFolder(b)));
    })().catch(() => setDenied(true));
  }, []);

  if (denied) {
    return (
      <View style={{ gap: 8 }}>
        <T style={styles.help} en="The app needs permission to see music files. Allow it in Settings → Apps → RussianSpeak → Permissions → Music and audio.">
          Приложе́нию ну́жен до́ступ к му́зыке. Разреши́те его́: Настро́йки → Приложе́ния → RussianSpeak → Разреше́ния → Му́зыка и а́удио.
        </T>
        <Button label="Откры́ть настро́йки" en="Open settings" variant="outline" onPress={() => Linking.openSettings()} style={{ flex: 0 }} />
        <Button label="📂 Вы́брать файл…" en="Choose a file…" variant="outline" onPress={onOther} style={{ flex: 0 }} />
      </View>
    );
  }
  if (!files) return <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />;

  const shown = q.trim() ? files.filter((f) => f.filename.toLowerCase().includes(q.trim().toLowerCase())) : files;
  return (
    <View style={{ gap: 8 }}>
      <T style={styles.help} en={`Put song files in the ${SONG_FOLDER} folder (or anywhere on the phone). They stay even if you remove the app.`}>
        Положи́те фа́йлы пе́сен в па́пку {SONG_FOLDER} (и́ли куда́ уго́дно на телефо́не). Они́ оста́нутся, да́же е́сли удали́ть приложе́ние.
      </T>
      {files.length > 8 ? <TextInput style={styles.input} placeholder="По́иск…" value={q} onChangeText={setQ} /> : null}
      {files.length === 0 ? (
        <T style={styles.help} en="No music files found on this phone yet.">На телефо́не пока́ нет музыка́льных фа́йлов.</T>
      ) : null}
      {shown.slice(0, 100).map((f) => (
        <Pressable
          key={f.id}
          onPress={() => onPick({ uri: f.uri, name: f.filename })}
          onLongPress={() => hint(f.uri.replace('file:///storage/emulated/0/', ''))}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.icon}>{f.uri.includes('/RussianSpeak/') ? '⭐' : '🎵'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>
              {f.filename.replace(/\.[a-z0-9]{2,5}$/i, '')}
            </Text>
            <Text style={styles.meta}>
              {Math.floor(f.duration / 60)}:{String(Math.round(f.duration % 60)).padStart(2, '0')}
            </Text>
          </View>
        </Pressable>
      ))}
      <Button label="📂 Друго́й файл…" en="Choose another file…" variant="outline" onPress={onOther} style={{ flex: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  help: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  icon: { fontSize: 18 },
  name: { fontSize: 15, color: colors.text, fontWeight: '500' },
  meta: { fontSize: 12, color: colors.muted },
});
