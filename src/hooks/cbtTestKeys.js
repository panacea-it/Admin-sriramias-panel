export const cbtTestKeys = {
  all: ['cbt-tests'],
  lists: () => [...cbtTestKeys.all, 'list'],
  list: (filters) => [...cbtTestKeys.lists(), filters],
  details: () => [...cbtTestKeys.all, 'detail'],
  detail: (id) => [...cbtTestKeys.details(), id],
  createForm: (facultySubjectId) => [...cbtTestKeys.all, 'create-form', facultySubjectId ?? ''],
  dashboardSummary: (filters) => [...cbtTestKeys.all, 'dashboard-summary', filters],
  dropdowns: {
    facultySubjects: (search) => [...cbtTestKeys.all, 'dropdown', 'faculty-subjects', search],
    folders: (facultySubjectId) => [...cbtTestKeys.all, 'dropdown', 'folders', facultySubjectId],
    batches: (facultySubjectId) => [...cbtTestKeys.all, 'dropdown', 'batches', facultySubjectId],
    languages: () => [...cbtTestKeys.all, 'dropdown', 'languages'],
    examPatterns: () => [...cbtTestKeys.all, 'dropdown', 'exam-patterns'],
  },
}
