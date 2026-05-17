import { apiClient } from '@/services/api/http'

export interface RequestFormPayload {
  name: string
  phone: string
  message: string
  page: string
  locale: string
}

export const sendRequestForm = (params: RequestFormPayload) => {
  return apiClient.get('/request', { params })
}
