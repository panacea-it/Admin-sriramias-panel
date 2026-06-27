export const YOUTUBE_API_SUCCESS_CODE = 10000

export function isYoutubeApiSuccess(response) {
  if (!response || response.success !== true) return false
  if (response.statusCode == null) return true
  return response.statusCode === YOUTUBE_API_SUCCESS_CODE
}

export const isYoutubeMutationSuccess = isYoutubeApiSuccess
export const isYoutubeListSuccess = isYoutubeApiSuccess

function formatDateFields(isoValue) {
  const value = isoValue ? new Date(isoValue) : null
  if (!value || Number.isNaN(value.getTime())) {
    return { time: '—', date: '—', iso: null }
  }

  return {
    iso: value.toISOString(),
    time: value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    date: value.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

export function mapApiStatusToUi(status) {
  if (status === 'ACTIVE') return 'Active'
  if (status === 'INACTIVE') return 'Deactivated'
  return status || 'Active'
}

export function mapUiStatusToApi(status) {
  if (status === 'Active') return 'ACTIVE'
  if (status === 'Deactivated' || status === 'Inactive') return 'INACTIVE'
  return status
}

export function mapApiVideoToRow(video, index = 0) {
  if (!video) return null

  const created = formatDateFields(
    video.createdAt || new Date(Date.now() - index * 86400000).toISOString(),
  )
  const updated = formatDateFields(video.updatedAt || video.createdAt)

  return {
    id: String(video._id || video.id || ''),
    name: video.title || '',
    description: video.description || '',
    url: video.youtubeUrl || '',
    youtubeVideoId: video.youtubeVideoId || '',
    thumbnailUrl: video.thumbnailUrl || '',
    status: mapApiStatusToUi(video.status),
    priority: Number.isFinite(Number(video.priority)) ? Number(video.priority) : 0,
    priorityOrder: video.rank != null && video.rank >= 1 ? Number(video.rank) : null,
    rank: video.rank ?? null,
    priorityExpiryDate: video.priorityExpiryDate || null,
    createdByName: video.createdBy?.name || '—',
    createdByEmail: video.createdBy?.email || '',
    createdAt: created.iso,
    time: created.time,
    date: created.date,
    updatedAt: updated.iso,
    updatedTime: updated.time,
    updatedDate: updated.date,
    updatedByName: video.updatedBy?.name || '—',
    updatedByEmail: video.updatedBy?.email || '',
    isDeleted: Boolean(video.isDeleted),
  }
}

export function mapApiVideosToRows(videos = []) {
  return videos.map((video, index) => mapApiVideoToRow(video, index)).filter(Boolean)
}

export function buildYoutubeCreatePayload(form) {
  const priority = Number.parseInt(String(form.priority ?? '').trim(), 10)

  return {
    title: form.name.trim(),
    description: form.description.trim(),
    youtubeUrl: form.url.trim(),
    status: mapUiStatusToApi(form.status),
    priority,
  }
}

export function buildRankedYoutubeSearchParams(searchTerm) {
  const trimmed = String(searchTerm ?? '').trim()
  if (!trimmed) return null

  const rankValue = Number.parseInt(trimmed, 10)
  if (
    Number.isFinite(rankValue) &&
    rankValue >= 1 &&
    Number.isInteger(rankValue) &&
    String(rankValue) === trimmed
  ) {
    return { rank: rankValue }
  }

  return { title: trimmed }
}

export function buildYoutubeUpdatePayload(form) {
  const payload = buildYoutubeCreatePayload(form)
  delete payload.priority
  payload.priority = Number.parseInt(String(form.priority ?? '').trim(), 10)
  return payload
}

export function formFromApiVideo(video) {
  const row = mapApiVideoToRow(video)
  if (!row) {
    return {
      name: '',
      description: '',
      url: '',
      status: 'Active',
      priority: '',
      priorityExpiryDate: '',
    }
  }

  return {
    name: row.name,
    description: row.description,
    url: row.url,
    status: row.status,
    priority: row.priority > 0 ? String(row.priority) : '',
    priorityExpiryDate: row.priorityExpiryDate || '',
  }
}

export function normalizeYoutubeListResponse(data, { page = 1, limit = 10 } = {}) {
  const items = mapApiVideosToRows(Array.isArray(data?.data) ? data.data : [])
  const total = data?.total ?? data?.count ?? items.length
  const totalPages =
    data?.totalPages != null
      ? data.totalPages
      : total > 0
        ? Math.max(1, Math.ceil(total / limit))
        : 0
  const currentPage = data?.page ?? page

  return {
    items,
    count: data?.count ?? items.length,
    total,
    totalPages,
    page: currentPage,
    limit: data?.limit ?? limit,
    hasNextPage: data?.hasNextPage ?? (totalPages > 0 && currentPage < totalPages),
    hasPrevPage: data?.hasPrevPage ?? currentPage > 1,
  }
}

export function buildYoutubeListParams(filters = {}) {
  const params = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    sortBy: filters.sortBy || 'priority',
    sortOrder: filters.sortOrder || 'asc',
  }

  const search = String(filters.search || filters.title || '').trim()
  if (search) params.title = search

  if (filters.status && filters.status !== 'all') {
    params.status = mapUiStatusToApi(filters.status)
  }

  if (filters.priority != null && filters.priority !== '' && filters.priority !== 'all') {
    params.priority = Number(filters.priority)
  }

  if (filters.createdFrom) params.createdFrom = filters.createdFrom
  if (filters.createdTo) params.createdTo = filters.createdTo

  return params
}
