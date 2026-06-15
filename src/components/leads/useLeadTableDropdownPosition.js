import { useCallback, useEffect, useState } from 'react'

const VIEWPORT_PADDING = 8
const DEFAULT_MAX_HEIGHT = 280

/**
 * Floating positioning for Leads table dropdowns.
 * Anchors menu flush to trigger — exact left/width, flips vertically at viewport edge.
 */
export function useLeadTableDropdownPosition(triggerRef, open, offset = 4, maxMenuHeight = DEFAULT_MAX_HEIGHT) {
  const [coords, setCoords] = useState(null)

  const update = useCallback(() => {
    const el = triggerRef?.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const left = rect.left
    const width = rect.width

    const spaceBelow = window.innerHeight - rect.bottom - offset - VIEWPORT_PADDING
    const spaceAbove = rect.top - offset - VIEWPORT_PADDING
    const flip = spaceBelow < 200 && spaceAbove > spaceBelow

    const available = flip ? spaceAbove : spaceBelow
    const maxHeight = Math.max(120, Math.min(maxMenuHeight, available))

    setCoords({
      top: flip ? rect.top - offset : rect.bottom + offset,
      left,
      width,
      maxHeight,
      placement: flip ? 'top' : 'bottom',
      transform: flip ? 'translateY(-100%)' : 'none',
    })
  }, [triggerRef, offset, maxMenuHeight])

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
