import { useState } from 'react'
import { Smartphone, ArrowDown } from 'lucide-react'
import { downloadAndroidApk } from '../../lib/download'
import { getAndroidVersionLabel } from '../../lib/appVersions'
import { useAppVersions } from '../../hooks/useAppVersions'
import { toast } from '../../store/toastStore'

const VARIANT_CLASS = {
  card: 'download-card download-card-android group',
  hero: 'download-card download-card-hero-android group',
  compact: 'download-compact bg-gradient-to-r from-brand-600 to-emerald-500 shadow-button hover:shadow-button-hover w-full',
  inline: 'btn-android',
}

export default function AndroidDownloadButton({
  variant = 'card',
  className,
  children,
}) {
  const [loading, setLoading] = useState(false)
  const { releases } = useAppVersions()
  const versionLabel = getAndroidVersionLabel(releases)
  const baseClass = className ?? VARIANT_CLASS[variant] ?? VARIANT_CLASS.card

  const handleClick = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await downloadAndroidApk()
      toast.success('APK download started')
    } catch {
      toast.error('Android APK not found. Run gradlew assembleDebug in the android folder.')
    } finally {
      setLoading(false)
    }
  }

  if (children) {
    return (
      <button type="button" onClick={handleClick} disabled={loading} className={baseClass}>
        {loading ? (
          <span className="flex items-center justify-center gap-2 w-full">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Downloading…
          </span>
        ) : children}
      </button>
    )
  }

  if (variant === 'compact' || variant === 'inline') {
    return (
      <button type="button" onClick={handleClick} disabled={loading} className={baseClass}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Downloading…
          </span>
        ) : (
          <>
            <Smartphone className="w-4 h-4 shrink-0" />
            <span className="truncate">{variant === 'inline' ? 'Download Android APK' : 'Android'}</span>
            {variant === 'compact' && <span className="download-compact-badge">APK</span>}
          </>
        )}
      </button>
    )
  }

  const isHero = variant === 'hero'

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={baseClass}>
      <div className={`download-card-icon download-card-icon-android ${isHero ? 'ring-2 ring-emerald-200/50' : ''}`}>
        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${isHero ? 'text-brand-600' : 'text-emerald-600'}`}>
          Download for
        </p>
        <p className={`text-sm sm:text-base font-bold truncate ${isHero ? 'text-slate-900' : 'text-slate-900'}`}>
          Android
          {variant === 'card' && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 align-middle">
              APK
            </span>
          )}
        </p>
        <p className={`text-[10px] sm:text-xs truncate ${isHero ? 'text-slate-500' : 'text-slate-500'}`}>
          WiFiExtender.apk · {versionLabel}
        </p>
      </div>

      <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
        isHero
          ? 'bg-brand-50 text-brand-600 group-hover:bg-brand-100'
          : 'bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-200/80'
      }`}>
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </div>
    </button>
  )
}
