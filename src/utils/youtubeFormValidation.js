import { extractYoutubeVideoId } from './youtubeVideoPriority'

export function isValidYoutubeUrl(url = '') {
  const trimmed = String(url).trim()
  if (!trimmed) return false
  return extractYoutubeVideoId(trimmed) != null
}

export function validateYoutubeVideoForm(form) {
  const errors = {}

  if (!form.name?.trim()) {
    errors.name = 'Video name is required.'
  }

  const url = form.url?.trim() ?? ''
  if (!url) {
    errors.url = 'YouTube URL is required.'
  } else if (!isValidYoutubeUrl(url)) {
    errors.url = 'Please enter a valid YouTube URL.'
  }

  if (!form.status) {
    errors.status = 'Status is required.'
  }

  const priorityRaw = String(form.priority ?? '').trim()
  if (!priorityRaw) {
    errors.priority = 'Priority is required.'
  } else {
    const priority = Number.parseInt(priorityRaw, 10)
    if (!Number.isFinite(priority) || priority < 1 || !Number.isInteger(priority)) {
      errors.priority = 'Priority must be a positive integer.'
    }
  }

  return errors
}
