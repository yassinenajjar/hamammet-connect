import { useCallback, useEffect, useState } from 'react'
import { reportService } from '../services/reportService'

export function useReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setReports(await reportService.list())
      setError('')
    } catch {
      setError('Impossible de charger les réclamations pour le moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let current = true
    const load = () => reportService.list().then((items) => {
      if (current) setReports(items)
    }).catch(() => {
      if (current) setError('Impossible de charger les réclamations pour le moment.')
    }).finally(() => {
      if (current) setLoading(false)
    })
    const unsubscribe = reportService.subscribe(load)
    load()
    return () => { current = false; unsubscribe() }
  }, [])
  return { reports, loading, error, refresh }
}
