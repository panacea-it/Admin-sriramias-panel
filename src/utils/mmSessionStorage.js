const KEYS = {
  facultySubjectId: 'mm_facultySubjectId',
  facultySubjectName: 'mm_facultySubjectName',
  subjectName: 'mm_subjectName',
  topicId: 'mm_topicId',
  topicName: 'mm_topicName',
  testId: 'mm_testId',
  testName: 'mm_testName',
}

export const mmSession = {
  save: (key, value) => sessionStorage.setItem(KEYS[key], value ?? ''),
  get: (key) => sessionStorage.getItem(KEYS[key]) || null,
  remove: (key) => sessionStorage.removeItem(KEYS[key]),
  clearAll: () => Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k)),
}
