import { useCallback, useEffect, useState } from 'react'

const VIEWPORT_PADDING = 8

/**
 * Computes viewport-fixed coordinates for a dropdown/menu rendered in a portal.
 * Returns null while closed or before the trigger is measured.
 */
export function usePortalMenuPosition(triggerRef, open, offset = 8, preferredMaxHeight = 280) {
  const [coords, setCoords] = useState(null)

  const update = useCallback(() => {
    const el = triggerRef?.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const width = rect.width

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
    if (!open) {
      setCoords(null)
      return undefined
    }

    update()
    const raf = requestAnimationFrame(update)

    const onScroll = () => update()
    const onResize = () => update()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    const observer =
      typeof ResizeObserver !== 'undefined' && triggerRef.current
        ? new ResizeObserver(update)
        : null
    if (triggerRef.current) observer?.observe(triggerRef.current)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      observer?.disconnect()
    }
  }, [open, update, triggerRef])

  return coords
}
