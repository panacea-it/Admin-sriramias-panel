import { isFrontendOnly } from '../config/appMode'
import { mapCourseFromApi } from '../utils/coursesApiMappers'
import {
  findBatchById,
  loadBatchesStore,
  saveBatchesStore,
} from '../utils/batchesApiStorage'

const DELAY_MS = 150

function delay(ms = DELAY_MS) {
  return new Promise((r) => setTimeout(r, ms))
}

function unwrapList(rows) {
  return (rows || []).map(mapCourseFromApi).filter(Boolean)
}

function filterRows(rows, params = {}) {
  const q = params.search?.trim().toLowerCase()
  return rows.filter((row) => {
    const matchSearch =
      !q ||
      String(row.batchName || row.name || '')
        .toLowerCase()
        .includes(q) ||
      String(row.batchId || '')
        .toLowerCase()
        .includes(q) ||
      String(row.courseId || '')
        .toLowerCase()
        .includes(q)
    const matchStatus =
      !params.status || params.status === 'all' || row.status === params.status
    const matchCategory =
      !params.category || params.category === 'all' || row.category === params.category
    return matchSearch && matchStatus && matchCategory
  })
}

async function fetchCoursesLocal(params = {}) {
  await delay()
  const rows = filterRows(loadBatchesStore(), params)
  return unwrapList(rows)
}

async function fetchCourseByIdLocal(id) {
  await delay()
  return mapCourseFromApi(findBatchById(id))
}

async function createCourseLocal(payload) {
  await delay()
  const list = loadBatchesStore()
  const id = `batch-${Date.now()}`
  const now = new Date().toISOString()
  const row = {
    ...mapCourseFromApi({
      ...payload,
      _id: id,
      id,
      createdAt: now,
      modifiedAt: now,
    }),
    id,
    createdAt: now,
    modifiedAt: now,
  }
  saveBatchesStore([row, ...list])
  return row
}

async function updateCourseLocal(id, payload) {
  await delay()
  const list = loadBatchesStore()
  const now = new Date().toISOString()
  const next = list.map((row) => {
    if (String(row.id) !== String(id)) return row
    const updated = {
      ...row,
      ...mapCourseFromApi({ ...row, ...payload, _id: id, modifiedAt: now }),
      modifiedAt: now,
    }
    return updated
  })
  saveBatchesStore(next)
  return mapCourseFromApi(findBatchById(id))
}

async function deleteCourseLocal(id) {
  await delay()
  saveBatchesStore(loadBatchesStore().filter((r) => String(r.id) !== String(id)))
}

export async function fetchCourses(params = {}) {
  if (isFrontendOnly) return fetchCoursesLocal(params)
  try {
    const { default: api } = await import('./axiosInstance')
    const query = {}
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.category && params.category !== 'all') query.category = params.category
    if (params.status && params.status !== 'all') query.status = params.status
    const response = await api.get('/courses', { params: query, skipAuthRedirect: true })
    const body = response.data
    const list = Array.isArray(body) ? body : body?.data ?? []
    return list.map(mapCourseFromApi).filter(Boolean)
  } catch {
    return fetchCoursesLocal(params)
  }
}

export async function fetchCourseById(id) {
  if (isFrontendOnly) return fetchCourseByIdLocal(id)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.get(`/courses/${id}`, { skipAuthRedirect: true })
    const body = response.data
    const doc = body?.data ?? body
    return mapCourseFromApi(doc)
  } catch {
    return fetchCourseByIdLocal(id)
  }
}

export async function createCourse(payload) {
  if (isFrontendOnly) return createCourseLocal(payload)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.post('/courses', payload, { skipAuthRedirect: true })
    const body = response.data
    return mapCourseFromApi(body?.data ?? body)
  } catch {
    return createCourseLocal(payload)
  }
}

export async function updateCourse(id, payload) {
  if (isFrontendOnly) return updateCourseLocal(id, payload)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.put(`/courses/${id}`, payload, { skipAuthRedirect: true })
    const body = response.data
    return mapCourseFromApi(body?.data ?? body)
  } catch {
    return updateCourseLocal(id, payload)
  }
}

export async function deleteCourse(id) {
  if (isFrontendOnly) return deleteCourseLocal(id)
  try {
    const { default: api } = await import('./axiosInstance')
    await api.delete(`/courses/${id}`, { skipAuthRedirect: true })
  } catch {
    await deleteCourseLocal(id)
  }
}
