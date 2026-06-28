import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

export {
  clearFacultySubjectDetailCache,
  getFacultySubjects,
  getFacultySubject as getFacultySubjectById,
  createFacultySubject,
  updateFacultySubject,
  changeFacultySubjectStatus as updateFacultySubjectStatus,
  deleteFacultySubject,
  getFacultySubjectCategories,
  getFacultySubjectCreateForm,
  getFacultySubjectsDropdown,
  getFacultySubjectSummary,
  getFacultySubjectContentTree,
  listFacultySubjectContentCategories as postFacultySubjectCategoryContent,
  createFacultySubjectContentFolder as createContentFolder,
  updateFacultySubjectContentFolder,
} from '../services/facultySubjectService'

export async function getSubjectsDropdown({ signal } = {}) {
  try {
    const response = await axiosInstance.get('/subjects/dropdown', { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}
