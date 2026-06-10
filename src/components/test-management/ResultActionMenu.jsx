import { useMemo, useState } from 'react'
import { Download, BarChart3, Eye, GitCompare, Send } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionButton({ icon: Icon, label, onClick, disabled, variant = 'default' }) {
  const base =
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2'
  const variants = {
    default: 'bg-[#eef2fc] text-[#1a3a5c] hover:bg-[#e5ebff]',
    primary: 'bg-gradient-to-r from-[#55ace7] to-[#246392] text-white hover:opacity-95',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn(base, variants[variant], disabled && 'opacity-50 cursor-not-allowed')}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

export default function ResultActionMenu({
  row,
  onViewResult,
  onViewAnalytics,
  onDownloadReport,
  onPublish,
  onCompare,
}) {
  const [open, setOpen] = useState(false)

  const items = useMemo(() => {
    return [
      { key: 'view', label: 'View Result', icon: Eye, onClick: () => onViewResult?.(row) },
      { key: 'analytics', label: 'View Analytics', icon: BarChart3, onClick: () => onViewAnalytics?.(row) },
      { key: 'download', label: 'Download Report', icon: Download, onClick: () => onDownloadReport?.(row) },
      { key: 'publish', label: 'Publish Result', icon: Send, onClick: () => onPublish?.(row), disabled: row?.status === 'Published' },
      { key: 'compare', label: 'Compare Performance', icon: GitCompare, onClick: () => onCompare?.(row) },
    ]
  }, [onCompare, onDownloadReport, onPublish, onViewAnalytics, onViewResult, row])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#eef2fc] px-3 text-sm font-extrabold text-[#1a3a5c] hover:bg-[#e5ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2"
      >
        Actions
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-[min(360px,90vw)] rounded-xl border border-slate-200 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((it) => (
                <ActionButton
                  key={it.key}
                  icon={it.icon}
                  label={it.label}
                  disabled={it.disabled}
                  variant={it.key === 'publish' ? 'primary' : 'default'}
                  onClick={() => {
                    it.onClick?.()
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

