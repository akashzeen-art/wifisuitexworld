import { motion } from 'framer-motion'
import { FadeUp, StaggerContainer, StaggerItem } from '../ui/Motion'

const testimonials = [
  { name: 'Sarah Chen',      role: 'Remote Developer',   avatar: 'SC', color: 'from-brand-400 to-cyan-400',    quote: 'WiFiExtender saved me at a client site with no spare router. Set it up in 30 seconds and shared my laptop connection with the whole team. Absolute lifesaver.',    rating: 5 },
  { name: 'Marcus Webb',     role: 'Digital Nomad',      avatar: 'MW', color: 'from-violet-400 to-brand-400',  quote: 'I travel full-time and this is my go-to tool. The device blocking feature is a lifesaver in hotels and cafes. Clean UI, works perfectly every time.',           rating: 5 },
  { name: 'Priya Sharma',    role: 'IT Manager',         avatar: 'PS', color: 'from-emerald-400 to-cyan-400',  quote: 'We use the Business plan for our field teams. The admin dashboard gives me full visibility over all connections. Excellent product, excellent support.',          rating: 5 },
  { name: 'Tom Eriksson',    role: 'Freelance Designer', avatar: 'TE', color: 'from-amber-400 to-rose-400',    quote: 'The UI is gorgeous — feels like a premium product. Setup was instant and the bandwidth monitoring is super useful for managing my home office network.',          rating: 5 },
  { name: 'Aisha Okonkwo',   role: 'Startup Founder',    avatar: 'AO', color: 'from-rose-400 to-violet-400',   quote: 'Replaced our old router setup entirely. The license system is clean and the dashboard is a joy to use every day. Highly recommend for any small team.',           rating: 5 },
  { name: 'James Liu',       role: 'Software Engineer',  avatar: 'JL', color: 'from-teal-400 to-brand-400',    quote: 'Incredibly fast to set up. I was sharing my connection within a minute. The real-time device list is exactly what I needed for my home lab setup.',              rating: 5 },
]

const Stars = ({ count = 5 }) => (
  <div className="flex gap-0.5">
    {[...Array(count)].map((_, i) => (
      <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
)

export default function TestimonialsSection() {
  return (
    <section className="section bg-white overflow-hidden">
      <div className="container-lg">
        <FadeUp className="text-center mb-14">
          <span className="badge-blue text-xs mb-4 inline-flex">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Loved by <span className="gradient-text">thousands</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            Join over 50,000 users who rely on WiFiExtender every day.
          </p>
        </FadeUp>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" stagger={0.08}>
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(59,110,245,0.08)' }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-slate-100 rounded-3xl p-6 h-full flex flex-col gap-4 shadow-card cursor-default"
              >
                <Stars count={t.rating} />
                <p className="text-sm text-slate-600 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Trust bar */}
        <FadeUp delay={0.3} className="mt-12 flex flex-wrap items-center justify-center gap-8">
          {[
            { label: '4.9/5 rating',       sub: 'on Product Hunt'  },
            { label: '#1 Tool',             sub: 'WiFi Sharing 2024' },
            { label: '50K+ users',          sub: 'worldwide'         },
            { label: '2M+ devices',         sub: 'managed'           },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="font-bold text-slate-900 text-sm">{item.label}</p>
              <p className="text-xs text-slate-400">{item.sub}</p>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  )
}
