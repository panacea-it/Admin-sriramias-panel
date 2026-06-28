import { useEffect, useRef } from 'react'

/**
 * Stable identity for modal create vs edit — avoids re-init when parent passes a new object reference.
 */
export function getModalEditKey(record) {
  if (record == null) return '__create__'
  const key =
    record.id ??
    record.blogId ??
    record.programId ??
    record.courseId ??
    record.categoryId ??
    record.subjectId ??
    record.enrollmentId ??
    record.employeeId ??
    record.centerId ??
    record.centerCode
  if (key != null && key !== '') return String(key)
  return '__create__'
}

/**
 * Runs `onInit` only when the modal opens or when the edit identity changes — not on every parent re-render.
 */
export function useInitOnModalOpen(open, editKey, onInit) {
  const wasOpenRef = useRef(false)
  const lastKeyRef = useRef(null)
  const onInitRef = useRef(onInit)
  onInitRef.current = onInit

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    const key = editKey ?? '__create__'
    const shouldInit = !wasOpenRef.current || lastKeyRef.current !== key
    wasOpenRef.current = true
    if (!shouldInit) return
    lastKeyRef.current = key
    onInitRef.current()
  }, [open, editKey])
}
