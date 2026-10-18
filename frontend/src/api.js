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

export async function uploadEvidenceToCloudinary(file) {
  const authorization = await apiRequest('/evidence/uploads/signature', {
    method: 'POST',
    body: JSON.stringify({ original_name: file.name, mime_type: file.type, size: file.size }),
  })
  const upload = authorization?.data
  if (!upload?.upload_url || !upload?.signature || !upload?.ticket || !upload?.parameters) {
    throw new Error('Le serveur n’a pas fourni une autorisation Cloudinary valide.')
  }

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', upload.api_key)
  body.append('signature', upload.signature)
  Object.entries(upload.parameters).forEach(([key, value]) => body.append(key, String(value)))

  let response
  try {
    response = await fetch(upload.upload_url, { method: 'POST', body })
  } catch {
    throw new Error(`Envoi de « ${file.name} » vers Cloudinary impossible. Vérifie ta connexion puis réessaie.`)
  }
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.public_id) {
    throw new Error(result?.error?.message || `Cloudinary n’a pas accepté « ${file.name} ». Réessaie.`)
  }
  if (result.public_id !== upload.parameters.public_id || result.resource_type !== upload.resource_type || result.type !== 'authenticated') {
    throw new Error(`Cloudinary a retourné des informations inattendues pour « ${file.name} ».`)
  }

  return { ticket: upload.ticket }
}
