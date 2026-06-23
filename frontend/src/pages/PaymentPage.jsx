import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Shield, Lock, Check, ChevronLeft,
  Loader, AlertCircle, CheckCircle, ExternalLink, Infinity
} from 'lucide-react'
import api from '../lib/api'
import { toast } from '../store/toastStore'

const GATEWAYS = [
  {
    id: 'STRIPE',
    name: 'Stripe',
    desc: 'Credit / Debit card',
    logo: '💳',
    currencies: ['USD', 'EUR', 'GBP'],
  },
  {
    id: 'RAZORPAY',
    name: 'Razorpay',
    desc: 'UPI, Cards, Net Banking',
    logo: '🇮🇳',
    currencies: ['INR'],
  },
  {
    id: 'PAYPAL',
    name: 'PayPal',
    desc: 'PayPal balance or card',
    logo: '🅿️',
    currencies: ['USD', 'EUR', 'GBP'],
  },
]

function GatewayCard({ gateway, selected, onSelect }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(gateway.id)}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
        selected
          ? 'border-brand-500 bg-brand-50 shadow-glow'
          : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'
      }`}
    >
      <span className="text-2xl">{gateway.logo}</span>
      <div className="flex-1">
        <p className="font-semibold text-slate-900 text-sm">{gateway.name}</p>
        <p className="text-xs text-slate-500">{gateway.desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
      }`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
    </motion.button>
  )
}

export default function PaymentPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const planId          = searchParams.get('planId')

  const [plan,     setPlan]     = useState(null)
  const [gateway,  setGateway]  = useState('STRIPE')
  const [currency, setCurrency] = useState('USD')
  const [step,     setStep]     = useState('select')  // select | processing | success | failed
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [orderData,setOrderData]= useState(null)

  useEffect(() => {
    if (!planId) { navigate('/pricing'); return }
    api.get(`/plans/${planId}`).then(r => setPlan(r.data)).catch(() => navigate('/pricing'))
  }, [planId, navigate])

  // Auto-set currency for Razorpay
  useEffect(() => {
    if (gateway === 'RAZORPAY') setCurrency('INR')
    else setCurrency('USD')
  }, [gateway])

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/payments/create-order', {
        planId:   parseInt(planId),
        gateway,
        currency,
      })
      setOrderData(data)

      if (gateway === 'STRIPE')   await handleStripe(data)
      if (gateway === 'RAZORPAY') await handleRazorpay(data)
      if (gateway === 'PAYPAL')   handlePaypal(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initialization failed')
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Stripe ────────────────────────────────────────────────────────────────
  const handleStripe = async (data) => {
    // Load Stripe.js dynamically
    if (!window.Stripe) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      document.head.appendChild(script)
      await new Promise(r => { script.onload = r })
    }
    const stripe = window.Stripe(data.stripePublishableKey || import.meta.env.VITE_STRIPE_PK || '')
    setStep('processing')

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      data.clientSecret,
      {
        payment_method: {
          card: { token: 'tok_visa' }, // In production: use Stripe Elements
        },
      }
    )

    if (stripeError) {
      setError(stripeError.message)
      setStep('failed')
      return
    }

    await verifyPayment({ stripePaymentIntentId: paymentIntent.id })
  }

  // ── Razorpay ──────────────────────────────────────────────────────────────
  const handleRazorpay = async (data) => {
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.head.appendChild(script)
      await new Promise(r => { script.onload = r })
    }

    return new Promise((resolve, reject) => {
      const options = {
        key:         data.razorpayKeyId,
        amount:      Math.round(data.amount * 100),
        currency:    data.currency,
        name:        'WiFiExtender',
        description: plan?.name,
        order_id:    data.orderId,
        handler: async (response) => {
          setStep('processing')
          try {
            await verifyPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            resolve()
          } catch (e) {
            reject(e)
          }
        },
        modal: {
          ondismiss: () => { setStep('select'); resolve() }
        },
        theme: { color: '#2450ea' },
      }
      new window.Razorpay(options).open()
    })
  }

  // ── PayPal ────────────────────────────────────────────────────────────────
  const handlePaypal = (data) => {
    // Store paymentId in sessionStorage for return
    sessionStorage.setItem('paypal_payment_id', data.paymentId)
    sessionStorage.setItem('paypal_order_id',   data.orderId)
    window.location.href = data.approvalUrl
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  const verifyPayment = async (extra) => {
    const { data } = await api.post('/payments/verify', {
      paymentId: orderData?.paymentId,
      gateway,
      ...extra,
    })
    if (data.status === 'SUCCESS') {
      setStep('success')
      toast.success('Payment successful! Your subscription is now active.')
    } else {
      setStep('failed')
      setError('Payment could not be verified')
    }
  }

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to plans
        </button>

        <AnimatePresence mode="wait">

          {/* ── Select gateway ── */}
          {step === 'select' && (
            <motion.div key="select"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-3xl shadow-glass-lg border border-slate-100 overflow-hidden"
            >
              {/* Plan summary */}
              <div className="bg-gradient-to-r from-brand-600 to-signal-500 p-6 text-white">
                <p className="text-sm font-medium text-blue-100 mb-1">You're subscribing to</p>
                <h2 className="text-2xl font-extrabold">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-blue-200 text-sm">
                    {plan.planType === 'LIFETIME' ? ' one-time' : plan.planType === 'FREE_TRIAL' ? ' free' : '/mo'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    {plan.unlimitedDevices ? <><Infinity className="w-3.5 h-3.5" /> Unlimited devices</> : `${plan.maxDevices} devices`}
                  </span>
                  <span>·</span>
                  <span>{plan.durationDays ? `${plan.durationDays} days` : 'Lifetime'}</span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Gateway selection */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Choose payment method</p>
                  <div className="space-y-2.5">
                    {GATEWAYS.map(gw => (
                      <GatewayCard key={gw.id} gateway={gw} selected={gateway === gw.id} onSelect={setGateway} />
                    ))}
                  </div>
                </div>

                {/* Currency selector */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Currency</label>
                  <select
                    className="input text-sm py-2.5"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    disabled={gateway === 'RAZORPAY'}
                  >
                    {GATEWAYS.find(g => g.id === gateway)?.currencies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Security badges */}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL Encrypted</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Payment</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> PCI Compliant</span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="btn-primary w-full text-base py-3.5"
                >
                  {loading
                    ? <><Loader className="w-5 h-5 animate-spin" /> Initializing...</>
                    : <>Pay {currency} {plan.price} via {GATEWAYS.find(g => g.id === gateway)?.name}</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <motion.div key="processing"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-glass-lg border border-slate-100 p-12 text-center"
            >
              <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Processing payment...</h3>
              <p className="text-slate-500 text-sm">Please do not close this window</p>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-glass-lg border border-slate-100 p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Successful!</h3>
              <p className="text-slate-500 mb-2">Your <strong>{plan.name}</strong> subscription is now active.</p>
              <p className="text-sm text-slate-400 mb-8">Your license key has been generated. Check your dashboard.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/dashboard/subscription')} className="btn-primary px-8">
                  View License Key
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary px-6">
                  Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Failed ── */}
          {step === 'failed' && (
            <motion.div key="failed"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-glass-lg border border-slate-100 p-10 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Failed</h3>
              <p className="text-red-500 text-sm mb-8">{error || 'Something went wrong. Please try again.'}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep('select'); setError('') }} className="btn-primary px-8">
                  Try Again
                </button>
                <button onClick={() => navigate('/pricing')} className="btn-secondary px-6">
                  Back to Plans
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
