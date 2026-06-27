import api from './api'
import { throwApiError } from '../utils/apiError'

const TOPICS_BASE = '/api/topics'

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

export async function getTopics(params = {}) {
  try {
    const response = await api.get(TOPICS_BASE, {
      params: stripEmptyParams(params),
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getTopicById(id) {
  try {
    const response = await api.get(`${TOPICS_BASE}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getTopicsBySubject(subjectId) {
  const key = String(subjectId ?? '').trim()
  if (!key) return { success: true, count: 0, data: [] }

  try {
    const response = await api.get(`${TOPICS_BASE}/by-subject/${key}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createTopic(payload) {
  try {
    const response = await api.post(TOPICS_BASE, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateTopic(id, payload) {
  try {
    const response = await api.put(`${TOPICS_BASE}/${id}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function toggleTopicStatus(id, status) {
  try {
    const response = await api.patch(`${TOPICS_BASE}/status/${id}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** @deprecated Use toggleTopicStatus */
export const updateTopicStatus = toggleTopicStatus

export async function deleteTopic(id) {
  try {
    const response = await api.delete(`${TOPICS_BASE}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const topicService = {
  getTopics,
  getTopicById,
  getTopicsBySubject,
  createTopic,
  updateTopic,
  toggleTopicStatus,
  deleteTopic,
}

export default topicService
