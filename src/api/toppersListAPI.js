import api, { UPLOAD_REQUEST_TIMEOUT_MS } from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

const LIST_PAGE_SIZE = 100

function toError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

function unwrapListPayload(response) {
  return response?.data?.data ?? { toppersLists: [], pagination: {} }
}

export async function fetchToppersLists(params = {}) {
  try {
    const response = await api.post('/admin/toppers-list/list', {
      page: 1,
      limit: LIST_PAGE_SIZE,
      search: '',
      status: '',
      year: '',
      sortBy: 'displayOrder',
      sortOrder: 'asc',
      ...params,
    })
    return unwrapListPayload(response)
  } catch (error) {
    throw toError(error, 'Failed to fetch toppers lists')
  }
}

/** Fetches every toppers list page (API max limit is 100 per request). */
export async function fetchAllToppersLists(params = {}) {
  const firstPage = await fetchToppersLists({ ...params, page: 1, limit: LIST_PAGE_SIZE })
  const allItems = [...(firstPage.toppersLists ?? [])]
  const totalPages = firstPage.pagination?.totalPages ?? 1

  if (totalPages <= 1) {
    return allItems
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchToppersLists({ ...params, page: index + 2, limit: LIST_PAGE_SIZE }),
    ),
  )

  for (const page of remainingPages) {
    allItems.push(...(page.toppersLists ?? []))
  }

  return allItems
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
