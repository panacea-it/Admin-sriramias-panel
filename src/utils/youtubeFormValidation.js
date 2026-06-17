import { extractYoutubeVideoId, normalizeRankInput } from './youtubeVideoPriority'

export function isValidYoutubeUrl(url = '') {
  const trimmed = String(url).trim()
  if (!trimmed) return false
  return extractYoutubeVideoId(trimmed) != null
}

export function validateYoutubeVideoForm(form) {
  const errors = {}

  if (!form.name?.trim()) {
    errors.name = 'Name is required.'
  }

  const url = form.url?.trim() ?? ''
  if (!url) {
    errors.url = 'Youtube URL is required.'
  } else if (!isValidYoutubeUrl(url)) {
    errors.url = 'Please enter a valid Youtube URL.'
  }

  if (!form.status) {
    errors.status = 'Status is required.'
  }

  const priorityRaw = form.priorityOrder
  if (priorityRaw !== '' && priorityRaw != null && priorityRaw !== undefined) {
    const rank = normalizeRankInput(priorityRaw)
    if (rank == null) {
      errors.priorityOrder = 'Enter a valid priority rank.'
    }
  }

  return errors
}
