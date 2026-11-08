import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { startActivityAsync } from 'expo-intent-launcher';

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

const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Download the APK inside the app (Chrome tends to stall on APKs at 100%),
 * then hand it to Android's installer. The first time, Android asks you to
 * allow RussianSpeak to install apps. Falls back to the browser on failure.
 */
export async function installUpdate(u: Update, onProgress?: (fraction: number) => void): Promise<void> {
  if (Platform.OS !== 'android' || !FileSystem.cacheDirectory) {
    await Linking.openURL(u.apkUrl);
    return;
  }
  const dest = `${FileSystem.cacheDirectory}RussianSpeak-${u.build}.apk`;
  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
    const task = FileSystem.createDownloadResumable(u.apkUrl, dest, {}, (p) => {
      if (p.totalBytesExpectedToWrite > 0) onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
    });
    const res = await task.downloadAsync();
    if (!res || res.status !== 200) throw new Error(`HTTP ${res?.status}`);
    const contentUri = await FileSystem.getContentUriAsync(res.uri);
    await startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: 'application/vnd.android.package-archive',
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
  } catch {
    await Linking.openURL(u.apkUrl);
  }
}
