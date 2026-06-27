import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, UserPlus, Users, GraduationCap, Loader2 } from 'lucide-react'
import { usePagination } from '../../hooks/usePagination'
import TablePagination from '../figma/TablePagination'
import PaymentStatusBadge from './PaymentStatusBadge'
import ProgressBar from './ProgressBar'
import StudentFormModal from './StudentFormModal'
import StudentViewModal from './StudentViewModal'
import StudentTableActions from './StudentTableActions'
import StudentEnrollmentStatusBadge from './StudentEnrollmentStatusBadge'
import { isStudentEnrollmentActive } from './studentStatusDisplay'
import BatchConfirmDialog from './BatchConfirmDialog'
import MoveStudentModal from './MoveStudentModal'
import { DEMO_BATCH_STUDENTS } from '../../data/batchStudentDemoData'
import { mapPaymentStatusToUi } from '../../utils/batchApiHelpers'
import { cn } from '../../utils/cn'
import { resolveEnrollmentApiId } from './enrollmentHelpers'
import { toast } from '../../utils/toast'

function StudentTableSkeleton({ rows = 5 }) {
  return Array.from({ length: rows }).map((_, index) => (
    <tr key={`student-skeleton-${index}`} className="border-t border-slate-100">
      {Array.from({ length: 10 }).map((__, cellIndex) => (
        <td key={cellIndex} className="px-4 py-3.5 sm:px-5">
          <div className="h-4 animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  ))
}

export default function BatchStudentPanel({
  batch,
  students: studentsProp,
  variant = 'embedded',
  serverPaginated = false,
  studentsLoading = false,
  searchLoading = false,
  addStudentSaving = false,
  editStudentSaving = false,
  deleteStudentSaving = false,
  moveStudentSaving = false,
  togglingStudentId = null,
  search: controlledSearch,
  onSearchChange,
  page: controlledPage,
  pageSize: controlledPageSize,
  totalItems: controlledTotalItems,
  totalPages: controlledTotalPages,
  startIndex: controlledStartIndex,
  endIndex: controlledEndIndex,
  onPageChange,
  onPageSizeChange,
  viewOpen: controlledViewOpen = false,
  viewStudent: controlledViewStudent,
  viewLoading = false,
  onViewStudent,
  onCloseView,
  onFetchStudentForEdit,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onToggleStudentStatus,
  onMoveStudent,
  targetBatches = [],
  getTargetStrength,
}) {
  const realStudents = studentsProp ?? batch.students ?? []
  const useDemoData = !serverPaginated && !studentsLoading && realStudents.length === 0
  const sourceStudents = useDemoData ? DEMO_BATCH_STUDENTS : realStudents
  const isPage = variant === 'page'

  const [localSearch, setLocalSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingStudent, setEditingStudent] = useState(null)
  const [localViewStudent, setLocalViewStudent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [disableTarget, setDisableTarget] = useState(null)
  const [moveTarget, setMoveTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editPreparing, setEditPreparing] = useState(false)

  const search = serverPaginated ? controlledSearch : localSearch
  const viewStudent = useDemoData || !serverPaginated ? localViewStudent : controlledViewStudent

  const activeSearch = serverPaginated ? controlledSearch : localSearch

  const filteredStudents = useMemo(() => {
    if (serverPaginated && !useDemoData) return sourceStudents
    const q = activeSearch.toLowerCase().trim()
    if (!q) return sourceStudents
    return sourceStudents.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.enrollmentId.toLowerCase().includes(q) ||
        s.phone.includes(q)
      )
    })
  }, [sourceStudents, activeSearch, serverPaginated, useDemoData])

  const clientPagination = usePagination(filteredStudents, {
    initialPageSize: isPage ? 10 : 5,
    resetDeps: [activeSearch, batch.id, useDemoData],
  })

  const useClientDisplay = !serverPaginated || useDemoData
  const displayStudents = useClientDisplay
    ? clientPagination.paginatedItems
    : sourceStudents
  const enrolledCount = useDemoData
    ? DEMO_BATCH_STUDENTS.length
    : serverPaginated
      ? (controlledTotalItems ?? realStudents.length)
      : realStudents.length

  const openAdd = () => {
    setFormMode('add')
    setEditingStudent(null)
    setFormOpen(true)
  }

  const openEdit = async (student) => {
    setFormMode('edit')
    setEditingStudent(student)
    setFormOpen(true)
    if (useDemoData || !onFetchStudentForEdit) return

    setEditPreparing(true)
    try {
      const latest = await onFetchStudentForEdit(student)
      if (latest) setEditingStudent(latest)
    } catch {
      /* keep table row values */
    } finally {
      setEditPreparing(false)
    }
  }

  const formInitial = useMemo(
    () =>
      formMode === 'edit' && editingStudent
        ? {
            name: editingStudent.name,
            email: editingStudent.email,
            phone: editingStudent.phone,
            course: batch.courseName,
            batch: batch.displayName,
            paymentStatus: mapPaymentStatusToUi(editingStudent.paymentStatus),
            attendance: String(editingStudent.attendance ?? 0),
            progress: String(editingStudent.progress ?? 0),
          }
        : {
            course: batch.courseName,
            batch: batch.displayName,
            paymentStatus: 'Pending',
            attendance: '0',
            progress: '0',
          },
    [formMode, editingStudent, batch.courseName, batch.displayName],
  )

  const formSeedKey =
    formMode === 'edit' && editingStudent
      ? `edit:${resolveEnrollmentApiId(editingStudent) || editingStudent.id}:${editingStudent.paymentStatus}:${editingStudent.attendance}:${editingStudent.progress}:${editingStudent.name}`
      : `add:${batch.id}`

  const handleFormSubmit = async (form) => {
    if (saving || addStudentSaving || editStudentSaving || editPreparing) return
    if (useDemoData) {
      setFormOpen(false)
      setEditingStudent(null)
      return
    }
    setSaving(true)
    try {
      if (formMode === 'edit' && editingStudent) {
        await onUpdateStudent?.(
          batch.id,
          resolveEnrollmentApiId(editingStudent),
          form,
        )
        setFormOpen(false)
        setEditingStudent(null)
      } else {
        await onAddStudent?.(batch.id, form)
        setFormOpen(false)
        setEditingStudent(null)
      }
    } catch {
      /* parent shows error toast; keep modal open */
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteStudentSaving) return
    if (useDemoData) {
      setDeleteTarget(null)
      return
    }
    setSaving(true)
    try {
      await onDeleteStudent?.(
        batch.id,
        resolveEnrollmentApiId(deleteTarget) || deleteTarget.id,
      )
      setDeleteTarget(null)
    } catch {
      /* parent shows error toast */
    } finally {
      setSaving(false)
    }
  }

  const handleView = (student) => {
    if (useDemoData) {
      setLocalViewStudent(student)
      return
    }
    if (serverPaginated && onViewStudent) {
      void onViewStudent(student)
      return
    }
    setLocalViewStudent(student)
  }

  const handleCloseView = () => {
    if (useDemoData) {
      setLocalViewStudent(null)
      return
    }
    if (serverPaginated && onCloseView) {
      onCloseView()
      return
    }
    setLocalViewStudent(null)
  }

  const isEmptyWithoutFilters =
    !useDemoData &&
    serverPaginated &&
    !studentsLoading &&
    realStudents.length === 0 &&
    !search?.trim()

  const panelBody = (
    <>
      <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-3', isPage && 'mt-0')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#55ace7]/15 text-[#246392]">
            <Users className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#111]">Student Management</h3>
            <p className="text-sm text-[#686868]">
              <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
              {batch.displayName} · {enrolledCount} enrolled
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={addStudentSaving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(85,172,231,0.4)] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      <div className="mb-4 rounded-xl bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
        <div className="relative min-w-0 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687180]" />
          {searchLoading && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#55ace7]" />
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => {
              const value = e.target.value
              if (serverPaginated) onSearchChange?.(value)
              else setLocalSearch(value)
            }}
            placeholder="Search students..."
            className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead className={isPage ? 'sticky top-0 z-10' : undefined}>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-[#686868]">
                <th className="px-4 py-3.5 sm:px-5">Student ID</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Enrollment Date</th>
                <th className="px-4 py-3.5">Fee Status</th>
                <th className="px-4 py-3.5 text-center">Attendance %</th>
                <th className="px-4 py-3.5 min-w-[120px]">Progress</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="w-[340px] min-w-[340px] px-3 py-3.5 text-right sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentsLoading ? (
                <StudentTableSkeleton rows={isPage ? 6 : 4} />
              ) : displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center">
                    {isEmptyWithoutFilters || (!serverPaginated && realStudents.length === 0) ? (
                      <div className="flex flex-col items-center py-6">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2fc]">
                          <Users className="h-7 w-7 text-[#55ace7]" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-semibold text-[#222]">No students added yet</p>
                        <p className="mt-1 text-sm text-[#686868]">
                          Enroll students to this batch to manage attendance and fees.
                        </p>
                        <button
                          type="button"
                          onClick={openAdd}
                          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-semibold text-white"
                        >
                          <UserPlus className="h-4 w-4" />
                          Add Student
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-[#686868]">
                        No students match your search or filter.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                displayStudents.map((student) => {
                  const isInactive = !isStudentEnrollmentActive(student.status)
                  const studentApiId = resolveEnrollmentApiId(student)
                  const rowBusy =
                    Boolean(togglingStudentId) &&
                    togglingStudentId === studentApiId
                  return (
                    <tr
                      key={studentApiId || student.enrollmentId || student.id}
                      className={cn(
                        'border-t border-slate-100 align-middle transition-colors duration-150',
                        'hover:bg-[#f8fbff] hover:shadow-[inset_3px_0_0_0_#55ace7]',
                        isInactive && 'bg-slate-50/80 opacity-80',
                        rowBusy && 'pointer-events-none opacity-60',
                      )}
                    >
                      <td className="px-4 py-4 align-middle font-mono text-xs font-medium text-[#246392] sm:px-5">
                        {student.enrollmentId}
                      </td>
                      <td className="px-4 py-4 align-middle font-semibold text-[#111]">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cbeeff] text-xs font-bold text-[#246392]">
                            {student.name.slice(0, 2).toUpperCase()}
                          </span>
                          {student.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle text-[#444]">
                        {student.phone}
                      </td>
                      <td className="px-4 py-4 align-middle text-[#444]">{student.email}</td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle text-[#444]">
                        {student.enrolledAt || '—'}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <PaymentStatusBadge status={student.paymentStatus} />
                      </td>
                      <td className="px-4 py-4 align-middle text-center font-semibold text-[#333]">
                        {student.attendance}%
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <ProgressBar value={student.progress} />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <StudentEnrollmentStatusBadge status={student.status} />
                      </td>
                      <td className="w-[340px] min-w-[340px] px-3 py-4 align-middle sm:px-4">
                        <div className="flex justify-end">
                          <StudentTableActions
                            studentName={student.name}
                            status={student.status ?? 'Active'}
                            onView={() => handleView(student)}
                            onEdit={() => void openEdit(student)}
                            onDisable={
                              !useDemoData && isStudentEnrollmentActive(student.status)
                                ? () => setDisableTarget(student)
                                : undefined
                            }
                            onEnable={
                              !useDemoData && !isStudentEnrollmentActive(student.status)
                                ? () =>
                                    onToggleStudentStatus?.(
                                      batch.id,
                                      resolveEnrollmentApiId(student) || student.id,
                                    )
                                : undefined
                            }
                            onMove={onMoveStudent ? () => setMoveTarget(student) : undefined}
                            canMove={Boolean(onMoveStudent)}
                            disabled={rowBusy}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!studentsLoading && filteredStudents.length > 0 && (
          <TablePagination
            page={useClientDisplay ? clientPagination.page : controlledPage}
            pageSize={useClientDisplay ? clientPagination.pageSize : controlledPageSize}
            totalItems={
              useClientDisplay ? clientPagination.totalItems : controlledTotalItems
            }
            totalPages={
              useClientDisplay ? clientPagination.totalPages : controlledTotalPages
            }
            startIndex={
              useClientDisplay ? clientPagination.startIndex : controlledStartIndex
            }
            endIndex={useClientDisplay ? clientPagination.endIndex : controlledEndIndex}
            onPageChange={
              useClientDisplay ? clientPagination.setPage : onPageChange
            }
            onPageSizeChange={
              useClientDisplay ? clientPagination.setPageSize : onPageSizeChange
            }
            itemLabel="students"
            className="bg-slate-50/50"
          />
        )}
      </div>

      <StudentFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingStudent(null)
        }}
        mode={formMode}
        initialValues={formInitial}
        seedKey={formSeedKey}
        onSubmit={handleFormSubmit}
        saving={saving || addStudentSaving || editStudentSaving || editPreparing}
      />

      <StudentViewModal
        key={viewStudent?.id ?? (viewLoading ? 'view-loading' : 'view-empty')}
        open={
          useDemoData
            ? Boolean(localViewStudent)
            : serverPaginated
              ? controlledViewOpen
              : Boolean(localViewStudent)
        }
        onClose={handleCloseView}
        student={viewStudent}
        batch={batch}
        loading={useDemoData ? false : viewLoading}
      />

      <BatchConfirmDialog
        open={Boolean(disableTarget)}
        title="Disable Student"
        message="Are you sure you want to disable this student for this batch? This action can be reversed later."
        confirmLabel="Disable Student"
        variant="warning"
        loading={Boolean(togglingStudentId)}
        loadingLabel="Disabling…"
        onClose={() => setDisableTarget(null)}
        onConfirm={async () => {
          if (!disableTarget) return
          try {
            await onToggleStudentStatus?.(
              batch.id,
              resolveEnrollmentApiId(disableTarget) || disableTarget.id,
            )
            setDisableTarget(null)
          } catch {
            /* parent shows error toast */
          }
        }}
      />

      <BatchConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate"
        message={
          serverPaginated
            ? 'Are you sure you want to permanently delete this student enrollment?'
            : deleteTarget
              ? `Remove ${deleteTarget.name} from ${batch.displayName}? This cannot be undone.`
              : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving || deleteStudentSaving}
        loadingLabel="Deactivating…"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <MoveStudentModal
        open={Boolean(moveTarget)}
        onClose={() => setMoveTarget(null)}
        student={moveTarget}
        currentBatch={batch}
        targetBatches={targetBatches}
        getTargetStrength={getTargetStrength}
        saving={saving || moveStudentSaving}
        onSubmit={async (values) => {
          if (!moveTarget) return
          if (useDemoData) {
            toast.success('Student transfer recorded (demo)')
            setMoveTarget(null)
            return
          }
          if (!onMoveStudent) return
          setSaving(true)
          try {
            await onMoveStudent(moveTarget, values)
            setMoveTarget(null)
          } catch {
            /* parent shows error toast */
          } finally {
            setSaving(false)
          }
        }}
      />
    </>
  )

  if (isPage) {
    return (
      <section className="rounded-2xl bg-gradient-to-b from-[#f0f7fc] to-[#f8fbff] p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-[#55ace7]/15 sm:p-6">
        {panelBody}
      </section>
    )
  }

  return (
    <motion.div
      key={batch.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden border-t border-[#55ace7]/20 bg-gradient-to-b from-[#f0f7fc] to-[#f8fbff]"
    >
      <div className="px-4 py-5 sm:px-8 sm:py-6">{panelBody}</div>
    </motion.div>
  )
}
