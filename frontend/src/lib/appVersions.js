/** Fallback when app-releases.json is not reachable (must match android/app/build.gradle). */
export const APP_RELEASES_FALLBACK = {
  android: {
    version: '1.3.2',
    versionCode: 24,
    label: 'WiFiExtender Android',
    filename: 'wifi-extender-android.apk',
    minSdk: 'Android 8.0+',
  },
  windows: {
    version: '1.2.0',
    label: 'WiFiExtender Windows',
    filename: 'wifi-extender-setup.exe',
    requirements: 'Windows 10/11',
  },
}

let cachedReleases = null

export async function fetchAppReleases() {
  if (cachedReleases) return cachedReleases
  try {
    const res = await fetch(`/app-releases.json?t=${Date.now()}`)
    if (res.ok) {
      cachedReleases = await res.json()
      return cachedReleases
    }
  } catch {
    /* use fallback */
  }
  cachedReleases = APP_RELEASES_FALLBACK
  return cachedReleases
}

export function getAndroidVersionLabel(releases) {
  const v = releases?.android?.version ?? APP_RELEASES_FALLBACK.android.version
  return `v${v} · ${releases?.android?.minSdk ?? 'Android 8+'}`
}

export function getWindowsVersionLabel(releases) {
  const v = releases?.windows?.version ?? APP_RELEASES_FALLBACK.windows.version
  return `v${v} · ${releases?.windows?.requirements ?? 'Win 10/11'}`
}
