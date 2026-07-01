import api, { UPLOAD_REQUEST_TIMEOUT_MS } from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

function toError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

export async function fetchTestimonials(params = {}) {
  try {
    const response = await api.post('/admin/testimonials/list', {
      page: 1,
      limit: 500,
      search: '',
      status: '',
      year: '',
      sortBy: 'displayOrder',
      sortOrder: 'asc',
      ...params,
    })
    return response?.data?.data ?? { testimonials: [], pagination: {} }
  } catch (error) {
    throw toError(error, 'Failed to fetch testimonials')
  }
}

export async function createTestimonial(formData) {
  try {
    const response = await api.post('/admin/testimonials/create', formData, {
      timeout: UPLOAD_REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'multipart/form-data' },
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
        headers: { 'Content-Type': 'multipart/form-data' },
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
