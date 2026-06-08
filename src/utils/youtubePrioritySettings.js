import {
  YOUTUBE_AUTO_COMPACT_STORAGE_KEY,
  YOUTUBE_ALLOW_GAPS_STORAGE_KEY,
} from '../constants/youtubeVideoConstants'

export function getAutoCompactEnabled() {
  try {
    const v = localStorage.getItem(YOUTUBE_AUTO_COMPACT_STORAGE_KEY)
    return v !== 'false'
  } catch {
    return true
  }
}

export function setAutoCompactEnabled(enabled) {
  try {
    localStorage.setItem(YOUTUBE_AUTO_COMPACT_STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

export function getAllowGapsEnabled() {
  try {
    return localStorage.getItem(YOUTUBE_ALLOW_GAPS_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setAllowGapsEnabled(enabled) {
  try {
    localStorage.setItem(YOUTUBE_ALLOW_GAPS_STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

/** @deprecated */
export const getAutoPriorityShiftEnabled = getAutoCompactEnabled
export const setAutoPriorityShiftEnabled = setAutoCompactEnabled
