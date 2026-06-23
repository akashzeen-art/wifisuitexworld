import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, LogOut, CheckCircle, XCircle, Loader,
  Monitor, Calendar, Infinity, AlertTriangle, RefreshCw
} from 'lucide-react'
import api from '../lib/api'
import useAppStore from '../store/appStore'

function formatKey(key) {
  // Display as XXXX-XXXX-XXXX-XXXX-XXXX
  const clean = key.replace(/-/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join('-') || key
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt) - Date.now()) / 86400000)
}

export default function LicenseScreen() {
  const [licenseKey, setLicenseKey] = useState('')
  const [step,       setStep]       = useState('input')   // input | activating | success | error
  const [error,      setError]      = useState('')
  const [licenseData,setLicenseData]= useState(null)
  const [machineId,  setMachineId]  = useState('')
  const [machineLabel,setMachineLabel] = useState('')
  const { setLicense, logout } = useAppStore()

  // Get machine fingerprint on mount
  useEffect(() => {
    Promise.all([
      window.electron.machine.id(),
      window.electron.machine.label(),
    ]).then(([id, label]) => {
      setMachineId(id)
      setMachineLabel(label)
    })
  }, [])

  const handleActivate = async (e) => {
    e.preventDefault()
    if (!machineId) { setError('Could not read machine ID. Please restart the app.'); return }

    setStep('activating')
    setError('')

    try {
      const { data } = await api.post('/licenses/activate', {
        licenseKey:   formatKey(licenseKey),
        machineId,
        machineLabel,
      })

      setLicenseData(data)

      // Persist to electron-store
      await window.electron.store.set('licenseKey',   formatKey(licenseKey))
      await window.electron.store.set('licenseValid', true)
      await window.electron.store.set('licenseData',  data)
      await window.electron.store.set('machineId',    machineId)

      setStep('success')

      // Auto-advance to hotspot screen after 2s
      setTimeout(() => {
        setLicense(formatKey(licenseKey), true, data)
      }, 2000)

    } catch (err) {
      const msg = err.response?.data?.message || 'Activation failed. Please check your license key.'
      setError(msg)
      setStep('error')
    }
  }

  const handleLogout = async () => {
    await window.electron.store.set('token', null)
    await window.electron.store.set('user', null)
    logout()
  }

  const reset = () => {
    setStep('input')
    setError('')
    setLicenseKey('')
    setLicenseData(null)
  }

  return (
    <div className="h-screen flex items-center justify-center auth-page-bg px-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={step === 'activating' ? { rotate: 360 } : { rotate: 0 }}
            transition={step === 'activating' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-button ${
              step === 'success' ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
              : step === 'error'   ? 'bg-gradient-to-br from-red-500 to-rose-500'
              : 'bg-gradient-to-br from-brand-600 to-teal-500'
            }`}
          >
            {step === 'success'    ? <CheckCircle className="w-8 h-8 text-white" />
             : step === 'error'    ? <XCircle className="w-8 h-8 text-white" />
             : step === 'activating' ? <Loader className="w-8 h-8 text-white animate-spin" />
             : <Key className="w-8 h-8 text-white" />}
          </motion.div>

          <h1 className="text-xl font-bold text-slate-900">
            {step === 'success'    ? 'License Activated!'
             : step === 'error'    ? 'Activation Failed'
             : step === 'activating' ? 'Activating...'
             : 'Activate License'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === 'success'    ? 'Launching your hotspot dashboard...'
             : step === 'error'    ? 'Please check your license key and try again'
             : step === 'activating' ? 'Verifying with server...'
             : 'Enter your license key to continue'}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Input step ── */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card p-6"
            >
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">License Key</label>
                  <input
                    type="text"
                    className="input-field font-mono text-center tracking-widest uppercase text-sm"
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={e => setLicenseKey(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    maxLength={24}
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                    Get your key from the web dashboard → Subscription
                  </p>
                </div>

                {/* Machine info */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Monitor className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
                    <span className="truncate">{machineLabel || 'Reading machine info...'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-5">
                    This license will be bound to this device
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!machineId || licenseKey.replace(/-/g,'').length < 16}
                  className="btn-primary w-full"
                >
                  Activate License
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Activating step ── */}
          {step === 'activating' && (
            <motion.div
              key="activating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-8 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Contacting activation server...</p>
              </div>
            </motion.div>
          )}

          {/* ── Success step ── */}
          {step === 'success' && licenseData && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card p-6 space-y-4"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-800">
                    {licenseData.message}
                  </span>
                </div>
                <p className="font-mono text-xs text-emerald-700 break-all">{licenseData.license?.licenseKey}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-semibold text-slate-800">{licenseData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Devices</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {licenseData.unlimitedDevices
                      ? <><Infinity className="w-3.5 h-3.5" /> Unlimited</>
                      : licenseData.maxDevices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expires</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {licenseData.lifetime
                      ? <><Infinity className="w-3.5 h-3.5 text-violet-500" /> Lifetime</>
                      : licenseData.expiresAt
                        ? new Date(licenseData.expiresAt).toLocaleDateString()
                        : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader className="w-3 h-3 animate-spin" />
                Launching dashboard...
              </div>
            </motion.div>
          )}

          {/* ── Error step ── */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card p-6 space-y-4"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>

              {error.includes('different machine') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <p className="font-semibold mb-1">License bound to another device</p>
                  <p>Contact support or deactivate from the web dashboard to transfer your license.</p>
                </div>
              )}

              <button onClick={reset} className="btn-primary w-full flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mx-auto mt-5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  )
}
