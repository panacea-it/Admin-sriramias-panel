/** Edit-form prefill helpers for course media URLs (read-only mapping). */

export function resolveCourseMediaUrl(media) {
  if (!media) return ''
  if (typeof media === 'string') return media.trim()
  if (typeof media === 'object') {
    return String(media.url || media.secure_url || media.href || '').trim()
  }
  return ''
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
    row.previewVideo ||
    fd.demoVideoUrl ||
    fd.demoVideo ||
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
