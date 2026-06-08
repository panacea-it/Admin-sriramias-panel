import { useState } from 'react'
import { Copy, X, Link2 } from 'lucide-react'
import { toast } from '@/utils/toast'

export default function ContentShareModal({ item, onClose }) {
  const [expiryDays, setExpiryDays] = useState('7')
  if (!item) return null

  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${base}/share/content/${item.seoSlug || item.id}?exp=${expiryDays}d`
  const internalLink = `${base}/academics/content-library/all?id=${item.id}`

  const copy = (text) => {
    navigator.clipboard?.writeText(text)
    toast.success('Link copied')
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a3a5c]">
            <Link2 className="h-5 w-5" /> Share content
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">{item.title}</p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Link expiry (days)
          <input
            type="number"
            min={1}
            max={90}
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          />
        </label>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Public share link</p>
            <div className="mt-1 flex gap-2">
              <input readOnly value={link} className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-xs" />
              <button type="button" onClick={() => copy(link)} className="rounded-lg bg-[#1a3a5c] px-3 text-white">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Internal link</p>
            <div className="mt-1 flex gap-2">
              <input readOnly value={internalLink} className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-xs" />
              <button type="button" onClick={() => copy(internalLink)} className="rounded-lg bg-[#55ace7] px-3 text-white">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
