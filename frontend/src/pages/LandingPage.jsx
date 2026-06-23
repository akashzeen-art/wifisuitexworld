import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/landing/HeroSection'
import StatsSection from '../components/landing/StatsSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import DeviceMonitorSection from '../components/landing/DeviceMonitorSection'
import AnalyticsSection from '../components/landing/AnalyticsSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import FaqSection from '../components/landing/FaqSection'
import CtaSection from '../components/landing/CtaSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-slate-50 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DeviceMonitorSection />
      <AnalyticsSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
