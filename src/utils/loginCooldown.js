const STORAGE_KEY = 'loginRateLimitUntil'

export function getLoginCooldownRemainingMs() {
  const until = Number(sessionStorage.getItem(STORAGE_KEY) || 0)
  const remaining = until - Date.now()
  return remaining > 0 ? remaining : 0
}

export function setLoginCooldown(durationMs = 60_000) {
  sessionStorage.setItem(STORAGE_KEY, String(Date.now() + durationMs))
}

export function clearLoginCooldown() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function isRateLimitError(error) {
  const status = error?.status ?? error?.cause?.status ?? error?.response?.status
  if (status === 429) return true
  const message = String(error?.message || error?.cause?.message || '').toLowerCase()
  return message.includes('too many') || message.includes('rate limit')
}
