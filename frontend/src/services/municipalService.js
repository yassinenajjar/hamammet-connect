import { apiRequest } from './reportService'

export const municipalService = {
  list: () => apiRequest('/services'),
}
