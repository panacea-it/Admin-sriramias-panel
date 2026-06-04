import { useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { FolderTree } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import SearchableSelect from './SearchableSelect'
import { useProgramsByCenter } from '../../hooks/useProgramsByCenter'
import { useCategoriesByCenterAndProgram } from '../../hooks/useCategoriesByCenterAndProgram'
import { mapApiExamSubCategoryToLocal } from '../../utils/examSubCategoryApiHelpers'
import { toast } from '../../utils/toast'

function buildForm(item) {
  if (item) {
    return {
      centerId: item.centerId || '',
      programId: item.programId || '',
      examCategoryId: item.examCategoryId || item.categoryId || '',
      name: item.name || '',
      status: item.status || 'Active',
    }
  }
  return {
    centerId: '',
    programId: '',
    examCategoryId: '',
    name: '',
    status: 'Active',
  }
}

function withCurrentOption(options, value, label) {
  if (!value) return options
  const normalizedValue = String(value)
  if (options.some((option) => String(option.value) === normalizedValue)) {
    return options
  }
  if (!label) return options
  return [...options, { value: normalizedValue, label }]
}

export default function ExamSubCategoryFormModal({
  open,
  onClose,
  isEditMode = false,
  item,
  onSubmit,
  centreOptions = [],
  centresLoading = false,
  detailLoading = false,
  submitting = false,
}) {
  const isEdit = isEditMode
  const [form, setForm] = useState(buildForm(null))
  const [errors, setErrors] = useState({})
  const closingRef = useRef(false)
  const itemRef = useRef(item)
  itemRef.current = item
  const editKey = getModalEditKey(item)

  const { programOptions, loading: programsLoading } = useProgramsByCenter(form.centerId)
  const { categoryOptions: examCategoryOptions, loading: categoriesLoading } =
    useCategoriesByCenterAndProgram(form.centerId, form.programId)

  const centreSelectOptions = useMemo(
    () => withCurrentOption(centreOptions, form.centerId, item?.centerName),
    [centreOptions, form.centerId, item?.centerName],
  )

  const programSelectOptions = useMemo(
    () => withCurrentOption(programOptions, form.programId, item?.program),
    [programOptions, form.programId, item?.program],
  )

  const categorySelectOptions = useMemo(
    () =>
      withCurrentOption(examCategoryOptions, form.examCategoryId, item?.examCategory),
    [examCategoryOptions, form.examCategoryId, item?.examCategory],
  )

  useInitOnModalOpen(open, isEdit ? `__edit__:${editKey}` : editKey, () => {
    closingRef.current = false
    if (!isEdit) {
      setForm(buildForm(null))
      setErrors({})
    }
  })

  useEffect(() => {
    if (!open || detailLoading) return

    if (isEdit && item) {
      const mapped = mapApiExamSubCategoryToLocal(item) || item
      setForm(buildForm(mapped))
      setErrors({})
      return
    }

    if (!isEdit) {
      setForm(buildForm(null))
      setErrors({})
    }
  }, [open, isEdit, item, detailLoading, editKey])

  const handleClose = () => {
    if (closingRef.current || submitting) return
    closingRef.current = true
    setErrors({})
    onClose()
  }

  const handleCentreChange = (centerId) => {
    setForm((f) => ({ ...f, centerId, programId: '', examCategoryId: '' }))
    setErrors((e) => ({
      ...e,
      centerId: undefined,
      programId: undefined,
      examCategoryId: undefined,
    }))
  }

  const handleProgramChange = (programId) => {
    setForm((f) => ({ ...f, programId, examCategoryId: '' }))
    setErrors((e) => ({ ...e, programId: undefined, examCategoryId: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.centerId) next.centerId = 'Centre is required'
    if (!form.programId) next.programId = 'Program is required'
    if (!form.examCategoryId) next.examCategoryId = 'Exam category is required'
    if (!form.name.trim()) next.name = 'Sub-category name is required'
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

    const centre = centreSelectOptions.find(
      (c) => String(c.value) === String(form.centerId),
    )
    const program = programSelectOptions.find(
      (p) => String(p.value) === String(form.programId),
    )
    const category = categorySelectOptions.find(
      (c) => String(c.value) === String(form.examCategoryId),
    )

    try {
      await onSubmit(
        {
          centerId: form.centerId,
          centerName: centre?.label || item?.centerName || '',
          programId: form.programId,
          program: program?.label || item?.program || '',
          examCategoryId: form.examCategoryId,
          examCategory: category?.label || item?.examCategory || '',
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

  const programDisabled =
    !form.centerId || programsLoading || centresLoading || detailLoading
  const categoryDisabled =
    !form.programId || categoriesLoading || programsLoading || detailLoading
  const formBusy = submitting || detailLoading

  if (!open) return null

  const title = isEdit ? 'Edit Exam Sub-Category' : 'Add Exam Sub-Category'

  return (
    <Modal open={open} onClose={handleClose} size="md" title={title}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={title}
          onClose={handleClose}
          closeVariant="icon"
          icon={FolderTree}
          iconClassName="text-[#246392]"
        />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <SectionBar title="Sub-Category Details" />

          {detailLoading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl bg-white px-4 py-8 text-sm font-medium text-[#686868]">
              Loading sub-category details…
            </div>
          ) : (
            <div className="grid gap-4 rounded-xl bg-white px-4 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:grid-cols-2 sm:px-6 sm:py-6">
              <CourseFormField label="Centre" required>
                <SearchableSelect
                  options={centreSelectOptions}
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
                  options={programSelectOptions}
                  value={form.programId}
                  onChange={handleProgramChange}
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
                  disabled={programDisabled}
                  error={errors.programId}
                />
              </CourseFormField>

              <CourseFormField label="Exam Category" required className="sm:col-span-2">
                <SearchableSelect
                  options={categorySelectOptions}
                  value={form.examCategoryId}
                  onChange={(examCategoryId) => {
                    setForm((f) => ({ ...f, examCategoryId }))
                    if (errors.examCategoryId) {
                      setErrors((e) => ({ ...e, examCategoryId: undefined }))
                    }
                  }}
                  placeholder={
                    !form.programId
                      ? 'Select program first'
                      : categoriesLoading
                        ? 'Loading categories…'
                        : 'Select exam category'
                  }
                  emptyMessage={
                    form.programId
                      ? 'No exam categories available for this program'
                      : 'Select a program first'
                  }
                  disabled={categoryDisabled}
                  error={errors.examCategoryId}
                />
              </CourseFormField>

              <CourseFormField label="Exam Sub-Category Name" required className="sm:col-span-2">
                <CourseInput
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors((err) => ({ ...err, name: undefined }))
                  }}
                  placeholder="e.g. Prelims Test Series"
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
            disableSubmit={formBusy}
            disableReset={formBusy}
            onReset={() => {
              const mapped = item ? mapApiExamSubCategoryToLocal(item) || item : null
              setForm(buildForm(mapped))
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
