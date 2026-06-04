import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  ChevronDown,
  UserPlus,
  Users,
  GraduationCap,
} from 'lucide-react'
import { usePagination } from '../../hooks/usePagination'
import TablePagination from '../figma/TablePagination'
import PaymentStatusBadge from './PaymentStatusBadge'
import ProgressBar from './ProgressBar'
import StudentFormModal from './StudentFormModal'
import StudentViewModal from './StudentViewModal'
import StudentTableActions from './StudentTableActions'
import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import BatchConfirmDialog from './BatchConfirmDialog'
import MoveStudentModal from './MoveStudentModal'
import { PAYMENT_STATUSES, STUDENT_STATUSES } from '../../data/batchManagementData'
import { cn } from '../../utils/cn'

export default function BatchStudentPanel({
  batch,
  students: studentsProp,
  variant = 'embedded',
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onToggleStudentStatus,
  onMoveStudent,
  targetBatches = [],
  getTargetStrength,
}) {
  const students = studentsProp ?? batch.students ?? []
  const isPage = variant === 'page'

  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingStudent, setEditingStudent] = useState(null)
  const [viewStudent, setViewStudent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [moveTarget, setMoveTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim()
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.enrollmentId.toLowerCase().includes(q) ||
        s.phone.includes(q)
      const matchPayment =
        paymentFilter === 'all' || s.paymentStatus === paymentFilter
      const matchAccount =
        accountFilter === 'all' || s.status === accountFilter
      return matchSearch && matchPayment && matchAccount
    })
  }, [students, search, paymentFilter, accountFilter])

  const pagination = usePagination(filteredStudents, {
    initialPageSize: isPage ? 10 : 5,
    resetDeps: [search, paymentFilter, accountFilter, batch.id],
  })

  const openAdd = () => {
    setFormMode('add')
    setEditingStudent(null)
    setFormOpen(true)
  }

  const openEdit = (student) => {
    setFormMode('edit')
    setEditingStudent(student)
    setFormOpen(true)
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
            paymentStatus: editingStudent.paymentStatus,
            attendance: String(editingStudent.attendance),
            progress: String(editingStudent.progress),
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
      ? `edit:${editingStudent.id}`
      : `add:${batch.id}`

  const handleFormSubmit = async (form) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 280))
    if (formMode === 'edit' && editingStudent) {
      onUpdateStudent(batch.id, editingStudent.id, form)
    } else {
      onAddStudent(batch.id, form)
    }
    setSaving(false)
    setFormOpen(false)
    setEditingStudent(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 220))
    onDeleteStudent(batch.id, deleteTarget.id)
    setSaving(false)
    setDeleteTarget(null)
  }

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
              {batch.displayName} · {students.length} enrolled
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(85,172,231,0.4)] transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Filter by payment status"
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-[#333] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/30"
          >
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
        </div>
        <div className="relative w-full sm:w-40">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            aria-label="Filter by account status"
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-[#333] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/30"
          >
            <option value="all">All Accounts</option>
            {STUDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686868]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className={isPage ? 'sticky top-0 z-10' : undefined}>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-[#686868]">
                <th className="px-4 py-3 sm:px-5">Student ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Enrollment Date</th>
                <th className="px-4 py-3">Fee Status</th>
                <th className="px-4 py-3">Attendance %</th>
                <th className="px-4 py-3 min-w-[120px]">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center">
                    {students.length === 0 ? (
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
                pagination.paginatedItems.map((student) => {
                  const isInactive = student.status === 'In Active'
                  return (
                    <tr
                      key={student.id}
                      className={cn(
                        'border-t border-slate-100 transition-colors hover:bg-[#f8fbff]',
                        isInactive && 'bg-slate-50/80 opacity-75',
                      )}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs font-medium text-[#246392] sm:px-5">
                        {student.enrollmentId}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#111]">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cbeeff] text-xs font-bold text-[#246392]">
                            {student.name.slice(0, 2).toUpperCase()}
                          </span>
                          {student.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[#444]">
                        {student.phone}
                      </td>
                      <td className="px-4 py-3.5 text-[#444]">{student.email}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[#444]">
                        {student.enrolledAt || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentStatusBadge status={student.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#333]">
                        {student.attendance}%
                      </td>
                      <td className="px-4 py-3.5">
                        <ProgressBar value={student.progress} />
                      </td>
                      <td className="px-4 py-3.5">
                        <CategoryStatusBadge status={student.status ?? 'Active'} />
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <StudentTableActions
                          status={student.status ?? 'Active'}
                          onView={() => setViewStudent(student)}
                          onEdit={() => openEdit(student)}
                          onMove={
                            onMoveStudent ? () => setMoveTarget(student) : undefined
                          }
                          onDelete={() => setDeleteTarget(student)}
                          onToggleStatus={() =>
                            onToggleStudentStatus(batch.id, student.id)
                          }
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredStudents.length > 0 && (
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
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
        saving={saving}
      />

      <StudentViewModal
        open={Boolean(viewStudent)}
        onClose={() => setViewStudent(null)}
        student={viewStudent}
        batch={batch}
      />

      <BatchConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete student?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name} from ${batch.displayName}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
        loadingLabel="Deleting…"
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
        saving={saving}
        onSubmit={async (values) => {
          setSaving(true)
          try {
            await onMoveStudent?.(moveTarget, values)
            setMoveTarget(null)
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
