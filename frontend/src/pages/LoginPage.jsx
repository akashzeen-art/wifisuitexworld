import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle, Wifi,
  Shield, Radio, ChevronLeft, Monitor,
} from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { toast } from '../store/toastStore'
import AuthLayout from '../components/auth/AuthLayout'
import AppDownloadButtons from '../components/ui/AppDownloadButtons'

function validate(form) {
  const errors = {}
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.password) errors.password = 'Password is required'
  return errors
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5"
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
    </motion.p>
  )
}

const perks = [
  { icon: Monitor, label: 'Live devices' },
  { icon: Radio, label: 'Hotspot control' },
  { icon: Shield, label: 'WPA2 secure' },
]

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
    if (errors.form) setErrors(er => ({ ...er, form: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const loadingId = toast.loading('Signing you in…')
    try {
      const { data } = await api.post('/auth/login', form)
      toast.dismiss(loadingId)
      login(data)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.dismiss(loadingId)
      const msg = err.response?.data?.message || 'Invalid email or password'
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      hero={{
        badge: 'Secure dashboard access',
        titlePrefix: 'Manage your',
        titleHighlight: 'WiFi network',
        titleSuffix: ' from anywhere.',
        subtitle: 'Sign in to monitor connected devices, control your hotspot, and track bandwidth in real time.',
        visualMode: 'login',
      }}
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand-600 transition-colors mb-3"
      >
        <ChevronLeft className="w-3 h-3" /> Back to home
      </Link>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-teal-500 flex items-center justify-center shadow-button shrink-0">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">Sign in</h1>
            <p className="text-xs text-slate-500">WiFiExtender dashboard</p>
          </div>
        </div>
        <span className="badge-green text-[9px] px-2 py-0.5 shrink-0 hidden sm:inline-flex">
          <span className="status-dot-green" /> Encrypted
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {perks.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-brand-50/80 border border-brand-100/60 px-2 py-1 rounded-full"
          >
            <Icon className="w-3 h-3 text-brand-600" />
            {label}
          </span>
        ))}
      </div>

      {errors.form && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-3"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errors.form}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="login-email" className="input-label text-xs mb-1">Email address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              id="login-email"
              type="email"
              autoFocus
              className={`input pl-9 py-2 text-sm ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : 'focus:border-brand-400'}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>
          <FieldError msg={errors.email} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="input-label text-xs mb-0">Password</label>
            <span className="text-[10px] text-slate-400">Min. 6 characters</span>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              className={`input pl-9 pr-10 py-2 text-sm ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : 'focus:border-brand-400'}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <FieldError msg={errors.password} />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-400/40"
          />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-shine w-full py-2.5 text-sm font-semibold"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in…
            </span>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-4">
        New to WiFiExtender?{' '}
        <Link to="/register" className="text-brand-700 font-semibold hover:text-brand-800 hover:underline">
          Create free account
        </Link>
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
          Download the app
        </p>
        <AppDownloadButtons layout="row" variant="compact" />
      </div>
    </AuthLayout>
  )
}
