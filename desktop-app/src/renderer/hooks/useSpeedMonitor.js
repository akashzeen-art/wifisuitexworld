import { useState, useEffect, useRef } from 'react'

const MAX_POINTS = 30

export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec < 0) return { value: '0.0', unit: 'KB/s', raw: 0 }
  if (bytesPerSec < 1024)        return { value: bytesPerSec.toFixed(0),           unit: 'B/s',  raw: bytesPerSec }
  if (bytesPerSec < 1024 * 1024) return { value: (bytesPerSec / 1024).toFixed(1),  unit: 'KB/s', raw: bytesPerSec }
  return { value: (bytesPerSec / 1024 / 1024).toFixed(2), unit: 'MB/s', raw: bytesPerSec }
}

export function useSpeedMonitor(intervalMs = 2000) {
  const [history, setHistory] = useState(() =>
    Array.from({ length: MAX_POINTS }, (_, i) => ({ t: i, up: 0, down: 0 }))
  )
  const [current, setCurrent] = useState({ up: 0, down: 0 })
  const tickRef = useRef(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const speed = await window.electron.network.speed()
        const up   = Math.max(0, speed.up   || 0)
        const down = Math.max(0, speed.down || 0)
        setCurrent({ up, down })
        setHistory(prev => {
          const next = [...prev.slice(1), { t: tickRef.current++, up, down }]
          return next
        })
      } catch {}
    }
    poll()
    const id = setInterval(poll, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return {
    history,
    current,
    upFormatted:   formatSpeed(current.up),
    downFormatted: formatSpeed(current.down),
  }
}
