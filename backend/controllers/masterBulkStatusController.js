import { forwardRemoteRequest } from '../utils/remoteApi.js'

const STATUS_PATH_BY_RESOURCE = {
  programs: (id) => `/api/programs/status/${id}`,
  categories: (id) => `/api/categories/status/${id}`,
  'sub-categories': (id) => `/api/sub-categories/status/${id}`,
  subjects: (id) => `/api/subjects/status/${id}`,
  topics: (id) => `/api/topics/status/${id}`,
  teachers: (id) => `/api/teachers/status/${id}`,
  cities: (id) => `/api/cities/status/${id}`,
  classrooms: (id) => `/api/classrooms/status/${id}`,
}

function normalizeIds(ids) {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))]
}

export async function bulkUpdateMasterStatus(req, res, next) {
  try {
    const resource = String(req.params.resource || '').trim()
    const pathBuilder = STATUS_PATH_BY_RESOURCE[resource]
    const { ids, status } = req.body || {}

    if (!pathBuilder) {
      return res.status(400).json({
        success: false,
        message: `Unsupported resource "${resource}" for bulk status update`,
      })
    }

    const normalizedIds = normalizeIds(ids)
    if (!normalizedIds.length) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required and must contain at least one id',
      })
    }

    if (status == null || String(status).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      })
    }

    const authHeader = req.headers.authorization
    const statusValue = status
    const failures = []

    for (const id of normalizedIds) {
      const { status: httpStatus, data } = await forwardRemoteRequest(
        'PATCH',
        pathBuilder(id),
        { body: { status: statusValue }, authHeader },
      )

      if (httpStatus < 200 || httpStatus >= 300) {
        failures.push({
          id,
          status: httpStatus,
          message:
            data?.message ||
            data?.error ||
            `Failed to update status for record ${id}`,
        })
      }
    }

    if (failures.length) {
      return res.status(502).json({
        success: false,
        message: 'Unable to enable selected records. Please try again.',
        failures,
      })
    }

    return res.json({
      success: true,
      message: 'Selected records updated successfully',
      updated: normalizedIds.length,
      ids: normalizedIds,
    })
  } catch (error) {
    next(error)
  }
}
