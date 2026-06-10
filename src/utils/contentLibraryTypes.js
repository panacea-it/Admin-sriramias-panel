export const CONTENT_TYPES = [
  'PDF',
  'Video',
  'Assignment',
  'Recording',
  'Handout',
  'Notes',
  'DOC',
  'DOCX',
  'PPT',
  'PPTX',
  'Excel',
  'ZIP',
  'Image',
  'External Link',
  'YouTube',
  'Vimeo',
  'Google Drive',
]

export const CONTENT_STATUSES = ['Published', 'Draft', 'Scheduled', 'Archived', 'Pending Approval', 'Deleted']

export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

export const VISIBILITY_MODES = ['Public', 'Private']

export const ACCESS_SCOPES = [
  'batch',
  'course',
  'student',
  'membership',
  'premium',
  'trial',
  'locked',
  'date_limited',
]

export const APPROVAL_STATUSES = ['approved', 'pending', 'rejected']

export const RECYCLE_AUTO_DELETE_DAYS = 30

export function detectContentTypeFromFile(file) {
  if (!file?.name) return 'PDF'
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const map = {
    pdf: 'PDF',
    mp4: 'Video',
    webm: 'Video',
    mov: 'Video',
    doc: 'DOC',
    docx: 'DOCX',
    ppt: 'PPT',
    pptx: 'PPTX',
    xls: 'Excel',
    xlsx: 'Excel',
    zip: 'ZIP',
    png: 'Image',
    jpg: 'Image',
    jpeg: 'Image',
    gif: 'Image',
    webp: 'Image',
  }
  return map[ext] || 'PDF'
}

export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}
