import { motion } from 'framer-motion'
import { Wifi, Smartphone, Tablet, Tv, Gamepad2 } from 'lucide-react'

const HUB = { x: 200, y: 210 }

const devices = [
  { label: 'Phone',    icon: Smartphone, x: 58,  y: 95,  delay: 0.1 },
  { label: 'Tablet',   icon: Tablet,     x: 342, y: 88,  delay: 0.25 },
  { label: 'Smart TV', icon: Tv,         x: 338, y: 300, delay: 0.4 },
  { label: 'Console',  icon: Gamepad2,   x: 62,  y: 295, delay: 0.55 },
]

function WifiArc({ cx, cy, r, delay }) {
  return (
    <motion.path
      d={`M ${cx - r * 0.55} ${cy} A ${r * 0.55} ${r * 0.55} 0 0 1 ${cx + r * 0.55} ${cy}`}
      fill="none"
      stroke="#10b981"
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ opacity: 0.15 }}
      animate={{ opacity: [0.15, 0.55, 0.15] }}
      transition={{ duration: 2, delay, repeat: Infinity }}
    />
  )
}

export default function WifiBoosterVisual() {
  return (
    <div className="relative w-full max-w-[420px] h-[200px] xl:h-[220px]">
      {/* Soft glow behind hub */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-brand-100/60 blur-2xl" />
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-teal-100/50 blur-xl" />

      {/* Expanding coverage rings */}
      {[100, 140, 180].map((size, i) => (
        <motion.div
          key={size}
          className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-200/50"
          style={{ width: size, height: size }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.15, 1.3], opacity: [0, 0.35, 0] }}
          transition={{ duration: 3, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 380" fill="none">
        {/* Dotted connection lines */}
        {devices.map((d, i) => (
          <motion.line
            key={d.label}
            x1={HUB.x} y1={HUB.y}
            x2={d.x + 20} y2={d.y + 20}
            stroke="#6ee7b7"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 2.5, delay: 0.3 + i * 0.15, repeat: Infinity }}
          />
        ))}

        {/* Data packets along lines */}
        {devices.map((d, i) => (
          <motion.circle
            key={`pkt-${d.label}`}
            r="3"
            fill="#10b981"
            initial={{ cx: HUB.x, cy: HUB.y, opacity: 0 }}
            animate={{
              cx: [HUB.x, d.x + 20],
              cy: [HUB.y, d.y + 20],
              opacity: [0, 0.9, 0],
            }}
            transition={{ duration: 1.8, delay: i * 0.35, repeat: Infinity, repeatDelay: 1.2 }}
          />
        ))}

        {/* WiFi arcs on laptop screen */}
        <WifiArc cx={HUB.x} cy={HUB.y - 18} r={28} delay={0} />
        <WifiArc cx={HUB.x} cy={HUB.y - 18} r={42} delay={0.3} />
        <WifiArc cx={HUB.x} cy={HUB.y - 18} r={56} delay={0.6} />
      </svg>

      {/* Central laptop hub */}
      <motion.div
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-10"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative">
          {/* Laptop body */}
          <div className="w-[120px] h-[78px] rounded-t-xl bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 shadow-xl flex items-center justify-center">
            <div className="w-[100px] h-[58px] rounded-md bg-gradient-to-br from-brand-500/20 to-teal-400/10 border border-brand-200/30 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-brand-500" />
            </div>
          </div>
          {/* Laptop base */}
          <div className="w-[140px] h-[6px] -ml-[10px] rounded-b-lg bg-gradient-to-b from-slate-500 to-slate-600" />
          <div className="w-[160px] h-[3px] -ml-[20px] rounded-full bg-slate-400/60" />
        </div>
      </motion.div>

      {/* Device nodes */}
      {devices.map((d) => (
        <motion.div
          key={d.label}
          className="absolute z-10"
          style={{ left: d.x, top: d.y }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.4, delay: d.delay },
            scale: { duration: 0.4, delay: d.delay },
            y: { duration: 3.5, delay: d.delay, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-card flex items-center justify-center">
            <d.icon className="w-4 h-4 text-brand-600" />
          </div>
        </motion.div>
      ))}

      {/* Live connection badge */}
      <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-700">12 devices connected</span>
        </motion.div>
    </div>
  )
}
