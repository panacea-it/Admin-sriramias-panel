import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { CourseDateInput } from '../courses/CourseFormField'
import BatchFormModalShell from './BatchFormModalShell'
import {
  BatchCheckboxCard,
  BatchField,
  BatchModalFooter,
  batchInputReadonlyClass,
  batchSelectClass,
  batchTextareaClass,
} from './batchModalUi'
import {
  canTransferToBatch,
  getAvailableSeats,
  getBatchCapacity,
  NON_TRANSFER_TARGET_STATUSES,
} from '../../utils/batchOperations'
import { cn } from '../../utils/cn'

export default function MoveStudentModal({
  open,
  onClose,
  student,
  currentBatch,
  targetBatches = [],
  getTargetStrength,
  onSubmit,
  saving = false,
}) {
  const [targetBatchId, setTargetBatchId] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [reason, setReason] = useState('')
  const [transferAttendance, setTransferAttendance] = useState(true)
  const [transferFee, setTransferFee] = useState(true)
  const [transferTests, setTransferTests] = useState(true)
  const [errors, setErrors] = useState({})

  const eligibleTargets = useMemo(
    () =>
      targetBatches.filter(
        (b) =>
          String(b.id) !== String(currentBatch?.id) &&
          !NON_TRANSFER_TARGET_STATUSES.includes(b.status || ''),
      ),
    [targetBatches, currentBatch?.id],
  )

  const selectedTarget = eligibleTargets.find((b) => String(b.id) === String(targetBatchId))

  const capacityInfo = useMemo(() => {
    if (!selectedTarget) return null
    const strength = getTargetStrength?.(selectedTarget) ?? selectedTarget.totalStudents ?? 0
    const capacity = getBatchCapacity(selectedTarget.apiRow || selectedTarget)
    const available = getAvailableSeats(capacity, strength)
    const check = canTransferToBatch(selectedTarget.apiRow || selectedTarget, strength)
    return { capacity, strength, available, check }
  }, [selectedTarget, getTargetStrength])

  useEffect(() => {
    if (!open) return
    setTargetBatchId('')
    setTransferDate(new Date().toISOString().slice(0, 10))
    setReason('')
    setTransferAttendance(true)
    setTransferFee(true)
    setTransferTests(true)
    setErrors({})
  }, [open, student?.id])

  const canSubmit =
    capacityInfo?.check?.ok && targetBatchId && reason.trim().length >= 3

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    if (!targetBatchId) next.target = 'Select a target batch'
    if (String(targetBatchId) === String(currentBatch?.id)) {
      next.target = 'Cannot move to the same batch'
    }
    if (!transferDate) next.transferDate = 'Transfer date is required'
    if (!reason.trim()) next.reason = 'Transfer reason is required'
    if (capacityInfo && !capacityInfo.check.ok) {
      next.target = capacityInfo.check.reason
    }
    setErrors(next)
    if (Object.keys(next).length) return

    onSubmit?.({
      targetBatchId,
      transferDate,
      reason: reason.trim(),
      transferAttendance,
      transferFee,
      transferTests,
    })
  }

  if (!student || !currentBatch) return null

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title="Move Student"
      subtitle={`${student.name} · ${student.enrollmentId}`}
      size="md"
      saving={saving}
      footer={
        <BatchModalFooter
          onCancel={onClose}
          submitLabel={saving ? 'Moving…' : 'Move Student'}
          saving={saving}
          submitDisabled={!canSubmit}
          submitForm="move-student-form"
          submitType="submit"
        />
      }
    >
      <form id="move-student-form" onSubmit={handleSubmit} className="space-y-4">
        <BatchField label="Current Batch">
          <input readOnly value={currentBatch.displayName} className={batchInputReadonlyClass} />
        </BatchField>

        <BatchField label="Select New Batch" required>
          <div className="relative">
            <select
              value={targetBatchId}
              onChange={(e) => {
                setTargetBatchId(e.target.value)
                setErrors((x) => ({ ...x, target: undefined }))
              }}
              className={batchSelectClass}
            >
              <option value="">Choose target batch…</option>
              {eligibleTargets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayName} ({b.status})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
          </div>
          {errors.target && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.target}</p>
          )}
        </BatchField>

        {capacityInfo && selectedTarget && (
          <div
            className={cn(
              'rounded-xl p-4 text-sm',
              capacityInfo.available > 0
                ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200',
            )}
          >
            <p>
              <span className="font-semibold">Capacity:</span> {capacityInfo.capacity}
            </p>
            <p>
              <span className="font-semibold">Current Strength:</span> {capacityInfo.strength}
            </p>
            <p>
              <span className="font-semibold">Available Seats:</span> {capacityInfo.available}
            </p>
            {capacityInfo.available <= 0 && (
              <p className="mt-2 flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                No seats available — transfer is disabled.
              </p>
            )}
          </div>
        )}

        <BatchField label="Effective Transfer Date" required>
          <CourseDateInput
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            required
          />
        </BatchField>

        <BatchField label="Transfer Reason" required>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className={batchTextareaClass}
            placeholder="Reason for transfer…"
          />
          {errors.reason && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.reason}</p>
          )}
        </BatchField>

        <div className="grid gap-2">
          <BatchCheckboxCard
            label="Transfer Attendance Records"
            checked={transferAttendance}
            onChange={setTransferAttendance}
          />
          <BatchCheckboxCard
            label="Transfer Fee Records"
            checked={transferFee}
            onChange={setTransferFee}
          />
          <BatchCheckboxCard
            label="Transfer Test Records"
            checked={transferTests}
            onChange={setTransferTests}
          />
        </div>
      </form>
    </BatchFormModalShell>
  )
}
