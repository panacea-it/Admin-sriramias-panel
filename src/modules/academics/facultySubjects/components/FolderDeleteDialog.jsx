import { AlertTriangle } from 'lucide-react'
import ModalCloseButton from '../../../../components/subjects/ModalCloseButton'

function CountRow({ label, count }) {
  if (!count) return null
  return (
    <li className="flex justify-between text-sm text-slate-700">
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{count}</span>
    </li>
  )
}

export default function FolderDeleteDialog({
  open,
  folderName,
  message,
  details,
  suggestions = [],
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const total = details?.contentCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={loading ? undefined : onCancel}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[#1a3a5c]">Cannot delete folder</h3>
            {folderName ? (
              <p className="mt-1 text-sm text-slate-600">&ldquo;{folderName}&rdquo;</p>
            ) : null}
          </div>
          <ModalCloseButton onClick={onCancel} disabled={loading} />
        </div>

        <p className="text-sm leading-relaxed text-slate-700">
          {message ||
            'This folder still contains content. Remove or move all items before deleting the folder.'}
        </p>

        {details ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Content in folder{typeof total === 'number' ? ` (${total})` : ''}
            </p>
            <ul className="space-y-1">
              <CountRow label="Live classes" count={details.liveClassCount} />
              <CountRow label="Recordings" count={details.recordingCount} />
              <CountRow label="PDFs" count={details.subjectPdfCount} />
              <CountRow label="Prelims tests" count={details.prelimsTestCount} />
              <CountRow label="Mains answer writing" count={details.mainsAnswerWritingCount} />
            </ul>
          </div>
        ) : null}

        {suggestions?.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-xl bg-[#1a3a5c] px-5 text-sm font-semibold text-white hover:bg-[#153049] disabled:opacity-60"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
