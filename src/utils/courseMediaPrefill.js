/** Edit-form prefill helpers for course media URLs (read-only mapping). */

import { BASE_URL } from '../config/api'

function resolveMediaBase() {
  if (BASE_URL) return BASE_URL.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return ''
}

/**
 * Turn API media values (string, object, or relative path) into a browser-ready URL.
 */
export function resolveCourseMediaUrl(media) {
  if (!media) return ''

  let raw = ''
  if (typeof media === 'string') {
    raw = media.trim()
  } else if (typeof media === 'object') {
    raw = String(
      media.url ||
        media.secure_url ||
        media.secureUrl ||
        media.href ||
        media.path ||
        media.src ||
        media.link ||
        media.publicUrl ||
        media.fileUrl ||
        media.file_url ||
        '',
    ).trim()
  }

  if (!raw) return ''

  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw
  if (raw.startsWith('//')) return `https:${raw}`

  const base = resolveMediaBase()
  if (!base) return raw

  if (raw.startsWith('/')) return `${base}${raw}`
  return `${base}/${raw.replace(/^\//, '')}`
}

export function fileNameFromMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''
  try {
    const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || '')
    return name || ''
  } catch {
    return ''
  }
}

export function normalizeCourseMediaList(list) {
  if (!Array.isArray(list)) return []
  return list.map(resolveCourseMediaUrl).filter(Boolean)
}

/**
 * Map stored course demo video fields into Edit Course form state.
 * Supports dedicated demo fields and legacy nested form blobs.
 */
export function mapDemoVideoFromCourse(item) {
  const row = item && typeof item === 'object' ? item : {}
  const fd = row.courseFormData || row.formData || {}
  const raw =
    row.demoVideoUrl ||
    row.demoVideo ||
    row.courseDemoVideo ||
    row.introVideo ||
    row.videoUrl ||
    row.previewVideo ||
    fd.demoVideoUrl ||
    fd.demoVideo ||
    fd.introVideo ||
    fd.videoUrl ||
    ''

  const videoUrl = resolveCourseMediaUrl(raw)
  const fileName =
    row.demoVideoFileName ||
    fd.demoVideoFileName ||
    fileNameFromMediaUrl(videoUrl)

  return {
    demoVideoUrl: videoUrl,
    demoVideoFileName: fileName,
    demoVideoFileSize: row.demoVideoFileSize ?? fd.demoVideoFileSize ?? null,
    demoVideo: videoUrl || null,
  }
}

export function mediaSlotFromUrl(url, fallbackName = '') {
  const preview = resolveCourseMediaUrl(url)
  if (!preview) {
    return { fileName: '', preview: '', file: null }
  }
  return {
    fileName: fallbackName || fileNameFromMediaUrl(preview) || 'uploaded-file',
    preview,
    file: null,
  }
}

/** Normalize a form media slot so preview URLs are browser-ready. */
export function resolveUiMediaSlot(slot = {}) {
  if (!slot || typeof slot !== 'object') {
    return { fileName: '', preview: '', file: null }
  }
  const preview = resolveCourseMediaUrl(slot.preview || slot.existingUrl)
  return {
    ...slot,
    preview,
    existingUrl: slot.existingUrl || preview || '',
    fileName: slot.fileName || (preview ? fileNameFromMediaUrl(preview) : ''),
    file: slot.file || null,
  }
}
