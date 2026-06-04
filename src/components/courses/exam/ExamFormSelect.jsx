import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { usePortalMenuPosition } from '../../ui/usePortalMenuPosition'
import { examDropdownTriggerClass } from './examFormStyles'

/**
 * Stable single-select dropdown for exam forms — avoids native select hover glitches.
 */
export default function ExamFormSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select…',
  loading = false,
  disabled = false,
  error,
  emptyMessage = 'No options available',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const optionList = useMemo(
    () =>
      (Array.isArray(options) ? options : [])
        .map((opt) => {
          if (typeof opt === 'string') return { value: opt, label: opt }
          const val = String(opt?.value ?? opt?.id ?? '').trim()
          const label = String(opt?.label ?? opt?.name ?? opt?.description ?? val).trim()
          if (!val) return null
          return { value: val, label: label || val }
        })
        .filter(Boolean),
    [options],
  )

  const selected = String(value || '')
  const selectedLabel = optionList.find((opt) => opt.value === selected)?.label

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const isDisabled = disabled || loading

  const displayLabel = loading
    ? 'Loading…'
    : selectedLabel || selected || placeholder

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={isDisabled}
        ref={triggerRef}
        onClick={() => !isDisabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          examDropdownTriggerClass,
          'justify-between',
          isDisabled && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <span
          className={cn(
            'min-w-0 truncate pr-2',
            !selectedLabel && !selected && 'font-normal text-[#7a8a9a]',
          )}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-[#687180]',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 220,
            }}
            className="overflow-hidden rounded-xl border border-[#cfe8f8] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          >
            <ul className="max-h-52 overflow-y-auto py-1">
              {optionList.length === 0 ? (
                <li className="px-4 py-3 text-sm text-[#7a8a9a]">{emptyMessage}</li>
              ) : (
                optionList.map((opt) => {
                  const isSelected = selected === opt.value
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChange?.(opt.value)
                          setOpen(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm text-[#1a3a5c] hover:bg-[#f0f7fc]',
                          isSelected && 'bg-[#eef6fc] font-semibold',
                        )}
                      >
                        {opt.label}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )}

      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
