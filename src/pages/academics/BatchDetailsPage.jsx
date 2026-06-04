import { useCallback, useMemo } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookMarked } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import BatchDetailsInfoCard from '../../components/batch-management/BatchDetailsInfoCard'
import BatchDetailsSkeleton from '../../components/batch-management/BatchDetailsSkeleton'
import BatchStudentPanel from '../../components/batch-management/BatchStudentPanel'
import AddCourseModal from '../../components/courses/AddCourseModal'
import PageBanner from '../../components/figma/PageBanner'
import { useBatchManagementContext } from '../../contexts/BatchManagementContext'
import { BATCHES_BASE } from '../../constants/batchNav'
import { useEditModal } from '../../hooks/useEditModal'
import { findBatchRow, useBatchesData } from '../../hooks/useBatchesData'
import { useBatchAudit } from '../../hooks/useBatchAudit'
import { mapCourseToApiPayload } from '../../utils/coursesApiMappers'
import {
  mapBatchRowToTableFormat,
  nextBatchId,
} from '../../utils/batchHelpers'
import { BATCH_AUDIT_TYPES } from '../../utils/batchAuditStorage'
import { createCourse, updateCourse } from '../../api/coursesAPI'
import { toast } from '../../utils/toast'

const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Batch', path: BATCHES_BASE },
  { label: 'Batch Details' },
]

export default function BatchDetailsPage() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const modal = useEditModal()
  const { sourceRows, loading, loadBatches, apiBatches, existingCourseIds } = useBatchesData()
  const {
    getStudents,
    getStudentCount,
    resolveStudentKey,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    moveStudentToBatch,
    studentExistsInBatch,
  } = useBatchManagementContext()
  const { logBatchActivity } = useBatchAudit()

  const apiRow = useMemo(
    () => findBatchRow(sourceRows, batchId),
    [sourceRows, batchId],
  )

  const studentKey = useMemo(
    () => (apiRow ? resolveStudentKey(apiRow) : ''),
    [apiRow, resolveStudentKey],
  )

  const students = useMemo(
    () => (studentKey ? getStudents(studentKey) : []),
    [getStudents, studentKey],
  )

  const batch = useMemo(() => {
    if (!apiRow) return null
    return mapBatchRowToTableFormat(apiRow, students)
  }, [apiRow, students])

  const allTableBatches = useMemo(
    () =>
      sourceRows.map((row) =>
        mapBatchRowToTableFormat(row, [], getStudentCount(row)),
      ),
    [sourceRows, getStudentCount],
  )

  const listState = location.state?.listState

  const backToList = useCallback(() => {
    navigate(BATCHES_BASE, { state: listState ? { listState } : undefined })
  }, [navigate, listState])

  const getTargetStrength = useCallback(
    (targetBatch) => {
      const row = targetBatch.apiRow ?? apiBatches.find((b) => b.id === targetBatch.id)
      if (!row) return targetBatch.totalStudents ?? 0
      const key = resolveStudentKey(row)
      return getStudents(key).length
    },
    [apiBatches, getStudents, resolveStudentKey],
  )

  const handleSaveBatch = async (form, { isEdit, id }) => {
    const existing = isEdit ? apiBatches.find((b) => b.id === id) : null
    const newBatchId = form.batchId || existing?.batchId || nextBatchId(apiBatches)
    const courseId = form.courseId || existing?.courseId
    if (!courseId) {
      toast.error('Please select a course')
      return
    }
    const payload = mapCourseToApiPayload(
      {
        ...form,
        batchId: newBatchId,
        courseId,
        academicCourseId: form.academicCourseId,
        courseName: form.courseName,
        status: form.status || 'Active',
      },
      existing,
    )

    if (isEdit && id != null) {
      await updateCourse(id, payload)
      toast.success('Batch updated')
    } else {
      await createCourse(payload)
      toast.success('Batch created')
    }
    await loadBatches()
  }

  const handleAddStudent = (tableBatchId, form) => {
    addStudent(studentKey, form)
    toast.success(`${form.name} enrolled successfully`)
  }

  const handleUpdateStudent = (_tableBatchId, studentId, form) => {
    updateStudent(studentKey, studentId, form)
    toast.success('Student updated')
  }

  const handleDeleteStudent = (_tableBatchId, studentId) => {
    deleteStudent(studentKey, studentId)
    toast.success('Student removed from batch')
  }

  const handleToggleStudentStatus = (_tableBatchId, studentId) => {
    const student = students.find((s) => s.id === studentId)
    const next = student?.status === 'Active' ? 'In Active' : 'Active'
    toggleStudentStatus(studentKey, studentId)
    toast.success(next === 'Active' ? 'Student enabled' : 'Student disabled')
  }

  const handleMoveStudent = async (student, values) => {
    const targetBatch = allTableBatches.find(
      (b) => String(b.id) === String(values.targetBatchId),
    )
    if (!targetBatch) {
      toast.error('Invalid target batch')
      return
    }
    if (String(values.targetBatchId) === String(batch.id)) {
      toast.error('Cannot move to the same batch')
      return
    }
    const targetRow = targetBatch.apiRow ?? apiBatches.find((b) => b.id === targetBatch.id)
    const targetKey = resolveStudentKey(targetRow)
    if (studentExistsInBatch(targetKey, student.enrollmentId, null)) {
      toast.error('Student already exists in the target batch')
      return
    }
    const moved = moveStudentToBatch(studentKey, targetKey, student.id)
    if (!moved) {
      toast.error('Failed to move student')
      return
    }
    logBatchActivity(batch.id, {
      type: BATCH_AUDIT_TYPES.STUDENT_MOVED,
      message: `${student.name} moved to ${targetBatch.displayName}. Reason: ${values.reason}`,
      meta: values,
    })
    logBatchActivity(targetBatch.id, {
      type: BATCH_AUDIT_TYPES.STUDENT_MOVED,
      message: `${student.name} transferred from ${batch.displayName}`,
      meta: values,
    })
    toast.success('Student moved successfully')
  }

  if (!loading && !batch) {
    return <Navigate to={BATCHES_BASE} replace />
  }

  if (loading || !batch) {
    return <BatchDetailsSkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6"
    >
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <CategoryBreadcrumb items={BREADCRUMB} />

        <PageBanner
          icon={BookMarked}
          iconClassName="text-[#dc2626]"
          title="Batch Details"
          className="sticky top-0 z-20 from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={backToList}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#f8fbff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Batch List
          </button>
        </div>

        <BatchDetailsInfoCard batch={batch} onEdit={() => modal.openEdit(apiRow)} />

        <BatchStudentPanel
          variant="page"
          batch={batch}
          students={students}
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onToggleStudentStatus={handleToggleStudentStatus}
          onMoveStudent={handleMoveStudent}
          targetBatches={allTableBatches}
          getTargetStrength={getTargetStrength}
        />
      </section>

      <AddCourseModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={handleSaveBatch}
        existingCourseIds={existingCourseIds}
      />
    </motion.div>
  )
}
