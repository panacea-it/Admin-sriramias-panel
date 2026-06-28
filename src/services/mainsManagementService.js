import axiosInstance from './axiosInstance'

const BASE = '/api/mains-management'

export async function getMainsDashboard(progressLimit = 5, config = {}) {
  const { data } = await axiosInstance.get(`${BASE}/dashboard`, {
    params: { progressLimit },
    ...config,
  })
  return data
}

export async function getMainsFacultySubjects(params = {}, config = {}) {
  const { data } = await axiosInstance.get(`${BASE}/faculty-subjects`, {
    params,
    ...config,
  })
  return data
}

export async function getMainsFacultySubjectDetails(facultySubjectId, config = {}) {
  const { data } = await axiosInstance.get(`${BASE}/faculty-subjects/${facultySubjectId}`, config)
  return data
}

export async function getMainsTopicTests(topicId, params = {}, config = {}) {
  const { data } = await axiosInstance.get(`${BASE}/topics/${topicId}/tests`, {
    params,
    ...config,
  })
  return data
}

export async function getMainsTestResults(testId, params = {}, config = {}) {
  const { data } = await axiosInstance.get(`${BASE}/tests/${testId}/results`, {
    params,
    ...config,
  })
  return data
}

export const mainsManagementService = {
  getDashboard: getMainsDashboard,
  getFacultySubjects: getMainsFacultySubjects,
  getFacultySubjectDetails: getMainsFacultySubjectDetails,
  getTopicTests: getMainsTopicTests,
  getTestResults: getMainsTestResults,
}
