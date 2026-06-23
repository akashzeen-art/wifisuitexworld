import { useState } from 'react'
import { Monitor, ArrowDown } from 'lucide-react'
import { downloadWindowsInstaller } from '../../lib/download'
import { getWindowsVersionLabel } from '../../lib/appVersions'
import { useAppVersions } from '../../hooks/useAppVersions'
import { toast } from '../../store/toastStore'

const VARIANT_CLASS = {
  card: 'download-card download-card-windows group',
  hero: 'download-card download-card-hero-windows group',
  compact: 'download-compact bg-gradient-to-r from-slate-800 to-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.25)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.3)] w-full',
  inline: 'btn-windows',
}

export default function WindowsDownloadButton({
  variant = 'card',
  className,
  children,
}) {
  const [loading, setLoading] = useState(false)
  const { releases } = useAppVersions()
  const versionLabel = getWindowsVersionLabel(releases)
  const baseClass = className ?? VARIANT_CLASS[variant] ?? VARIANT_CLASS.card

  const handleClick = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await downloadWindowsInstaller()
      toast.success('EXE download started')
    } catch {
      toast.error('Windows EXE not found. Run npm run build in desktop-app first.')
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
            <Monitor className="w-4 h-4 shrink-0" />
            <span className="truncate">{variant === 'inline' ? 'Download Windows EXE' : 'Windows'}</span>
            {variant === 'compact' && <span className="download-compact-badge">EXE</span>}
          </>
        )}
      </button>
    )
  }

  const isHero = variant === 'hero'

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={baseClass}>
      <div className={`download-card-icon download-card-icon-windows ${isHero ? 'ring-2 ring-slate-600' : ''}`}>
        <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${isHero ? 'text-slate-400' : 'text-slate-500'}`}>
          Download for
        </p>
        <p className={`text-sm sm:text-base font-bold truncate ${isHero ? 'text-white' : 'text-slate-900'}`}>
          Windows
          {variant === 'card' && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 align-middle">
              EXE
            </span>
          )}
        </p>
        <p className={`text-[10px] sm:text-xs truncate ${isHero ? 'text-slate-400' : 'text-slate-500'}`}>
          WiFiExtender-Setup.exe · {versionLabel}
        </p>
      </div>

      <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
        isHero
          ? 'bg-white/10 text-white group-hover:bg-white/20'
          : 'bg-slate-200/80 text-slate-700 group-hover:bg-slate-300/80'
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
