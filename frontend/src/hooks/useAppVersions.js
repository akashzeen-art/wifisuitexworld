import { useEffect, useState } from 'react'
import { APP_RELEASES_FALLBACK, fetchAppReleases } from '../lib/appVersions'

export function useAppVersions() {
  const [releases, setReleases] = useState(APP_RELEASES_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchAppReleases().then((data) => {
      if (active) setReleases(data)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  return { releases, loading }
}
