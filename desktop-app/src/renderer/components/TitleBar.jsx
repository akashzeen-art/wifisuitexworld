import { Minus, Square, X, Wifi } from 'lucide-react'

export default function TitleBar({ title = 'WiFiExtender' }) {
  return (
    <div className="drag-region h-10 bg-white border-b border-slate-100 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-5 h-5 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-md flex items-center justify-center">
          <Wifi className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.electron.window.minimize()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electron.window.maximize()}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={() => window.electron.window.close()}
          className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
