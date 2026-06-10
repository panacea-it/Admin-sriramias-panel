import {
  BANNER_CATEGORIES,
  BANNER_CENTERS,
  BANNER_STATUSES,
  getBannerImageSrc,
  loadBanners,
  nextBannerId,
  saveBanners,
} from '../data/bannersData'

const DELAY = 160

function delay(ms = DELAY) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalizeStatus(status) {
  return status === 'Active' ? 'Active' : 'In Active'
}

function validatePayload(payload, list, { excludeId } = {}) {
  const errors = {}
  const course = payload.course?.trim()
  if (!course) errors.course = 'Course is required'
  if (!BANNER_CATEGORIES.includes(payload.category)) {
    errors.category = 'Select a valid category'
  }
  if (!BANNER_CENTERS.includes(payload.center)) {
    errors.center = 'Select a valid center'
  }
  if (!BANNER_STATUSES.includes(normalizeStatus(payload.status))) {
    errors.status = 'Select a valid status'
  }
  const duplicate = list.find(
    (b) =>
      b.course === course &&
      b.center === payload.center &&
      b.id !== excludeId,
  )
  if (duplicate) {
    errors.course = 'A banner already exists for this course at the selected center'
  }
  return errors
}

function rowFromPayload(payload, existing) {
  const cleared = Boolean(payload.clearImage)
  const imageUrl = cleared ? '' : payload.imageUrl ?? ''
  const hasThumbnail = cleared ? false : Boolean(imageUrl) || Boolean(existing?.hasThumbnail)
  return {
    id: existing?.id ?? nextBannerId(loadBanners()),
    course: payload.course.trim(),
    category: payload.category,
    center: payload.center,
    status: normalizeStatus(payload.status),
    imageUrl,
    imageFileName: cleared ? '' : payload.imageFileName ?? '',
    hasThumbnail,
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchBanners({ signal } = {}) {
  await delay()
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return loadBanners()
}

export async function updateBanner(payload, { id } = {}) {
  const list = loadBanners()
  const errors = validatePayload(payload, list, { excludeId: id })
  if (Object.keys(errors).length) {
    const err = new Error(Object.values(errors)[0])
    err.validation = errors
    throw err
  }

  await delay()
  const existing = list.find((b) => b.id === id)
  if (!existing) {
    const err = new Error('Banner not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  const updated = rowFromPayload(payload, existing)
  const next = list.map((b) => (b.id === id ? updated : b))
  saveBanners(next)
  return updated
}

export async function deleteBanner(id) {
  await delay()
  const list = loadBanners()
  const exists = list.some((b) => b.id === id)
  if (!exists) {
    const err = new Error('Banner not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  const next = list.filter((b) => b.id !== id)
  saveBanners(next)
}

export async function toggleBannerStatus(id) {
  const list = loadBanners()
  const row = list.find((b) => b.id === id)
  if (!row) {
    const err = new Error('Banner not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  const nextStatus = row.status === 'Active' ? 'In Active' : 'Active'
  return updateBanner(
    {
      course: row.course,
      category: row.category,
      center: row.center,
      status: nextStatus,
      imageUrl: row.imageUrl,
      imageFileName: row.imageFileName,
    },
    { id },
  )
}

export { getBannerImageSrc }
