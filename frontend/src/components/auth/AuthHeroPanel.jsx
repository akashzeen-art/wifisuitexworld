import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wifi, Zap, Shield, Gauge, Smartphone, CheckCircle2 } from 'lucide-react'
import WifiBoosterVisual from './WifiBoosterVisual'

const features = [
  {
    icon: Wifi,
    title: 'Amplify Signal Range',
    desc: 'Extend coverage across rooms, floors, and outdoor spaces.',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: Smartphone,
    title: 'Connect Every Device',
    desc: 'Share internet with phones, tablets, laptops, TVs, and more.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Gauge,
    title: 'Live Network Insights',
    desc: 'Monitor speed, bandwidth, and connected devices in real time.',
    color: 'bg-emerald-50 text-emerald-600',
  },
]

export default function AuthHeroPanel({ hero }) {
  return (
    <div className="hidden lg:flex lg:w-[58%] flex-col h-full px-10 xl:px-12 py-8 overflow-hidden">
      <Link to="/" className="inline-flex items-center gap-3 w-fit shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-button">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">WiFiExtender</span>
          <p className="text-[11px] text-slate-500 font-medium -mt-0.5">Amplify • Share • Manage</p>
        </div>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 shrink-0 max-w-lg"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" />
          {hero.badge}
        </div>

        <h1 className="text-[1.65rem] xl:text-[2rem] font-extrabold text-slate-900 leading-[1.15] tracking-tight">
          {hero.titlePrefix}{' '}
          <span className="gradient-text">{hero.titleHighlight}</span>
          {hero.titleSuffix}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mt-2">
          {hero.subtitle}
        </p>
      </motion.div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-5 space-y-2.5 shrink-0 max-w-md"
      >
        {features.map((f, i) => (
          <motion.li
            key={f.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-start gap-3"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}>
              <f.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{f.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <div className="flex-1 flex items-end justify-center min-h-0 pb-2 pt-4">
        <WifiBoosterVisual />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4 text-xs text-slate-500 shrink-0"
      >
        <span className="inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-500" /> Secure
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="inline-flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-teal-500" /> Fast
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Reliable
        </span>
      </motion.div>
    </div>
  )
}
