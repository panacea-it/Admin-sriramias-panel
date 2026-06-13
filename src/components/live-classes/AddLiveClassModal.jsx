import { Radio } from 'lucide-react'
import { toast } from '@/utils/toast'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import {
  CourseFormField,
  CourseInput,
  CourseSelect,
  CourseTextarea,
} from '../courses/CourseFormField'
import { LIVE_CLASS_CENTERS } from '../../data/liveClassesData'
import {
  createEmptyLiveClassForm,
  liveClassRowToForm,
} from '../../utils/academicsFormMappers'
import { useModalForm } from '../../hooks/useModalForm'

export default function AddLiveClassModal({ open, onClose, item, onSubmit }) {
  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    liveClassRowToForm,
    createEmptyLiveClassForm,
  )

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleClose = () => {
    onClose()
  }

  const handleReset = () => {
    reset()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.faculty.trim() || !form.scheduledAt) {
      toast.error('Please fill required live class details')
      return
    }
    onSubmit?.(form, { isEdit: isEditMode, id: item?.id })
    toast.success(
      isEditMode ? 'Live class updated successfully' : 'Live class scheduled successfully',
    )
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={isEditMode ? 'Edit Live Class' : 'Schedule Live Class'}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Live Class' : 'Schedule Live Class'}
          onBack={handleClose}
          icon={Radio}
        />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Live Class Details 23444 " />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CourseFormField label="Class Title" required>
              <CourseInput value={form.title} onChange={update('title')} />
            </CourseFormField>
            <CourseFormField label="Faculty" required>
              <CourseInput value={form.faculty} onChange={update('faculty')} />
            </CourseFormField>
            <CourseFormField label="Center" required>
              <CourseSelect value={form.center} onChange={update('center')}>
                {LIVE_CLASS_CENTERS.filter((c) => c !== 'All Centers').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>
            <CourseFormField label="Schedule" required>
              <CourseInput type="datetime-local" value={form.scheduledAt} onChange={update('scheduledAt')} />
            </CourseFormField>
            <CourseFormField label="Duration">
              <CourseInput value={form.duration} onChange={update('duration')} placeholder="e.g. 90 min" />
            </CourseFormField>
            <CourseFormField label="Status" required>
              <CourseSelect value={form.status} onChange={update('status')}>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="In Active">In Active</option>
              </CourseSelect>
            </CourseFormField>
            <CourseFormField label="Meeting Link" className="sm:col-span-2 lg:col-span-3">
              <CourseInput value={form.meetingLink} onChange={update('meetingLink')} placeholder="https://" />
            </CourseFormField>
            <CourseFormField label="Description" className="sm:col-span-2 lg:col-span-3">
              <CourseTextarea value={form.description} onChange={update('description')} rows={4} />
            </CourseFormField>
          </div>

          <FormModalSubmitBar
            isEditMode={isEditMode}
            onReset={handleReset}
            className="pt-2"
            createLabel="Create"
            updateLabel="Update"
          />
        </div>
      </form>
    </Modal>
  )
}
