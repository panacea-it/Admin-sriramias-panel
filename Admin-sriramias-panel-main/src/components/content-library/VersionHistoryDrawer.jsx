import { useEffect, useState } from 'react'
import { X, History, RotateCcw } from 'lucide-react'
import { listVersionsForContent } from '../../api/contentLibraryAPI'
import { toast } from '@/utils/toast'

export default function VersionHistoryDrawer({ contentId, open, onClose, onRestore }) {
  const [versions, setVersions] = useState([])

  useEffect(() => {
    if (!open || !contentId) return
    setVersions(listVersionsForContent(contentId))
  }, [open, contentId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[190] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-[#1a3a5c]">
            <History className="h-5 w-5" /> Version history
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="flex-1 overflow-auto p-4">
          {versions.length === 0 ? (
            <p className="text-sm text-slate-500">No previous versions recorded.</p>
          ) : (
            versions.map((v) => (
              <li
                key={v.id}
                className="mb-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a3a5c]">v{v.version}</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#55ace7]"
                    onClick={() => {
                      onRestore?.(v)
                      toast.success(`Restored version ${v.version}`)
                      onClose()
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-600">{v.fileName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {v.changedBy} · {new Date(v.changedAt).toLocaleString()}
                </p>
                {v.note && <p className="mt-2 text-xs italic text-slate-500">{v.note}</p>}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
