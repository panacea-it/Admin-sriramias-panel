import { createElement, lazy } from 'react'
import { isChunkLoadError } from '../utils/chunkLoadError'
import LazyLoadErrorPage from '../pages/LazyLoadErrorPage'

/**
 * Wraps React.lazy so a failed dynamic import shows a recoverable fallback
 * instead of a blank screen. LazyLoadErrorPage is statically imported so the
 * fallback never depends on a second dynamic import (which can also fail in dev).
 */
export function lazyRoute(importer, moduleLabel = 'page') {
  return lazy(async () => {
    try {
      return await importer()
    } catch (error) {
      console.error(`[lazyRoute] Failed to load ${moduleLabel}:`, error)

      const isChunk = isChunkLoadError(error)
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
