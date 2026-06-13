import api from '../config/api'
import { TEST_CONFIG_API_DISABLED } from '../constants/testConfigurationStaticMode'
import { throwApiError } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'
import {
  createExamPatternStatic,
  deleteExamPatternStatic,
  getExamPatternByIdStatic,
  getExamPatternDropdownStatic,
  getExamPatternsStatic,
  updateExamPatternStatic,
  updateExamPatternStatusStatic,
} from './testConfigurationStaticService'

const BASE_PATH = '/api/test-configuration/exam-patterns'

/* -------------------------------------------------------------------------- */
/*  HTTP integration (preserved — re-enable via TEST_CONFIG_API_DISABLED)     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Public exports — static data while TEST_CONFIG_API_DISABLED is true       */
/* -------------------------------------------------------------------------- */

export async function getExamPatterns(params = {}) {
  if (TEST_CONFIG_API_DISABLED) return getExamPatternsStatic(params)
  return getExamPatternsApi(params)
}

export async function getExamPatternById(examPatternId) {
  if (TEST_CONFIG_API_DISABLED) return getExamPatternByIdStatic(examPatternId)
  return getExamPatternByIdApi(examPatternId)
}

export async function createExamPattern(data) {
  if (TEST_CONFIG_API_DISABLED) return createExamPatternStatic(data)
  return createExamPatternApi(data)
}

export async function updateExamPattern(examPatternId, data) {
  if (TEST_CONFIG_API_DISABLED) return updateExamPatternStatic(examPatternId, data)
  return updateExamPatternApi(examPatternId, data)
}

export async function updateExamPatternStatus(examPatternId, status) {
  if (TEST_CONFIG_API_DISABLED) return updateExamPatternStatusStatic(examPatternId, status)
  return updateExamPatternStatusApi(examPatternId, status)
}

export async function deleteExamPattern(examPatternId) {
  if (TEST_CONFIG_API_DISABLED) return deleteExamPatternStatic(examPatternId)
  return deleteExamPatternApi(examPatternId)
}

export async function getExamPatternDropdown() {
  if (TEST_CONFIG_API_DISABLED) return getExamPatternDropdownStatic()
  return getExamPatternDropdownApi()
}
