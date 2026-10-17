const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const validationMessage = Object.values(payload?.errors ?? {}).flat()[0]
    const error = new Error(validationMessage || payload?.message || 'La requête a échoué.')
    error.status = response.status
    throw error
  }

  return payload
}

const apiTransport = {
  list() {
    return apiRequest('/reports')
  },
  async get(id) {
    try {
      return await apiRequest(`/reports/${encodeURIComponent(id)}`)
    } catch (error) {
      if (error.status === 404) return null
      throw error
    }
  },
  update(id, changes) {
    return apiRequest(`/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    })
  },
  subscribe() {
    return () => {}
  },
}

export function createReportService(transport) {
  if (!transport?.list || !transport?.get || !transport?.update) {
    throw new Error('A report transport must implement list, get, and update.')
  }

  return {
    list: () => transport.list(),
    get: (id) => transport.get(String(id)),
    update: (id, changes) => transport.update(String(id), changes),
    subscribe: (listener) => transport.subscribe?.(listener) ?? (() => {}),
  }
}

export const reportService = createReportService(apiTransport)
