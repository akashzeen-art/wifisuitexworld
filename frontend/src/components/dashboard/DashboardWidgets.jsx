import { motion } from 'framer-motion'

export function PageHeader({ badge, title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        {badge && (
          <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-1">{badge}</p>
        )}
        <h1 className="dash-page-title">{title}</h1>
        {subtitle && <p className="dash-page-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, color, delay = 0, onClick, badge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(16,185,129,0.12)' }}
      onClick={onClick}
      className={`glass-card p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
        {sub && !badge && <span className="text-[11px] text-slate-400 font-medium">{sub}</span>}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </motion.div>
  )
}

export function GlassCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card p-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-semibold text-slate-900 text-[15px]">{title}</h3>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function ProgressBar({ value, max, color = 'from-brand-500 to-teal-400', label, showPct = true }) {
  const pct    = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const urgent = pct >= 85
  return (
    <div className="space-y-1.5">
      {(label || showPct) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-slate-500">{label}</span>}
          {showPct && (
            <span className={`font-semibold ${urgent ? 'text-red-500' : 'text-slate-700'}`}>
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${urgent ? 'from-red-400 to-rose-500' : color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export function LiveDot({ active = true }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {active && (
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-emerald-400 opacity-40"
          animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
    </div>
  )
}

export function SpeedArc({ value, max, label, unit, color = '#10b981' }) {
  const pct    = Math.min(1, (value || 0) / max)
  const circ   = Math.PI * 52
  const offset = circ * (1 - pct)
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
          <motion.path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span key={value} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
            className="text-xl font-extrabold text-slate-900 leading-none">
            {value ?? 0}
          </motion.span>
          <span className="text-[10px] text-slate-400 font-medium">{unit}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
    </div>
  )
}

export function formatBytes(b) {
  if (!b || b <= 0) return '0 B'
  if (b < 1e6) return `${(b / 1e3).toFixed(1)} KB`
  if (b < 1e9) return `${(b / 1e6).toFixed(1)} MB`
  return `${(b / 1e9).toFixed(2)} GB`
}

export function daysLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 86400000))
}
