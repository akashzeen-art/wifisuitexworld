import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Save, Check, Trash2, AlertTriangle, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../lib/api'
import { toast } from '../../store/toastStore'

function Section({ title, desc, children }) {
  return (
    <div className="glass-card p-6 mb-5">
      <div className="mb-5 pb-4 border-b border-slate-50">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {desc && <p className="text-sm text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const [profileSaved, setProfileSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })

  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [notifications, setNotifications] = useState({
    deviceConnect: user?.notifyDeviceConnect ?? true,
    deviceBlock: user?.notifyDeviceBlock ?? true,
    licenseExpiry: user?.notifyLicenseExpiry ?? true,
    newsletter: user?.notifyNewsletter ?? false,
  })
  const [notifSaving, setNotifSaving] = useState(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setProfile({ name: data.name, email: data.email })
      setNotifications({
        deviceConnect: data.notifyDeviceConnect ?? true,
        deviceBlock: data.notifyDeviceBlock ?? true,
        licenseExpiry: data.notifyLicenseExpiry ?? true,
        newsletter: data.notifyNewsletter ?? false,
      })
      updateUser(data)
    }).catch(() => {})
  }, [updateUser])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const { data } = await api.patch('/auth/me', profile)
      updateUser(data)
      setProfileSaved(true)
      toast.success('Profile updated')
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (password.new !== password.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setPasswordLoading(true)
    try {
      await api.put('/auth/password', {
        currentPassword: password.current,
        newPassword: password.new,
        confirmPassword: password.confirm,
      })
      setPassword({ current: '', new: '', confirm: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNotificationToggle = async (key) => {
    const next = { ...notifications, [key]: !notifications[key] }
    setNotifications(next)
    setNotifSaving(key)
    try {
      const { data } = await api.patch('/auth/notifications', {
        deviceConnect: next.deviceConnect,
        deviceBlock: next.deviceBlock,
        licenseExpiry: next.licenseExpiry,
        newsletter: next.newsletter,
      })
      updateUser(data)
    } catch (err) {
      setNotifications(notifications)
      toast.error(err.response?.data?.message || 'Failed to save notification preference')
    } finally {
      setNotifSaving(null)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (!deletePassword) {
      toast.error('Enter your password to confirm deletion')
      return
    }
    setDeleteLoading(true)
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } })
      logout()
      toast.success('Account deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and notifications.</p>
      </div>

      <div className="max-w-2xl">
        <Section title="Profile" desc="Update your personal information.">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-button">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <span className={`badge text-xs mt-1 ${user?.role === 'ADMIN' ? 'badge-blue' : 'badge-gray'}`}>{user?.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Full name</label>
                <input
                  className="input"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="input-label">Email address</label>
                <input
                  className="input"
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button
                type="submit"
                className="btn-primary text-sm py-2.5 px-5"
                whileTap={{ scale: 0.97 }}
                disabled={profileLoading}
              >
                {profileSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {profileLoading ? 'Saving…' : 'Save changes'}</>}
              </motion.button>
            </div>
          </form>
        </Section>

        <Section title="Password" desc="Change your account password.">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="input-label">Current password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password.current}
                onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">New password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password.new}
                  onChange={e => setPassword(p => ({ ...p, new: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="input-label">Confirm password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repeat password"
                  value={password.confirm}
                  onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-secondary text-sm py-2.5 px-5" disabled={passwordLoading}>
                <Lock className="w-4 h-4" /> {passwordLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </Section>

        <Section title="Notifications" desc="Choose what you want to be notified about.">
          <div className="space-y-4">
            {[
              { key: 'deviceConnect', label: 'Device connects', desc: 'Get notified when a new device joins your hotspot.' },
              { key: 'deviceBlock',   label: 'Device blocked',  desc: 'Notification when a device is blocked or unblocked.' },
              { key: 'licenseExpiry', label: 'License expiry',  desc: 'Reminder 7 days before your license expires.' },
              { key: 'newsletter',    label: 'Product updates', desc: 'Occasional emails about new features and improvements.' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationToggle(key)}
                  disabled={notifSaving === key}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${notifications[key] ? 'bg-brand-600' : 'bg-slate-200'} ${notifSaving === key ? 'opacity-60' : ''}`}
                >
                  <motion.div
                    animate={{ x: notifications[key] ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Danger Zone" desc="Irreversible actions for your account.">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
            <div>
              <p className="text-sm font-semibold text-red-700">Delete account</p>
              <p className="text-xs text-red-500 mt-0.5">Permanently delete your account and all data.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-sm font-semibold text-red-600 bg-white border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </Section>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Delete account</h3>
                    <p className="text-sm text-slate-500">This cannot be undone.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                  disabled={deleteLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                All your devices, subscriptions, licenses, and hotspot data will be permanently removed.
              </p>
              <form onSubmit={handleDeleteAccount}>
                <label className="input-label">Confirm with your password</label>
                <input
                  className="input mb-4"
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    className="btn-secondary text-sm py-2.5 px-4"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60"
                    disabled={deleteLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteLoading ? 'Deleting…' : 'Delete permanently'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
