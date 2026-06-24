import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import BatchStatusBadge from './BatchStatusBadge'
import { BATCH_UI_STATUSES, normalizeBatchUiStatus } from '../../utils/batchOperations'
import { cn } from '../../utils/cn'

export default function BatchStatusSelector({
  status,
  onStatusChange,
  disabled = false,
}) {
  const normalizedStatus = normalizeBatchUiStatus(status)
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 200),
    })
  }, [])

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleSelect = (next) => {
    setOpen(false)
    if (next !== normalizedStatus) onStatusChange?.(next)
  }

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'group inline-flex items-center gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
        >
          <BatchStatusBadge status={normalizedStatus} />
          {!disabled && (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-[#246392] transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          )}
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.ul
              ref={menuRef}
              id={menuId}
              role="listbox"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 140 }}
              className="min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              {BATCH_UI_STATUSES.map((s) => (
                <li key={s} role="option" aria-selected={s === normalizedStatus}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s)}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-left transition hover:bg-[#f0f7fc]',
                      s === normalizedStatus && 'bg-[#eef6fc]',
                    )}
                  >
                    <BatchStatusBadge status={s} className="min-w-0 scale-90" />
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
