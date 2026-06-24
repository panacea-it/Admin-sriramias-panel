import api from './api'

const BASE = '/api/prelims-tests'
const CBT_MGMT = '/api/cbt-management'

/** @typedef {import('../utils/cbtTestFormHelpers').PrelimsTestListFilters} PrelimsTestListFilters */

export const cbtTestService = {
  getCreateForm: (body = {}) =>
    api.post(`${BASE}/create-form`, body).then((r) => r.data),

  getDashboardSummary: (body = {}) =>
    api.post(`${BASE}/dashboard-summary`, body).then((r) => r.data),

  createTest: (formData) =>
    api.post(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  updateTest: (id, payload) =>
    api.put(`${BASE}/${id}`, payload).then((r) => r.data),

  deleteTest: (id) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),

  getTestById: (id) =>
    api.post(`${BASE}/view`, { id }).then((r) => r.data),

  getTests: (filters = {}) =>
    api.post(`${BASE}/list`, filters).then((r) => r.data),

  publishTest: (id, publishStatus) =>
    api.patch(`${BASE}/${id}/publish-status`, { publishStatus }).then((r) => r.data),

  scheduleTest: (id, schedule) =>
    api.put(`${BASE}/${id}`, schedule).then((r) => r.data),

  duplicateTest: (id, testName) =>
    api.post(`${BASE}/${id}/duplicate`, testName ? { testName } : {}).then((r) => r.data),

  uploadQuestions: (formData) =>
    api.post(`${BASE}/questions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  reuploadQuestions: (formData) =>
    api.post(`${BASE}/questions/reupload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  listQuestions: (body) =>
    api.post(`${BASE}/questions/list`, body).then((r) => r.data),

  getCbtDashboard: (progressLimit = 5) =>
    api.post(`${CBT_MGMT}/dashboard`, { progressLimit }).then((r) => r.data),

  listCbtFacultySubjects: (body = {}) =>
    api.post(`${CBT_MGMT}/list`, body).then((r) => r.data),

  listCbtTopics: (facultySubjectId, params = {}) =>
    api.post(`${CBT_MGMT}/topics`, { facultySubjectId, ...params }).then((r) => r.data),

  listCbtTests: (topicId, params = {}) =>
    api.post(`${CBT_MGMT}/tests`, { topicId, ...params }).then((r) => r.data),

  getCbtResults: (testId, params = {}) =>
    api.post(`${CBT_MGMT}/results`, { testId, ...params }).then((r) => r.data),

  getCbtResultsAnalytics: (testId, params = {}) =>
    api.post(`${CBT_MGMT}/results/analytics`, { testId, ...params }).then((r) => r.data),

  exportCbtResultsCsv: (testId, filters = {}) =>
    api.post(`${CBT_MGMT}/results/export-csv`, { testId, filters }, { responseType: 'blob' }),

  exportCbtResultsPdf: (testId, filters = {}) =>
    api.post(`${CBT_MGMT}/results/export-pdf`, { testId, filters }, { responseType: 'blob' }),
}

export default cbtTestService
