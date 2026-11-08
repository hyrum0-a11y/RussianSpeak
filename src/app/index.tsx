import { useEffect, useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { allPhrases, DECKS, phrasesIn } from '../data/phrases';
import { PROMPTS } from '../data/prompts';
import { hasRussianVoice } from '../lib/speech';
import { buildQueue, gradeOf, LEVEL_NAMES, type Level } from '../lib/srs';
import { statusOf } from '../lib/status';
import { newLeftToday, updateProgress, useProgress, type Progress } from '../lib/storage';
import { checkForUpdate, installUpdate, type Update } from '../lib/update';
import { ProgressBar } from '../components/ProgressBar';
import { Button, colors, hint, LangToggle, T, useLang } from '../components/ui';

const LEVELS: { grade: Level; color: string }[] = [
  { grade: 'hard', color: colors.hard },
  { grade: 'good', color: colors.good },
  { grade: 'easy', color: colors.easy },
];

export default function Home() {
  const tr = useLang();
  const [p] = useProgress();
  const [voiceOk, setVoiceOk] = useState(true);
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
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
  const levelCounts = { hard: 0, good: 0, easy: 0 };
  for (const x of all) {
    const c = p.cards[x.id];
    if (c) levelCounts[gradeOf(c)]++;
  }
  const promptsDue = buildQueue(PROMPTS.map((x) => x.id), p.prompts, now, 5).length;

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      {update && (
        <Banner
          tone="good"
          title={`Есть обновле́ние · сбо́рка ${update.build}`}
          titleEn={`Update available · build ${update.build}`}
          body="Скачива́ется в приложе́нии, пото́м Android предложи́т установи́ть. В пе́рвый раз разреши́те RussianSpeak устана́вливать приложе́ния. Прогре́сс сохрани́тся."
          bodyEn="Downloads inside the app, then Android asks to install. The first time, allow RussianSpeak to install apps. Your progress is kept."
        >
          <Button
            en="Download & install"
            label={progress === null ? '⬇ Скача́ть и установи́ть' : `Скачива́ние… ${Math.round(progress * 100)}%`}
            color={colors.good}
            disabled={progress !== null}
            onPress={async () => {
              setProgress(0);
              await installUpdate(update, setProgress);
              setProgress(null);
            }}
            style={{ flex: 0 }}
          />
        </Banner>
      )}
      {!voiceOk && (
        <Banner
          tone="warn"
          title="Нет ру́сского го́лоса"
          titleEn="No Russian voice found"
          body="Откро́йте Настро́йки → Ру́сский го́лос, там напи́сано, как его́ установи́ть."
          bodyEn="Open Settings → Russian voice for the steps to install one."
        />
      )}
      {!p.settings.holdHintDone && (
        <Banner
          tone="good"
          title="Всё по-ру́сски 🇷🇺"
          titleEn="Everything is in Russian"
          body="Нажми́те и уде́рживайте любу́ю кно́пку и́ли на́дпись, что́бы уви́деть англи́йский. Кно́пка EN наверху́ перево́дит весь экра́н."
          bodyEn="Press and hold any button or label to see the English. The EN switch at the top translates the whole screen."
        >
          <Button
            label="Поня́тно"
            en="Got it"
            onPress={() => updateProgress((q) => ({ ...q, settings: { ...q.settings, holdHintDone: true } }))}
            style={{ flex: 0 }}
          />
        </Banner>
      )}

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroKicker}>RUSSIANSPEAK</Text>
          <LangToggle light />
        </View>
        <T style={styles.heroTitle} en="Speak Russian">Говори́ по-ру́сски</T>
        <View style={styles.heroProgress}>
          <ProgressBar value={all.length ? learned / all.length : 0} color="#F2C14E" height={8} />
          <T style={styles.heroMeta} en={`${learned} of ${all.length} phrases learned`}>
            Вы́учено {learned} из {all.length}
          </T>
        </View>
        <T style={styles.heroAsk} en="Cards you marked…">Ка́рточки, кото́рые вы отме́тили…</T>
        <View style={styles.levels}>
          {LEVELS.map((l) => {
            const n = levelCounts[l.grade];
            return (
              <Pressable
                key={l.grade}
                disabled={!n}
                onPress={() => router.push({ pathname: '/level', params: { grade: l.grade } })}
                onLongPress={() => hint(LEVEL_NAMES[l.grade].en)}
                style={({ pressed }) => [styles.level, { backgroundColor: l.color }, (pressed || !n) && { opacity: n ? 0.8 : 0.4 }]}
              >
                <Text style={styles.levelLabel}>{tr(LEVEL_NAMES[l.grade].ru, LEVEL_NAMES[l.grade].en.split(':')[0])}</Text>
                <Text style={styles.levelCount}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>


      {/* Decks */}
      <T style={styles.sectionTitle} en="Decks">Коло́ды</T>
      <View style={styles.grid}>
        {DECKS.map((d, i) => {
          const s = deckStats[i];
          return (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: '/deck', params: { deck: d.id } })}
              onLongPress={() => hint(d.en)}
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
                {tr(d.title, d.en)}
              </Text>
              <Text style={styles.tileMeta}>
                {s.total ? tr(`вы́учено ${s.learned}/${s.total}`, `${s.learned}/${s.total} learned`) : tr('Доба́вьте свои́', 'Add your own')}
              </Text>
              <ProgressBar value={s.total ? s.learned / s.total : 0} height={4} />
            </Pressable>
          );
        })}
      </View>

      {/* Practice */}
      <T style={styles.sectionTitle} en="Practice">Пра́ктика</T>
      <View style={styles.modes}>
        <ModeTile icon="🗣" label="Говори́ть" sub={`${promptsDue} вопр.`} en="Speak" subEn={`answer out loud (${promptsDue})`} onPress={() => router.push('/respond')} />
        <ModeTile icon="🎧" label="Дикта́нт" sub="Слу́шать и писа́ть" en="Dictation" subEn="hear & type" onPress={() => router.push('/dictation')} />
        <ModeTile icon="✏️" label="Про́пуск" sub="Оконча́ния" en="Fill in the blank" subEn="endings" onPress={() => router.push('/cloze')} />
      </View>
      <Pressable onPress={() => router.push('/words')} onLongPress={() => hint('My words: new words, learned inside real sentences')} style={({ pressed }) => [styles.songs, pressed && styles.pressed]}>
        <Text style={styles.modeIcon}>📝</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeLabel}>{tr('Мои́ сло́ва', 'My words')} · {p.words.length}</Text>
          <Text style={styles.modeSub}>{tr('Но́вые сло́ва в настоя́щих фра́зах', 'New words, learned inside real sentences')}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/songs')} onLongPress={() => hint('Sing along: YouTube or your own files, lyrics light up')} style={({ pressed }) => [styles.songs, pressed && styles.pressed]}>
        <Text style={styles.modeIcon}>🎵</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeLabel}>{tr('Поём вме́сте', 'Sing along')}</Text>
          <Text style={styles.modeSub}>{tr('YouTube и́ли свои́ фа́йлы, текст подсве́чивается', 'YouTube or your own files, lyrics light up')}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>

      <View style={styles.footer}>
        <FooterLink label="📚 Фра́зы" en="Phrase library" onPress={() => router.push('/phrases')} />
        <FooterLink label="📖 Слова́рь" en="Dictionary" onPress={() => router.push('/dictionary')} />
        <FooterLink label="⚙️ Настро́йки" en="Settings" onPress={() => router.push('/settings')} />
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

function ModeTile({ icon, label, sub, en, subEn, onPress }: { icon: string; label: string; sub: string; en: string; subEn: string; onPress: () => void }) {
  const tr = useLang();
  return (
    <Pressable onPress={onPress} onLongPress={() => hint(`${en}: ${subEn}`)} style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
      <Text style={styles.modeIcon}>{icon}</Text>
      <Text style={styles.modeLabel}>{tr(label, en)}</Text>
      <Text style={styles.modeSub}>{tr(sub, subEn)}</Text>
    </Pressable>
  );
}

function FooterLink({ label, en, onPress }: { label: string; en: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} onLongPress={() => hint(en)} hitSlop={8} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
      <Text style={styles.footerText}>{useLang()(label, `${label.split(' ')[0]} ${en}`)}</Text>
    </Pressable>
  );
}

function Banner({
  tone,
  title,
  titleEn,
  body,
  bodyEn,
  children,
}: {
  tone: 'good' | 'warn';
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
  children?: ReactNode;
}) {
  const c = tone === 'good' ? { bg: '#E8F6EC', border: '#9FD5B0', fg: '#1B5E31' } : { bg: '#FFF4E0', border: '#F0C27A', fg: '#7A4B00' };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border }]}>
      <T style={[styles.bannerTitle, { color: c.fg }]} en={titleEn}>
        {title}
      </T>
      <T style={{ color: c.fg, lineHeight: 20 }} en={bodyEn}>
        {body}
      </T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, paddingBottom: 36 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },

  hero: { backgroundColor: colors.primary, borderRadius: 20, padding: 22, gap: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroKicker: { color: '#C9D6EA', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: -6 },
  heroProgress: { gap: 6 },
  heroMeta: { color: '#C9D6EA', fontSize: 13 },
  heroAsk: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: -4 },
  levels: { flexDirection: 'row', gap: 8 },
  level: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  levelLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  levelCount: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },

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
  songs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  chev: { fontSize: 26, color: colors.muted },
  modeLabel: { fontWeight: '700', color: colors.text },
  modeSub: { color: colors.muted, fontSize: 12 },

  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 8 },
  footerLink: { paddingVertical: 8 },
  footerText: { color: colors.primary, fontSize: 15, fontWeight: '600' },

  banner: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  bannerTitle: { fontWeight: '700' },
});
