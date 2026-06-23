import { motion } from 'framer-motion'
import { Wifi, ArrowRight, Shield, Activity, Smartphone, Laptop, Tv } from 'lucide-react'
import AppDownloadButtons from '../../components/ui/AppDownloadButtons'

/* ── Animated WiFi rings ── */
function WifiRings({ x, y, delay = 0, color = '#10b981' }) {
  return (
    <motion.g>
      {[1, 2, 3].map((r) => (
        <motion.circle
          key={r}
          cx={x} cy={y} r={r * 18}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.4, 1.2, 1.6] }}
          transition={{ duration: 2.4, delay: delay + r * 0.4, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </motion.g>
  )
}

/* ── Animated connection line ── */
function ConnectionLine({ x1, y1, x2, y2, delay = 0, active = true }) {
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={active ? '#10b981' : '#e2e8f0'}
      strokeWidth="1.5"
      strokeDasharray="6 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: active ? 0.7 : 0.3 }}
      transition={{ duration: 1, delay, ease: 'easeInOut' }}
    />
  )
}

/* ── Animated data packet ── */
function DataPacket({ x1, y1, x2, y2, delay = 0, color = '#10b981' }) {
  return (
    <motion.circle
      r="3" fill={color}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.8, delay, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
    />
  )
}

/* ── Network Graph SVG ── */
function NetworkGraph() {
  const hub = { x: 220, y: 220 }
  const devices = [
    { x: 80,  y: 90,  icon: Laptop,     label: "MacBook",    color: '#059669', active: true  },
    { x: 360, y: 80,  icon: Smartphone, label: "iPhone",     color: '#14b8a6', active: true  },
    { x: 390, y: 230, icon: Smartphone, label: "Android",    color: '#0d9488', active: true  },
    { x: 360, y: 350, icon: Tv,         label: "Smart TV",   color: '#f59e0b', active: false },
    { x: 80,  y: 340, icon: Laptop,     label: "Dell XPS",   color: '#10b981', active: true  },
    { x: 50,  y: 220, icon: Smartphone, label: "iPad",       color: '#ef4444', active: false },
  ]

  return (
    <div className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 440 440" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines */}
        {devices.map((d, i) => (
          <ConnectionLine key={i} x1={hub.x} y1={hub.y} x2={d.x} y2={d.y} delay={i * 0.15} active={d.active} />
        ))}
        {/* Data packets */}
        {devices.filter(d => d.active).map((d, i) => (
          <DataPacket key={i} x1={hub.x} y1={hub.y} x2={d.x} y2={d.y} delay={i * 0.5} color={d.color} />
        ))}
        {/* WiFi rings from hub */}
        <WifiRings x={hub.x} y={hub.y} delay={0} color="#10b981" />
      </svg>

      {/* Hub node */}
      <motion.div
        className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${(hub.x / 440) * 100}%`, top: `${(hub.y / 440) * 100}%` }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-brand-600 to-signal-500 rounded-2xl flex items-center justify-center shadow-button border-2 border-white">
          <Wifi className="w-7 h-7 text-white" />
        </div>
        <span className="text-[10px] font-bold text-brand-600 mt-1 bg-white px-1.5 py-0.5 rounded-md shadow-sm">HUB</span>
      </motion.div>

      {/* Device nodes */}
      {devices.map((d, i) => {
        const Icon = d.icon
        return (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(d.x / 440) * 100}%`, top: `${(d.y / 440) * 100}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200 }}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-white shadow-md ${d.active ? 'bg-white' : 'bg-slate-100'}`}
              style={{ boxShadow: d.active ? `0 4px 16px ${d.color}30` : undefined }}
            >
              <Icon className="w-5 h-5" style={{ color: d.active ? d.color : '#94a3b8' }} />
            </div>
            <span className="text-[9px] font-semibold mt-0.5 whitespace-nowrap" style={{ color: d.active ? d.color : '#94a3b8' }}>
              {d.label}
            </span>
            {d.active && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Speed bar ── */
function SpeedBar({ label, value, max, color, delay }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{value} Mbps</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/* ── Floating signal icon ── */
function FloatingSignal({ style, delay, size = 'w-8 h-8', opacity = 'opacity-20' }) {
  return (
    <motion.div
      className={`absolute ${style} ${opacity} pointer-events-none`}
      animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
      transition={{ duration: 5 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Wifi className={`${size} text-brand-400`} />
    </motion.div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

      {/* Glow orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 7, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating WiFi signals */}
      <FloatingSignal style="top-[15%] left-[8%]"  delay={0}   size="w-10 h-10" opacity="opacity-15" />
      <FloatingSignal style="top-[60%] left-[5%]"  delay={1.5} size="w-6 h-6"   opacity="opacity-10" />
      <FloatingSignal style="top-[20%] right-[6%]" delay={0.8} size="w-8 h-8"   opacity="opacity-10" />
      <FloatingSignal style="bottom-[20%] right-[8%]" delay={2} size="w-12 h-12" opacity="opacity-10" />
      <FloatingSignal style="top-[45%] right-[3%]" delay={1.2} size="w-5 h-5"   opacity="opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── LEFT: Copy ── */}
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-7 shadow-sm"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Now live — Windows 10 &amp; 11
              <ArrowRight className="w-3 h-3" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-6xl lg:text-[62px] font-extrabold text-slate-900 leading-[1.07] tracking-tight mb-6"
            >
              Turn Your Laptop Into a{' '}
              <span className="relative inline-block">
                <span className="gradient-text">Powerful WiFi</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-brand-500 to-signal-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'left' }}
                />
              </span>{' '}
              Extender
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.38 }}
              className="text-lg md:text-xl text-slate-500 leading-relaxed mb-10"
            >
              Share, extend, and manage internet connections with one click. Monitor devices, block intruders, and track bandwidth — all from a beautiful dashboard.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-full max-w-xl"
            >
              <AppDownloadButtons layout="row" variant="card" />
            </motion.div>
          </div>

          {/* ── RIGHT: Interactive visual (square) ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block w-[520px] xl:w-[580px] max-w-full ml-auto"
          >
            <div className="aspect-square relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-slate-100 shadow-glass-lg p-6 overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50/60 via-transparent to-signal-500/10 pointer-events-none rounded-3xl" />

              <div className="flex items-center gap-2 mb-4 relative shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1 mx-2 h-7 bg-slate-100 rounded-lg flex items-center px-3">
                  <span className="text-[11px] text-slate-400 font-mono">app.wifiextender.com</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  LIVE
                </div>
              </div>

              <div className="relative flex-1 min-h-0">
                <NetworkGraph />
              </div>

              <div className="mt-4 space-y-2.5 bg-slate-50/80 rounded-2xl p-4 relative shrink-0">
                <SpeedBar label="Download" value={94.2} max={150} color="#10b981" delay={0.8} />
                <SpeedBar label="Upload"   value={42.7} max={150} color="#14b8a6" delay={1.0} />
              </div>
            </div>

            <motion.div
              className="absolute -top-5 -left-6 z-10"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-glass-lg border border-white/80 w-52">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Hotspot Active</p>
                  <p className="text-xs text-emerald-500 font-semibold">5 devices</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-5 -left-6 z-10"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4.5, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-glass-lg border border-white/80 w-48">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4.5 h-4.5 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">WPA2 Secure</p>
                  <p className="text-xs text-slate-400">Encrypted</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}
