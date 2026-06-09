import { createElement, lazy } from 'react'
import { isChunkLoadError } from '../utils/chunkLoadError'
import LazyLoadErrorPage from '../pages/LazyLoadErrorPage'

/**
 * Wraps React.lazy so a failed dynamic import shows a recoverable fallback
 * instead of a blank screen. LazyLoadErrorPage is statically imported so the
 * fallback never depends on a second dynamic import (which can also fail in dev).
 */
const CHUNK_RELOAD_KEY = 'lazyRoute:chunkReload'

export function lazyRoute(importer, moduleLabel = 'page') {
  return lazy(async () => {
    try {
      return await importer()
    } catch (error) {
      console.error(`[lazyRoute] Failed to load ${moduleLabel}:`, error)

      const isChunk = isChunkLoadError(error)

      if (import.meta.env.DEV && isChunk && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
        return new Promise(() => {})
      }

      if (import.meta.env.DEV) {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      }
      const devDetail =
        import.meta.env.DEV && error?.message ? error.message : undefined

      return {
        default: function LazyRouteLoadError() {
          return createElement(LazyLoadErrorPage, {
            moduleLabel,
            isChunkLoadError: isChunk,
            detail: devDetail,
          })
        },
      }
    }
  })
}
