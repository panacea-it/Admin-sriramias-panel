import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import BatchFormModalShell from './BatchFormModalShell'
import BatchConfirmDialog from './BatchConfirmDialog'
import {
  BatchField,
  BatchModalFooter,
  batchInputReadonlyClass,
  batchSelectClass,
  batchTextareaClass,
} from './batchModalUi'
import { getBatchesDropdown } from '../../api/batchesAPI'
import { fetchAcademicCourseOptions } from '../../api/academicCoursesAPI'
import { getCentersDropdown, normalizeCentersDropdown } from '../../services/centerService'
import { TRANSFER_REASONS } from '../../data/batchManagementData'
import { resolveBatchDisplayId } from '../../utils/batchHelpers'
import { canTransferToBatch, normalizeBatchUiStatus } from '../../utils/batchOperations'
import { cn } from '../../utils/cn'

const REMARKS_MAX = 300

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatBatchOptionLabel(batch) {
  const batchId = resolveBatchDisplayId(batch)
  const batchName = batch.batchName || batch.name || batch.batchLabel || '—'
  return `${batchId} - ${batchName}`
}

function normalizeDropdownBatch(row) {
  const fd = row.formData || {}
  const id = String(row.id || row._id || '')
  const center = String(row.center || fd.center || '').trim()
  const courseName = row.linkedCourseName || row.courseName || fd.courseName || ''
  const courseId = String(row.academicCourseId || row.courseId || fd.academicCourseId || fd.courseId || '').trim()
  const capacity = Number(row.capacity ?? fd.capacity) > 0 ? Number(row.capacity ?? fd.capacity) : 50
  const totalStudents = Number(row.totalStudents ?? row.studentCount ?? fd.totalStudents ?? 0) || 0

  return {
    id,
    batchId: row.batchId || row.batchCode || fd.batchId,
    batchName: row.batchName || row.name || '',
    center,
    courseId,
    courseName,
    mentorName: row.mentorName || fd.mentorName || row.trainerName || fd.trainerName || '',
    status: normalizeBatchUiStatus(row.status || fd.status),
    capacity,
    totalStudents,
    label: formatBatchOptionLabel(row),
    raw: row,
  }
}

function ReadOnlyField({ label, value }) {
  return (
    <BatchField label={label}>
      <input readOnly value={value || '—'} className={batchInputReadonlyClass} />
    </BatchField>
  )
}

function SectionTitle({ children }) {
  return (
    <h4 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">
      {children}
    </h4>
  )
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
  const [branchId, setBranchId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [targetBatchId, setTargetBatchId] = useState('')
  const [transferDate, setTransferDate] = useState(todayIsoDate)
  const [transferReason, setTransferReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState(null)

  const [dropdownBatches, setDropdownBatches] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [courseOptions, setCourseOptions] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    let active = true
    setLoadingMeta(true)

    Promise.all([
      getBatchesDropdown({ activeOnly: true }),
      getCentersDropdown().catch(() => []),
      fetchAcademicCourseOptions().catch(() => []),
    ])
      .then(([batchResponse, centersResponse, coursesResponse]) => {
        if (!active) return
        const rows = Array.isArray(batchResponse?.data)
          ? batchResponse.data
          : batchResponse?.data?.data || []
        setDropdownBatches(rows)

        const centers = normalizeCentersDropdown(centersResponse)
        setBranchOptions(centers)

        const courses = (coursesResponse || []).map((c) => ({
          id: String(c._id || c.courseId || ''),
          courseId: String(c.courseId || ''),
          label: c.label || c.courseName || '—',
          courseName: c.courseName || '',
        }))
        setCourseOptions(courses)
      })
      .catch(() => {
        if (active) {
          setDropdownBatches([])
          setBranchOptions([])
          setCourseOptions([])
        }
      })
      .finally(() => {
        if (active) setLoadingMeta(false)
      })

    return () => {
      active = false
    }
  }, [open])

  const allBatchOptions = useMemo(() => {
    const source = dropdownBatches.length ? dropdownBatches : targetBatches.map((b) => b.apiRow || b)
    const currentId = String(currentBatch?.id || currentBatch?.apiRow?._id || '')

    return source
      .map((row) => normalizeDropdownBatch(row))
      .filter((row) => row.id && row.id !== currentId && row.status === 'Active')
  }, [dropdownBatches, targetBatches, currentBatch?.id, currentBatch?.apiRow?._id])

  const selectedBranch = branchOptions.find((b) => String(b.value) === String(branchId))

  const filteredCourses = useMemo(() => {
    if (!branchId) return courseOptions
    const branchName = selectedBranch?.centerName || selectedBranch?.label || ''
    if (!branchName) return courseOptions

    const courseIdsInBranch = new Set(
      allBatchOptions
        .filter((b) => b.center && b.center.toLowerCase() === branchName.toLowerCase())
        .map((b) => b.courseId)
        .filter(Boolean),
    )

    if (!courseIdsInBranch.size) return courseOptions
    return courseOptions.filter(
      (c) => courseIdsInBranch.has(c.courseId) || courseIdsInBranch.has(c.id),
    )
  }, [branchId, courseOptions, allBatchOptions, selectedBranch])

  const filteredBatches = useMemo(() => {
    let rows = allBatchOptions

    if (branchId) {
      const branchName = selectedBranch?.centerName || selectedBranch?.label || ''
      if (branchName) {
        rows = rows.filter(
          (b) => !b.center || b.center.toLowerCase() === branchName.toLowerCase(),
        )
      }
    }

    if (courseId) {
      const course = courseOptions.find((c) => String(c.id) === String(courseId) || String(c.courseId) === String(courseId))
      const courseKey = course?.courseId || courseId
      rows = rows.filter(
        (b) =>
          (courseKey && b.courseId === courseKey) ||
          (course?.courseName && b.courseName && b.courseName.toLowerCase() === course.courseName.toLowerCase()),
      )
    }

    return rows.sort((a, b) => a.label.localeCompare(b.label))
  }, [allBatchOptions, branchId, courseId, courseOptions, selectedBranch])

  const selectedTarget = filteredBatches.find((b) => String(b.id) === String(targetBatchId))
    || allBatchOptions.find((b) => String(b.id) === String(targetBatchId))

  useEffect(() => {
    if (!open) return
    setBranchId('')
    setCourseId('')
    setTargetBatchId('')
    setTransferDate(todayIsoDate())
    setTransferReason('')
    setRemarks('')
    setErrors({})
    setConfirmOpen(false)
    setPendingValues(null)
  }, [open, student?.id])

  useEffect(() => {
    setTargetBatchId('')
    setErrors((x) => ({ ...x, batch: undefined }))
  }, [branchId, courseId])

  const resolveTargetStrength = (batchRow) => {
    if (getTargetStrength) {
      const tableBatch = targetBatches.find((b) => String(b.id) === String(batchRow.id))
      if (tableBatch) return getTargetStrength(tableBatch)
    }
    return batchRow.totalStudents ?? 0
  }

  const validate = () => {
    const next = {}

    if (!branchId) next.branch = 'Please select a branch'
    if (!courseId) next.course = 'Please select a course'
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
    if (!transferReason) next.transferReason = 'Please select a transfer reason'
    if (remarks.length > REMARKS_MAX) {
      next.remarks = `Remarks cannot exceed ${REMARKS_MAX} characters`
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const branchLabel = selectedBranch?.centerName || selectedBranch?.label || ''
    const course = courseOptions.find(
      (c) => String(c.id) === String(courseId) || String(c.courseId) === String(courseId),
    )

    setPendingValues({
      targetBatchId,
      branch: branchLabel,
      branchId,
      course: course?.courseName || course?.label || '',
      courseId: course?.courseId || courseId,
      transferDate,
      transferReason,
      remarks: remarks.trim(),
    })
    setConfirmOpen(true)
  }

  const handleConfirmMove = async () => {
    if (!pendingValues) return
    try {
      await onSubmit?.(pendingValues)
      setConfirmOpen(false)
      setPendingValues(null)
    } catch {
      setConfirmOpen(false)
    }
  }

  if (!student || !currentBatch) return null

  const currentBatchLabel =
    currentBatch.displayName ||
    formatBatchOptionLabel(currentBatch.apiRow || currentBatch)

  const currentCourse = currentBatch.courseName || '—'
  const currentMentor = currentBatch.mentorName || currentBatch.trainerName || '—'
  const currentCenter = currentBatch.center || currentBatch.apiRow?.center || '—'

  const confirmTargetLabel = selectedTarget?.label || 'the selected batch'

  return (
    <>
      <BatchFormModalShell
        open={open && !confirmOpen}
        onClose={onClose}
        title="Move Student to Another Batch"
        subtitle={`${student.name} · ${student.enrollmentId}`}
        size="lg"
        saving={saving}
        footer={
          <BatchModalFooter
            onCancel={onClose}
            submitLabel={saving ? 'Moving…' : 'Move Student'}
            saving={saving}
            submitDisabled={loadingMeta}
            submitForm="move-student-form"
            submitType="submit"
          />
        }
      >
        <form id="move-student-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <SectionTitle>Student Information</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Student ID" value={student.enrollmentId} />
              <ReadOnlyField label="Student Name" value={student.name} />
              <ReadOnlyField label="Phone Number" value={student.phone} />
              <ReadOnlyField label="Current Batch" value={currentBatchLabel} />
              <ReadOnlyField label="Current Course" value={currentCourse} />
              <ReadOnlyField label="Current Mentor" value={currentMentor} />
              {currentCenter !== '—' && (
                <ReadOnlyField label="Current Branch" value={currentCenter} />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <SectionTitle>Destination Batch</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <BatchField label="Branch" required>
                <div className="relative">
                  <select
                    value={branchId}
                    disabled={loadingMeta}
                    onChange={(e) => {
                      setBranchId(e.target.value)
                      setErrors((x) => ({ ...x, branch: undefined }))
                    }}
                    className={batchSelectClass}
                  >
                    <option value="">
                      {loadingMeta ? 'Loading branches…' : 'Select branch…'}
                    </option>
                    {branchOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.centerName || b.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
                </div>
                {errors.branch && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.branch}</p>
                )}
              </BatchField>

              <BatchField label="Course" required>
                <div className="relative">
                  <select
                    value={courseId}
                    disabled={loadingMeta || !branchId}
                    onChange={(e) => {
                      setCourseId(e.target.value)
                      setErrors((x) => ({ ...x, course: undefined }))
                    }}
                    className={batchSelectClass}
                  >
                    <option value="">
                      {!branchId ? 'Select branch first…' : 'Select course…'}
                    </option>
                    {filteredCourses.map((c) => (
                      <option key={c.id || c.courseId} value={c.id || c.courseId}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
                </div>
                {errors.course && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.course}</p>
                )}
              </BatchField>

              <BatchField label="Batch" required className="sm:col-span-2">
                <div className="relative">
                  <select
                    value={targetBatchId}
                    disabled={loadingMeta || !courseId}
                    onChange={(e) => {
                      setTargetBatchId(e.target.value)
                      setErrors((x) => ({ ...x, batch: undefined }))
                    }}
                    className={batchSelectClass}
                  >
                    <option value="">
                      {!courseId ? 'Select course first…' : 'Choose destination batch…'}
                    </option>
                    {filteredBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
                </div>
                {errors.batch && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.batch}</p>
                )}
                {selectedTarget && (
                  <p className="mt-1.5 text-xs text-[#686868]">
                    {resolveTargetStrength(selectedTarget)} / {selectedTarget.capacity} seats filled
                  </p>
                )}
              </BatchField>
            </div>
          </div>

          <div className="space-y-3">
            <SectionTitle>Transfer Details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <BatchField label="Effective Transfer Date" required>
                <input
                  type="date"
                  value={transferDate}
                  max={todayIsoDate()}
                  onChange={(e) => {
                    setTransferDate(e.target.value)
                    setErrors((x) => ({ ...x, transferDate: undefined }))
                  }}
                  className={cn(batchInputReadonlyClass, 'bg-white text-[#222]')}
                />
                {errors.transferDate && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.transferDate}</p>
                )}
              </BatchField>

              <BatchField label="Transfer Reason" required>
                <div className="relative">
                  <select
                    value={transferReason}
                    onChange={(e) => {
                      setTransferReason(e.target.value)
                      setErrors((x) => ({ ...x, transferReason: undefined }))
                    }}
                    className={batchSelectClass}
                  >
                    <option value="">Select reason…</option>
                    {TRANSFER_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
                </div>
                {errors.transferReason && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.transferReason}</p>
                )}
              </BatchField>

              <BatchField label="Remarks" className="sm:col-span-2">
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value.slice(0, REMARKS_MAX))
                    setErrors((x) => ({ ...x, remarks: undefined }))
                  }}
                  rows={3}
                  maxLength={REMARKS_MAX}
                  className={batchTextareaClass}
                  placeholder="Optional notes about this transfer…"
                />
                <p className="mt-1 text-right text-xs text-[#9ca0a8]">
                  {remarks.length}/{REMARKS_MAX}
                </p>
                {errors.remarks && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.remarks}</p>
                )}
              </BatchField>
            </div>
          </div>
        </form>
      </BatchFormModalShell>

      <BatchConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!saving) {
            setConfirmOpen(false)
            setPendingValues(null)
          }
        }}
        title="Confirm student move"
        message={`Are you sure you want to move this student to ${confirmTargetLabel}?`}
        confirmLabel="Move Student"
        loading={saving}
        loadingLabel="Moving…"
        onConfirm={handleConfirmMove}
      />
    </>
  )
}
