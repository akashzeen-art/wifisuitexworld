import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Menu, X, ChevronRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Download', href: '/download' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { token, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_24px_rgba(59,110,245,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-button group-hover:shadow-button-hover transition-shadow duration-200">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-[15px] tracking-tight">WiFiExtender</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100/80 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <>
                <Link to="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
                <button onClick={handleLogout} className="btn-ghost text-sm text-slate-500">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  Get started <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-lg md:hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map(link => (
                <Link key={link.label} to={link.href} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                {token ? (
                  <>
                    <Link to="/dashboard" className="btn-secondary w-full text-sm py-2.5">Dashboard</Link>
                    <button onClick={handleLogout} className="btn-ghost w-full text-sm text-slate-500">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-outline w-full text-sm py-2.5">Sign in</Link>
                    <Link to="/register" className="btn-primary w-full text-sm py-2.5">Get started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
