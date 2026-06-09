import { useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { BookOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import SearchableSelect from './SearchableSelect'
import CourseMarketingSections from './CourseMarketingSections'
import { useCourseFormDropdowns } from '../../hooks/useCourseFormDropdowns'
import { withCurrentSelectOption } from '../../utils/courseDropdownApiHelpers'
import {
  academicCourseItemToContent,
  createEmptyAcademicCourseContent,
  serializeAcademicCourseContent,
} from '../../utils/academicCourseForm'
import { validateCreateCourseContent } from '../../utils/courseApiHelpers'
import { toast } from '../../utils/toast'

function buildHierarchyForm(item) {
  if (item) {
    return {
      name: item.name || '',
      centerId: item.centerId ? String(item.centerId) : '',
      programId: item.programId ? String(item.programId) : '',
      examCategoryId: item.examCategoryId ? String(item.examCategoryId) : '',
      examSubCategoryId: item.examSubCategoryId ? String(item.examSubCategoryId) : '',
      status: item.status || 'Active',
    }
  }
  return {
    name: '',
    centerId: '',
    programId: '',
    examCategoryId: '',
    examSubCategoryId: '',
    status: 'Active',
  }
}

function buildFullForm(item) {
  return {
    ...buildHierarchyForm(item),
    ...academicCourseItemToContent(item),
  }
}

export default function CourseFormModal({ open, onClose, item, onSubmit, submitting = false }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(() => ({
    ...buildHierarchyForm(null),
    ...createEmptyAcademicCourseContent(),
  }))
  const [errors, setErrors] = useState({})
  const closingRef = useRef(false)
  const itemRef = useRef(item)
  itemRef.current = item
  const editKey = getModalEditKey(item)

  const {
    centerOptions,
    programOptions,
    categoryOptions,
    subCategoryOptions,
    centerLoading,
    programLoading,
    categoryLoading,
    subCategoryLoading,
    clearDependentOptions,
  } = useCourseFormDropdowns({
    open,
    centerId: form.centerId,
    programId: form.programId,
    categoryId: form.examCategoryId,
  })

  useInitOnModalOpen(open, editKey, () => {
    closingRef.current = false
    setForm(buildFullForm(itemRef.current))
    setErrors({})
  })

  const centreSelectOptions = useMemo(
    () => withCurrentSelectOption(centerOptions, form.centerId, item?.centerName),
    [centerOptions, form.centerId, item?.centerName],
  )

  const programSelectOptions = useMemo(
    () => withCurrentSelectOption(programOptions, form.programId, item?.program),
    [programOptions, form.programId, item?.program],
  )

  const examCategorySelectOptions = useMemo(
    () => withCurrentSelectOption(categoryOptions, form.examCategoryId, item?.examCategory),
    [categoryOptions, form.examCategoryId, item?.examCategory],
  )

  const examSubCategorySelectOptions = useMemo(
    () =>
      withCurrentSelectOption(
        subCategoryOptions,
        form.examSubCategoryId,
        item?.examSubCategory,
      ),
    [subCategoryOptions, form.examSubCategoryId, item?.examSubCategory],
  )

  const handleClose = () => {
    if (closingRef.current || submitting) return
    closingRef.current = true
    setErrors({})
    onClose()
  }

  const handleCentreChange = (centerId) => {
    setForm((f) => ({
      ...f,
      centerId,
      programId: '',
      examCategoryId: '',
      examSubCategoryId: '',
    }))
    clearDependentOptions()
    setErrors({})
  }

  const handleReset = () => {
    setForm(buildFullForm(itemRef.current))
    setErrors({})
  }

  const validateHierarchy = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Course name is required'
    if (!form.centerId) next.centerId = 'Centre is required'
    if (!form.programId) next.programId = 'Program is required'
    if (!form.examCategoryId) next.examCategoryId = 'Exam category is required'
    if (!form.examSubCategoryId) next.examSubCategoryId = 'Exam subcategory is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const hierarchyOk = validateHierarchy()
    const contentErrs = isEdit ? {} : validateCreateCourseContent(form)
    if (!hierarchyOk || Object.keys(contentErrs).length) {
      if (Object.keys(contentErrs).length) setErrors((prev) => ({ ...prev, ...contentErrs }))
      toast.error('Please fix the highlighted fields')
      return
    }

    const centre = centreSelectOptions.find((c) => String(c.value) === String(form.centerId))
    const program = programSelectOptions.find((p) => String(p.value) === String(form.programId))
    const category = examCategorySelectOptions.find(
      (c) => String(c.value) === String(form.examCategoryId),
    )
    const sub = examSubCategorySelectOptions.find(
      (s) => String(s.value) === String(form.examSubCategoryId),
    )

    try {
      await onSubmit(
        {
          name: form.name.trim(),
          centerId: form.centerId,
          centerName: centre?.label || '',
          programId: form.programId,
          program: program?.label || '',
          examCategoryId: form.examCategoryId,
          examCategory: category?.label || '',
          examSubCategoryId: form.examSubCategoryId,
          examSubCategory: sub?.label || '',
          status: form.status,
          overview: form.overview,
          keyFeatures: form.keyFeatures,
          whyChooseFeatures: form.whyChooseFeatures,
          howWill: form.howWill,
          whyChooseTitle: form.whyChooseTitle,
          whyChooseSubtitle: form.whyChooseSubtitle,
          ...serializeAcademicCourseContent(form, {
            examCategory: category?.label || '',
            courseName: form.name.trim(),
          }),
        },
        { isEdit, id: item?.id },
      )
      handleClose()
    } catch {
      /* parent shows toast; keep modal open */
    }
  }

  if (!open) return null

  const title = isEdit ? 'Edit Course' : 'Add Course'

  return (
    <Modal open={open} onClose={handleClose} size="full" title={title} showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[min(92vh,820px)] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={title}
          onClose={handleClose}
          closeVariant="icon"
          plainCloseIcon
          icon={BookOpen}
          iconClassName="text-[#246392]"
        />

        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-7">
          <div className="space-y-6">
            <SectionBar title="Course Details" />
            <div className="grid gap-4 rounded-xl bg-white px-4 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:grid-cols-2 sm:px-6 sm:py-6">
              <CourseFormField label="Course Name" required>
                <CourseInput
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors((err) => ({ ...err, name: undefined }))
                  }}
                  placeholder="e.g. UPSC Foundation"
                />
                {errors.name && (
                  <p className="text-xs font-medium text-[#dc2626]">{errors.name}</p>
                )}
              </CourseFormField>

              <CourseFormField label="Center" required>
                <SearchableSelect
                  options={centreSelectOptions}
                  value={form.centerId}
                  onChange={handleCentreChange}
                  placeholder="Select centre"
                  emptyMessage="No centres available"
                  loading={centerLoading}
                  error={errors.centerId}
                />
              </CourseFormField>

              <CourseFormField label="Program" required>
                <SearchableSelect
                  options={programSelectOptions}
                  value={form.programId}
                  onChange={(programId) => {
                    setForm((f) => ({
                      ...f,
                      programId,
                      examCategoryId: '',
                      examSubCategoryId: '',
                    }))
                    setErrors({})
                  }}
                  placeholder={form.centerId ? 'Select program' : 'Select centre first'}
                  emptyMessage={
                    form.centerId ? 'No programs for this centre' : 'Select a centre first'
                  }
                  disabled={!form.centerId}
                  loading={programLoading}
                  error={errors.programId}
                />
              </CourseFormField>

              <CourseFormField label="Exam Category" required>
                <SearchableSelect
                  options={examCategorySelectOptions}
                  value={form.examCategoryId}
                  onChange={(examCategoryId) => {
                    setForm((f) => ({ ...f, examCategoryId, examSubCategoryId: '' }))
                    setErrors({})
                  }}
                  placeholder={
                    form.programId ? 'Select exam category' : 'Select program first'
                  }
                  disabled={!form.programId}
                  loading={categoryLoading}
                  error={errors.examCategoryId}
                />
              </CourseFormField>

              <CourseFormField label="Exam Subcategory" required className="sm:col-span-2">
                <SearchableSelect
                  options={examSubCategorySelectOptions}
                  value={form.examSubCategoryId}
                  onChange={(examSubCategoryId) => {
                    setForm((f) => ({ ...f, examSubCategoryId }))
                    setErrors({})
                  }}
                  placeholder={
                    form.examCategoryId ? 'Select subcategory' : 'Select exam category first'
                  }
                  disabled={!form.examCategoryId}
                  loading={subCategoryLoading}
                  error={errors.examSubCategoryId}
                />
              </CourseFormField>
            </div>
          </div>

          <CourseMarketingSections
            form={form}
            setForm={setForm}
            courseName={form.name}
          />
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 border-t border-[#e5eaf2] bg-[#f0f4f8]/95 px-4 py-5 backdrop-blur-md sm:px-8">
          <FormModalSubmitBar
            isEditMode={isEdit}
            onReset={handleReset}
            isSubmitting={submitting}
            disableSubmit={submitting}
            disableReset={submitting}
            createLabel="Create"
            updateLabel="Update"
            loadingLabel="Creating…"
            className="border-t-0 pt-4"
          />
        </div>
      </form>
    </Modal>
  )
}

