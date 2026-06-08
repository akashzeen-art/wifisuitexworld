import { Download, Monitor, Key, Wifi, ChevronRight, Check, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  { icon: Download, step: '01', title: 'Download the app',     desc: 'Click the button below to download the WiFiExtender desktop app for Windows.' },
  { icon: Key,      step: '02', title: 'Activate your license', desc: 'Open the app, sign in, and paste your license key from the Subscription page.' },
  { icon: Wifi,     step: '03', title: 'Start your hotspot',   desc: 'Set your SSID and password, then click Start Hotspot.' },
  { icon: Monitor,  step: '04', title: 'Monitor devices',      desc: 'Connected devices appear here in real time. Block or monitor bandwidth.' },
]

export default function DownloadPageDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Download App</h1>
        <p className="text-slate-500 mt-1">Get the WiFiExtender desktop app for Windows.</p>
      </div>

      {/* Download card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-8 flex flex-col md:flex-row items-center gap-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-button flex-shrink-0">
          <Wifi className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-bold text-slate-900 mb-1">WiFiExtender Desktop</h2>
          <p className="text-slate-500 text-sm mb-3">Version 1.0.0 · Windows 10 / 11 · ~45 MB</p>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="badge-green text-xs"><div className="status-dot-green" /> Stable</span>
            <span className="badge-gray text-xs">Requires admin rights</span>
          </div>
        </div>
        <a
          href="/downloads/wifi-extender-setup.exe"
          className="btn-primary text-[15px] py-3.5 px-8 flex-shrink-0"
        >
          <Download className="w-5 h-5" />
          Download for Windows
        </a>
      </motion.div>

      {/* Steps */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">How to get started</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {steps.map(({ icon: Icon, step, title, desc }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 relative overflow-hidden group"
          >
            <div className="absolute top-3 right-4 text-5xl font-black text-slate-100 group-hover:text-brand-100 transition-colors leading-none select-none">
              {step}
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-3 shadow-sm relative z-10">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5 relative z-10">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed relative z-10">{desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Requirements */}
      <div className="grid md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-slate-900">System Requirements</h3>
          </div>
          <ul className="space-y-2.5">
            {['Windows 10 (1903+) or Windows 11', 'WiFi adapter with hosted network support', 'Administrator privileges', 'Active internet connection', 'Active WiFiExtender subscription'].map(r => (
              <li key={r} className="flex items-center gap-2.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-brand-500 flex-shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-900">Security</h3>
          </div>
          <ul className="space-y-2.5">
            {['Digitally signed installer', 'No background services or daemons', 'WPA2 encrypted hotspot', 'Uses standard Windows netsh commands', 'No kernel drivers or exploits'].map(r => (
              <li key={r} className="flex items-center gap-2.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
