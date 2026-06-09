import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

export async function createTopic(payload) {
  try {
    const response = await axiosInstance.post('/api/topics', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getTopics(params = {}) {
  try {
    const response = await axiosInstance.get('/api/topics', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getTopicsBySubject(subjectId) {
  const key = String(subjectId ?? '').trim()
  if (!key || key === 'all' || key === 'undefined' || key === 'null') {
    return []
  }

  try {
    const response = await axiosInstance.get(`/api/topics/by-subject/${key}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getTopicById(topicId) {
  try {
    const response = await axiosInstance.get(`/api/topics/${topicId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateTopic(topicId, payload) {
  try {
    const response = await axiosInstance.put(`/api/topics/${topicId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateTopicStatus(topicId, status) {
  try {
    const response = await axiosInstance.patch(`/api/topics/status/${topicId}`, {
      status,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteTopic(topicId) {
  try {
    const response = await axiosInstance.delete(`/api/topics/${topicId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
