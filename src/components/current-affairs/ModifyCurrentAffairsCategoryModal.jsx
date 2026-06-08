import { useEffect, useRef, useState } from 'react'
import { Edit3, ImageIcon, Layers, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import { CourseFormField, CourseInput, CourseSelect } from '../courses/CourseFormField'
import { StatusBadge } from '../academics/AcademicsUi'
import ConfirmDeleteDialog from '../subjects/ConfirmDeleteDialog'
import { cn } from '../../utils/cn'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'

const CHECKBOX_CLASS =
  'h-4 w-4 shrink-0 cursor-pointer rounded border-[#55ace7]/40 text-[#246392] accent-[#246392] focus:ring-[#55ace7]/50'

function nextCategoryStatus(status) {
  return status === 'Active' ? 'In Active' : 'Active'
}

export default function ModifyCurrentAffairsCategoryModal({
  open,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const imageRef = useRef(null)
  const [name, setName] = useState('')
  const [imageName, setImageName] = useState('')
  const [uploadError, setUploadError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editStatus, setEditStatus] = useState('Active')
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      setSelectedIds([])
      setDeleteTarget(null)
    }
  }, [open])

  const handleClose = () => {
    setName('')
    setImageName('')
    setUploadError(null)
    setEditingId(null)
    setSelectedIds([])
    onClose()
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Enter a category name')
      return
    }
    onAddCategory?.({ name: name.trim(), imageName })
    setName('')
    setImageName('')
    if (imageRef.current) imageRef.current.value = ''
    toast.success('Category added')
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditStatus(cat.status || 'Active')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditStatus('Active')
  }

  const saveEdit = () => {
    if (!editName.trim()) {
      toast.error('Category name is required')
      return
    }
    onUpdateCategory?.({
      id: editingId,
      name: editName.trim(),
      status: editStatus,
    })
    cancelEdit()
  }

  const toggleCategoryStatus = (cat) => {
    if (editingId === cat.id) return
    onUpdateCategory?.({
      id: cat.id,
      name: cat.name,
      status: nextCategoryStatus(cat.status || 'Active'),
    })
  }

  const pageIds = categories.map((c) => c.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const someSelected = pageIds.some((id) => selectedIds.includes(id))

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 0))
      const ids = deleteTarget.ids || [deleteTarget.id]
      ids.forEach((id) => onDeleteCategory?.(id))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      if (editingId && ids.includes(editingId)) cancelEdit()
      toast.success(ids.length > 1 ? `${ids.length} categories removed` : 'Category removed')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} size="full">
        <div className="overflow-hidden rounded-xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
          <ModalPanelHeader
            title="Add Current Affairs Category"
            onClose={handleClose}
            icon={Layers}
            closeVariant="icon"
          />

          <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
            <SectionBar title="Add New Category" />
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
              <CourseFormField label="Category Name" required>
                <CourseInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                />
              </CourseFormField>
              <CourseFormField label="Background Image" required>
                <div className="relative">
                  <CourseInput
                    readOnly
                    value={imageName}
                    placeholder="Upload background image"
                    className="pr-12"
                  />
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const result = await validateUploadFile(file, 'IMAGE_BANNER')
                      if (!result.valid) {
                        setUploadError(result.message)
                        e.target.value = ''
                        return
                      }
                      setUploadError(null)
                      setImageName(file.name)
                    }}
                  />
                  <ImageIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
                </div>
                <UploadFieldHint profile="IMAGE_BANNER" />
                <UploadValidationMessage message={uploadError} />
              </CourseFormField>
              <div className="flex items-end sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1a3a5c] px-8 text-sm font-bold text-white shadow-[0_4px_12px_rgba(26,58,92,0.35)] transition hover:bg-[#152f4a]"
                >
                  Add Category
                </button>
              </div>
            </form>

            <SectionBar title="Modify Existing Category" />

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#55ace7]/20 bg-white px-4 py-2.5">
                <span className="text-sm font-semibold text-[#246392]">
                  {selectedIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget({
                      ids: selectedIds,
                    })
                  }
                  className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-[#c96565]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete selected
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-t-md bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)]">
              <div className="overflow-x-auto">
                <table className="min-w-[520px] w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-sm font-semibold text-white sm:text-base">
                      <th className="w-12 px-4 py-3 sm:pl-5">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected
                          }}
                          onChange={() => {
                            if (allSelected) setSelectedIds([])
                            else setSelectedIds([...pageIds])
                          }}
                          aria-label="Select all categories"
                          className="h-4 w-4 rounded border-white/40 bg-white/20 text-[#246392] accent-[#246392] focus:ring-white/50"
                        />
                      </th>
                      <th className="px-4 py-3">Course Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className={cn(
                          'border-b border-slate-100 text-sm font-medium text-[#111] last:border-0 sm:text-base',
                          cat.id % 2 === 0 && 'bg-slate-50/60',
                        )}
                      >
                        <td className="px-4 py-3.5 sm:pl-5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cat.id)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(cat.id)
                                  ? prev.filter((x) => x !== cat.id)
                                  : [...prev, cat.id],
                              )
                            }}
                            aria-label={`Select ${cat.name}`}
                            className={CHECKBOX_CLASS}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          {editingId === cat.id ? (
                            <CourseInput
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Category name"
                              autoFocus
                            />
                          ) : (
                            <span>{cat.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {editingId === cat.id ? (
                            <CourseSelect
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                            >
                              <option value="Active">Active</option>
                              <option value="In Active">In Active</option>
                            </CourseSelect>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleCategoryStatus(cat)}
                              className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50"
                              aria-label={`Toggle status for ${cat.name}, currently ${cat.status}`}
                            >
                              <StatusBadge status={cat.status} />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-wrap items-center gap-4">
                            {editingId === cat.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="text-sm font-semibold text-[#246392] hover:underline"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="text-sm font-medium text-[#686868] hover:underline"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(cat)}
                                className="inline-flex items-center gap-2 text-[#686868] transition hover:text-[#246392]"
                              >
                                <Edit3 className="h-4 w-4" strokeWidth={2.35} />
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                              disabled={editingId === cat.id}
                              className="inline-flex items-center gap-2 text-[#c96565] transition hover:text-[#b94b4b] disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.ids?.length > 1 ? 'Delete selected categories?' : 'Delete category?'
        }
        message={
          deleteTarget?.ids?.length > 1
            ? `Delete ${deleteTarget.ids.length} categories? Entries using them will be marked Uncategorized.`
            : `Delete "${deleteTarget?.name || 'this category'}"? Entries using it will be marked Uncategorized.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        loading={deleteLoading}
      />
    </>
  )
}
