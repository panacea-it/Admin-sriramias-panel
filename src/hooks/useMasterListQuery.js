import { useEffect, useRef } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'

export const MASTER_LIST_RATE_LIMIT_MESSAGE =
  'Too many requests. Please wait a few seconds and try again.'

const SESSION_CACHE_TTL_MS = 5 * 60_000
const sessionCache = new Map()

export function buildFilterSignature(parts) {
  return parts.map((part) => String(part ?? '')).join('|')
}

export function getListSessionCache(key) {
  const entry = sessionCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > SESSION_CACHE_TTL_MS) {
    sessionCache.delete(key)
    return null
  }
  return entry.data
}

export function setListSessionCache(key, data) {
  if (data == null) return
  sessionCache.set(key, { data, at: Date.now() })
}

export function invalidateListSession(scope) {
  const prefix = `${scope}:`
  for (const key of sessionCache.keys()) {
    if (key.startsWith(prefix)) {
      sessionCache.delete(key)
    }
  }
}

/**
 * When filters change, use page 1 for the fetch immediately (avoids double API calls).
 */
export function useEffectivePage(page, setPage, filterSignature) {
  const lastFilterSigRef = useRef(filterSignature)

  const effectivePage =
    lastFilterSigRef.current !== filterSignature ? 1 : page

  useEffect(() => {
    if (lastFilterSigRef.current !== filterSignature) {
      lastFilterSigRef.current = filterSignature
      if (page !== 1) {
        setPage(1)
      }
    }
  }, [filterSignature, page, setPage])

  return effectivePage
}

/**
 * Guards list fetches: abort stale requests, throttle error toasts.
 * Network dedupe is handled by service-level apiRequestCache.
 */
export function createListFetchGuard() {
  const loadSeqRef = { current: 0 }
  const abortRef = { current: null }
  const lastErrorToastAt = { current: 0 }

  function beginRequest() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const seq = ++loadSeqRef.current
    return { controller, seq }
  }

  function endRequest(seq) {
    return seq === loadSeqRef.current
  }

  function shouldApplyResult(seq, controller) {
    return seq === loadSeqRef.current && !controller.signal.aborted
  }

  function isAbortError(error) {
    return error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED'
  }

  function getListErrorMessage(error, fallback) {
    if (isRateLimitError(error)) {
      return MASTER_LIST_RATE_LIMIT_MESSAGE
    }
    return getApiErrorMessage(error, fallback)
  }

  function toastListError(message, throttleMs = 4000) {
    const now = Date.now()
    if (now - lastErrorToastAt.current <= throttleMs) return
    lastErrorToastAt.current = now
    toast.error(message)
  }

  return {
    beginRequest,
    endRequest,
    shouldApplyResult,
    isAbortError,
    getListErrorMessage,
    toastListError,
  }
}

/**
 * Shared list loader: session cache for instant remount, soft revalidate, no loading flash.
 */
export async function runGuardedListFetch({
  fetchGuard,
  sessionKey,
  bypassCache = false,
  ignoreFlag,
  setLoading,
  fetchFn,
  applyData,
  handleError,
  errorFallback = 'Failed to load data',
}) {
  let hydratedFromSession = false

  if (!bypassCache && sessionKey) {
    const cached = getListSessionCache(sessionKey)
    if (cached != null) {
      applyData(cached)
      setLoading(false)
      hydratedFromSession = true
    }
  }

  const ctx = fetchGuard.beginRequest()
  if (!ctx) return

  const { controller, seq } = ctx

  if (!hydratedFromSession) {
    setLoading(true)
  }

  try {
    const data = await fetchFn({ signal: controller.signal })
    if (!fetchGuard.shouldApplyResult(seq, controller)) return

    if (sessionKey) {
      setListSessionCache(sessionKey, data)
    }

    if (ignoreFlag?.()) return
    applyData(data)
  } catch (error) {
    if (!fetchGuard.shouldApplyResult(seq, controller)) return
    if (fetchGuard.isAbortError(error)) return

    if (ignoreFlag?.()) return

    if (handleError) {
      handleError(error, { hydratedFromSession })
      return
    }

    fetchGuard.toastListError(fetchGuard.getListErrorMessage(error, errorFallback))
  } finally {
    if (fetchGuard.endRequest(seq) && !ignoreFlag?.()) {
      setLoading(false)
    }
  }
}
