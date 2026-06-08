import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wifi, Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { toast } from '../store/toastStore'

// ── Field-level validation ────────────────────────────────────────────────────
function validate(form) {
  const errors = {}
  if (!form.email.trim())                          errors.email    = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.password)                              errors.password = 'Password is required'
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

export default function LoginPage() {
  const [form,     setForm]     = useState({ email: '', password: '' })
  const [errors,   setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
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
    <div className="min-h-screen bg-hero-gradient flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-cyan-700 items-center justify-center p-12">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-cyan-300/15 rounded-full blur-2xl" />

        <div className="relative text-white max-w-sm z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">WiFiExtender</span>
          </Link>
          <h2 className="text-3xl font-extrabold mb-4 leading-tight">
            Share your internet with anyone, anywhere
          </h2>
          <p className="text-blue-100 leading-relaxed mb-10">
            Manage your hotspot, monitor devices, and control bandwidth — all from one beautiful dashboard.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active users',   value: '50K+' },
              { label: 'Uptime',         value: '99.9%' },
              { label: 'Devices managed',value: '2M+' },
              { label: 'Avg setup',      value: '<60s' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-button">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">WiFiExtender</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to your account to continue</p>

          {/* Form-level error */}
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl mb-6"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.form}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="input-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  className={`input pl-10 ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
              </div>
              <FieldError msg={errors.email} />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Password</label>
                <a href="#" className="text-xs text-brand-600 hover:underline font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pl-10 pr-11 ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-[15px] mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
