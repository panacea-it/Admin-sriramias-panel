import api, { UPLOAD_REQUEST_TIMEOUT_MS } from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

const LIST_PAGE_SIZE = 100

function toError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

function unwrapListPayload(response) {
  return response?.data?.data ?? { testimonials: [], pagination: {} }
}

export async function fetchTestimonials(params = {}) {
  try {
    const response = await api.post('/admin/testimonials/list', {
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
    throw toError(error, 'Failed to fetch testimonials')
  }
}

/** Fetches every testimonial page (API max limit is 100 per request). */
export async function fetchAllTestimonials(params = {}) {
  const firstPage = await fetchTestimonials({ ...params, page: 1, limit: LIST_PAGE_SIZE })
  const allItems = [...(firstPage.testimonials ?? [])]
  const totalPages = firstPage.pagination?.totalPages ?? 1

  if (totalPages <= 1) {
    return allItems
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchTestimonials({ ...params, page: index + 2, limit: LIST_PAGE_SIZE }),
    ),
  )

  for (const page of remainingPages) {
    allItems.push(...(page.testimonials ?? []))
  }

  return allItems
}

export async function createTestimonial(formData) {
  try {
    const response = await api.post('/admin/testimonials/create', formData, {
      timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    })
    return response?.data?.data
  } catch (error) {
    throw toError(error, 'Failed to create testimonial')
  }
}

export async function updateTestimonial(id, formData) {
  try {
    const response = await api.put(
      `/admin/testimonials/update/${encodeURIComponent(id)}`,
      formData,
      {
        timeout: UPLOAD_REQUEST_TIMEOUT_MS,
      },
    )
    return response?.data?.data
  } catch (error) {
    throw toError(error, 'Failed to update testimonial')
  }
}

export async function changeTestimonialStatus(id, status) {
  try {
    const response = await api.patch(
      `/admin/testimonials/status/${encodeURIComponent(id)}`,
      { status },
    )
    return response?.data?.data
  } catch (error) {
    throw toError(error, 'Failed to update testimonial status')
  }
}

export async function deleteTestimonial(id) {
  try {
    const response = await api.delete(
      `/admin/testimonials/delete/${encodeURIComponent(id)}`,
    )
    return response?.data
  } catch (error) {
    throw toError(error, 'Failed to delete testimonial')
  }
}
