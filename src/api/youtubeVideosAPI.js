import api from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildYoutubeCreatePayload,
  buildYoutubeListParams,
  buildYoutubeUpdatePayload,
  isYoutubeListSuccess,
  isYoutubeApiSuccess,
  mapApiVideosToRows,
  mapApiVideoToRow,
  normalizeYoutubeListResponse,
} from '../utils/youtubeApiHelpers'

function unwrapMutation(response) {
  return response?.data ?? response
}

function toError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

export async function fetchYoutubeVideosPage(params = {}) {
  try {
    const response = await api.get('/youtube/videos', {
      params: buildYoutubeListParams(params),
    })
    const body = response?.data ?? {}

    if (!isYoutubeListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch YouTube videos. Please try again.')
    }

    return normalizeYoutubeListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 10,
    })
  } catch (error) {
    throw toError(error, 'Unable to fetch YouTube videos. Please try again.')
  }
}

export async function fetchYoutubeVideos(filters = {}) {
  try {
    const result = await fetchYoutubeVideosPage({
      ...filters,
      page: filters.page || 1,
      limit: filters.limit || 100,
    })
    return result.items
  } catch (error) {
    throw toError(error, 'Failed to fetch YouTube videos')
  }
}

export async function fetchYoutubeVideoById(id) {
  try {
    const response = await api.get(`/youtube/videos/${encodeURIComponent(id)}`)
    const body = response?.data ?? {}

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch YouTube video details. Please try again.')
    }

    const row = mapApiVideoToRow(body.data)
    if (!row) {
      throw new Error('Unable to fetch YouTube video details. Please try again.')
    }

    return row
  } catch (error) {
    throw toError(error, 'Unable to fetch YouTube video details. Please try again.')
  }
}

export async function createYoutubeVideo(form) {
  try {
    const payload = buildYoutubeCreatePayload(form)
    const desiredStatus = payload.status
    delete payload.status

    const response = await api.post('/youtube/videos', payload)
    const body = unwrapMutation(response)
    const createdId = body?.data?._id

    if (createdId && desiredStatus && desiredStatus !== 'ACTIVE') {
      await api.put(`/youtube/videos/${encodeURIComponent(createdId)}`, {
        status: desiredStatus,
      })
    }

    return body
  } catch (error) {
    throw toError(error, 'Failed to create YouTube video')
  }
}

export async function updateYoutubeVideo(id, formOrPayload) {
  try {
    const payload =
      formOrPayload?.title != null || formOrPayload?.youtubeUrl != null
        ? formOrPayload
        : buildYoutubeUpdatePayload(formOrPayload)

    const response = await api.put(`/youtube/videos/${encodeURIComponent(id)}`, payload)
    const body = unwrapMutation(response)

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update the YouTube video. Please try again.')
    }

    return {
      ...body,
      video: mapApiVideoToRow(body.data),
    }
  } catch (error) {
    throw toError(error, 'Unable to update the YouTube video. Please try again.')
  }
}

export async function deleteYoutubeVideo(id) {
  try {
    const response = await api.delete(`/youtube/videos/${encodeURIComponent(id)}`)
    const body = unwrapMutation(response)

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to delete YouTube video. Please try again.')
    }

    return body
  } catch (error) {
    throw toError(error, 'Unable to delete YouTube video. Please try again.')
  }
}

export async function fetchRankedYoutubeVideos(params = {}) {
  try {
    const response = await api.get('/youtube/rankings', { params })
    const body = response?.data ?? {}

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch ranked YouTube videos. Please try again.')
    }

    const items = mapApiVideosToRows(Array.isArray(body?.data) ? body.data : [])

    return {
      ...body,
      items,
      count: body.count ?? items.length,
    }
  } catch (error) {
    throw toError(error, 'Unable to fetch ranked YouTube videos. Please try again.')
  }
}

export async function searchRankedYoutubeVideos(params = {}) {
  try {
    const response = await api.get('/youtube/rankings/search', { params })
    const body = response?.data ?? {}

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to search ranked YouTube videos. Please try again.')
    }

    const items = mapApiVideosToRows(Array.isArray(body?.data) ? body.data : [])

    return {
      ...body,
      items,
      count: body.count ?? items.length,
    }
  } catch (error) {
    throw toError(error, 'Unable to search ranked YouTube videos. Please try again.')
  }
}

export async function assignYoutubeRank(videoId, rank) {
  try {
    const response = await api.put(`/youtube/videos/${encodeURIComponent(videoId)}/rank`, {
      rank: Number(rank),
    })
    const body = unwrapMutation(response)

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to assign video rank. Please try again.')
    }

    return {
      ...body,
      video: mapApiVideoToRow(body.data),
    }
  } catch (error) {
    throw toError(error, 'Unable to assign video rank. Please try again.')
  }
}

export async function updateYoutubeVideoPriority(videoId, priority) {
  try {
    const response = await api.put(`/youtube/videos/${encodeURIComponent(videoId)}/priority`, {
      priority: Number(priority),
    })
    const body = unwrapMutation(response)

    if (!isYoutubeApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update video priority. Please try again.')
    }

    return {
      ...body,
      video: mapApiVideoToRow(body.data),
    }
  } catch (error) {
    throw toError(error, 'Unable to update video priority. Please try again.')
  }
}

export async function removeYoutubeRank(videoId) {
  try {
    const response = await api.put(`/youtube/videos/${encodeURIComponent(videoId)}/priority`, {
      priority: 0,
    })
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to remove video priority')
  }
}

export async function reorderYoutubeRanks(orderedIds) {
  try {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await assignYoutubeRank(orderedIds[index], index + 1)
    }
    return fetchRankedYoutubeVideos()
  } catch (error) {
    throw toError(error, 'Failed to reorder video ranks')
  }
}

export async function recalculateYoutubeRanks() {
  try {
    const response = await api.post('/youtube/rankings/recalculate')
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to recalculate video ranks')
  }
}

export const assignYoutubePriority = assignYoutubeRank
export const removeYoutubePriority = removeYoutubeRank
export const swapYoutubePriority = assignYoutubeRank

export async function reorderYoutubeVideos() {
  return fetchYoutubeVideos()
}

export async function fetchPinnedYoutubeVideos() {
  const result = await fetchRankedYoutubeVideos()
  return (result.items ?? []).filter((video) => video.priorityOrder === 1)
}
