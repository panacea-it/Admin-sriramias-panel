import api, { UPLOAD_REQUEST_TIMEOUT_MS } from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

function toError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

export async function fetchToppersLists(params = {}) {
  try {
    const response = await api.post('/admin/toppers-list/list', {
      page: 1,
      limit: 500,
      search: '',
      status: '',
      year: '',
      sortBy: 'displayOrder',
      sortOrder: 'asc',
      ...params,
    })
    return response?.data?.data ?? { toppersLists: [], pagination: {} }
  } catch (error) {
    throw toError(error, 'Failed to fetch toppers lists')
  }
}

export async function createToppersList(formData) {
  try {
    const response = await api.post('/admin/toppers-list/create', formData, {
      timeout: UPLOAD_REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response?.data?.data
  } catch (error) {
    throw toError(error, 'Failed to create toppers list')
  }
}

export async function updateToppersList(id, formData) {
  try {
    const response = await api.put(
      `/admin/toppers-list/update/${encodeURIComponent(id)}`,
      formData,
      {
        timeout: UPLOAD_REQUEST_TIMEOUT_MS,
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return response?.data?.data
  } catch (error) {
    throw toError(error, 'Failed to update toppers list')
  }
}

export async function changeToppersListStatus(id, status) {
  try {
    const response = await api.patch(
      `/admin/toppers-list/status/${encodeURIComponent(id)}`,
      { status },
    )
    return response?.data?.data
  } catch (error) {
    throw toError(error, 'Failed to update toppers list status')
  }
}

export async function deleteToppersList(id) {
  try {
    const response = await api.delete(
      `/admin/toppers-list/delete/${encodeURIComponent(id)}`,
    )
    return response?.data
  } catch (error) {
    throw toError(error, 'Failed to delete toppers list')
  }
}
