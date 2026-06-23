import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Wifi, Download } from 'lucide-react'
import { FadeUp } from '../ui/Motion'

export default function CtaSection() {
  return (
    <section className="section bg-transparent">
      <div className="container-lg">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-teal-600 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Wifi className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Ready to extend your WiFi?
              </h2>
              <p className="text-lg text-emerald-50 mb-10 max-w-lg mx-auto">
                Create your free account, download the app, and start sharing internet in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3.5 rounded-2xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  Get started free <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/download"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  <Download className="w-4 h-4" /> Download app
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
