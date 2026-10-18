const defaultApiBaseUrl = import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api'
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, '')
let publicStatisticsRequest

export function getPublicStatistics() {
  if (!publicStatisticsRequest) {
    publicStatisticsRequest = apiRequest('/public/statistics').then((data) => {
      const values = [data?.citizens, data?.reports, data?.resolved]
      if (!values.every((value) => Number.isSafeInteger(value) && value >= 0)) {
        throw new Error('Réponse de statistiques invalide.')
      }
      return data
    }).catch((error) => {
      publicStatisticsRequest = null
      throw error
    })
  }
  return publicStatisticsRequest
}

export async function apiRequest(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }
  const token = sessionStorage.getItem('hc_api_token')
  if (token) headers.Authorization = `Bearer ${token}`
  if (!(options.body instanceof FormData) && options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const validationMessage = Object.values(payload?.errors ?? {}).flat()[0]
    const error = new Error(validationMessage || payload?.message || 'La requête a échoué.')
    error.status = response.status
    throw error
  }
  return payload
}

export function prepareReportWithAssistant(messages) {
  return apiRequest('/report-assistant/messages', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}
