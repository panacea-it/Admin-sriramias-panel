import { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import BatchFormModalShell from './BatchFormModalShell'
import { NON_TRANSFER_TARGET_STATUSES } from '../../utils/batchOperations'
import { cn } from '../../utils/cn'

const MERGE_OPTIONS = [
  { key: 'students', label: 'Students' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'fees', label: 'Fee Records' },
  { key: 'tests', label: 'Test Results' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'notes', label: 'Notes' },
]

const CONFLICT_OPTIONS = [
  { value: 'skip', label: 'Skip duplicates' },
  { value: 'replace', label: 'Replace existing' },
  { value: 'keep_both', label: 'Keep both records' },
]

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:bg-[#f8fbff]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded text-[#246392]"
      />
      <span className="text-sm font-medium text-[#333]">{label}</span>
    </label>
  )
}

export default function MergeBatchesModal({
  open,
  onClose,
  allBatches = [],
  preselectedSourceIds = [],
  onSubmit,
  saving = false,
}) {
  const [step, setStep] = useState(1)
  const [sourceIds, setSourceIds] = useState([])
  const [targetId, setTargetId] = useState('')
  const [mergeFlags, setMergeFlags] = useState({
    students: true,
    attendance: true,
    fees: true,
    tests: true,
    assignments: false,
    notes: false,
  })
  const [conflictMode, setConflictMode] = useState('skip')

  const eligibleTargets = useMemo(
    () =>
      allBatches.filter(
        (b) =>
          !sourceIds.includes(String(b.id)) &&
          !NON_TRANSFER_TARGET_STATUSES.includes(b.status || ''),
      ),
    [allBatches, sourceIds],
  )

  const sourceBatches = allBatches.filter((b) => sourceIds.includes(String(b.id)))
  const targetBatch = allBatches.find((b) => String(b.id) === String(targetId))

  useEffect(() => {
    if (!open) return
    setStep(1)
    setSourceIds(preselectedSourceIds.map(String))
    setTargetId('')
    setMergeFlags({
      students: true,
      attendance: true,
      fees: true,
      tests: true,
      assignments: false,
      notes: false,
    })
    setConflictMode('skip')
  }, [open, preselectedSourceIds])

  const toggleSource = (id) => {
    const sid = String(id)
    setSourceIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
    if (String(targetId) === sid) setTargetId('')
  }

  const canNextStep1 = sourceIds.length >= 1
  const canNextStep2 = Boolean(targetId)
  const canMerge = sourceIds.length >= 1 && targetId && mergeFlags.students !== undefined

  const handleNext = () => setStep((s) => Math.min(4, s + 1))
  const handleBack = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = () => {
    onSubmit?.({
      sourceIds,
      targetId,
      mergeFlags,
      conflictMode,
    })
  }

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title="Merge Batches"
      subtitle={`Step ${step} of 4`}
      size="lg"
      saving={saving}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={cn(
                  'h-2 w-8 rounded-full transition-colors',
                  n <= step ? 'bg-[#55ace7]' : 'bg-slate-200',
                )}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-slate-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444]"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 1 && !canNextStep1) ||
                  (step === 2 && !canNextStep2) ||
                  saving
                }
                className="inline-flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !canMerge}
                className="h-10 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? 'Merging…' : 'Merge Batches'}
              </button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-[#686868]">
            Select one or more source batches to merge. Source batches will be archived after merge.
          </p>
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {allBatches
              .filter((b) => b.status !== 'Archived')
              .map((b) => (
                <li key={b.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#55ace7]/40 hover:bg-[#f8fbff]">
                    <input
                      type="checkbox"
                      checked={sourceIds.includes(String(b.id))}
                      onChange={() => toggleSource(b.id)}
                      className="h-4 w-4 rounded text-[#246392]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#111]">{b.displayName}</p>
                      <p className="text-xs text-[#686868]">{b.batchId} · {b.status}</p>
                    </div>
                  </label>
                </li>
              ))}
          </ul>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-[#686868]">Choose the target batch that will receive merged data.</p>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/30"
          >
            <option value="">Select target batch…</option>
            {eligibleTargets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.displayName}
              </option>
            ))}
          </select>
          {sourceBatches.length > 0 && (
            <p className="text-xs text-[#686868]">
              Merging {sourceBatches.length} batch(es) into{' '}
              {targetBatch?.displayName || '—'}
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {MERGE_OPTIONS.map((opt) => (
            <CheckboxField
              key={opt.key}
              label={opt.label}
              checked={mergeFlags[opt.key]}
              onChange={(v) => setMergeFlags((f) => ({ ...f, [opt.key]: v }))}
            />
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-[#686868]">
            If duplicate students exist in the target batch, choose how to resolve conflicts.
          </p>
          <div className="space-y-2">
            {CONFLICT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition',
                  conflictMode === opt.value
                    ? 'border-[#55ace7] bg-[#eef6fc]'
                    : 'border-slate-100 hover:bg-slate-50',
                )}
              >
                <input
                  type="radio"
                  name="conflictMode"
                  value={opt.value}
                  checked={conflictMode === opt.value}
                  onChange={() => setConflictMode(opt.value)}
                  className="text-[#246392]"
                />
                <span className="text-sm font-medium text-[#333]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            Source batches will be marked <strong>Archived</strong> with reference: Merged Into:{' '}
            {targetBatch?.displayName || 'target batch'}.
          </div>
        </div>
      )}
    </BatchFormModalShell>
  )
}
