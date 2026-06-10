import { useEffect, useRef, useState } from 'react'
import HelpDeskStatusBadge from './HelpDeskStatusBadge'
import { cn } from '../../utils/cn'

const OPTIONS = ['Replied', 'Not Replied']

export default function HelpDeskStatusCell({ status, onStatusChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (next) => {
    if (next !== status) onStatusChange?.(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative flex w-full items-center justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'rounded-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ace7]',
          !disabled && 'cursor-pointer hover:brightness-105 active:scale-[0.98]',
          disabled && 'cursor-default opacity-70',
        )}
        aria-label={`Status: ${status}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <HelpDeskStatusBadge status={status} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-1/2 top-[calc(100%+6px)] z-50 w-[9.5rem] -translate-x-1/2 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {OPTIONS.map((opt) => (
            <li key={opt} role="option" aria-selected={opt === status}>
              <button
                type="button"
                onClick={() => pick(opt)}
                className={cn(
                  'flex w-full items-center justify-center px-2 py-2 transition hover:bg-[#f4f6fb]',
                  opt === status && 'bg-[#eef4fa]',
                )}
              >
                <HelpDeskStatusBadge status={opt} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
