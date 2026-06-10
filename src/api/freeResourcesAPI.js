import axiosInstance from './axiosInstance'
import {
  buildFreeResourceListBody,
  buildFreeResourceListParams,
  buildMockTestFormData,
  buildNcertBookFormData,
  buildPreviousYearPaperFormData,
  buildStudyMaterialFormData,
} from '../utils/freeResourceApiHelpers'

const BASE = '/free-resources'

/** GET /api/free-resources/dropdowns/resource-categories */
export async function fetchResourceCategoriesDropdown({ signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/dropdowns/resource-categories`, { signal })
  return data
}

/** POST /api/free-resources/list — unified list (all categories) */
export async function fetchFreeResourcesList(params = {}, { signal } = {}) {
  const body = buildFreeResourceListBody(params)
  const { data } = await axiosInstance.post(`${BASE}/list`, body, { signal })
  return data
}

const MULTIPART_REQUEST_OPTIONS = {
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
}

/** POST /api/free-resources/ncert-books — create NCERT book (multipart/form-data) */
export async function createNcertBook(payload, { signal } = {}) {
  const formData = buildNcertBookFormData(payload)
  const { data } = await axiosInstance.post(`${BASE}/ncert-books`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** GET /api/free-resources/ncert-books/{resourceId} */
export async function fetchNcertBookById(resourceId, { signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/ncert-books/${resourceId}`, { signal })
  return data
}

async function fetchFreeResourceList(path, params = {}, { signal } = {}) {
  const queryParams = buildFreeResourceListParams(params)
  try {
    const { data } = await axiosInstance.get(path, { params: queryParams, signal })
    return data
  } catch (error) {
    if (error?.response?.status !== 400) throw error
    const { data } = await axiosInstance.get(path, { signal })
    return data
  }
}

/** GET /api/free-resources/ncert-books */
export async function fetchNcertBooks(params = {}, { signal } = {}) {
  return fetchFreeResourceList(`${BASE}/ncert-books`, params, { signal })
}

/** PUT /api/free-resources/ncert-books/{resourceId} */
export async function updateNcertBook(resourceId, payload, { signal } = {}) {
  const formData = buildNcertBookFormData(payload, { isEdit: true })
  const { data } = await axiosInstance.put(`${BASE}/ncert-books/${resourceId}`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** DELETE /api/free-resources/ncert-books/{resourceId} */
export async function deleteNcertBook(resourceId, { signal } = {}) {
  const { data } = await axiosInstance.delete(`${BASE}/ncert-books/${resourceId}`, { signal })
  return data
}

/** GET /api/free-resources/dropdowns/exam-categories */
export async function fetchExamCategoriesDropdown({ signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/dropdowns/exam-categories`, { signal })
  return data
}

/** GET /api/free-resources/dropdowns/paper-types */
export async function fetchPaperTypesDropdown({ signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/dropdowns/paper-types`, { signal })
  return data
}

/** GET /api/free-resources/dropdowns/years */
export async function fetchYearsDropdown({ signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/dropdowns/years`, { signal })
  return data
}

/** POST /api/free-resources/previous-year-papers — create previous year paper (multipart/form-data) */
export async function createPreviousYearPaper(payload, { signal } = {}) {
  const formData = buildPreviousYearPaperFormData(payload)
  const { data } = await axiosInstance.post(`${BASE}/previous-year-papers`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** GET /api/free-resources/previous-year-papers/{resourceId} */
export async function fetchPreviousYearPaperById(resourceId, { signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/previous-year-papers/${resourceId}`, { signal })
  return data
}

/** GET /api/free-resources/previous-year-papers */
export async function fetchPreviousYearPapers(params = {}, { signal } = {}) {
  return fetchFreeResourceList(`${BASE}/previous-year-papers`, params, { signal })
}

/** PUT /api/free-resources/previous-year-papers/{resourceId} */
export async function updatePreviousYearPaper(resourceId, payload, { signal } = {}) {
  const formData = buildPreviousYearPaperFormData(payload, { isEdit: true })
  const { data } = await axiosInstance.put(`${BASE}/previous-year-papers/${resourceId}`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** DELETE /api/free-resources/previous-year-papers/{resourceId} */
export async function deletePreviousYearPaper(resourceId, { signal } = {}) {
  const { data } = await axiosInstance.delete(`${BASE}/previous-year-papers/${resourceId}`, { signal })
  return data
}

/** POST /api/free-resources/mock-tests — create mock test (multipart/form-data) */
export async function createMockTest(payload, { signal } = {}) {
  const formData = buildMockTestFormData(payload, { isEdit: false })
  const { data } = await axiosInstance.post(`${BASE}/mock-tests`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** GET /api/free-resources/mock-tests */
export async function fetchMockTests(params = {}, { signal } = {}) {
  return fetchFreeResourceList(`${BASE}/mock-tests`, params, { signal })
}

/** GET /api/free-resources/mock-tests/{mockTestId} */
export async function fetchMockTestById(mockTestId, { signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/mock-tests/${mockTestId}`, { signal })
  return data
}

/** PUT /api/free-resources/mock-tests/{mockTestId} */
export async function updateMockTest(mockTestId, payload, { signal } = {}) {
  const formData = buildMockTestFormData(payload, { isEdit: true })
  const { data } = await axiosInstance.put(`${BASE}/mock-tests/${mockTestId}`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** DELETE /api/free-resources/mock-tests/{mockTestId} */
export async function deleteMockTest(mockTestId, { signal } = {}) {
  const { data } = await axiosInstance.delete(`${BASE}/mock-tests/${mockTestId}`, { signal })
  return data
}

/** GET /api/free-resources/mock-tests/questions/bulk-template */
export async function fetchMockTestBulkTemplate({ signal } = {}) {
  const response = await axiosInstance.get(`${BASE}/mock-tests/questions/bulk-template`, {
    responseType: 'blob',
    signal,
  })
  return response
}

/** POST /api/free-resources/mock-tests/{mockTestId}/questions/upload */
export async function uploadMockTestQuestions(mockTestId, file, { replace = false, onUploadProgress, signal } = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('replace', String(replace))
  const { data } = await axiosInstance.post(
    `${BASE}/mock-tests/${mockTestId}/questions/upload`,
    formData,
    {
      onUploadProgress,
      signal,
    },
  )
  return data
}

/** GET /api/free-resources/mock-tests/{mockTestId}/questions */
export async function fetchMockTestQuestions(mockTestId, { signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/mock-tests/${mockTestId}/questions`, { signal })
  return data
}

/** POST /api/free-resources/mock-tests/{mockTestId}/questions */
export async function createMockTestQuestion(mockTestId, payload, { signal } = {}) {
  const { data } = await axiosInstance.post(`${BASE}/mock-tests/${mockTestId}/questions`, payload, {
    signal,
  })
  return data
}

/** PUT /api/free-resources/mock-tests/{mockTestId}/questions/{questionId} */
export async function updateMockTestQuestion(mockTestId, questionId, payload, { signal } = {}) {
  const { data } = await axiosInstance.put(
    `${BASE}/mock-tests/${mockTestId}/questions/${questionId}`,
    payload,
    { signal },
  )
  return data
}

/** POST /api/free-resources/mock-tests/{mockTestId}/questions/{questionId}/duplicate */
export async function duplicateMockTestQuestion(mockTestId, questionId, { signal } = {}) {
  const { data } = await axiosInstance.post(
    `${BASE}/mock-tests/${mockTestId}/questions/${questionId}/duplicate`,
    {},
    { signal },
  )
  return data
}

/** DELETE /api/free-resources/mock-tests/{mockTestId}/questions/{questionId} */
export async function deleteMockTestQuestion(mockTestId, questionId, { signal } = {}) {
  const { data } = await axiosInstance.delete(
    `${BASE}/mock-tests/${mockTestId}/questions/${questionId}`,
    { signal },
  )
  return data
}

/** GET /api/free-resources/dropdowns/study-material-categories — returns null when unavailable */
export async function fetchStudyMaterialCategoriesDropdown({ signal } = {}) {
  try {
    const { data } = await axiosInstance.get(`${BASE}/dropdowns/study-material-categories`, { signal })
    return data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response?.status === 404) return null
    throw error
  }
}

/** POST /api/free-resources/study-materials — create study material (multipart/form-data) */
export async function createStudyMaterial(payload, { signal } = {}) {
  const formData = buildStudyMaterialFormData(payload)
  const { data } = await axiosInstance.post(`${BASE}/study-materials`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** GET /api/free-resources/study-materials */
export async function fetchStudyMaterials(params = {}, { signal } = {}) {
  return fetchFreeResourceList(`${BASE}/study-materials`, params, { signal })
}

/** GET /api/free-resources/study-materials/{resourceId} */
export async function fetchStudyMaterialById(resourceId, { signal } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/study-materials/${resourceId}`, { signal })
  return data
}

/** PUT /api/free-resources/study-materials/{resourceId} */
export async function updateStudyMaterial(resourceId, payload, { signal } = {}) {
  const formData = buildStudyMaterialFormData(payload, { isEdit: true })
  const { data } = await axiosInstance.put(`${BASE}/study-materials/${resourceId}`, formData, {
    ...MULTIPART_REQUEST_OPTIONS,
    signal,
  })
  return data
}

/** DELETE /api/free-resources/study-materials/{resourceId} */
export async function deleteStudyMaterial(resourceId, { signal } = {}) {
  const { data } = await axiosInstance.delete(`${BASE}/study-materials/${resourceId}`, { signal })
  return data
}

/** PATCH /api/free-resources/{resourceId}/status */
export async function updateFreeResourceStatus(resourceId, status, { signal } = {}) {
  const { data } = await axiosInstance.patch(
    `${BASE}/${resourceId}/status`,
    { status: String(status || 'ACTIVE').trim().toUpperCase() },
    { signal },
  )
  return data
}
