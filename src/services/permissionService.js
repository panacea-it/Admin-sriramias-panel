import api from '../config/api'
import { throwApiError } from '../utils/apiError'

export async function fetchPermissionMatrix(params = {}) {
  try {
    const response = await api.get('/api/admin/permissions', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function syncPermissionMatrixBulk(updates) {
  try {
    const response = await api.post('/api/admin/permissions/sync-bulk', { updates })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
