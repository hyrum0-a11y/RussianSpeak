import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { youtubeId } from '../lib/songs';
import { colors, hint, T } from './ui';

// Catch the tap on a video before YouTube opens it, and hand back its link.
const CATCH_TAPS = `
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest && e.target.closest('a[href*="/watch"], a[href*="/shorts/"]');
  if (!a) return;
  e.preventDefault();
  e.stopPropagation();
  window.ReactNativeWebView.postMessage(a.href);
}, true);
true;
`;

/** Full-screen YouTube search inside the app: tap a video and it's picked. No link copying. */
export function YouTubePicker({ query, onPick, onClose }: { query: string; onPick: (videoId: string) => void; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  function take(url: string): void {
    const id = youtubeId(url);
    if (!id || done) return;
    setDone(true);
    onPick(id);
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.bar}>
        <T style={styles.title} en="Tap a video to add it">Нажми́те на ви́део, что́бы доба́вить его́</T>
        <Pressable onPress={onClose} onLongPress={() => hint('Close')} hitSlop={10}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <WebView
        source={{ uri: `https://m.youtube.com/results?search_query=${encodeURIComponent(query)}` }}
        injectedJavaScript={CATCH_TAPS}
        onMessage={(e) => take(e.nativeEvent.data)}
        // Fallbacks in case YouTube navigates without a normal link tap.
        onShouldStartLoadWithRequest={(r): boolean => {
          if (youtubeId(r.url) && !r.url.includes('/results')) {
            take(r.url);
            return false;
          }
          return true;
        }}
        onNavigationStateChange={(n: WebViewNavigation): void => {
          if (youtubeId(n.url)) take(n.url);
        }}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
      />
      {loading || done ? <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  close: { fontSize: 22, color: colors.muted },
  spinner: { position: 'absolute', top: '50%', alignSelf: 'center' },
});
