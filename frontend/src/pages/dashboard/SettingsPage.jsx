import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Bell, Globe, Save, Check } from 'lucide-react'
import useAuthStore from '../../store/authStore'

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
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [notifications, setNotifications] = useState({ deviceConnect: true, deviceBlock: true, licenseExpiry: true, newsletter: false })

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and notifications.</p>
      </div>

      <div className="max-w-2xl">
        {/* Profile */}
        <Section title="Profile" desc="Update your personal information.">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-button">
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
                <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Email address</label>
                <input className="input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button
                type="submit"
                className="btn-primary text-sm py-2.5 px-5"
                whileTap={{ scale: 0.97 }}
              >
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
              </motion.button>
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section title="Password" desc="Change your account password.">
          <form className="space-y-4">
            <div>
              <label className="input-label">Current password</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">New password</label>
                <input className="input" type="password" placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="input-label">Confirm password</label>
                <input className="input" type="password" placeholder="Repeat password" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-secondary text-sm py-2.5 px-5">
                <Lock className="w-4 h-4" /> Update password
              </button>
            </div>
          </form>
        </Section>

        {/* Notifications */}
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
                  onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${notifications[key] ? 'bg-brand-600' : 'bg-slate-200'}`}
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

        {/* Danger zone */}
        <Section title="Danger Zone" desc="Irreversible actions for your account.">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
            <div>
              <p className="text-sm font-semibold text-red-700">Delete account</p>
              <p className="text-xs text-red-500 mt-0.5">Permanently delete your account and all data.</p>
            </div>
            <button className="text-sm font-semibold text-red-600 bg-white border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}
