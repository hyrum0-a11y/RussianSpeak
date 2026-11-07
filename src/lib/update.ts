import { Linking } from 'react-native';

const REPO = 'hyrum0-a11y/RussianSpeak';

/** Build number baked in by the GitHub Actions build (0 for local/dev builds). */
export const BUILD_NUMBER = Number(process.env.EXPO_PUBLIC_BUILD_NUMBER ?? 0) || 0;

export type Update = { build: number; apkUrl: string; pageUrl: string };

/** Parse "build-12" → 12. */
export function buildFromTag(tag: string): number {
  const m = /build-(\d+)/.exec(tag);
  return m ? Number(m[1]) : 0;
}

/**
 * Ask GitHub for the newest release. Works only while the repo is public;
 * any failure (private repo, offline, rate limit) just means "no update".
 */
export async function checkForUpdate(): Promise<Update | null> {
  if (!BUILD_NUMBER) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const rel = (await res.json()) as {
      tag_name: string;
      html_url: string;
      assets: { name: string; browser_download_url: string }[];
    };
    const build = buildFromTag(rel.tag_name);
    const apk = rel.assets.find((a) => a.name.endsWith('.apk'));
    if (!apk || build <= BUILD_NUMBER) return null;
    return { build, apkUrl: apk.browser_download_url, pageUrl: rel.html_url };
  } catch {
    return null;
  }
}

/** Opens the APK in the browser; Android downloads it and offers to install. */
export function installUpdate(u: Update) {
  Linking.openURL(u.apkUrl);
}
