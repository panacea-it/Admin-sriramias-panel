import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'

const MENU_WIDTH = 196
const MENU_GAP = 8
const VIEWPORT_PAD = 12

/**
 * Reusable row action menu — portal positioning, keyboard nav, viewport-aware placement.
 * @param {Array<{ label: string, icon?: import('react').ComponentType, onClick: () => void, danger?: boolean, disabled?: boolean }>} items
 */
export default function TableActionMenu({
  items = [],
  triggerLabel = 'Row actions',
  align = 'end',
  className,
  menuWidth = MENU_WIDTH,
}) {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' })
  const [focusIndex, setFocusIndex] = useState(0)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const normalizedItems = items.filter(Boolean)
  const enabledItems = normalizedItems.filter((item) => !item.disabled)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const menuEl = menuRef.current
    const menuHeight = menuEl?.offsetHeight || enabledItems.length * 44 + 16

    let top = rect.bottom + MENU_GAP
    let left = align === 'end' ? rect.right - menuWidth : rect.left
    let placement = 'bottom'

    if (top + menuHeight > window.innerHeight - VIEWPORT_PAD) {
      top = rect.top - menuHeight - MENU_GAP
      placement = 'top'
    }
    if (top < VIEWPORT_PAD) {
      top = VIEWPORT_PAD
    }

    left = Math.max(
      VIEWPORT_PAD,
      Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD),
    )

    setCoords({ top, left, placement })
  }, [align, enabledItems.length, menuWidth])

  useEffect(() => {
    if (!open) return undefined

    updatePosition()
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (!enabledItems.length) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((i) => (i + 1) % enabledItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((i) => (i - 1 + enabledItems.length) % enabledItems.length)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const item = enabledItems[focusIndex]
        if (item?.onClick) {
          item.onClick()
          setOpen(false)
          triggerRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, enabledItems, focusIndex])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      const t = e.target
      if (
        triggerRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setFocusIndex(0)
    requestAnimationFrame(() => {
      updatePosition()
      requestAnimationFrame(updatePosition)
    })
  }, [open, updatePosition])

  useEffect(() => {
    if (!open || !menuRef.current) return
    const buttons = menuRef.current.querySelectorAll('[data-action-item]')
    buttons[focusIndex]?.focus()
  }, [open, focusIndex])

  const toggle = () => {
    if (!normalizedItems.length) return
    setOpen((o) => !o)
  }

  const runItem = (item, index) => {
    if (item.disabled) return
    item.onClick?.()
    setOpen(false)
    triggerRef.current?.focus()
    const enabledIndex = enabledItems.indexOf(item)
    setFocusIndex(enabledIndex >= 0 ? enabledIndex : index)
  }

  const menu = (
    <AnimatePresence>
      {open && normalizedItems.length > 0 ? (
        <motion.div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          initial={{ opacity: 0, scale: 0.96, y: coords.placement === 'bottom' ? -4 : 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: coords.placement === 'bottom' ? -4 : 4 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: menuWidth,
            zIndex: 9999,
          }}
          className={cn(
            'overflow-hidden rounded-xl border border-[#e5eaf2]/90',
            'bg-white py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]',
            'ring-1 ring-[#55ace7]/10',
          )}
        >
          {normalizedItems.map((item, index) => {
            const Icon = item.icon
            const isFocused = enabledItems[focusIndex] === item
            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                role="menuitem"
                data-action-item
                disabled={item.disabled}
                onClick={() => runItem(item, index)}
                onMouseEnter={() => {
                  if (item.disabled) return
                  const enabledIndex = enabledItems.indexOf(item)
                  if (enabledIndex >= 0) setFocusIndex(enabledIndex)
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-none',
                  isFocused && 'bg-[#eef6fc]',
                  item.danger
                    ? 'text-[#c96565] hover:bg-red-50 focus:bg-red-50'
                    : 'text-[#1a3a5c] hover:bg-[#eef6fc] focus:bg-[#eef6fc]',
                  item.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {Icon ? (
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
                      item.danger
                        ? 'bg-red-50 text-[#c96565] ring-red-100'
                        : 'bg-[#eef6fc] text-[#246392] ring-[#cfe8f8]/80',
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  </span>
                ) : (
                  <span className="h-8 w-8 shrink-0" />
                )}
                <span className="min-w-0 flex-1">{item.label}</span>
              </button>
            )
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        ref={triggerRef}
        type="button"
        title={triggerLabel}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={!normalizedItems.length}
        onClick={toggle}
        className={cn(
          'flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg',
          'border border-slate-200/90 bg-white text-slate-500',
          'transition-colors duration-150',
          'hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-300/80',
          'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200/90 disabled:hover:bg-white disabled:hover:text-slate-500',
          open && 'border-slate-300 bg-slate-50 text-slate-700',
        )}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
      {typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  )
}

/** Minimal actions column — matches other table columns (no highlight strip). */
export const tableActionsCellClass =
  'align-middle w-[68px] min-w-[68px] whitespace-nowrap pr-4 sm:pr-6'

export const tableActionsHeaderClass = 'whitespace-nowrap'
