const WINDOWS_API_URL = '/api/download/windows'
const WINDOWS_STATIC_URL = '/downloads/wifi-extender-setup.exe'
const ANDROID_API_URL = '/api/download/android'
const ANDROID_STATIC_URL = '/downloads/wifi-extender-android.apk'

const FILES = {
  android: { static: ANDROID_STATIC_URL, api: ANDROID_API_URL, name: 'WiFiExtender.apk' },
  windows: { static: WINDOWS_STATIC_URL, api: WINDOWS_API_URL, name: 'WiFiExtender-Setup.exe' },
}

function startDirectDownload(url, filename) {
  const link = document.createElement('a')
  link.href = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
  if (filename) link.setAttribute('download', filename)
  link.style.display = 'none'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function isAvailable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function downloadFile({ static: staticUrl, api, name }) {
  if (await isAvailable(staticUrl)) {
    startDirectDownload(staticUrl, name)
    return
  }
  if (await isAvailable(api)) {
    startDirectDownload(api, name)
    return
  }
  throw new Error('not_found')
}

/** Download Android APK */
export async function downloadAndroidApk() {
  try {
    await downloadFile(FILES.android)
  } catch {
    throw new Error('APK not available. Build the Android app or place wifi-extender-android.apk in public/downloads.')
  }
}

/** Download Windows EXE installer */
export async function downloadWindowsInstaller() {
  try {
    await downloadFile(FILES.windows)
  } catch {
    throw new Error('EXE not available. Build the desktop app or place wifi-extender-setup.exe in public/downloads.')
  }
}
