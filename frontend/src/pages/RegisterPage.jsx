import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, Mail, Lock, User, Check, AlertCircle, Wifi, ChevronLeft,
} from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { toast } from '../store/toastStore'
import AuthLayout from '../components/auth/AuthLayout'

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Full name is required'
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.password) errors.password = 'Password is required'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters'
  if (!form.confirm) errors.confirm = 'Please confirm your password'
  else if (form.password !== form.confirm) errors.confirm = 'Passwords do not match'
  return errors
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-xs text-red-500 mt-1"
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
    </motion.p>
  )
}

function getStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  return score
}

const strengthMeta = [
  { label: 'Weak', color: 'bg-red-400', text: 'text-red-500' },
  { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-500' },
  { label: 'Good', color: 'bg-emerald-400', text: 'text-emerald-500' },
  { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
    if (errors.form) setErrors(er => ({ ...er, form: '' }))
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
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      toast.dismiss(loadingId)
      login(data)
      toast.success('Account created! Welcome to WiFiExtender')
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
    <AuthLayout
      hero={{
        badge: 'Free account setup',
        titlePrefix: 'Extend your',
        titleHighlight: 'WiFi network',
        titleSuffix: ' in minutes.',
        subtitle: 'Create an account, set up your hotspot, and start connecting devices from your dashboard.',
        visualMode: 'signup',
      }}
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand-600 transition-colors mb-2"
      >
        <ChevronLeft className="w-3 h-3" /> Back to home
      </Link>

      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-500 flex items-center justify-center shadow-button shrink-0">
          <Wifi className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Create account</h1>
      </div>

      {errors.form && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-2"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{errors.form}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <div>
          <label htmlFor="reg-name" className="input-label text-xs mb-0.5">Full name</label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              id="reg-name"
              type="text"
              autoFocus
              className={`input pl-9 py-1.5 text-sm ${errors.name ? 'border-red-300 focus:border-red-400' : 'focus:border-brand-400'}`}
              placeholder="John Doe"
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
            />
          </div>
          <FieldError msg={errors.name} />
        </div>

        <div>
          <label htmlFor="reg-email" className="input-label text-xs mb-0.5">Email address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              id="reg-email"
              type="email"
              className={`input pl-9 py-1.5 text-sm ${errors.email ? 'border-red-300 focus:border-red-400' : 'focus:border-brand-400'}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>
          <FieldError msg={errors.email} />
        </div>

        <div>
          <label htmlFor="reg-password" className="input-label text-xs mb-0.5">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              id="reg-password"
              type={showPass ? 'text' : 'password'}
              className={`input pl-9 pr-10 py-1.5 text-sm ${errors.password ? 'border-red-300 focus:border-red-400' : 'focus:border-brand-400'}`}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
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
          {form.password.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`h-0.5 flex-1 rounded-full ${i < strength ? sm.color : 'bg-slate-200'}`} />
                ))}
              </div>
              <span className={`text-[10px] font-semibold ${sm.text}`}>{sm.label}</span>
            </div>
          )}
          <FieldError msg={errors.password} />
        </div>

        <div>
          <label htmlFor="reg-confirm" className="input-label text-xs mb-0.5">Confirm password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              id="reg-confirm"
              type={showPass ? 'text' : 'password'}
              className={`input pl-9 pr-9 py-1.5 text-sm ${
                errors.confirm ? 'border-red-300 focus:border-red-400'
                  : form.confirm && form.confirm === form.password ? 'border-emerald-300 focus:border-emerald-400'
                  : 'focus:border-brand-400'
              }`}
              placeholder="Repeat password"
              value={form.confirm}
              onChange={set('confirm')}
              autoComplete="new-password"
            />
            {form.confirm && form.confirm === form.password && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
            )}
          </div>
          <FieldError msg={errors.confirm} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-shine w-full py-2 text-sm font-semibold !mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating account…
            </span>
          ) : (
            <>
              Create account
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[10px] text-slate-400 mt-2.5">
        By signing up you agree to our{' '}
        <a href="#" className="text-brand-600 hover:underline">Terms</a> and{' '}
        <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
        {' · '}
        <Link to="/login" className="text-brand-700 font-semibold hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
