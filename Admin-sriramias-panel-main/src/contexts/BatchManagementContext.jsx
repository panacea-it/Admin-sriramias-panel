import { createContext, useCallback, useContext, useMemo } from 'react'
import { useBatchStudents } from '../hooks/useBatchStudents'

const BatchManagementContext = createContext(null)

export function resolveStudentKey(row, getStudents) {
  if (!row) return ''
  if (getStudents(row.id).length) return row.id
  if (row.batchId && getStudents(row.batchId).length) return row.batchId
  return row.id
}

export function BatchManagementProvider({ children }) {
  const {
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    copyStudentsToBatch,
    moveStudentToBatch,
    studentExistsInBatch,
  } = useBatchStudents()

  const getStudentCount = useCallback(
    (row) => {
      const key = resolveStudentKey(row, getStudents)
      return getStudents(key).length
    },
    [getStudents],
  )

  const value = useMemo(
    () => ({
      getStudents,
      getStudentCount,
      resolveStudentKey: (row) => resolveStudentKey(row, getStudents),
      addStudent,
      updateStudent,
      deleteStudent,
      toggleStudentStatus,
      copyStudentsToBatch,
      moveStudentToBatch,
      studentExistsInBatch,
    }),
    [
      getStudents,
      getStudentCount,
      addStudent,
      updateStudent,
      deleteStudent,
      toggleStudentStatus,
      copyStudentsToBatch,
      moveStudentToBatch,
      studentExistsInBatch,
    ],
  )

  return (
    <BatchManagementContext.Provider value={value}>
      {children}
    </BatchManagementContext.Provider>
  )
}

export function useBatchManagementContext() {
  const ctx = useContext(BatchManagementContext)
  if (!ctx) {
    throw new Error('useBatchManagementContext must be used within BatchManagementProvider')
  }
  return ctx
}
