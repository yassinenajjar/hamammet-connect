import { apiRequest } from '../../api'

export const municipalService = {
  list: () => apiRequest('/services'),
}
