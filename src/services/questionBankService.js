import api from '../config/api'
import { throwApiError } from '../utils/apiError'

const BASE_PATH = '/api/question-bank'

function parseContentDispositionFileName(header) {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1].replace(/"/g, ''))
  } catch {
    return match[1].replace(/"/g, '')
  }
}

/** GET /api/question-bank/analytics */
export async function getAnalytics(params = {}) {
  try {
    const response = await api.get(`${BASE_PATH}/analytics`, { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank */
export async function listQuestions(params = {}) {
  try {
    const response = await api.get(BASE_PATH, { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/:id */
export async function getQuestion(id) {
  try {
    const response = await api.get(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/question-bank */
export async function createQuestion(payload) {
  try {
    const response = await api.post(BASE_PATH, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** PATCH /api/question-bank/:id */
export async function updateQuestion(id, payload) {
  try {
    const response = await api.patch(`${BASE_PATH}/${id}`, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** PUT /api/question-bank/:id */
export async function replaceQuestion(id, payload) {
  try {
    const response = await api.put(`${BASE_PATH}/${id}`, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** DELETE /api/question-bank/:id */
export async function deleteQuestion(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** PATCH /api/question-bank/:id/status */
export async function updateQuestionStatus(id, status) {
  try {
    const response = await api.patch(`${BASE_PATH}/${id}/status`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/question-bank/:id/duplicate */
export async function duplicateQuestion(id) {
  try {
    const response = await api.post(`${BASE_PATH}/${id}/duplicate`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/types */
export async function getTypes() {
  try {
    const response = await api.get(`${BASE_PATH}/types`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/subjects */
export async function getSubjects() {
  try {
    const response = await api.get(`${BASE_PATH}/subjects`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/topics */
export async function getTopics(subject) {
  try {
    const response = await api.get(`${BASE_PATH}/topics`, {
      params: subject ? { subject } : undefined,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/tags */
export async function getTags(subject) {
  try {
    const response = await api.get(`${BASE_PATH}/tags`, {
      params: subject ? { subject } : undefined,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/difficulties */
export async function getDifficulties() {
  try {
    const response = await api.get(`${BASE_PATH}/difficulties`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/categories */
export async function getCategories() {
  try {
    const response = await api.get(`${BASE_PATH}/categories`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/editable-fields/:type */
export async function getEditableFields(type) {
  try {
    const response = await api.get(`${BASE_PATH}/editable-fields/${type}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/question-bank/bulk/templates/:type */
export async function downloadTemplate(typeSlug) {
  try {
    const response = await api.get(`${BASE_PATH}/bulk/templates/${typeSlug}`, {
      responseType: 'blob',
    })
    const fileName =
      parseContentDispositionFileName(response.headers?.['content-disposition']) ||
      `question-bank-${typeSlug}-template.xlsx`
    return { blob: response.data, fileName }
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/question-bank/bulk/validate */
export async function validateBulkFile(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`${BASE_PATH}/bulk/validate`, formData)
    return response.data
  } catch (error) {
    if (error?.response?.data?.data) {
      return error.response.data
    }
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/question-bank/bulk/import */
export async function importBulkFile(file, duplicateMode = 'SKIP') {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('duplicateMode', duplicateMode)
    const response = await api.post(`${BASE_PATH}/bulk/import`, formData)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export const questionBankService = {
  getAnalytics,
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  replaceQuestion,
  deleteQuestion,
  updateQuestionStatus,
  duplicateQuestion,
  getTypes,
  getSubjects,
  getTopics,
  getTags,
  getDifficulties,
  getCategories,
  getEditableFields,
  downloadTemplate,
  validateBulkFile,
  importBulkFile,
}

export default questionBankService
