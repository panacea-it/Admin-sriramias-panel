import axiosInstance from '../api/axiosInstance'
import { throwApiError } from '../utils/apiError'

const BASE = '/subject-pdfs'

export async function getSubjectPdfCreateForm(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/create-form`, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getSubjectPdfDashboardSummary(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/dashboard-summary`, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getSubjectPdfs(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(BASE, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getSubjectPdfById(id, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/${encodeURIComponent(id)}`, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function createSubjectPdf(formData) {
  try {
    const response = await axiosInstance.post(BASE, formData)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateSubjectPdf(id, formDataOrBody) {
  try {
    const response = await axiosInstance.put(`${BASE}/${encodeURIComponent(id)}`, formDataOrBody)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateSubjectPdfVisibility(id, visibility) {
  try {
    const response = await axiosInstance.patch(
      `${BASE}/${encodeURIComponent(id)}/visibility`,
      { visibility },
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function downloadSubjectPdf(id) {
  try {
    const response = await axiosInstance.post(`${BASE}/${encodeURIComponent(id)}/download`)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteSubjectPdf(id) {
  try {
    const response = await axiosInstance.delete(`${BASE}/${encodeURIComponent(id)}`)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}
