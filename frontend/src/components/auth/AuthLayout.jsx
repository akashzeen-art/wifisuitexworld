import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wifi } from 'lucide-react'
import AuthHeroPanel from './AuthHeroPanel'

export default function AuthLayout({ children, hero }) {
  return (
    <div className="h-screen overflow-hidden auth-page-bg relative">
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none opacity-70" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[20%] w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 h-full flex">
        <AuthHeroPanel hero={hero} />

        {/* Right form panel — 40% */}
        <div className="w-full lg:w-[42%] flex items-start lg:items-center justify-center px-5 sm:px-6 py-5 lg:py-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[360px] my-auto"
          >
            {/* Mobile header */}
            <div className="lg:hidden mb-5">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-button">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-900">WiFiExtender</span>
                  <p className="text-[10px] text-slate-500 -mt-0.5">Amplify • Share • Manage</p>
                </div>
              </Link>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {hero.titlePrefix}{' '}
                <span className="gradient-text">{hero.titleHighlight}</span>
                {hero.titleSuffix}
              </h2>
            </div>

            <div className="auth-form-card">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
