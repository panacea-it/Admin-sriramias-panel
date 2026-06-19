import { useState } from 'react'
import { Edit3 } from 'lucide-react'
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
