import { isRateLimitError } from './apiError'

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a request when the server responds with 429.
 * Uses exponential backoff between attempts.
 */
export async function withRateLimitRetry(
  requestFn,
  { maxRetries = 3, baseDelayMs = 1200, onRetry } = {},
) {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestFn(attempt)
    } catch (error) {
      lastError = error
      if (!isRateLimitError(error) || attempt >= maxRetries) break
      const delayMs = baseDelayMs * 2 ** attempt
      onRetry?.(attempt + 1, delayMs)
      await sleep(delayMs)
    }
  }

  throw lastError
}
