import { useCallback, useState } from 'react'
import { INITIAL_BATCHES, nextEnrollmentId, nextStudentId } from '../data/batchManagementData'

function buildInitialStudentsMap() {
  const map = {}
  for (const batch of INITIAL_BATCHES) {
    map[batch.id] = batch.students
    if (batch.batchId) map[batch.batchId] = batch.students
  }
  return map
}

export function useBatchStudents() {
  const [studentsByBatchId, setStudentsByBatchId] = useState(buildInitialStudentsMap)

  const getStudents = useCallback(
    (batchKey) => studentsByBatchId[batchKey] ?? [],
    [studentsByBatchId],
  )

  const updateStudents = useCallback((batchKey, updater) => {
    setStudentsByBatchId((prev) => {
      const current = prev[batchKey] ?? []
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [batchKey]: next }
    })
  }, [])

  const addStudent = useCallback(
    (batchKey, form) => {
      const allStudents = Object.values(studentsByBatchId).flat()
      const student = {
        id: nextStudentId(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        enrollmentId: form.enrollmentId || nextEnrollmentId([{ students: allStudents }]),
        paymentStatus: form.paymentStatus,
        attendance: Number(form.attendance) || 0,
        progress: Number(form.progress) || 0,
        status: 'Active',
      }
      updateStudents(batchKey, (students) => [...students, student])
      return student
    },
    [studentsByBatchId, updateStudents],
  )

  const updateStudent = useCallback(
    (batchKey, studentId, form) => {
      updateStudents(batchKey, (students) =>
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
    [updateStudents],
  )

  const deleteStudent = useCallback(
    (batchKey, studentId) => {
      updateStudents(batchKey, (students) => students.filter((s) => s.id !== studentId))
    },
    [updateStudents],
  )

  const toggleStudentStatus = useCallback(
    (batchKey, studentId) => {
      updateStudents(batchKey, (students) =>
        students.map((s) =>
          s.id === studentId
            ? { ...s, status: s.status === 'Active' ? 'In Active' : 'Active' }
            : s,
        ),
      )
    },
    [updateStudents],
  )

  const copyStudentsToBatch = useCallback(
    (sourceKey, targetKey, { conflictMode = 'skip' } = {}) => {
      setStudentsByBatchId((prev) => {
        const source = prev[sourceKey] ?? []
        const target = prev[targetKey] ?? []
        const targetEnrollmentIds = new Set(target.map((s) => s.enrollmentId))
        const nextTarget = [...target]

        for (const student of source) {
          const isDuplicate = targetEnrollmentIds.has(student.enrollmentId)
          if (!isDuplicate) {
            const copy = {
              ...student,
              id: nextStudentId(),
            }
            nextTarget.push(copy)
            targetEnrollmentIds.add(student.enrollmentId)
            continue
          }
          if (conflictMode === 'replace') {
            const idx = nextTarget.findIndex((s) => s.enrollmentId === student.enrollmentId)
            if (idx >= 0) {
              nextTarget[idx] = { ...student, id: nextStudentId() }
            }
          } else if (conflictMode === 'keep_both') {
            nextTarget.push({ ...student, id: nextStudentId() })
          }
        }

        return { ...prev, [targetKey]: nextTarget }
      })
    },
    [],
  )

  const moveStudentToBatch = useCallback(
    (sourceKey, targetKey, studentId) => {
      const source = studentsByBatchId[sourceKey] ?? []
      const target = studentsByBatchId[targetKey] ?? []
      const student = source.find((s) => s.id === studentId)
      if (!student) return null
      if (target.some((s) => s.enrollmentId === student.enrollmentId)) {
        return null
      }
      setStudentsByBatchId((prev) => ({
        ...prev,
        [sourceKey]: (prev[sourceKey] ?? []).filter((s) => s.id !== studentId),
        [targetKey]: [...(prev[targetKey] ?? []), student],
      }))
      return student
    },
    [studentsByBatchId],
  )

  const studentExistsInBatch = useCallback(
    (batchKey, enrollmentId, excludeStudentId) => {
      const list = studentsByBatchId[batchKey] ?? []
      return list.some(
        (s) => s.enrollmentId === enrollmentId && s.id !== excludeStudentId,
      )
    },
    [studentsByBatchId],
  )

  return {
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    copyStudentsToBatch,
    moveStudentToBatch,
    studentExistsInBatch,
  }
}
