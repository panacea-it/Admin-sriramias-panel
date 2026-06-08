import { useCallback, useState } from 'react'

/**
 * Shared create/edit modal state for academics (and similar) list pages.
 */
export function useEditModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [duplicateSource, setDuplicateSource] = useState(null)

  const openCreate = useCallback(() => {
    setSelectedItem(null)
    setDuplicateSource(null)
    setIsEditMode(false)
    setIsOpen(true)
  }, [])

  const openEdit = useCallback((row) => {
    setSelectedItem(row)
    setDuplicateSource(null)
    setIsEditMode(true)
    setIsOpen(true)
  }, [])

  const openDuplicate = useCallback((row) => {
    setSelectedItem(null)
    setDuplicateSource(row)
    setIsEditMode(false)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsEditMode(false)
    setSelectedItem(null)
    setDuplicateSource(null)
  }, [])

  return {
    isOpen,
    isEditMode,
    isDuplicateMode: Boolean(duplicateSource),
    selectedItem,
    duplicateSource,
    openCreate,
    openEdit,
    openDuplicate,
    close,
  }
}
