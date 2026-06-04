import { useEffect, useMemo, useState } from 'react'
import { GitMerge } from 'lucide-react'
import BatchFormModalShell from './BatchFormModalShell'
import { NON_TRANSFER_TARGET_STATUSES } from '../../utils/batchOperations'
import { cn } from '../../utils/cn'

const selectClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#222] outline-none transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/30'

export default function MergeTwoBatchesModal({
  open,
  onClose,
  batches = [],
  onSubmit,
  saving = false,
}) {
  const [primaryBatchId, setPrimaryBatchId] = useState('')
  const [mergeBatchId, setMergeBatchId] = useState('')
  const [errors, setErrors] = useState({})

  const eligibleBatches = useMemo(
    () => batches.filter((b) => b.status !== 'Archived'),
    [batches],
  )

  const primaryBatch = eligibleBatches.find((b) => String(b.id) === String(primaryBatchId))
  const mergeBatch = eligibleBatches.find((b) => String(b.id) === String(mergeBatchId))

  useEffect(() => {
    if (!open) return
    setPrimaryBatchId('')
    setMergeBatchId('')
    setErrors({})
  }, [open])

  const validate = () => {
    const next = {}
    if (!primaryBatchId) next.primary = 'Select the main batch'
    if (!mergeBatchId) next.merge = 'Select the batch to merge'
    if (primaryBatchId && mergeBatchId && primaryBatchId === mergeBatchId) {
      next.merge = 'Choose a different batch than the main batch'
    }
    if (primaryBatch && NON_TRANSFER_TARGET_STATUSES.includes(primaryBatch.status)) {
      next.primary = 'Main batch cannot be Archived, Completed, or Cancelled'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit?.({
      targetId: primaryBatchId,
      sourceId: mergeBatchId,
      primaryBatch,
      mergeBatch,
    })
  }

  const mergeOptionsFor = (excludeId) =>
    eligibleBatches.filter((b) => String(b.id) !== String(excludeId))

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title="Merge Batches"
      subtitle="Combine two batches into one. Students and records move to the main batch."
      size="md"
      saving={saving}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-xl border border-slate-200 px-6 text-sm font-semibold text-[#444] transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="merge-two-batches-form"
            disabled={saving}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold text-white shadow-md',
              'bg-gradient-to-r from-[#55ace7] to-[#246392] transition hover:scale-[1.02] active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100',
            )}
          >
            <GitMerge className="h-4 w-4" />
            {saving ? 'Merging…' : 'Merge'}
          </button>
        </div>
      }
    >
      <form id="merge-two-batches-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="rounded-xl bg-[#f0f7fc] px-4 py-3 text-sm leading-relaxed text-[#444] ring-1 ring-[#55ace7]/20">
          After merge, both batches act as a <strong>single batch</strong> under the main batch.
          The second batch is archived with a reference to the main batch.
        </p>

        <div>
          <label
            htmlFor="merge-primary-batch"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#686868]"
          >
            Main batch (keeps identity) <span className="text-red-500">*</span>
          </label>
          <select
            id="merge-primary-batch"
            value={primaryBatchId}
            onChange={(e) => {
              setPrimaryBatchId(e.target.value)
              if (e.target.value === mergeBatchId) setMergeBatchId('')
              setErrors((x) => ({ ...x, primary: undefined }))
            }}
            className={selectClass}
          >
            <option value="">Select main batch…</option>
            {eligibleBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.displayName} ({b.batchId})
              </option>
            ))}
          </select>
          {errors.primary && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.primary}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="merge-second-batch"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#686868]"
          >
            Batch to merge into main <span className="text-red-500">*</span>
          </label>
          <select
            id="merge-second-batch"
            value={mergeBatchId}
            onChange={(e) => {
              setMergeBatchId(e.target.value)
              setErrors((x) => ({ ...x, merge: undefined }))
            }}
            className={selectClass}
            disabled={!primaryBatchId}
          >
            <option value="">Select batch to merge…</option>
            {mergeOptionsFor(primaryBatchId).map((b) => (
              <option key={b.id} value={b.id}>
                {b.displayName} ({b.batchId}) · {b.totalStudents} students
              </option>
            ))}
          </select>
          {errors.merge && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.merge}</p>
          )}
        </div>

        {primaryBatch && mergeBatch && (
          <div className="rounded-xl border border-dashed border-[#55ace7]/40 bg-white p-4 text-sm text-[#444]">
            <p className="font-semibold text-[#1a3a5c]">Preview</p>
            <p className="mt-2">
              <span className="text-[#686868]">Merge:</span> {mergeBatch.displayName}
            </p>
            <p>
              <span className="text-[#686868]">Into:</span> {primaryBatch.displayName}
            </p>
            <p className="mt-2 text-xs text-[#686868]">
              Combined strength: approximately{' '}
              {(primaryBatch.totalStudents || 0) + (mergeBatch.totalStudents || 0)} students
            </p>
          </div>
        )}
      </form>
    </BatchFormModalShell>
  )
}
