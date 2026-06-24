import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { LayoutGrid, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import CentreMultiSelect from './CentreMultiSelect'
import { formatCategoryStatusDisplayLabel } from '../../utils/categoryStatusHelpers'
import { mapApiStatusToUi } from '../../utils/programHelpers'
import { toast } from '../../utils/toast'

function buildForm(program) {
  if (program) {
    return {
      programId: program.programId || program.id,
      name: program.name || '',
      description: program.description || '',
      status: program.status || mapApiStatusToUi(program.status),
      courseIds: program.courseIds || [],
      centerIds: (program.centerIds || []).map(String),
    }
  }
  return {
    programId: '',
    name: '',
    description: '',
    status: 'Active',
    courseIds: [],
    centerIds: [],
  }
}

export default function ProgramFormModal({
  open,
  onClose,
  program,
  onSubmit,
  centres = [],
  loadingCentres = false,
  detailLoading = false,
  submitting = false,
}) {
  const isEdit = Boolean(program)
  const [form, setForm] = useState(buildForm(null))
  const [errors, setErrors] = useState({})
  const closingRef = useRef(false)
  const programRef = useRef(program)
  programRef.current = program
  const editKey = getModalEditKey(program)

  useInitOnModalOpen(open, editKey, () => {
    closingRef.current = false
    setForm(buildForm(programRef.current))
    setErrors({})
  })

  const handleClose = () => {
    if (closingRef.current || submitting) return
    closingRef.current = true
    setErrors({})
    onClose()
  }

  const handleReset = () => {
    setForm(buildForm(program))
    setErrors({})
    toast.message('Form reset')
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Program name is required'
    if (!form.centerIds?.length) next.centers = 'Select at least one centre'
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

    try {
      await onSubmit(
        {
          programId: form.programId,
          name: form.name.trim(),
          description: form.description,
          status: form.status,
          courseIds: form.courseIds,
          centerIds: form.centerIds,
        },
        { isEdit, id: program?.id },
      )
    } catch {
      /* parent shows toast */
    }
  }

  if (!open) return null

  const title = isEdit ? 'Edit Program' : 'Add Program'

  return (
    <Modal open={open} onClose={handleClose} size="lg" title={title} showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={title}
          onClose={handleClose}
          closeVariant="icon"
          plainCloseIcon
          icon={LayoutGrid}
          iconClassName="text-[#246392]"
        />

        {detailLoading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-2 px-6 py-12 text-sm font-medium text-[#686868]">
            <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
            Loading program…
          </div>
        ) : (
          <div className="max-h-[min(72vh,640px)] space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <SectionBar title="Program Details" />

            <div className="space-y-4 rounded-xl bg-white px-4 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:px-6 sm:py-6">
              <CourseFormField label="Program Name" required>
                <CourseInput
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors((err) => ({ ...err, name: undefined }))
                  }}
                  placeholder="e.g. UPSC Complete Program"
                  autoFocus
                  disabled={submitting}
                />
              </CourseFormField>
              {errors.name && (
                <p className="text-xs font-medium text-[#dc2626]">{errors.name}</p>
              )}

              <CourseFormField label="Centre Name" required>
                <CentreMultiSelect
                  centres={centres}
                  selectedIds={form.centerIds}
                  loading={loadingCentres}
                  onChange={(ids) => {
                    setForm((f) => ({ ...f, centerIds: ids }))
                    if (errors.centers) setErrors((err) => ({ ...err, centers: undefined }))
                  }}
                />
              </CourseFormField>
              {errors.centers && (
                <p className="text-xs font-medium text-[#dc2626]">{errors.centers}</p>
              )}

              <CourseFormField label="Status" required>
                <select
                  value={form.status}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, status: e.target.value }))
                    if (errors.status) setErrors((err) => ({ ...err, status: undefined }))
                  }}
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#111] outline-none focus:ring-2 focus:ring-[#55ace7]/40"
                >
                  <option value="Active">{formatCategoryStatusDisplayLabel('Active')}</option>
                  <option value="In Active">{formatCategoryStatusDisplayLabel('In Active')}</option>
                </select>
              </CourseFormField>
              {errors.status && (
                <p className="text-xs font-medium text-[#dc2626]">{errors.status}</p>
              )}
            </div>

            <FormModalSubmitBar
              isEditMode={isEdit}
              onReset={handleReset}
              createLabel={submitting ? 'Saving…' : 'Create Program'}
              updateLabel={submitting ? 'Saving…' : 'Update Program'}
            />
          </div>
        )}
      </form>
    </Modal>
  )
}
