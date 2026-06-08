import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useAnimationFrame, useMotionValue, useSpring } from 'framer-motion'
import { Wifi, Download, ArrowRight, Zap, Shield, Activity, Smartphone, Laptop, Tv } from 'lucide-react'

/* ── Animated WiFi rings ── */
function WifiRings({ x, y, delay = 0, color = '#3b6ef5' }) {
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
      stroke={active ? '#3b6ef5' : '#e2e8f0'}
      strokeWidth="1.5"
      strokeDasharray="6 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: active ? 0.7 : 0.3 }}
      transition={{ duration: 1, delay, ease: 'easeInOut' }}
    />
  )
}

/* ── Animated data packet ── */
function DataPacket({ x1, y1, x2, y2, delay = 0, color = '#3b6ef5' }) {
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
  const hub = { x: 220, y: 200 }
  const devices = [
    { x: 80,  y: 80,  icon: Laptop,     label: "MacBook",    color: '#3b6ef5', active: true  },
    { x: 360, y: 70,  icon: Smartphone, label: "iPhone",     color: '#06b6d4', active: true  },
    { x: 390, y: 220, icon: Smartphone, label: "Android",    color: '#8b5cf6', active: true  },
    { x: 360, y: 340, icon: Tv,         label: "Smart TV",   color: '#f59e0b', active: false },
    { x: 80,  y: 330, icon: Laptop,     label: "Dell XPS",   color: '#10b981', active: true  },
    { x: 50,  y: 200, icon: Smartphone, label: "iPad",       color: '#ef4444', active: false },
  ]

  return (
    <div className="relative w-full h-[420px]">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 440 420" fill="none">
        {/* Connection lines */}
        {devices.map((d, i) => (
          <ConnectionLine key={i} x1={hub.x} y1={hub.y} x2={d.x} y2={d.y} delay={i * 0.15} active={d.active} />
        ))}
        {/* Data packets */}
        {devices.filter(d => d.active).map((d, i) => (
          <DataPacket key={i} x1={hub.x} y1={hub.y} x2={d.x} y2={d.y} delay={i * 0.5} color={d.color} />
        ))}
        {/* WiFi rings from hub */}
        <WifiRings x={hub.x} y={hub.y} delay={0} color="#3b6ef5" />
      </svg>

      {/* Hub node */}
      <motion.div
        className="absolute flex flex-col items-center"
        style={{ left: hub.x - 28, top: hub.y - 28 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-button border-2 border-white">
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
            className="absolute flex flex-col items-center"
            style={{ left: d.x - 20, top: d.y - 20 }}
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
  const [deviceCount, setDeviceCount] = useState(4)

  useEffect(() => {
    const t = setInterval(() => {
      setDeviceCount(c => c === 4 ? 5 : c === 5 ? 6 : 4)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

      {/* Glow orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,110,245,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }}
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
                  className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
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
              className="flex flex-col sm:flex-row gap-3 mb-12"
            >
              <Link to="/register" className="btn-primary text-[15px] py-4 px-8 group">
                <Zap className="w-4 h-4" />
                Start Free Trial
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
              <Link to="/download" className="btn-secondary text-[15px] py-4 px-8">
                <Download className="w-4 h-4" />
                Download App
              </Link>
            </motion.div>

            {/* Live stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex items-center gap-6"
            >
              {/* Avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['from-brand-400 to-brand-500','from-cyan-400 to-cyan-500','from-violet-400 to-violet-500','from-emerald-400 to-emerald-500','from-amber-400 to-amber-500'].map((g, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500"><span className="font-bold text-slate-800">4.9/5</span> · 2,400+ users</p>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-200" />

              {/* Live device count */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs text-slate-500">
                  <motion.span
                    key={deviceCount}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="font-bold text-slate-800 inline-block"
                  >
                    {deviceCount}
                  </motion.span>
                  {' '}devices live right now
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Interactive visual ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            {/* Main card */}
            <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-slate-100 shadow-glass-lg p-6 overflow-hidden">
              {/* Card glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-3xl" />

              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-5 relative">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1 mx-3 h-6 bg-slate-100 rounded-lg flex items-center px-3">
                  <span className="text-[10px] text-slate-400 font-mono">app.wifiextender.com</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  LIVE
                </div>
              </div>

              {/* Network graph */}
              <NetworkGraph />

              {/* Speed bars */}
              <div className="mt-2 space-y-2.5 bg-slate-50/80 rounded-2xl p-4">
                <SpeedBar label="Download" value={94.2} max={150} color="#3b6ef5" delay={0.8} />
                <SpeedBar label="Upload"   value={42.7} max={150} color="#06b6d4" delay={1.0} />
                <SpeedBar label="Latency"  value={12}   max={100} color="#10b981" delay={1.2} />
              </div>
            </div>

            {/* Floating overlay cards */}
            {/* Card 1 — Hotspot status */}
            <motion.div
              className="absolute -top-4 -left-6 z-10"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-glass-lg border border-white/80 w-52">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Hotspot Active</p>
                  <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                    <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    {deviceCount} devices connected
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 — Security */}
            <motion.div
              className="absolute -bottom-4 -left-6 z-10"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-glass-lg border border-white/80 w-48">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">WPA2 Secure</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Encrypted network</p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 — Speed */}
            <motion.div
              className="absolute top-1/3 -right-6 z-10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="px-4 py-3 bg-white rounded-2xl shadow-glass-lg border border-white/80 w-44">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Download</p>
                <p className="text-2xl font-extrabold text-slate-900">94.2<span className="text-sm font-medium text-slate-400 ml-1">Mbps</span></p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '78%' }}
                    transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                  />
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
