import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from './modalFormSync'

/**
 * Syncs modal form state when opened for create vs edit.
 * Re-initializes only on open or when the edited record identity changes.
 */
export function useModalForm(open, item, rowToForm, createEmpty, options = {}) {
  const { forceCreateMode = false } = options
  const itemRef = useRef(item)
  itemRef.current = item
  const rowToFormRef = useRef(rowToForm)
  rowToFormRef.current = rowToForm
  const createEmptyRef = useRef(createEmpty)
  createEmptyRef.current = createEmpty

  const editKey = forceCreateMode
    ? item
      ? `create:${getModalEditKey(item)}`
      : '__create__'
    : getModalEditKey(item)
  const isEditMode =
    !forceCreateMode && editKey !== '__create__' && item != null

  const [form, setForm] = useState(() => createEmptyRef.current())
  const [initialSnapshot, setInitialSnapshot] = useState(null)

  useInitOnModalOpen(open, editKey, () => {
    const current = itemRef.current
    const next = current ? rowToFormRef.current(current) : createEmptyRef.current()
    setForm(next)
    setInitialSnapshot(structuredClone(next))
  })

  const reset = () => {
    setForm(initialSnapshot ? structuredClone(initialSnapshot) : createEmptyRef.current())
  }

  const clear = () => {
    const empty = createEmptyRef.current()
    setForm(empty)
    setInitialSnapshot(structuredClone(empty))
  }

  return { form, setForm, isEditMode, reset, clear, editKey }
}
