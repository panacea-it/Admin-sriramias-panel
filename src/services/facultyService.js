import api from './api'

const TEACHERS_BASE = '/api/teachers'

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

export const facultyService = {
  /** GET /api/teachers — paginated list */
  getFacultyList: async (params) => {
    const { data } = await api.get(TEACHERS_BASE, { params: stripEmptyParams(params) })
    return data
  },

  /** GET /api/teachers/:id */
  getFacultyById: async (id) => {
    const { data } = await api.get(`${TEACHERS_BASE}/${id}`)
    return data
  },

  /** GET /api/teachers/dropdown */
  getFacultyDropdown: async (params) => {
    const { data } = await api.get(`${TEACHERS_BASE}/dropdown`, {
      params: stripEmptyParams(params),
    })
    return data
  },

  /** POST /api/teachers */
  createFaculty: async (payload) => {
    const { data } = await api.post(TEACHERS_BASE, payload)
    return data
  },

  /** PUT /api/teachers/:id */
  updateFaculty: async (id, payload) => {
    const { data } = await api.put(`${TEACHERS_BASE}/${id}`, payload)
    return data
  },

  /** PATCH /api/teachers/status/:id */
  updateFacultyStatus: async (id, status) => {
    const { data } = await api.patch(`${TEACHERS_BASE}/status/${id}`, { status })
    return data
  },

  /** DELETE /api/teachers/:id — soft delete */
  deleteFaculty: async (id) => {
    const { data } = await api.delete(`${TEACHERS_BASE}/${id}`)
    return data
  },
}

export default facultyService
