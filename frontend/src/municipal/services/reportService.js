import { apiRequest } from '../../api'

const apiTransport = {
  async list(filters = {}) {
    const query = new URLSearchParams(filters)
    const payload = await apiRequest(`/staff/reports${query.size ? `?${query}` : ''}`)
    return payload.data ?? payload
  },
  async get(id) {
    try {
      const payload = await apiRequest(`/staff/reports/${encodeURIComponent(id)}`)
      return payload.data ?? payload
    } catch (error) {
      if (error.status === 404) return null
      throw error
    }
  },
  update(id, changes) {
    return apiRequest(`/staff/reports/${encodeURIComponent(id)}/status`, {
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
    list: (filters) => transport.list(filters),
    get: (id) => transport.get(String(id)),
    update: (id, changes) => transport.update(String(id), changes),
    setUrgency: (id, changes) => apiRequest(`/staff/reports/${encodeURIComponent(id)}/urgency`, { method: 'PATCH', body: JSON.stringify(changes) }),
    assign: (id, changes) => apiRequest(`/staff/reports/${encodeURIComponent(id)}/assignments`, { method: 'POST', body: JSON.stringify(changes) }),
    addNote: (id, note) => apiRequest(`/staff/reports/${encodeURIComponent(id)}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
    subscribe: (listener) => transport.subscribe?.(listener) ?? (() => {}),
  }
}

export const reportService = createReportService(apiTransport)
