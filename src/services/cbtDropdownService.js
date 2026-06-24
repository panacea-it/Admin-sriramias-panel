import api from './api'

export const cbtDropdownService = {
  facultySubjects: (search = '') =>
    api
      .post('/api/faculty-subjects/dropdown', { category: 'PRELIMS_TEST', search })
      .then((r) => r.data),

  folders: (facultySubjectId, search = '') =>
    api
      .post('/api/folders/list', {
        facultySubjectId,
        category: 'PRELIMS_TEST',
        search,
      })
      .then((r) => r.data),

  batches: (facultySubjectId) =>
    api.post('/api/batches/dropdown', { facultySubjectId }).then((r) => r.data),

  languages: () =>
    api.post('/api/test-configuration/languages/dropdown', {}).then((r) => r.data),

  examPatterns: () =>
    api.post('/api/test-configuration/exam-patterns/dropdown', {}).then((r) => r.data),
}

export default cbtDropdownService
