import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

const BASE_PATH = '/api/test-configuration/exam-patterns'

async function getExamPatternsApi(params = {}) {
  try {
    const response = await withRateLimitRetry(() => api.get(BASE_PATH, { params }))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function getExamPatternByIdApi(examPatternId) {
  try {
    const response = await api.get(`${BASE_PATH}/${examPatternId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function createExamPatternApi(data) {
  try {
    const response = await api.post(BASE_PATH, data)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function updateExamPatternApi(examPatternId, data) {
  try {
    const response = await api.put(`${BASE_PATH}/${examPatternId}`, data)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function updateExamPatternStatusApi(examPatternId, status) {
  try {
    const response = await api.patch(`${BASE_PATH}/status/${examPatternId}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function deleteExamPatternApi(examPatternId) {
  try {
    const response = await api.delete(`${BASE_PATH}/${examPatternId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function getExamPatternDropdownApi() {
  try {
    const response = await api.get(`${BASE_PATH}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

async function postExamPatternDropdownApi() {
  try {
    const response = await api.post(`${BASE_PATH}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getExamPatterns = getExamPatternsApi
export const getExamPatternById = getExamPatternByIdApi
export const createExamPattern = createExamPatternApi
export const updateExamPattern = updateExamPatternApi
export const updateExamPatternStatus = updateExamPatternStatusApi
export const deleteExamPattern = deleteExamPatternApi
export const getExamPatternDropdown = getExamPatternDropdownApi
export const postExamPatternDropdown = postExamPatternDropdownApi
