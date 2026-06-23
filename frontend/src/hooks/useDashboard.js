import { useState, useEffect, useRef } from 'react'

const MAX_POINTS = 30
const POLL_MS = 3000

/** Derive live download/upload Mbps from cumulative byte counters */
export function useBandwidthTracker(api) {
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState({ down: 0, up: 0 })
  const prev = useRef(null)
  const tick = useRef(0)

  useEffect(() => {
    const sample = async () => {
      try {
        const { data } = await api.get('/devices/stats')
        const now = Date.now()
        const downBytes = data.totalBytesReceived ?? 0
        const upBytes = data.totalBytesSent ?? 0

        if (prev.current) {
          const dtSec = (now - prev.current.t) / 1000
          if (dtSec >= 0.5) {
            const downMbps = Math.max(0, ((downBytes - prev.current.down) * 8) / dtSec / 1_000_000)
            const upMbps = Math.max(0, ((upBytes - prev.current.up) * 8) / dtSec / 1_000_000)
            const rounded = { down: Math.round(downMbps * 10) / 10, up: Math.round(upMbps * 10) / 10 }
            setCurrent(rounded)
            setHistory(h => [...h.slice(-(MAX_POINTS - 1)), { t: tick.current++, ...rounded }])
          }
        }

        prev.current = { t: now, down: downBytes, up: upBytes }
      } catch {
        /* keep last values */
      }
    }

    sample()
    const id = setInterval(sample, POLL_MS)
    return () => clearInterval(id)
  }, [api])

  return { history, current }
}

export function useDashboardData(api) {
  const [subs, setSubs] = useState([])
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState(null)
  const [licenses, setLicenses] = useState([])
  const [hotspot, setHotspot] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [subRes, devRes, statsRes, licRes, hsRes] = await Promise.allSettled([
        api.get('/subscriptions'),
        api.get('/devices'),
        api.get('/devices/stats'),
        api.get('/subscriptions/licenses'),
        api.get('/hotspots/active'),
      ])
      if (subRes.status === 'fulfilled') setSubs(subRes.value.data)
      if (devRes.status === 'fulfilled') setDevices(devRes.value.data)
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (licRes.status === 'fulfilled') setLicenses(licRes.value.data)
      if (hsRes.status === 'fulfilled' && hsRes.value.status === 200) {
        setHotspot(hsRes.value.data)
      } else {
        setHotspot(null)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    const id = setInterval(() => fetch(true), 12000)
    return () => clearInterval(id)
  }, [])

  return { subs, devices, stats, licenses, hotspot, loading, refetch: () => fetch(true) }
}
