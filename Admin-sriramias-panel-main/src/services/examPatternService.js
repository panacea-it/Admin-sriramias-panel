import api from '../config/api'
import { throwApiError } from '../utils/apiError'

const BASE_PATH = '/api/test-configuration/exam-patterns'

export async function getExamPatterns(params = {}) {
  try {
    const response = await api.get(BASE_PATH, { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getExamPatternById(examPatternId) {
  try {
    const response = await api.get(`${BASE_PATH}/${examPatternId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createExamPattern(data) {
  try {
    const response = await api.post(BASE_PATH, data)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateExamPattern(examPatternId, data) {
  try {
    const response = await api.put(`${BASE_PATH}/${examPatternId}`, data)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateExamPatternStatus(examPatternId, status) {
  try {
    const response = await api.patch(`${BASE_PATH}/status/${examPatternId}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteExamPattern(examPatternId) {
  try {
    const response = await api.delete(`${BASE_PATH}/${examPatternId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getExamPatternDropdown() {
  try {
    const response = await api.get(`${BASE_PATH}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
