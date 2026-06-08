import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import {
  mapApiCurrentAffairToForm,
  mapApiCurrentAffairToRow,
  mapQuestionApiToUi,
  normalizeCurrentAffairsListResponse,
  normalizeMainsCategoriesResponse,
  unwrapCurrentAffairResponse,
} from '../utils/currentAffairsApiHelpers'

const BASE_PATH = '/api/current-affairs'

export async function getCurrentAffairs(params = {}) {
  try {
    const response = await api.get(BASE_PATH, { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function fetchAllCurrentAffairs(params = {}) {
  let page = 1
  const limit = 100
  const items = []
  let totalPages = 1

  do {
    const data = await getCurrentAffairs({ ...params, page, limit })
    const normalized = normalizeCurrentAffairsListResponse(data, { page, limit })
    items.push(...normalized.items)
    totalPages = normalized.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return items
}

export async function getCurrentAffairById(id) {
  try {
    const response = await api.get(`${BASE_PATH}/${id}`)
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToForm(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function getDailyPracticeById(id) {
  try {
    const [paperResponse, questionsResponse] = await Promise.all([
      api.get(`${BASE_PATH}/${id}`),
      api.get(`${BASE_PATH}/${id}/questions`).catch(() => null),
    ])

    const raw = unwrapCurrentAffairResponse(paperResponse.data)
    const form = mapApiCurrentAffairToForm(raw)

    const questionsRaw = questionsResponse?.data?.data
    if (Array.isArray(questionsRaw) && questionsRaw.length) {
      form.questions = questionsRaw.map(mapQuestionApiToUi)
    }

    return form
  } catch (error) {
    throwApiError(error)
  }
}

export async function createCurrentAffair(formData) {
  try {
    const response = await api.post(BASE_PATH, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToRow(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function createDailyPractice(payload) {
  try {
    const response = await api.post(`${BASE_PATH}/daily-practice`, payload)
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToRow(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function createDailyPracticeBulk(formData) {
  try {
    const response = await api.post(`${BASE_PATH}/daily-practice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToRow(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCurrentAffair(id, formData) {
  try {
    const response = await api.put(`${BASE_PATH}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToRow(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateDailyPracticePaper(id, payload) {
  try {
    const response = await api.put(`${BASE_PATH}/${id}`, payload)
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToRow(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteCurrentAffair(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCurrentAffairStatus(id, active) {
  try {
    const response = await api.patch(`${BASE_PATH}/${id}/status`, { status: Boolean(active) })
    const raw = unwrapCurrentAffairResponse(response.data)
    return mapApiCurrentAffairToRow(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function getDailyPracticeMainsCategories() {
  try {
    const response = await api.get(`${BASE_PATH}/daily-practice/mains-categories`)
    return normalizeMainsCategoriesResponse(response.data)
  } catch (error) {
    throwApiError(error)
  }
}

export async function downloadDailyPracticeBulkTemplate() {
  try {
    const response = await api.get(`${BASE_PATH}/daily-practice/questions/bulk-template`, {
      responseType: 'blob',
    })
    const blob = response.data
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'daily-practice-questions-template.xlsx'
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    throwApiError(error)
  }
}

export async function getDailyPracticeQuestions(currentAffairId) {
  try {
    const response = await api.get(`${BASE_PATH}/${currentAffairId}/questions`)
    const list = Array.isArray(response.data?.data) ? response.data.data : []
    return list.map(mapQuestionApiToUi)
  } catch (error) {
    throwApiError(error)
  }
}

export async function addDailyPracticeQuestion(currentAffairId, formData) {
  try {
    const response = await api.post(`${BASE_PATH}/${currentAffairId}/questions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const raw = response.data?.data ?? response.data
    return mapQuestionApiToUi(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateDailyPracticeQuestion(currentAffairId, questionId, formData) {
  try {
    const response = await api.put(
      `${BASE_PATH}/${currentAffairId}/questions/${questionId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    const raw = response.data?.data ?? response.data
    return mapQuestionApiToUi(raw)
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteDailyPracticeQuestion(currentAffairId, questionId) {
  try {
    const response = await api.delete(`${BASE_PATH}/${currentAffairId}/questions/${questionId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function bulkUploadDailyPracticeQuestions(currentAffairId, file, { replace = false } = {}) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('replace', String(replace))
    const response = await api.post(
      `${BASE_PATH}/${currentAffairId}/questions/bulk-upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
