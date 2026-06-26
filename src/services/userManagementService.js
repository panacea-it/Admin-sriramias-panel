/**
 * User management API — delegates to centralized userService.
 * @deprecated Prefer userService and userHelpers for new code.
 */
import userService from './userService'
import {
  mapApiUserListRow,
  normalizeUserDetailResponse,
  normalizeUserListResponse,
} from '../utils/userHelpers'

export {
  mapApiUserListRow,
  normalizeUserListResponse,
  normalizeUserDetailResponse,
}

export async function getUserById(userId, type) {
  return userService.getUserById(userId, type)
}

export async function createStudentUser(payload = {}) {
  return userService.createUser(payload)
}

export async function updateUser(userId, payload = {}, type = 'USER') {
  return userService.updateUser(userId, payload, type)
}

export async function updateUserStatus(userId, status = true, type) {
  return userService.updateUserStatus(userId, status, type)
}

export async function deleteUser(userId, type) {
  return userService.deleteUser(userId, type)
}

export async function getUnifiedUsers(params = {}) {
  return userService.getUsers(params)
}

/** @deprecated Use normalizeUserListResponse */
export function normalizeUnifiedUsersResponse(data, options) {
  return normalizeUserListResponse(data, options)
}
