import { Link } from 'react-router-dom'
import { Wifi, Twitter, Github, Linkedin } from 'lucide-react'

const links = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Download', href: '/download' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">WiFiExtender</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Turn your laptop into a powerful WiFi hotspot. Share internet, monitor devices, and stay in control.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-600 hover:border-brand-200 transition-all duration-150 shadow-sm">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2024 WiFiExtender, Inc. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="status-dot-green animate-pulse" />
            <span className="text-xs text-slate-400">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
