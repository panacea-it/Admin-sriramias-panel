import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseDateInput } from '../courses/CourseFormField'
import BatchFormModalShell from './BatchFormModalShell'
import {
  BatchField,
  BatchModalFooter,
  BatchTransferOptionCheckbox,
  batchTextareaClass,
} from './batchModalUi'
import { getBatchesDropdown } from '../../api/batchesAPI'
import { resolveBatchDisplayId, resolveBatchMongoId } from '../../utils/batchHelpers'
import { canTransferToBatch, normalizeBatchUiStatus } from '../../utils/batchOperations'
import { cn } from '../../utils/cn'

const REASON_MAX = 500

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatBatchOptionLabel(batch) {
  const batchId = resolveBatchDisplayId(batch)
  const batchName = batch.batchName || batch.name || batch.batchLabel || '—'
  return `${batchId} - ${batchName}`
}

function normalizeDropdownBatch(row, index = 0) {
  const fd = row.formData || {}
  const mongoId = resolveBatchMongoId(row, []) || String(row._id || '').trim()
  const humanId = resolveBatchDisplayId(row)
  const id = mongoId || humanId || `batch-option-${index}`
  const center = String(row.center || fd.center || '').trim()
  const courseName = row.linkedCourseName || row.courseName || fd.courseName || ''
  const courseId = String(row.academicCourseId || row.courseId || fd.academicCourseId || fd.courseId || '').trim()
  const capacity = Number(row.capacity ?? fd.capacity) > 0 ? Number(row.capacity ?? fd.capacity) : 50
  const totalStudents = Number(row.totalStudents ?? row.studentCount ?? fd.totalStudents ?? 0) || 0

  return {
    id,
    mongoId: mongoId || '',
    batchId: row.batchId || row.batchCode || fd.batchId || humanId,
    batchName: row.batchName || row.name || row.batchLabel || '',
    center,
    courseId,
    courseName,
    status: normalizeBatchUiStatus(row.status || fd.status),
    capacity,
    totalStudents,
    label: formatBatchOptionLabel(row),
    raw: row,
  }
}

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
  const [transferDate, setTransferDate] = useState(todayIsoDate)
  const [transferReason, setTransferReason] = useState('')
  const [transferAttendance, setTransferAttendance] = useState(true)
  const [transferFee, setTransferFee] = useState(true)
  const [notifyStudent, setNotifyStudent] = useState(false)
  const [errors, setErrors] = useState({})

  const [dropdownBatches, setDropdownBatches] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    let active = true
    setLoadingMeta(true)

    getBatchesDropdown({ activeOnly: true })
      .then((batchResponse) => {
        if (!active) return
        const rows = Array.isArray(batchResponse?.data)
          ? batchResponse.data
          : batchResponse?.data?.data || []
        setDropdownBatches(rows)
      })
      .catch(() => {
        if (active) setDropdownBatches([])
      })
      .finally(() => {
        if (active) setLoadingMeta(false)
      })

    return () => {
      active = false
    }
  }, [open])

  const allBatchOptions = useMemo(() => {
    const currentKeys = new Set(
      [
        currentBatch?.id,
        currentBatch?.apiRow?._id,
        currentBatch?.apiRow?.id,
        currentBatch?.batchId,
        currentBatch?.displayBatchId,
      ]
        .filter(Boolean)
        .map((v) => String(v)),
    )

    const fromProps = (targetBatches || []).map((b, i) => normalizeDropdownBatch(b.apiRow || b, i))
    const fromApi = (dropdownBatches || []).map((row, i) => normalizeDropdownBatch(row, i))
    const merged = new Map()

    for (const row of [...fromProps, ...fromApi]) {
      if (!row.id || row.status !== 'Active') continue
      const isCurrent =
        currentKeys.has(String(row.id)) ||
        currentKeys.has(String(row.mongoId)) ||
        currentKeys.has(String(row.batchId))
      if (isCurrent) continue
      const key = row.mongoId || row.id
      if (!merged.has(key)) merged.set(key, row)
    }

    return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [dropdownBatches, targetBatches, currentBatch])

  const batchSelectOptions = useMemo(
    () =>
      allBatchOptions.map((b) => ({
        value: b.id,
        label: b.label,
      })),
    [allBatchOptions],
  )

  const selectedTarget = allBatchOptions.find((b) => String(b.id) === String(targetBatchId))

  useEffect(() => {
    if (!open) return
    setTargetBatchId('')
    setTransferDate(todayIsoDate())
    setTransferReason('')
    setTransferAttendance(true)
    setTransferFee(true)
    setNotifyStudent(false)
    setErrors({})
  }, [open, student?.id])

  const resolveTargetStrength = (batchRow) => {
    if (getTargetStrength) {
      const tableBatch = targetBatches.find((b) => String(b.id) === String(batchRow.id))
      if (tableBatch) return getTargetStrength(tableBatch)
    }
    return batchRow.totalStudents ?? 0
  }

  const validate = () => {
    const next = {}
    const trimmedReason = transferReason.trim()

    if (!targetBatchId) {
      next.batch = 'Please select a destination batch'
    } else if (String(targetBatchId) === String(currentBatch?.id)) {
      next.batch = 'Cannot move to the same batch'
    } else if (selectedTarget && selectedTarget.status !== 'Active') {
      next.batch = 'Selected batch is inactive'
    } else if (selectedTarget) {
      const strength = resolveTargetStrength(selectedTarget)
      const transferCheck = canTransferToBatch(
        { status: selectedTarget.status, capacity: selectedTarget.capacity },
        strength,
      )
      if (!transferCheck.ok) next.batch = transferCheck.reason
    }

    if (!transferDate) next.transferDate = 'Transfer date is required'
    if (!trimmedReason) next.transferReason = 'Transfer reason is required'
    if (trimmedReason.length > REASON_MAX) {
      next.transferReason = `Reason cannot exceed ${REASON_MAX} characters`
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || !selectedTarget) return

    const notifyNote = notifyStudent ? ' [Notify student requested]' : ''

    try {
      await onSubmit?.({
        targetBatchId,
        targetBatchMongoId: selectedTarget.mongoId || selectedTarget.id,
        branch: selectedTarget.center || '',
        branchId: '',
        course: selectedTarget.courseName || '',
        courseId: selectedTarget.courseId || '',
        transferDate,
        transferReason: transferReason.trim(),
        remarks: notifyNote.trim(),
        transferAttendance,
        transferFee,
      })
    } catch {
      /* parent shows error toast */
    }
  }

  if (!student || !currentBatch) return null

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title="Move Student to Another Batch"
      subtitle="Transfer this student to another batch while maintaining enrollment history."
      size="md"
      saving={saving}
      footer={
        <BatchModalFooter
          onCancel={onClose}
          submitLabel={saving ? 'Transferring…' : 'Transfer Student'}
          saving={saving}
          submitDisabled={loadingMeta}
          submitForm="move-student-form"
          submitType="submit"
        />
      }
    >
      <form id="move-student-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Student</p>
          <p className="mt-1 text-sm font-bold text-[#1a3a5c]">{student.name}</p>
          <p className="text-xs text-[#686868]">
            {student.enrollmentId} · {currentBatch.displayName || formatBatchOptionLabel(currentBatch.apiRow || currentBatch)}
          </p>
        </div>

        <BatchField label="Select Batch" required>
          <SearchableSelect
            options={batchSelectOptions}
            value={targetBatchId}
            onChange={(value) => {
              setTargetBatchId(value)
              setErrors((x) => ({ ...x, batch: undefined }))
            }}
            placeholder="Choose destination batch"
            emptyMessage={loadingMeta ? 'Loading batches…' : 'No active batches available'}
            disabled={loadingMeta}
            loading={loadingMeta}
            error={errors.batch}
            triggerClassName={cn(
              'flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm text-gray-800 shadow-sm outline-none transition',
              'hover:border-[#93c5fd] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
            )}
          />
          {selectedTarget && (
            <p className="mt-1.5 text-xs text-[#686868]">
              {resolveTargetStrength(selectedTarget)} / {selectedTarget.capacity} seats filled
            </p>
          )}
        </BatchField>

        <BatchField label="Transfer Reason" required>
          <textarea
            value={transferReason}
            onChange={(e) => {
              setTransferReason(e.target.value.slice(0, REASON_MAX))
              setErrors((x) => ({ ...x, transferReason: undefined }))
            }}
            rows={4}
            maxLength={REASON_MAX}
            className={batchTextareaClass}
            placeholder="Enter reason for transferring this student..."
          />
          <p className="mt-1 text-right text-xs text-[#9ca0a8]">
            {transferReason.length}/{REASON_MAX}
          </p>
          {errors.transferReason && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.transferReason}</p>
          )}
        </BatchField>

        <BatchField label="Effective Transfer Date" required>
          <CourseDateInput
            value={transferDate}
            max={todayIsoDate()}
            onChange={(e) => {
              setTransferDate(e.target.value)
              setErrors((x) => ({ ...x, transferDate: undefined }))
            }}
          />
          {errors.transferDate && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.transferDate}</p>
          )}
        </BatchField>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#686868]">Transfer Options</p>
          <div className="space-y-2.5">
            <BatchTransferOptionCheckbox
              label="Transfer attendance history"
              description="Carry forward attendance records."
              checked={transferAttendance}
              onChange={setTransferAttendance}
            />
            <BatchTransferOptionCheckbox
              label="Transfer payment records"
              description="Keep payment history linked with the student."
              checked={transferFee}
              onChange={setTransferFee}
            />
            <BatchTransferOptionCheckbox
              label="Notify student after transfer"
              description="Send transfer notification after completion."
              checked={notifyStudent}
              onChange={setNotifyStudent}
            />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[#55ace7]/20 bg-[#eef6fc]/80 px-4 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#246392] shadow-sm">
            <Info className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <p className="text-sm leading-relaxed text-[#444]">
            The student will be removed from the current batch and enrolled into the selected batch
            while preserving academic history based on the selected options.
          </p>
        </div>
      </form>
    </BatchFormModalShell>
  )
}
