import { useEffect, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { Layers } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import SearchableSelect from './SearchableSelect'
import { useProgramsByCenter } from '../../hooks/useProgramsByCenter'
import { mapApiExamCategoryToLocal } from '../../utils/examCategoryApiHelpers'
import { toast } from '../../utils/toast'

function buildForm(item) {
  if (item) {
    return {
      centerId: item.centerId || '',
      programId: item.programId || '',
      name: item.name || '',
      status: item.status || 'Active',
    }
  }
  return { centerId: '', programId: '', name: '', status: 'Active' }
}

export default function ExamCategoryFormModal({
  open,
  onClose,
  item,
  onSubmit,
  centreOptions = [],
  centresLoading = false,
  detailLoading = false,
  submitting = false,
}) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(buildForm(null))
  const [errors, setErrors] = useState({})
  const closingRef = useRef(false)
  const itemRef = useRef(item)
  itemRef.current = item
  const editKey = getModalEditKey(item)

  const { programOptions, loading: programsLoading } = useProgramsByCenter(form.centerId)

  useInitOnModalOpen(open, editKey, () => {
    closingRef.current = false
    const mapped = itemRef.current ? mapApiExamCategoryToLocal(itemRef.current) : null
    setForm(buildForm(mapped || itemRef.current))
    setErrors({})
  })

  useEffect(() => {
    if (!open || !item || detailLoading) return
    const mapped = mapApiExamCategoryToLocal(item)
    if (mapped) {
      setForm(buildForm(mapped))
    }
  }, [open, item, detailLoading])

  const handleClose = () => {
    if (closingRef.current || submitting) return
    closingRef.current = true
    setErrors({})
    onClose()
  }

  const handleCentreChange = (centerId) => {
    setForm((f) => ({ ...f, centerId, programId: '' }))
    if (errors.centerId) setErrors((e) => ({ ...e, centerId: undefined }))
    if (errors.programId) setErrors((e) => ({ ...e, programId: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.centerId) next.centerId = 'Centre is required'
    if (!form.programId) next.programId = 'Program is required'
    if (!form.name.trim()) next.name = 'Exam category name is required'
    if (!form.status) next.status = 'Status is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }

    const centre = centreOptions.find((c) => String(c.value) === String(form.centerId))
    const program = programOptions.find((p) => String(p.value) === String(form.programId))

    try {
      await onSubmit(
        {
          centerId: form.centerId,
          centerMongoId: centre?.mongoId || form.centerId,
          centerName: centre?.centerName || centre?.label || '',
          programId: program?.businessProgramId || form.programId,
          programMongoId: program?.mongoId || form.programId,
          program: program?.label || '',
          name: form.name.trim(),
          status: form.status,
        },
        { isEdit, id: item?.id },
      )
      handleClose()
    } catch {
      // Parent shows toast; keep modal open
    }
  }

  const programDisabled = !form.centerId || programsLoading || centresLoading || detailLoading
  const formBusy = submitting || detailLoading

  if (!open) return null

  const title = isEdit ? 'Edit Exam Category' : 'Add Exam Category'

  return (
    <Modal open={open} onClose={handleClose} size="md" title={title} showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={title}
          onClose={handleClose}
          closeVariant="icon"
          plainCloseIcon
          icon={Layers}
          iconClassName="text-[#246392]"
        />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <SectionBar title="Exam Category Details" />

          {detailLoading ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-white px-4 py-8 text-sm font-medium text-[#686868]">
              Loading category details…
            </div>
          ) : (
            <div className="grid gap-4 rounded-xl bg-white px-4 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:grid-cols-2 sm:px-6 sm:py-6">
              <CourseFormField label="Centre" required>
                <SearchableSelect
                  options={centreOptions}
                  value={form.centerId}
                  onChange={handleCentreChange}
                  placeholder={centresLoading ? 'Loading centres…' : 'Select centre'}
                  emptyMessage="No centres available"
                  disabled={centresLoading || formBusy}
                  error={errors.centerId}
                />
              </CourseFormField>

              <CourseFormField label="Program" required>
                <SearchableSelect
                  options={programOptions}
                  value={form.programId}
                  onChange={(programId) => {
                    setForm((f) => ({ ...f, programId }))
                    if (errors.programId) setErrors((e) => ({ ...e, programId: undefined }))
                  }}
                  placeholder={
                    !form.centerId
                      ? 'Select centre first'
                      : programsLoading
                        ? 'Loading programs…'
                        : 'Select program'
                  }
                  emptyMessage={
                    form.centerId
                      ? 'No programs available for this centre'
                      : 'Select a centre first'
                  }
                  disabled={programDisabled || formBusy}
                  error={errors.programId}
                />
              </CourseFormField>

              <CourseFormField label="Exam Category Name" required className="sm:col-span-2">
                <CourseInput
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors((err) => ({ ...err, name: undefined }))
                  }}
                  placeholder="e.g. UPSC"
                  disabled={formBusy}
                />
              </CourseFormField>
              {errors.name && (
                <p className="text-xs font-medium text-[#dc2626] sm:col-span-2">{errors.name}</p>
              )}

              <CourseFormField label="Status" required>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={formBusy}
                  className="h-11 w-full rounded-lg bg-[#e8f4fc] px-4 text-sm font-medium text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60"
                >
                  <option value="Active">Active</option>
                  <option value="In Active">Inactive</option>
                </select>
              </CourseFormField>
            </div>
          )}

          <FormModalSubmitBar
            isEditMode={isEdit}
            isSubmitting={submitting}
            disableSubmit={formBusy || detailLoading}
            disableReset={formBusy || detailLoading}
            onReset={() => {
              setForm(buildForm(item ? mapApiExamCategoryToLocal(item) || item : null))
              setErrors({})
              toast.message('Form reset')
            }}
            createLabel="Save"
            updateLabel="Update"
            loadingLabel={isEdit ? 'Updating…' : 'Saving…'}
          />
        </div>
      </form>
    </Modal>
  )
}
