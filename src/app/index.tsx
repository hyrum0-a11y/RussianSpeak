import { useEffect, useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { allPhrases, DECKS, phrasesIn } from '../data/phrases';
import { PROMPTS } from '../data/prompts';
import { hasRussianVoice } from '../lib/speech';
import { buildQueue } from '../lib/srs';
import { statusOf } from '../lib/status';
import { newLeftToday, useProgress, type Progress } from '../lib/storage';
import { checkForUpdate, installUpdate, type Update } from '../lib/update';
import { ProgressBar } from '../components/ProgressBar';
import { Button, colors } from '../components/ui';

export default function Home() {
  const [p] = useProgress();
  const [voiceOk, setVoiceOk] = useState(true);
  const [update, setUpdate] = useState<Update | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    hasRussianVoice().then(setVoiceOk);
    checkForUpdate().then(setUpdate);
  }, []);

  if (!p) return null;

  const now = Date.now();
  const all = allPhrases(p.custom);
  const learned = all.filter((x) => statusOf(p.cards[x.id], now) === 'learned').length;
  const deckStats = DECKS.map((d) => deckStat(d.id, p, now));
  const dueToday = deckStats.reduce((n, s) => n + s.queue, 0);
  const promptsDue = buildQueue(PROMPTS.map((x) => x.id), p.prompts, now, 5).length;

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      {update && (
        <Banner tone="good" title={`Update available · build ${update.build}`} body="Download it, then open the file to install. Your progress is kept.">
          <Button label="⬇ Download update" color={colors.good} onPress={() => installUpdate(update)} style={{ flex: 0 }} />
        </Banner>
      )}
      {!voiceOk && (
        <Banner tone="warn" title="No Russian voice found" body="Open Settings → Russian voice for the steps to install one." />
      )}

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>RUSSIANSPEAK</Text>
        <Text style={styles.heroTitle}>Говори́ по-ру́сски</Text>
        <View style={styles.heroProgress}>
          <ProgressBar value={all.length ? learned / all.length : 0} color="#F2C14E" height={8} />
          <Text style={styles.heroMeta}>
            {learned} of {all.length} phrases learned
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/review', params: { deck: 'all' } })}
          disabled={!dueToday}
          style={({ pressed }) => [styles.heroBtn, (pressed || !dueToday) && { opacity: 0.8 }]}
        >
          <Text style={styles.heroBtnText}>{dueToday ? `Start today's review · ${dueToday}` : 'All caught up for today ✓'}</Text>
        </Pressable>
      </View>

      {/* Decks */}
      <Text style={styles.sectionTitle}>Decks</Text>
      <View style={styles.grid}>
        {DECKS.map((d, i) => {
          const s = deckStats[i];
          return (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: '/deck', params: { deck: d.id } })}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <View style={styles.tileTop}>
                <Text style={styles.tileIcon}>{d.icon}</Text>
                {s.due > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{s.due}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.tileTitle} numberOfLines={2}>
                {d.title}
              </Text>
              <Text style={styles.tileMeta}>
                {s.total ? `${s.learned}/${s.total} learned` : 'Add your own'}
              </Text>
              <ProgressBar value={s.total ? s.learned / s.total : 0} height={4} />
            </Pressable>
          );
        })}
      </View>

      {/* Practice */}
      <Text style={styles.sectionTitle}>Practice</Text>
      <View style={styles.modes}>
        <ModeTile icon="🗣" label="Speak" sub={`${promptsDue} prompts`} onPress={() => router.push('/respond')} />
        <ModeTile icon="🎧" label="Dictation" sub="Hear & type" onPress={() => router.push('/dictation')} />
        <ModeTile icon="✏️" label="Fill blank" sub="Endings" onPress={() => router.push('/cloze')} />
      </View>

      <View style={styles.footer}>
        <FooterLink label="📚 Phrase library" onPress={() => router.push('/phrases')} />
        <FooterLink label="⚙️ Settings" onPress={() => router.push('/settings')} />
      </View>
    </ScrollView>
  );
}

function deckStat(deck: (typeof DECKS)[number]['id'], p: Progress, now: number) {
  const phrases = phrasesIn(deck, p.custom);
  const queue = buildQueue(phrases.map((x) => x.id), p.cards, now, newLeftToday(p, deck));
  return {
    total: phrases.length,
    learned: phrases.filter((x) => statusOf(p.cards[x.id], now) === 'learned').length,
    due: queue.filter((id) => p.cards[id]).length,
    queue: queue.length,
  };
}

function ModeTile({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
      <Text style={styles.modeIcon}>{icon}</Text>
      <Text style={styles.modeLabel}>{label}</Text>
      <Text style={styles.modeSub}>{sub}</Text>
    </Pressable>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
      <Text style={styles.footerText}>{label}</Text>
    </Pressable>
  );
}

function Banner({ tone, title, body, children }: { tone: 'good' | 'warn'; title: string; body: string; children?: ReactNode }) {
  const c = tone === 'good' ? { bg: '#E8F6EC', border: '#9FD5B0', fg: '#1B5E31' } : { bg: '#FFF4E0', border: '#F0C27A', fg: '#7A4B00' };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.bannerTitle, { color: c.fg }]}>{title}</Text>
      <Text style={{ color: c.fg, lineHeight: 20 }}>{body}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, paddingBottom: 36 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },

  hero: { backgroundColor: colors.primary, borderRadius: 20, padding: 22, gap: 14 },
  heroKicker: { color: '#C9D6EA', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: -6 },
  heroProgress: { gap: 6 },
  heroMeta: { color: '#C9D6EA', fontSize: 13 },
  heroBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  heroBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tileIcon: { fontSize: 26 },
  badge: { backgroundColor: colors.hard, borderRadius: 999, minWidth: 24, paddingHorizontal: 7, paddingVertical: 2, alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.text, minHeight: 40 },
  tileMeta: { color: colors.muted, fontSize: 12 },

  modes: { flexDirection: 'row', gap: 10 },
  mode: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  modeIcon: { fontSize: 26 },
  modeLabel: { fontWeight: '700', color: colors.text },
  modeSub: { color: colors.muted, fontSize: 12 },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 8 },
  footerLink: { paddingVertical: 8 },
  footerText: { color: colors.primary, fontSize: 15, fontWeight: '600' },

  banner: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  bannerTitle: { fontWeight: '700' },
});
