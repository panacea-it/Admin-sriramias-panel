import api from '../config/api'
import { throwApiError } from '../utils/apiError'

const BASE = '/api/admin/users'

async function request(promise) {
  try {
    const response = await promise
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

const userService = {
  getModuleConfig: () => request(api.get(`${BASE}/module-config`)),

  getUsers: (params) => request(api.get(BASE, { params })),

  getUsersPost: (body) => request(api.post(`${BASE}/list`, body)),

  getUserById: (id, type) =>
    request(
      api.get(`${BASE}/${encodeURIComponent(id)}`, {
        params: type ? { type } : undefined,
      }),
    ),

  getUserDetailPost: (id, type) => request(api.post(`${BASE}/detail`, { id, type })),

  createUser: (payload) => request(api.post(BASE, payload)),

  updateUser: (id, payload, type) =>
    request(
      api.put(`${BASE}/${encodeURIComponent(id)}`, payload, {
        params: type ? { type } : undefined,
      }),
    ),

  deleteUser: (id, type) =>
    request(
      api.delete(`${BASE}/${encodeURIComponent(id)}`, {
        params: type ? { type } : undefined,
      }),
    ),

  updateUserStatus: (id, status, type) =>
    request(
      api.patch(
        `${BASE}/${encodeURIComponent(id)}/status`,
        { status: Boolean(status) },
        { params: type ? { type } : undefined },
      ),
    ),

  getUpdateFields: (type = 'USER') =>
    request(api.get(`${BASE}/update-fields`, { params: { type } })),

  getRoleDropdown: () => request(api.get('/api/admin/user-roles')),

  getCenterDropdown: () => request(api.get('/api/admin/user-centers')),

  getCreateRoleDropdown: () => request(api.get('/api/admin/user-create-roles')),

  getCenterFormDropdown: () => request(api.get('/api/admin/centers/dropdown')),

  updateAdminStatus: (adminId, status) =>
    request(
      api.patch(`/api/admin/admin-access/${encodeURIComponent(adminId)}/status`, {
        status: Boolean(status),
      }),
    ),
}

export default userService

export const {
  getModuleConfig,
  getUsers,
  getUsersPost,
  getUserById,
  getUserDetailPost,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUpdateFields,
  getRoleDropdown,
  getCenterDropdown,
  getCreateRoleDropdown,
  getCenterFormDropdown,
  updateAdminStatus,
} = userService
