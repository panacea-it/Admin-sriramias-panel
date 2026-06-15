import axiosInstance from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

export const MASTER_BULK_ERROR = {
  enable: 'Unable to enable selected records. Please try again.',
  disable: 'Unable to disable selected records. Please try again.',
  delete: 'Unable to delete selected records. Please try again.',
}

/**
 * Resource keys accepted by PATCH /api/:resource/bulk-status on the local backend gateway.
 * @type {Record<string, string>}
 */
export const MASTER_BULK_RESOURCES = {
  programs: 'programs',
  categories: 'categories',
  examCategories: 'categories',
  subCategories: 'sub-categories',
  subjects: 'subjects',
  topics: 'topics',
  teachers: 'teachers',
  cities: 'cities',
  classrooms: 'classrooms',
}

function normalizeIds(ids) {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))]
}

/**
 * Bulk status update via local backend gateway (single request with ids array).
 */
export async function bulkUpdateMasterStatus(resource, ids, status) {
  const normalizedIds = normalizeIds(ids)
  if (!normalizedIds.length) {
    return { updated: [] }
  }

  const resourceKey = MASTER_BULK_RESOURCES[resource] || resource

  const response = await axiosInstance.patch(`/api/${resourceKey}/bulk-status`, {
    ids: normalizedIds,
    status,
  })
  return response.data
}

export function getMasterBulkErrorMessage(error, action = 'enable') {
  const fallback =
    MASTER_BULK_ERROR[action] || MASTER_BULK_ERROR.enable
  const message = getApiErrorMessage(error, fallback)
  if (/not allowed by cors/i.test(message)) {
    return fallback
  }
  return message || fallback
}
