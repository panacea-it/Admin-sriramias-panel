import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  INITIAL_BATCHES,
  nextEnrollmentId,
  nextStudentId,
} from '../data/batchManagementData'

function syncBatchDisplayName(batch) {
  return {
    ...batch,
    displayName: `${batch.courseName} - ${batch.batchLabel}`,
  }
}

export function useBatchManagement() {
  const [batches, setBatches] = useState(INITIAL_BATCHES)
  const [loading, setLoading] = useState(true)
  const [expandedBatchId, setExpandedBatchId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const batchesWithCounts = useMemo(
    () =>
      batches.map((b) => ({
        ...b,
        totalStudents: b.students.length,
      })),
    [batches],
  )

  const filteredBatches = useMemo(() => {
    const q = search.toLowerCase().trim()
    return batchesWithCounts.filter((batch) => {
      const matchSearch =
        !q ||
        batch.batchId?.toLowerCase().includes(q) ||
        batch.displayName.toLowerCase().includes(q) ||
        batch.courseName.toLowerCase().includes(q) ||
        batch.batchLabel.toLowerCase().includes(q) ||
        batch.trainerName.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || batch.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [batchesWithCounts, search, statusFilter])

  const toggleBatch = useCallback((batchId) => {
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId))
  }, [])

  const updateBatchStudents = useCallback((batchId, updater) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b
        const students = typeof updater === 'function' ? updater(b.students) : updater
        return syncBatchDisplayName({ ...b, students })
      }),
    )
  }, [])

  const addStudent = useCallback(
    (batchId, form) => {
      const student = {
        id: nextStudentId(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        enrollmentId: form.enrollmentId || nextEnrollmentId(batches),
        paymentStatus: form.paymentStatus,
        attendance: Number(form.attendance) || 0,
        progress: Number(form.progress) || 0,
        status: 'Active',
      }
      updateBatchStudents(batchId, (students) => [...students, student])
      return student
    },
    [batches, updateBatchStudents],
  )

  const updateStudent = useCallback(
    (batchId, studentId, form) => {
      updateBatchStudents(batchId, (students) =>
        students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                paymentStatus: form.paymentStatus,
                attendance: Number(form.attendance) || 0,
                progress: Number(form.progress) || 0,
              }
            : s,
        ),
      )
    },
    [updateBatchStudents],
  )

  const deleteStudent = useCallback(
    (batchId, studentId) => {
      updateBatchStudents(batchId, (students) =>
        students.filter((s) => s.id !== studentId),
      )
    },
    [updateBatchStudents],
  )

  const toggleStudentStatus = useCallback(
    (batchId, studentId) => {
      updateBatchStudents(batchId, (students) =>
        students.map((s) =>
          s.id === studentId
            ? { ...s, status: s.status === 'Active' ? 'In Active' : 'Active' }
            : s,
        ),
      )
    },
    [updateBatchStudents],
  )

  const getBatch = useCallback(
    (batchId) => batchesWithCounts.find((b) => b.id === batchId),
    [batchesWithCounts],
  )

  return {
    batches: batchesWithCounts,
    filteredBatches,
    loading,
    setLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    expandedBatchId,
    toggleBatch,
    setExpandedBatchId,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    getBatch,
  }
}
