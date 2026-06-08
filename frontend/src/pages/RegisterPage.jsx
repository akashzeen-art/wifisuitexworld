import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wifi, Eye, EyeOff, ArrowRight, Mail, Lock, User, Check, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { toast } from '../store/toastStore'

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}
  if (!form.name.trim())                                    errors.name     = 'Full name is required'
  else if (form.name.trim().length < 2)                     errors.name     = 'Name must be at least 2 characters'
  if (!form.email.trim())                                   errors.email    = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email    = 'Enter a valid email address'
  if (!form.password)                                       errors.password = 'Password is required'
  else if (form.password.length < 6)                        errors.password = 'Password must be at least 6 characters'
  if (!form.confirm)                                        errors.confirm  = 'Please confirm your password'
  else if (form.password !== form.confirm)                  errors.confirm  = 'Passwords do not match'
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

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6)  score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  return score
}

const strengthMeta = [
  { label: 'Weak',   color: 'bg-red-400',   text: 'text-red-500'   },
  { label: 'Fair',   color: 'bg-amber-400',  text: 'text-amber-500' },
  { label: 'Good',   color: 'bg-emerald-400',text: 'text-emerald-500'},
  { label: 'Strong', color: 'bg-emerald-500',text: 'text-emerald-600'},
]

const perks = [
  'Free 7-day trial, no credit card',
  'Start hotspot in under 60 seconds',
  'Monitor & block devices in real time',
  'Cancel anytime',
]

export default function RegisterPage() {
  const [form,     setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors,   setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const strength = getStrength(form.password)
  const sm = strengthMeta[strength] || strengthMeta[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const loadingId = toast.loading('Creating your account…')

    try {
      const { data } = await api.post('/auth/register', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      })
      toast.dismiss(loadingId)
      login(data)
      toast.success('Account created! Welcome to WiFiExtender 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.dismiss(loadingId)
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
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
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        <div className="relative text-white max-w-sm z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">WiFiExtender</span>
          </Link>
          <h2 className="text-3xl font-extrabold mb-4 leading-tight">
            Start sharing WiFi in minutes
          </h2>
          <p className="text-blue-100 leading-relaxed mb-8">
            Create your free account and get your hotspot running today.
          </p>
          <ul className="space-y-3">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3 text-sm text-blue-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                {p}
              </li>
            ))}
          </ul>
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
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-button">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">WiFiExtender</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Create your account</h1>
          <p className="text-slate-500 mb-8">Free trial — no credit card required</p>

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

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label className="input-label">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className={`input pl-10 ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  placeholder="John Doe"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                />
              </div>
              <FieldError msg={errors.name} />
            </div>

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
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pl-10 pr-11 ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? sm.color : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${sm.text}`}>{sm.label}</span>
                </div>
              )}
              <FieldError msg={errors.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="input-label">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pl-10 ${errors.confirm ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : form.confirm && form.confirm === form.password ? 'border-emerald-300 focus:border-emerald-400' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  autoComplete="new-password"
                />
                {form.confirm && form.confirm === form.password && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              <FieldError msg={errors.confirm} />
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
                  Creating account…
                </span>
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            By creating an account you agree to our{' '}
            <a href="#" className="text-brand-600 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
          </p>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
