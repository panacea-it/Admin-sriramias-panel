import api from '../config/api'
import { throwApiError } from '../utils/apiError'

async function request(promise) {
  try {
    const response = await promise
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** @typedef {import('../utils/adminManagementHelpers').AdminListParams} AdminListParams */
/** @typedef {import('../utils/adminManagementHelpers').CreateAdminPayload} CreateAdminPayload */
/** @typedef {import('../utils/adminManagementHelpers').UpdateAdminPayload} UpdateAdminPayload */

export const adminManagementService = {
  /** GET /api/admin/admin-access */
  getAdmins: (params = {}) =>
    request(api.get('/api/admin/admin-access', { params })),

  /** GET /api/admin/admin-access/:id */
  getAdminById: (id) =>
    request(api.get(`/api/admin/admin-access/${id}`)),

  /** POST /api/admin/admin-access */
  createAdmin: (payload) =>
    request(api.post('/api/admin/admin-access', payload)),

  /** PUT /api/admin/admin-access/:id */
  updateAdmin: (id, payload) =>
    request(api.put(`/api/admin/admin-access/${id}`, payload)),

  /** PATCH /api/admin/admin-access/:id/status */
  updateAdminStatus: (id, status) =>
    request(api.patch(`/api/admin/admin-access/${id}/status`, { status: Boolean(status) })),

  /** DELETE /api/admin/admin-access/:id */
  deleteAdmin: (id) =>
    request(api.delete(`/api/admin/admin-access/${id}`)),

  /** GET /api/admin/roles/dropdown */
  getRolesDropdown: () =>
    request(api.get('/api/admin/roles/dropdown')),

  /** GET /api/centers/dropdown */
  getCentersDropdown: () =>
    request(api.get('/api/centers/dropdown')),

  /** GET /api/admin/admin-access/mentors/dropdown */
  getMentorAdminsDropdown: (params = {}) =>
    request(api.get('/api/admin/admin-access/mentors/dropdown', { params })),

  /** GET /api/admin/permissions/my-access */
  getMyPermissions: () =>
    request(api.get('/api/admin/permissions/my-access')),

  /** GET /api/admin/permissions/role/:roleId */
  getPermissionsByRole: (roleId) =>
    request(api.get(`/api/admin/permissions/role/${roleId}`)),
}

export default adminManagementService
