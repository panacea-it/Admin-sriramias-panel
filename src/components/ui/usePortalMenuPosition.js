import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Computes viewport-fixed coordinates for a dropdown/menu rendered in a portal.
 * This avoids clipping issues caused by parent containers using `overflow-hidden`.
 */
export function usePortalMenuPosition(triggerRef, open, offset = 6) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const update = useCallback(() => {
    const el = triggerRef?.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const width = Math.max(0, rect.width)
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
    const top = rect.bottom + offset

    setCoords({ top, left, width })
  }, [triggerRef, offset])

  useEffect(() => {
    if (!open) return undefined
    update()

    const onScroll = () => update()
    const onResize = () => update()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, update])

  return useMemo(() => coords, [coords])
}

