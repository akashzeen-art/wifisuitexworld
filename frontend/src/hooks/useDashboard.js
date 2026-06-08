import { useState, useEffect, useRef } from 'react'

const MAX_POINTS = 30

export function useDashboardData(api) {
  const [subs,     setSubs]     = useState([])
  const [devices,  setDevices]  = useState([])
  const [stats,    setStats]    = useState(null)
  const [licenses, setLicenses] = useState([])
  const [loading,  setLoading]  = useState(true)

  const fetch = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [subRes, devRes, statsRes, licRes] = await Promise.allSettled([
        api.get('/subscriptions'),
        api.get('/devices'),
        api.get('/devices/stats'),
        api.get('/subscriptions/licenses'),
      ])
      if (subRes.status   === 'fulfilled') setSubs(subRes.value.data)
      if (devRes.status   === 'fulfilled') setDevices(devRes.value.data)
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (licRes.status   === 'fulfilled') setLicenses(licRes.value.data)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    const id = setInterval(() => fetch(true), 12000)
    return () => clearInterval(id)
  }, [])

  return { subs, devices, stats, licenses, loading, refetch: () => fetch(true) }
}

export function useLiveSpeed() {
  const [history, setHistory] = useState(() =>
    Array.from({ length: MAX_POINTS }, (_, i) => ({
      t: i,
      down: Math.floor(Math.random() * 60 + 20),
      up:   Math.floor(Math.random() * 20 + 5),
    }))
  )
  const [current, setCurrent] = useState({ down: 48, up: 12 })
  const tick = useRef(MAX_POINTS)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent(prev => {
        const down = Math.max(5,  Math.min(200, prev.down + (Math.random() - 0.45) * 18))
        const up   = Math.max(1,  Math.min(80,  prev.up   + (Math.random() - 0.45) * 7))
        const pt   = { t: tick.current++, down: Math.round(down), up: Math.round(up) }
        setHistory(h => [...h.slice(1), pt])
        return { down: Math.round(down), up: Math.round(up) }
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return { history, current }
}
