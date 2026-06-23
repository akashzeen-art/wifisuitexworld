import { Link } from 'react-router-dom'
import { Wifi, Smartphone, Monitor } from 'lucide-react'
import AppDownloadButtons from '../ui/AppDownloadButtons'

const links = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Download', href: '/download' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Account: [
    { label: 'Sign in', href: '/login' },
    { label: 'Create account', href: '/register' },
    { label: 'Subscription', href: '/dashboard/subscription' },
  ],
}

export default function Footer() {
  return (
    <footer className="relative bg-slate-900 text-slate-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      {/* Download strip */}
      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Get the app</p>
            <h3 className="text-xl font-bold text-white mb-1">Download WiFiExtender</h3>
            <p className="text-sm text-slate-400 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Android APK</span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-emerald-400" /> Windows EXE</span>
            </p>
          </div>
          <div className="w-full max-w-md lg:max-w-xl shrink-0">
            <AppDownloadButtons layout="row" variant="card" />
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-teal-500 rounded-xl flex items-center justify-center shadow-button group-hover:shadow-button-hover transition-shadow">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">WiFiExtender</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Extend your WiFi, share internet with every device, and monitor your network from one beautiful dashboard.
            </p>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">© 2026 WiFiExtender. All rights reserved.</p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="status-dot-green animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
