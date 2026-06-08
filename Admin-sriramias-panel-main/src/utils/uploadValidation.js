import { UPLOAD_PROFILES } from '../constants/uploadConstraints'

export function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export function formatBytesLabel(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 0 : 1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

export function resolveUploadProfile(profileOrKey) {
  if (!profileOrKey) return UPLOAD_PROFILES.IMAGE_STANDARD
  if (typeof profileOrKey === 'string') {
    return UPLOAD_PROFILES[profileOrKey] || UPLOAD_PROFILES.IMAGE_STANDARD
  }
  return profileOrKey
}

export function inferUploadProfileFromAccept(accept = '') {
  const a = String(accept).toLowerCase()
  if (a.includes('video')) return UPLOAD_PROFILES.VIDEO_STANDARD
  if (a.includes('audio')) return UPLOAD_PROFILES.AUDIO_STANDARD
  if (a.includes('.csv') && !a.includes('xlsx')) return UPLOAD_PROFILES.CSV_METADATA
  if (a.includes('xlsx') || a.includes('spreadsheet')) return UPLOAD_PROFILES.EXCEL_BULK
  if (a.includes('pdf') && (a.includes('epub') || a.includes('.doc'))) {
    return UPLOAD_PROFILES.DOCUMENT_BOOK
  }
  if (a.includes('pdf')) return UPLOAD_PROFILES.PDF_STANDARD
  if (a.includes('svg')) return UPLOAD_PROFILES.IMAGE_ICON
  return UPLOAD_PROFILES.IMAGE_STANDARD
}

function fileMatchesProfile(file, profile) {
  const ext = getFileExtension(file.name)
  if (profile.extensions?.length && profile.extensions.includes(ext)) return true
  if (profile.mimeTypes?.length && profile.mimeTypes.includes(file.type)) return true
  if (profile.accept?.includes('image/*') && file.type.startsWith('image/')) return true
  if (profile.accept?.includes('video/*') && file.type.startsWith('video/')) return true
  return false
}

export function formatUploadHint(profileOrKey) {
  const profile = resolveUploadProfile(profileOrKey)
  const parts = []
  if (profile.labelFormats?.length) {
    parts.push(`Allowed: ${profile.labelFormats.join(', ')}`)
  }
  if (profile.maxBytes) {
    parts.push(`Max Size: ${formatBytesLabel(profile.maxBytes)}`)
  }
  if (profile.recommendedDimensions) {
    const { width, height } = profile.recommendedDimensions
    parts.push(`Recommended: ${width}×${height} px`)
  }
  if (profile.limitations) {
    parts.push(profile.limitations)
  }
  return parts.join(' | ')
}

export function loadImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions'))
    }
    img.src = url
  })
}

/**
 * @param {File} file
 * @param {string|object} profileOrKey
 * @param {{ checkDimensions?: boolean }} [options]
 * @returns {Promise<{ valid: boolean, message?: string }>}
 */
export async function validateUploadFile(file, profileOrKey, options = {}) {
  const { checkDimensions = true } = options
  if (!file) return { valid: false, message: 'Choose a file to upload' }

  const profile = resolveUploadProfile(profileOrKey)

  if (profile.maxBytes && file.size > profile.maxBytes) {
    return {
      valid: false,
      message: `File size exceeds ${formatBytesLabel(profile.maxBytes)}`,
    }
  }

  if (profile.extensions?.length || profile.mimeTypes?.length) {
    if (!fileMatchesProfile(file, profile)) {
      const formats = profile.labelFormats?.join(', ') || 'selected formats'
      return { valid: false, message: `Only ${formats} files are allowed` }
    }
  }

  const isRasterImage =
    file.type.startsWith('image/') && !file.type.includes('svg') && getFileExtension(file.name) !== 'svg'

  if (checkDimensions && isRasterImage && profile.minDimensions) {
    try {
      const { width, height } = await loadImageDimensions(file)
      const { width: minW, height: minH } = profile.minDimensions
      if (width < minW || height < minH) {
        return {
          valid: false,
          message: `Image dimensions too small (minimum ${minW}×${minH} px)`,
        }
      }
    } catch {
      /* skip dimension check if unreadable */
    }
  }

  return { valid: true }
}

/** Sync validation for callers that only check extension/size (no dimensions). */
export function validateUploadFileSync(file, profileOrKey) {
  if (!file) return { valid: false, message: 'Choose a file to upload' }
  const profile = resolveUploadProfile(profileOrKey)
  if (profile.maxBytes && file.size > profile.maxBytes) {
    return {
      valid: false,
      message: `File size exceeds ${formatBytesLabel(profile.maxBytes)}`,
    }
  }
  if ((profile.extensions?.length || profile.mimeTypes?.length) && !fileMatchesProfile(file, profile)) {
    const formats = profile.labelFormats?.join(', ') || 'selected formats'
    return { valid: false, message: `Only ${formats} files are allowed` }
  }
  return { valid: true }
}

export async function validateUploadFiles(files, profileOrKey, options = {}) {
  const list = Array.from(files || [])
  for (const file of list) {
    const result = await validateUploadFile(file, profileOrKey, options)
    if (!result.valid) return result
  }
  return { valid: true }
}
