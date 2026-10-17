import { useEffect, useState } from 'react'
import { municipalService } from '../services/municipalService'

export function useServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true

    municipalService.list()
      .then((items) => {
        if (current) {
          setServices(items)
          setError('')
        }
      })
      .catch(() => {
        if (current) setError('Impossible de charger les services municipaux pour le moment.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => { current = false }
  }, [])

  return { services, loading, error }
}
