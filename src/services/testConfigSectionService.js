import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

const BASE_PATH = '/api/test-configuration/sections'

async function getSectionsApi(params = {}) {
  try {
    const response = await withRateLimitRetry(() => api.get(BASE_PATH, { params }))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function getSectionByIdApi(id) {
  try {
    const response = await api.get(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function getSectionsDropdownApi() {
  try {
    const response = await api.get(`${BASE_PATH}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function createSectionApi(data) {
  try {
    const response = await api.post(BASE_PATH, data)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

async function updateSectionApi(id, data) {
  try {
    const response = await api.put(`${BASE_PATH}/${id}`, data)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

async function updateSectionStatusApi(id, status) {
  try {
    const response = await api.patch(`${BASE_PATH}/status/${id}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function deleteSectionApi(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getSections = getSectionsApi
export const getSectionById = getSectionByIdApi
export const getSectionsDropdown = getSectionsDropdownApi
export const createSection = createSectionApi
export const updateSection = updateSectionApi
export const updateSectionStatus = updateSectionStatusApi
export const deleteSection = deleteSectionApi
