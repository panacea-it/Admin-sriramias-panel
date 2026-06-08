import { useEffect } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active || !containerRef.current) return undefined
    const root = containerRef.current
    const getFocusable = () => [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)

    const timer = requestAnimationFrame(() => {
      const list = getFocusable()
      list[0]?.focus()
    })

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const list = getFocusable()
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(timer)
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [active, containerRef])
}
