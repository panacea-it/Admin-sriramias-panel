import { useCallback, useEffect, useMemo, useState } from 'react'

const VIEWPORT_PADDING = 8

/**
 * Computes viewport-fixed coordinates for a dropdown/menu rendered in a portal.
 * Anchors the menu directly to the trigger — bottom edge below, or top edge above.
 */
export function usePortalMenuPosition(triggerRef, open, offset = 8, preferredMaxHeight = 280) {
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: preferredMaxHeight,
    placement: 'bottom',
    transform: 'none',
  })

  const update = useCallback(() => {
    const el = triggerRef?.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const width = Math.max(0, rect.width)

    let left = rect.left
    if (left + width > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - width - VIEWPORT_PADDING
    }
    left = Math.max(VIEWPORT_PADDING, left)

    const spaceBelow = window.innerHeight - rect.bottom - offset - VIEWPORT_PADDING
    const spaceAbove = rect.top - offset - VIEWPORT_PADDING
    const openUpward = spaceBelow < 160 && spaceAbove > spaceBelow

    const available = openUpward ? spaceAbove : spaceBelow
    const maxHeight = Math.max(120, Math.min(preferredMaxHeight, available))

    if (openUpward) {
      setCoords({
        top: rect.top - offset,
        left,
        width,
        maxHeight,
        placement: 'top',
        transform: 'translateY(-100%)',
      })
    } else {
      setCoords({
        top: rect.bottom + offset,
        left,
        width,
        maxHeight,
        placement: 'bottom',
        transform: 'none',
      })
    }
  }, [triggerRef, offset, preferredMaxHeight])

  useEffect(() => {
    if (!open) return undefined

    update()
    const raf = requestAnimationFrame(update)

    const onScroll = () => update()
    const onResize = () => update()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, update])

  return useMemo(() => coords, [coords])
}
