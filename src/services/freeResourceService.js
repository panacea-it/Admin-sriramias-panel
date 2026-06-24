import api from './api'
import { throwApiError } from '../utils/apiError'
import {
  buildFreeResourceListBody,
  buildFreeResourceListParams,
  buildMockTestFormData,
  buildNcertBookFormData,
  buildPreviousYearPaperFormData,
  buildStudyMaterialFormData,
} from '../utils/freeResourceApiHelpers'

const BASE = '/api/free-resources'

const MULTIPART_OPTIONS = {
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
}

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

async function fetchFreeResourceList(path, params = {}, config = {}) {
  const queryParams = buildFreeResourceListParams(params)
  try {
    const { data } = await api.get(path, { params: queryParams, ...config })
    return data
  } catch (error) {
    if (error?.response?.status !== 400) throwApiError(error)
    const { data } = await api.get(path, config)
    return data
  }
}

// ─── Unified list ───

/** POST /api/free-resources/list */
export async function getFreeResourcesList(params = {}, config = {}) {
  try {
    const body = buildFreeResourceListBody(params)
    const { data } = await api.post(`${BASE}/list`, body, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/free-resources */
export async function getFreeResources(params = {}, config = {}) {
  try {
    const { data } = await api.get(BASE, {
      params: stripEmptyParams(buildFreeResourceListBody(params)),
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** GET /api/free-resources/view/:id */
export async function getFreeResourceById(resourceId, config = {}) {
  try {
    const { data } = await api.get(`${BASE}/view/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** PATCH /api/free-resources/:id/status */
export async function updateFreeResourceStatus(resourceId, status, config = {}) {
  try {
    const { data } = await api.patch(
      `${BASE}/${resourceId}/status`,
      { status: String(status || 'ACTIVE').trim().toUpperCase() },
      config,
    )
    return data
  } catch (error) {
    throwApiError(error)
  }
}

// ─── Dropdowns ───

export async function getResourceCategoriesDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/resource-categories`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getNcertSubjectsDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/ncert-subjects`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getNcertClassesDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/ncert-classes`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getExamCategoriesDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/exam-categories`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getPaperTypesDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/paper-types`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getYearsDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/years`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getStudyMaterialCategoriesDropdown(config = {}) {
  try {
    const { data } = await api.get(`${BASE}/dropdowns/study-material-categories`, config)
    return data
  } catch (error) {
    if (error?.response?.status === 404) return null
    throwApiError(error)
  }
}

// ─── NCERT Books ───

export async function createNcertBook(payload, config = {}) {
  try {
    const formData = buildNcertBookFormData(payload)
    const { data } = await api.post(`${BASE}/ncert-books`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getNcertBooks(params = {}, config = {}) {
  return fetchFreeResourceList(`${BASE}/ncert-books`, params, config)
}

export async function getNcertBookById(resourceId, config = {}) {
  try {
    const { data } = await api.get(`${BASE}/ncert-books/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateNcertBook(resourceId, payload, config = {}) {
  try {
    const formData = buildNcertBookFormData(payload, { isEdit: true })
    const { data } = await api.put(`${BASE}/ncert-books/${resourceId}`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteNcertBook(resourceId, config = {}) {
  try {
    const { data } = await api.delete(`${BASE}/ncert-books/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

// ─── Previous Year Papers ───

export async function createPreviousYearPaper(payload, config = {}) {
  try {
    const formData = buildPreviousYearPaperFormData(payload)
    const { data } = await api.post(`${BASE}/previous-year-papers`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getPreviousYearPapers(params = {}, config = {}) {
  return fetchFreeResourceList(`${BASE}/previous-year-papers`, params, config)
}

export async function getPreviousYearPaperById(resourceId, config = {}) {
  try {
    const { data } = await api.get(`${BASE}/previous-year-papers/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updatePreviousYearPaper(resourceId, payload, config = {}) {
  try {
    const formData = buildPreviousYearPaperFormData(payload, { isEdit: true })
    const { data } = await api.put(`${BASE}/previous-year-papers/${resourceId}`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deletePreviousYearPaper(resourceId, config = {}) {
  try {
    const { data } = await api.delete(`${BASE}/previous-year-papers/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

// ─── Mock Tests ───

export async function createMockTest(payload, config = {}) {
  try {
    const formData = buildMockTestFormData(payload, { isEdit: false })
    const { data } = await api.post(`${BASE}/mock-tests`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getMockTests(params = {}, config = {}) {
  return fetchFreeResourceList(`${BASE}/mock-tests`, params, config)
}

export async function getMockTestById(mockTestId, config = {}) {
  try {
    const { data } = await api.get(`${BASE}/mock-tests/${mockTestId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateMockTest(mockTestId, payload, config = {}) {
  try {
    const formData = buildMockTestFormData(payload, { isEdit: true })
    const { data } = await api.put(`${BASE}/mock-tests/${mockTestId}`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteMockTest(mockTestId, config = {}) {
  try {
    const { data } = await api.delete(`${BASE}/mock-tests/${mockTestId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getMockTestBulkTemplate(config = {}) {
  try {
    return await api.get(`${BASE}/mock-tests/questions/bulk-template`, {
      responseType: 'blob',
      ...config,
    })
  } catch (error) {
    throwApiError(error)
  }
}

export async function previewMockTestQuestions(file, fields = {}, config = {}) {
  try {
    const formData = new FormData()
    formData.append('bulkFile', file)
    Object.entries(fields).forEach(([key, value]) => {
      if (value != null && value !== '') formData.append(key, String(value))
    })
    const { data } = await api.post(`${BASE}/mock-tests/questions/preview`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function uploadMockTestQuestions(
  mockTestId,
  file,
  { replace = false, onUploadProgress, ...config } = {},
) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('replace', String(replace))
    const { data } = await api.post(`${BASE}/mock-tests/${mockTestId}/questions/upload`, formData, {
      ...MULTIPART_OPTIONS,
      onUploadProgress,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getMockTestQuestions(mockTestId, config = {}) {
  try {
    const { data } = await api.get(`${BASE}/mock-tests/${mockTestId}/questions`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createMockTestQuestion(mockTestId, payload, config = {}) {
  try {
    const { data } = await api.post(`${BASE}/mock-tests/${mockTestId}/questions`, payload, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateMockTestQuestion(mockTestId, questionId, payload, config = {}) {
  try {
    const { data } = await api.put(
      `${BASE}/mock-tests/${mockTestId}/questions/${questionId}`,
      payload,
      config,
    )
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function duplicateMockTestQuestion(mockTestId, questionId, config = {}) {
  try {
    const { data } = await api.post(
      `${BASE}/mock-tests/${mockTestId}/questions/${questionId}/duplicate`,
      {},
      config,
    )
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteMockTestQuestion(mockTestId, questionId, config = {}) {
  try {
    const { data } = await api.delete(
      `${BASE}/mock-tests/${mockTestId}/questions/${questionId}`,
      config,
    )
    return data
  } catch (error) {
    throwApiError(error)
  }
}

// ─── Study Materials ───

export async function createStudyMaterial(payload, config = {}) {
  try {
    const formData = buildStudyMaterialFormData(payload)
    const { data } = await api.post(`${BASE}/study-materials`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getStudyMaterials(params = {}, config = {}) {
  return fetchFreeResourceList(`${BASE}/study-materials`, params, config)
}

export async function getStudyMaterialById(resourceId, config = {}) {
  try {
    const { data } = await api.get(`${BASE}/study-materials/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateStudyMaterial(resourceId, payload, config = {}) {
  try {
    const formData = buildStudyMaterialFormData(payload, { isEdit: true })
    const { data } = await api.put(`${BASE}/study-materials/${resourceId}`, formData, {
      ...MULTIPART_OPTIONS,
      ...config,
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteStudyMaterial(resourceId, config = {}) {
  try {
    const { data } = await api.delete(`${BASE}/study-materials/${resourceId}`, config)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** Delete by resource category enum */
export async function deleteFreeResourceByCategory(resourceCategory, resourceId, config = {}) {
  const normalized = String(resourceCategory || '').toUpperCase()
  switch (normalized) {
    case 'NCERT_BOOKS':
      return deleteNcertBook(resourceId, config)
    case 'PREVIOUS_YEAR_QUESTIONS':
      return deletePreviousYearPaper(resourceId, config)
    case 'FREE_MOCK_TEST':
      return deleteMockTest(resourceId, config)
    case 'STUDY_MATERIAL':
      return deleteStudyMaterial(resourceId, config)
    default:
      throw new Error(`Unsupported resource category: ${resourceCategory}`)
  }
}

export const freeResourceService = {
  getFreeResourcesList,
  getFreeResources,
  getFreeResourceById,
  updateFreeResourceStatus,
  getResourceCategoriesDropdown,
  getNcertSubjectsDropdown,
  getNcertClassesDropdown,
  getExamCategoriesDropdown,
  getPaperTypesDropdown,
  getYearsDropdown,
  getStudyMaterialCategoriesDropdown,
  createNcertBook,
  getNcertBooks,
  getNcertBookById,
  updateNcertBook,
  deleteNcertBook,
  createPreviousYearPaper,
  getPreviousYearPapers,
  getPreviousYearPaperById,
  updatePreviousYearPaper,
  deletePreviousYearPaper,
  createMockTest,
  getMockTests,
  getMockTestById,
  updateMockTest,
  deleteMockTest,
  getMockTestBulkTemplate,
  previewMockTestQuestions,
  uploadMockTestQuestions,
  getMockTestQuestions,
  createMockTestQuestion,
  updateMockTestQuestion,
  duplicateMockTestQuestion,
  deleteMockTestQuestion,
  createStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
  deleteFreeResourceByCategory,
}

export default freeResourceService
