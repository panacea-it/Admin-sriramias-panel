import { useState } from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from './ModalPanelHeader'
import SectionBar from './SectionBar'
import { CourseFormField, CourseInput } from './CourseFormField'
import { cn } from '../../utils/cn'

function StatusBadge({ status }) {
  const active = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        active ? 'bg-[#69df66]' : 'bg-[#efb36d]',
      )}
    >
      {status}
    </span>
  )
}

export default function ModifyCategoryModal({
  open,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) {
  const [newName, setNewName] = useState('')

  const handleClose = () => {
    setNewName('')
    onClose()
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error('Enter a category name')
      return
    }
    onAddCategory?.(newName.trim())
    setNewName('')
    toast.success('Category added')
  }

  return (
    <Modal open={open} onClose={handleClose} size="full">
      <div className="overflow-hidden rounded-xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader title="Modify Course Category" onBack={handleClose} />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Add New Category" />
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <CourseFormField label="Category Name" required className="flex-1">
              <CourseInput
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter category name"
              />
            </CourseFormField>
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-6 text-sm font-bold text-white shadow-[0_4px_12px_rgba(26,58,92,0.35)] transition hover:bg-[#152f4a] sm:mb-0"
            >
              Add Category
            </button>
          </form>

          <SectionBar title="Modify Existing Category" />

          <div className="overflow-hidden rounded-t-md bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)]">
            <div className="overflow-x-auto">
              <table className="min-w-[520px] w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-sm font-semibold text-white sm:text-base">
                    <th className="px-6 py-3">Course Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b border-slate-100 text-sm font-medium text-[#111] last:border-0 sm:text-base"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-4">
                          <span className="h-6 w-6 shrink-0 rounded bg-[#cbeeff]" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={cat.status} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-[#686868] transition hover:text-[#246392]"
                          >
                            <Edit3 className="h-4 w-4" strokeWidth={2.35} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCategory?.(cat.id)
                              toast.success('Category removed')
                            }}
                            className="inline-flex items-center gap-2 text-[#c96565] transition hover:text-[#b94b4b]"
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
  )
}
