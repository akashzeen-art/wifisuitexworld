import { Link } from 'react-router-dom'
import { Download, Monitor, Key, Wifi, Check, Shield, Zap, ArrowRight } from 'lucide-react'
import AndroidDownloadButton from '../../components/ui/AndroidDownloadButton'
import WindowsDownloadButton from '../../components/ui/WindowsDownloadButton'
import { PageHeader } from '../../components/dashboard/DashboardWidgets'
import { motion } from 'framer-motion'

const steps = [
  { icon: Download, title: 'Download the app', desc: 'Get Android or Windows using the buttons above.' },
  { icon: Key, title: 'Activate license', desc: 'Sign in to the app and paste your key from Subscription.' },
  { icon: Wifi, title: 'Start hotspot', desc: 'Set your SSID and password, then tap Start Hotspot.' },
  { icon: Monitor, title: 'Monitor devices', desc: 'View connected devices and manage bandwidth in real time.' },
]

const windowsReqs = [
  'Windows 10 (1903+) or Windows 11',
  'WiFi adapter with hosted network support',
  'Administrator privileges',
  'Active internet connection',
  'Active WiFiExtender subscription',
]

const androidReqs = [
  'Android 8.0 (Oreo) or newer',
  'WiFi hotspot support on your device',
  'Active internet connection',
  'Active WiFiExtender subscription',
  'Allow install from unknown sources if sideloading',
]

export default function DownloadPageDashboard() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-hero relative"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5" /> Get the app
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Download WiFiExtender
            </h1>
            <p className="text-emerald-50/90 text-sm mt-2 leading-relaxed">
              Install on Android or Windows to extend your WiFi, share internet, and monitor every connected device.
            </p>
          </div>
            <div className="grid sm:grid-cols-2 gap-3 w-full max-w-xl lg:max-w-2xl lg:ml-auto">
              <AndroidDownloadButton variant="hero" />
              <WindowsDownloadButton variant="hero" />
            </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <AndroidDownloadButton variant="card" />
          <ul className="mt-4 space-y-2">
            {androidReqs.slice(0, 3).map(r => (
              <li key={r} className="flex items-start gap-2 text-xs text-slate-500">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WindowsDownloadButton variant="card" />
          <ul className="mt-4 space-y-2">
            {windowsReqs.slice(0, 3).map(r => (
              <li key={r} className="flex items-start gap-2 text-xs text-slate-500">
                <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <PageHeader
        badge="Setup guide"
        title="How to get started"
        subtitle="Four simple steps to extend your network"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {steps.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="glass-card p-5 relative overflow-hidden"
          >
            <div className="absolute -top-1 -right-1 w-16 h-16 rounded-full bg-brand-50/80 -z-0" />
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-teal-500 flex items-center justify-center shadow-sm shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-brand-600">Step {i + 1}</span>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5 relative z-10">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed relative z-10">{desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6 border-l-4 border-l-slate-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-slate-900">Windows Requirements</h3>
          </div>
          <ul className="space-y-2.5">
            {windowsReqs.map(r => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900">Android Requirements</h3>
          </div>
          <ul className="space-y-2.5">
            {androidReqs.map(r => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="flex items-center justify-center gap-2 text-sm text-slate-500 py-2"
      >
        <span>Need your license key?</span>
        <Link to="/dashboard/subscription" className="inline-flex items-center gap-1 text-brand-600 font-semibold hover:text-brand-700">
          Go to Subscription <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  )
}
