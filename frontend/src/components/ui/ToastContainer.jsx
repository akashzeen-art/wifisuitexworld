import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader } from 'lucide-react'
import useToastStore from '../../store/toastStore'

const config = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50',  border: 'border-emerald-200', icon_color: 'text-emerald-500', text: 'text-emerald-800' },
  error:   { icon: XCircle,     bg: 'bg-red-50',      border: 'border-red-200',     icon_color: 'text-red-500',     text: 'text-red-800'     },
  warning: { icon: AlertTriangle,bg: 'bg-amber-50',   border: 'border-amber-200',   icon_color: 'text-amber-500',   text: 'text-amber-800'   },
  info:    { icon: Info,         bg: 'bg-brand-50',   border: 'border-brand-200',   icon_color: 'text-brand-500',   text: 'text-brand-800'   },
  loading: { icon: Loader,       bg: 'bg-slate-50',   border: 'border-slate-200',   icon_color: 'text-slate-500',   text: 'text-slate-800'   },
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const c = config[toast.type] || config.info
          const Icon = c.icon
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 60,  scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-glass-lg max-w-sm w-full ${c.bg} ${c.border}`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 mt-0.5 ${c.icon_color} ${toast.type === 'loading' ? 'animate-spin' : ''}`} />
              <p className={`text-sm font-medium flex-1 leading-snug ${c.text}`}>{toast.message}</p>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => remove(toast.id)}
                  className={`flex-shrink-0 ${c.icon_color} opacity-60 hover:opacity-100 transition-opacity`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
