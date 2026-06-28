import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

const BASE_PATH = '/api/test-configuration/languages'

async function getLanguagesApi(params = {}) {
  try {
    const response = await withRateLimitRetry(() => api.get(BASE_PATH, { params }))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function getLanguageByIdApi(id) {
  try {
    const response = await api.get(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function getLanguagesDropdownApi() {
  try {
    const response = await api.get(`${BASE_PATH}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function postLanguagesDropdownApi() {
  try {
    const response = await api.post(`${BASE_PATH}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function createLanguageApi(data) {
  try {
    const response = await api.post(BASE_PATH, data)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

async function updateLanguageApi(id, data) {
  try {
    const response = await api.put(`${BASE_PATH}/${id}`, data)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

async function updateLanguageStatusApi(id, status) {
  try {
    const response = await api.patch(`${BASE_PATH}/status/${id}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function deleteLanguageApi(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getLanguages = getLanguagesApi
export const getLanguageById = getLanguageByIdApi
export const getLanguagesDropdown = getLanguagesDropdownApi
export const postLanguagesDropdown = postLanguagesDropdownApi
export const createLanguage = createLanguageApi
export const updateLanguage = updateLanguageApi
export const updateLanguageStatus = updateLanguageStatusApi
export const deleteLanguage = deleteLanguageApi
