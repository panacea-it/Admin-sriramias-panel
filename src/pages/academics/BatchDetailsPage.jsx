import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookMarked } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import BatchDetailsInfoCard from '../../components/batch-management/BatchDetailsInfoCard'
import BatchDetailsSkeleton from '../../components/batch-management/BatchDetailsSkeleton'
import BatchStudentPanel from '../../components/batch-management/BatchStudentPanel'
import AddCourseModal from '../../components/courses/AddCourseModal'
import PageBanner from '../../components/figma/PageBanner'
import { BATCHES_BASE } from '../../constants/batchNav'
import { useEditModal } from '../../hooks/useEditModal'
import { useBatchesData } from '../../hooks/useBatchesData'
import { useBatchEnrollments } from '../../hooks/useBatchEnrollments'
import { useBatchAudit } from '../../hooks/useBatchAudit'
import { usePermissions } from '../../hooks/usePermissions'
import {
  enrichBatchRow,
  findBatchRow,
  mapBatchRowToTableFormat,
  resolveBatchMongoId,
  resolveBatchDisplayId,
} from '../../utils/batchHelpers'
import { BATCH_AUDIT_TYPES } from '../../utils/batchAuditStorage'
import { createBatch, fetchBatchByIdResolved, updateBatch } from '../../api/batchesAPI'
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollmentById,
  moveEnrollment,
  updateEnrollment,
  updateEnrollmentStatus,
} from '../../services/batchEnrollmentService'
import { resolveApiBaseUrl } from '../../api/axiosInstance'
import { BASE_URL } from '../../config/api'
import { getApiErrorMessage } from '../../utils/apiError'
import { getAuthToken } from '../../utils/authStorage'
import { toast, TOAST_DURATION } from '../../utils/toast'
import {
  buildEnrollmentRowFromEdit,
  fetchEnrollmentForEdit,
  findEnrollmentInList,
  resolveEnrollmentApiId,
  resolveLatestEnrollmentStudent,
} from '../../components/batch-management/enrollmentHelpers'
import { isStudentEnrollmentActive } from '../../components/batch-management/studentStatusDisplay'
import { STUDENT_MOVE_ROLES } from '../../constants/roles'
import { canTransferToBatch, normalizeBatchUiStatus } from '../../utils/batchOperations'

const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Batch', path: BATCHES_BASE },
  { label: 'Batch Details' },
]

const ADD_STUDENT_FALLBACK = 'Unable to add student. Please try again.'

function validateBatchApiContext({ selectedBatch, batchId, token, baseUrl }) {
  if (!selectedBatch) return 'Unable to load batch details'
  if (!batchId) return 'Missing batch id'
  if (!token) return 'Authentication required'
  if (!baseUrl) return 'API base URL is not configured'
  return null
}

export default function BatchDetailsPage() {
  const { batchId: routeBatchId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navBatchRow = location.state?.batchRow ?? null
  const modal = useEditModal()
  const { sourceRows, loading: listLoading, loadBatches } = useBatchesData({
    page: 1,
    limit: 500,
    enabled: Boolean(routeBatchId),
  })
  const [apiRow, setApiRow] = useState(() =>
    navBatchRow ? enrichBatchRow(navBatchRow) : null,
  )
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState(null)
  const [addingStudent, setAddingStudent] = useState(false)
  const [editingStudent, setEditingStudent] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState(false)
  const [togglingStudentId, setTogglingStudentId] = useState(null)
  const [movingStudent, setMovingStudent] = useState(false)
  const [viewStudent, setViewStudent] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const fetchRequestRef = useRef(0)
  const viewFetchRef = useRef(0)
  const { logBatchActivity, adminName } = useBatchAudit()
  const { hasRole } = usePermissions()
  const canMoveStudent = hasRole(...STUDENT_MOVE_ROLES)

  const selectedBatch = useMemo(
    () => findBatchRow(sourceRows, routeBatchId),
    [sourceRows, routeBatchId],
  )

  const mongoBatchId = useMemo(
    () => resolveBatchMongoId(apiRow || selectedBatch || routeBatchId, sourceRows),
    [apiRow, selectedBatch, routeBatchId, sourceRows],
  )

  const {
    students,
    meta: studentsMeta,
    loading: studentsLoading,
    searchLoading,
    error: studentsError,
    search,
    paymentFilter,
    accountFilter,
    page: studentsPage,
    pageSize: studentsPageSize,
    setSearch,
    setPaymentFilter,
    setAccountFilter,
    setPage: setStudentsPage,
    setPageSize: setStudentsPageSize,
    refetchStudents,
    refetchStudentsAfterMutation,
    mergeEnrollmentUpdate,
  } = useBatchEnrollments(mongoBatchId, { enabled: Boolean(mongoBatchId) })

  const refetchBatchDetails = useCallback(async () => {
    const validationError = validateBatchApiContext({
      selectedBatch: apiRow || selectedBatch,
      batchId: mongoBatchId,
      token: getAuthToken(),
      baseUrl: resolveApiBaseUrl() || BASE_URL,
    })
    if (validationError) return null

    const refreshed = await fetchBatchByIdResolved(mongoBatchId || routeBatchId, {
      rows: sourceRows,
    })
    if (refreshed) setApiRow(enrichBatchRow(refreshed))
    return refreshed
  }, [apiRow, selectedBatch, mongoBatchId, routeBatchId, sourceRows])

  useEffect(() => {
    if (!routeBatchId) return undefined

    const navCached =
      navBatchRow && findBatchRow([enrichBatchRow(navBatchRow)], routeBatchId)
        ? enrichBatchRow(navBatchRow)
        : null
    const listCached = findBatchRow(sourceRows, routeBatchId)
    const cached = listCached || navCached

    if (cached) setApiRow(enrichBatchRow(cached))

    const requestId = ++fetchRequestRef.current
    const ac = new AbortController()
    let active = true
    setDetailLoading(true)
    setDetailError(null)

    fetchBatchByIdResolved(routeBatchId, { rows: sourceRows, signal: ac.signal })
      .then((row) => {
        if (!active || requestId !== fetchRequestRef.current) return
        if (row) {
          setApiRow(enrichBatchRow(row))
          setDetailError(null)
          return
        }
        if (cached) {
          setDetailError(null)
          return
        }
        if (!listLoading) {
          setApiRow(null)
          setDetailError('Unable to load batch details')
        }
      })
      .catch((err) => {
        if (!active || requestId !== fetchRequestRef.current) return
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        if (cached) {
          setDetailError(null)
          return
        }
        if (!listLoading) {
          setApiRow(null)
          setDetailError(getApiErrorMessage(err, 'Failed to load batch'))
        }
      })
      .finally(() => {
        if (active && requestId === fetchRequestRef.current) setDetailLoading(false)
      })

    return () => {
      active = false
      ac.abort()
    }
  }, [routeBatchId, sourceRows, listLoading, navBatchRow])

  const batch = useMemo(() => {
    if (!apiRow) return null
    const total = studentsMeta.total ?? apiRow.totalStudents ?? apiRow.studentCount ?? 0
    return mapBatchRowToTableFormat(apiRow, students, total)
  }, [apiRow, students, studentsMeta.total])

  const allTableBatches = useMemo(
    () =>
      sourceRows.map((row) =>
        mapBatchRowToTableFormat(
          row,
          [],
          row.totalStudents ?? row.studentCount ?? 0,
        ),
      ),
    [sourceRows],
  )

  const listState = location.state?.listState

  const backToList = useCallback(() => {
    navigate(BATCHES_BASE, { state: listState ? { listState } : undefined })
  }, [navigate, listState])

  const getTargetStrength = useCallback((targetBatch) => {
    return targetBatch.totalStudents ?? 0
  }, [])

  const handleSaveBatch = useCallback(
    async (form, { isEdit, id }) => {
      if (!form.academicCourseId?.trim() && !form.courseId?.trim()) {
        toast.error('Please select a course')
        return
      }

      const saveBatchId = resolveBatchMongoId(id ?? mongoBatchId, sourceRows)
      if (!saveBatchId) {
        toast.error('Missing batch id')
        return
      }

      if (isEdit && id != null) {
        await updateBatch(saveBatchId, form)
        toast.success('Batch updated')
      } else {
        await createBatch(form)
        toast.success('Batch created')
      }
      await loadBatches()
      await refetchBatchDetails()
      await refetchStudents({ silent: true })
    },
    [mongoBatchId, sourceRows, loadBatches, refetchBatchDetails, refetchStudents],
  )

  const handleAddStudent = useCallback(
    async (_tableBatchId, form) => {
      if (addingStudent) return

      const validationError = validateBatchApiContext({
        selectedBatch: apiRow || selectedBatch,
        batchId: mongoBatchId,
        token: getAuthToken(),
        baseUrl: resolveApiBaseUrl() || BASE_URL,
      })
      if (validationError) {
        toast.error(validationError)
        throw new Error(validationError)
      }

      setAddingStudent(true)
      try {
        await createEnrollment({
          studentName: String(form.name || '').trim(),
          email: String(form.email || '').trim(),
          mobileNumber: String(form.phone || '').trim(),
          batchId: mongoBatchId,
          paymentStatus: form.paymentStatus || 'Pending',
          attendancePercentage: Number(form.attendance) || 0,
          courseProgressPercentage: Number(form.progress) || 0,
        })
        toast.success('Student Added Successfully')
        await refetchStudentsAfterMutation()
        await refetchBatchDetails()
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') throw err
        toast.error(getApiErrorMessage(err, ADD_STUDENT_FALLBACK))
        throw err
      } finally {
        setAddingStudent(false)
      }
    },
    [
      addingStudent,
      apiRow,
      selectedBatch,
      mongoBatchId,
      refetchStudentsAfterMutation,
      refetchBatchDetails,
    ],
  )

  const handleFetchStudentForEdit = useCallback(
    async (student) =>
      fetchEnrollmentForEdit(student, { students, getEnrollmentById }),
    [students],
  )

  const handleUpdateStudent = useCallback(
    async (_tableBatchId, studentId, form) => {
      const enrollmentId = resolveEnrollmentApiId({
        enrollmentApiId: studentId,
        id: studentId,
        enrollmentId: studentId,
      })
      if (!enrollmentId) {
        toast.error('Missing enrollment id')
        throw new Error('Missing enrollment id')
      }
      if (editingStudent) {
        throw new Error('Update already in progress')
      }

      const baseStudent =
        findEnrollmentInList(students, {
          enrollmentApiId: enrollmentId,
          id: enrollmentId,
          enrollmentId,
        }) || students.find((s) => resolveEnrollmentApiId(s) === enrollmentId)

      setEditingStudent(true)
      try {
        const putResult = await updateEnrollment(enrollmentId, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          paymentStatus: form.paymentStatus,
          attendance: form.attendance,
          progress: form.progress,
        })

        const optimistic = buildEnrollmentRowFromEdit(baseStudent || {}, form, putResult)
        mergeEnrollmentUpdate(optimistic)

        const listResult = await refetchStudentsAfterMutation()
        const fromList = findEnrollmentInList(listResult?.students || [], {
          enrollmentApiId: enrollmentId,
          id: enrollmentId,
          enrollmentId: baseStudent?.enrollmentId || enrollmentId,
        })

        const latest = fromList
          ? {
              ...fromList,
              name: optimistic.name,
              email: optimistic.email,
              phone: optimistic.phone,
              paymentStatus: optimistic.paymentStatus,
              attendance: optimistic.attendance,
              progress: optimistic.progress,
            }
          : optimistic

        mergeEnrollmentUpdate(latest)

        if (viewOpen && resolveEnrollmentApiId(viewStudent) === enrollmentId) {
          setViewStudent(latest)
        }

        toast.success('Student updated')
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') throw err
        toast.error(getApiErrorMessage(err, 'Failed to update student'))
        throw err
      } finally {
        setEditingStudent(false)
      }
    },
    [
      students,
      editingStudent,
      mergeEnrollmentUpdate,
      refetchStudentsAfterMutation,
      viewOpen,
      viewStudent,
    ],
  )

  const handleDeleteStudent = useCallback(
    async (_tableBatchId, studentId) => {
      const enrollmentId = resolveEnrollmentApiId({
        enrollmentApiId: studentId,
        id: studentId,
        enrollmentId: studentId,
      })
      if (deletingStudent || !enrollmentId) {
        if (!enrollmentId) toast.error('Missing enrollment id')
        return
      }
      setDeletingStudent(true)
      try {
        await deleteEnrollment(enrollmentId)
        toast.success('Student deleted successfully')
        if (viewOpen && resolveEnrollmentApiId(viewStudent) === enrollmentId) {
          setViewOpen(false)
          setViewStudent(null)
          setViewLoading(false)
        }
        const result = await refetchStudentsAfterMutation()
        if (result?.students?.length === 0 && studentsPage > 1) {
          setStudentsPage(studentsPage - 1)
        }
        await refetchBatchDetails()
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') throw err
        toast.error(getApiErrorMessage(err, 'Failed to delete student'))
        throw err
      } finally {
        setDeletingStudent(false)
      }
    },
    [
      deletingStudent,
      refetchStudentsAfterMutation,
      refetchBatchDetails,
      studentsPage,
      setStudentsPage,
      viewOpen,
      viewStudent,
    ],
  )

  const handleToggleStudentStatus = useCallback(
    async (_tableBatchId, studentId) => {
      const enrollmentId = resolveEnrollmentApiId({
        enrollmentApiId: studentId,
        id: studentId,
        enrollmentId: studentId,
      })
      if (togglingStudentId || !enrollmentId) {
        if (!enrollmentId) toast.error('Missing enrollment id')
        return
      }
      const student = students.find((s) => resolveEnrollmentApiId(s) === enrollmentId)
      if (!student) return

      const nextStatus = isStudentEnrollmentActive(student.status) ? 'In Active' : 'Active'
      setTogglingStudentId(enrollmentId)
      try {
        await updateEnrollmentStatus(enrollmentId, nextStatus)
        toast.success(nextStatus === 'Active' ? 'Student enabled' : 'Student disabled')
        await refetchStudentsAfterMutation()
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        toast.error(getApiErrorMessage(err, 'Failed to update student status'))
      } finally {
        setTogglingStudentId(null)
      }
    },
    [students, togglingStudentId, refetchStudentsAfterMutation],
  )

  const handleMoveStudent = useCallback(
    async (student, values) => {
      const enrollmentId = resolveEnrollmentApiId(student)
      if (movingStudent || !enrollmentId) {
        if (!enrollmentId) toast.error('Missing enrollment id')
        return
      }

      const targetRow = findBatchRow(sourceRows, values.targetBatchId)
      const targetBatch = allTableBatches.find(
        (b) => String(b.id) === String(values.targetBatchId),
      )
      if (!targetRow && !targetBatch) {
        toast.error('Invalid target batch')
        return
      }
      if (!batch?.id || String(values.targetBatchId) === String(batch.id)) {
        toast.error('Cannot move to the same batch')
        return
      }
      const targetStatus = targetBatch?.status || targetRow?.status
      if (targetStatus && normalizeBatchUiStatus(targetStatus) !== 'Active') {
        toast.error('Cannot move student to an inactive batch')
        return
      }

      const targetStrength = getTargetStrength(targetBatch || { totalStudents: targetRow?.totalStudents ?? 0 })
      const capacityRow = targetBatch?.apiRow || targetRow || targetBatch
      const transferCheck = canTransferToBatch(
        { status: targetStatus || 'Active', capacity: targetBatch?.capacity ?? capacityRow?.capacity },
        targetStrength,
      )
      if (!transferCheck.ok) {
        toast.error(transferCheck.reason)
        return
      }

      const targetBatchMongoId = resolveBatchMongoId(
        values.targetBatchId,
        sourceRows,
      )
      if (!targetBatchMongoId) {
        toast.error('Missing target batch id')
        return
      }

      const destinationLabel = targetRow
        ? `${resolveBatchDisplayId(targetRow)} - ${targetRow.batchName || targetRow.name || ''}`.trim()
        : `${resolveBatchDisplayId(targetBatch?.apiRow || targetBatch)} - ${targetBatch?.batchName || targetBatch?.batchLabel || ''}`.trim()

      setMovingStudent(true)
      try {
        await moveEnrollment(enrollmentId, {
          batchId: targetBatchMongoId,
          transferDate: values.transferDate,
          transferReason: values.transferReason,
          branch: values.branch,
          course: values.course,
          remarks: values.remarks,
          performedBy: adminName,
          transferAttendance: true,
          transferFee: true,
          transferTests: true,
        })

        const batchNameOnly =
          targetRow?.batchName ||
          targetRow?.name ||
          targetBatch?.batchName ||
          targetBatch?.batchLabel ||
          destinationLabel

        const auditMeta = {
          studentId: student.enrollmentId,
          studentName: student.name,
          oldBatch: batch.displayName,
          newBatch: destinationLabel,
          course: values.course || batch.courseName,
          branch: values.branch || batch.center || '',
          transferDate: values.transferDate,
          transferReason: values.transferReason,
          remarks: values.remarks || '',
          performedBy: adminName,
        }

        logBatchActivity(batch.id, {
          type: BATCH_AUDIT_TYPES.STUDENT_MOVED,
          message: `${student.name} moved to ${destinationLabel}.`,
          meta: auditMeta,
        })
        logBatchActivity(targetBatch?.id || values.targetBatchId, {
          type: BATCH_AUDIT_TYPES.STUDENT_MOVED,
          message: `${student.name} transferred from ${batch.displayName}.`,
          meta: auditMeta,
        })

        toast.success(`Student successfully moved to ${batchNameOnly}`, {
          duration: TOAST_DURATION.short,
        })
        await refetchStudentsAfterMutation()
        await refetchBatchDetails()
        await loadBatches({ silent: true })
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') throw err
        toast.error(getApiErrorMessage(err, 'Unable to move student. Please try again.'))
        throw err
      } finally {
        setMovingStudent(false)
      }
    },
    [
      movingStudent,
      allTableBatches,
      batch,
      sourceRows,
      adminName,
      logBatchActivity,
      refetchStudentsAfterMutation,
      refetchBatchDetails,
      loadBatches,
      getTargetStrength,
    ],
  )

  const handleCloseView = useCallback(() => {
    setViewOpen(false)
    setViewStudent(null)
    setViewLoading(false)
  }, [])

  const handleViewStudent = useCallback(
    async (student) => {
      const requestId = ++viewFetchRef.current

      setViewOpen(true)
      setViewStudent(null)
      setViewLoading(true)

      try {
        const latest = await resolveLatestEnrollmentStudent({
          student,
          students,
          refetchStudents: refetchStudentsAfterMutation,
        })
        if (requestId !== viewFetchRef.current) return
        const resolved = latest || student
        setViewStudent(resolved)
        if (resolved) mergeEnrollmentUpdate(resolved)
      } catch (err) {
        if (requestId !== viewFetchRef.current) return
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        toast.error(getApiErrorMessage(err, 'Failed to load enrollment details'))
        setViewStudent(student)
      } finally {
        if (requestId === viewFetchRef.current) setViewLoading(false)
      }
    },
    [students, refetchStudentsAfterMutation, mergeEnrollmentUpdate],
  )

  const shouldRedirect = !detailLoading && !listLoading && !batch

  useEffect(() => {
    if (detailError && !shouldRedirect) toast.error(detailError)
  }, [detailError, shouldRedirect])

  useEffect(() => {
    if (studentsError) toast.error(studentsError)
  }, [studentsError])

  const showSkeleton = (detailLoading || listLoading) && !batch

  const studentsStartIndex =
    studentsMeta.total === 0 ? 0 : (studentsMeta.page - 1) * studentsPageSize
  const studentsEndIndex = Math.min(studentsStartIndex + students.length, studentsMeta.total)

  if (shouldRedirect) {
    return <Navigate to={BATCHES_BASE} replace />
  }

  if (showSkeleton) {
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
          serverPaginated
          studentsLoading={studentsLoading}
          searchLoading={searchLoading}
          addStudentSaving={addingStudent}
          editStudentSaving={editingStudent}
          deleteStudentSaving={deletingStudent}
          moveStudentSaving={movingStudent}
          togglingStudentId={togglingStudentId}
          search={search}
          onSearchChange={setSearch}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          accountFilter={accountFilter}
          onAccountFilterChange={setAccountFilter}
          page={studentsPage}
          pageSize={studentsPageSize}
          totalItems={studentsMeta.total}
          totalPages={studentsMeta.pages}
          startIndex={studentsStartIndex}
          endIndex={studentsEndIndex}
          onPageChange={setStudentsPage}
          onPageSizeChange={setStudentsPageSize}
          viewOpen={viewOpen}
          viewStudent={viewStudent}
          viewLoading={viewLoading}
          onViewStudent={handleViewStudent}
          onCloseView={handleCloseView}
          onFetchStudentForEdit={handleFetchStudentForEdit}
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onToggleStudentStatus={handleToggleStudentStatus}
          onMoveStudent={canMoveStudent ? handleMoveStudent : undefined}
          canMoveStudent={canMoveStudent}
          targetBatches={allTableBatches}
          getTargetStrength={getTargetStrength}
        />
      </section>

      <AddCourseModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        existingBatches={sourceRows}
        onSubmit={handleSaveBatch}
      />
    </motion.div>
  )
}
