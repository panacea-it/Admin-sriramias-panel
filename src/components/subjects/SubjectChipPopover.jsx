import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import AdminTooltip from './AdminTooltip'

const MAX_VISIBLE = 2

export default function SubjectChipPopover({
  values = [],
  maxVisible = MAX_VISIBLE,
  emptyLabel = '—',
  tooltipLabel = 'View all',
  chipClassName,
}) {
  const list = Array.isArray(values)
    ? values.filter(Boolean)
    : typeof values === 'string' && values.trim()
      ? [values.trim()]
      : []

  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const popoverId = useId()

  if (!list.length) {
    return <span className="text-xs text-slate-400">{emptyLabel}</span>
  }

  const visible = list.slice(0, maxVisible)
  const overflow = list.length - visible.length
  const hidden = list.slice(maxVisible)

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const popoverWidth = 220
    let left = rect.left
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12
    }
    setCoords({ top: rect.bottom + 8, left: Math.max(12, left) })
  }

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    const close = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  const chipBase =
    chipClassName ||
    'inline-flex max-w-[108px] truncate rounded-full bg-gradient-to-r from-[#eef2fc] to-[#e8f4fc] px-2 py-0.5 text-[11px] font-semibold text-[#246392] ring-1 ring-[#55ace7]/12 transition hover:ring-[#55ace7]/30'

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map((item) => (
          <AdminTooltip key={item} label={item}>
            <span className={chipBase}>{item}</span>
          </AdminTooltip>
        ))}
        {overflow > 0 && (
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={popoverId}
            onClick={() => {
              setOpen((v) => !v)
              requestAnimationFrame(updatePosition)
            }}
            className="inline-flex items-center rounded-full bg-[#55ace7]/10 px-2 py-0.5 text-[11px] font-bold text-[#246392] ring-1 ring-[#55ace7]/20 transition hover:bg-[#55ace7]/15 hover:ring-[#55ace7]/35"
          >
            +{overflow} more
          </button>
        )}
      </div>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && overflow > 0 && (
              <motion.div
                ref={popoverRef}
                id={popoverId}
                role="dialog"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999 }}
                className="w-[220px] rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-[#55ace7]/10"
              >
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {tooltipLabel}
                </p>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {hidden.map((item) => (
                    <span key={item} className={cn(chipBase, 'max-w-full')}>
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
