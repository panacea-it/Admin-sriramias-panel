import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

/** GET /api/batches/dropdown — all active batches for live-class forms. */
export async function getBatchesDropdown({ signal } = {}) {
  try {
    const response = await axiosInstance.get('/batches/dropdown', { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}
