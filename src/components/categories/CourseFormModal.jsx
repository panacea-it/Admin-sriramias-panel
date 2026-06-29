import { useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { BookOpen, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import DemoVideoUpload from '../courses/DemoVideoUpload'
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
import { mapDemoVideoFromCourse } from '../../utils/courseMediaPrefill'
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

function buildDemoVideoFields(item) {
  const mapped = mapDemoVideoFromCourse(item)
  return {
    demoVideoFile: null,
    demoVideoUrl: mapped.demoVideoUrl || '',
    demoVideoFileName: mapped.demoVideoFileName || '',
    demoVideoFileSize: mapped.demoVideoFileSize ?? null,
  }
}

function buildFullForm(item) {
  const row = item && typeof item === 'object' ? item : null
  return {
    ...buildHierarchyForm(row),
    ...academicCourseItemToContent(row),
    ...buildDemoVideoFields(row),
  }
}

function getCourseFormInitKey(item, isEdit, detailLoading) {
  if (!isEdit) return '__create__'
  const id = getModalEditKey(item)
  return detailLoading ? `${id}:loading` : `${id}:ready`
}

function CourseFormLoadingSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading course details"
    >
      <div className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-6 text-sm font-medium text-[#686868] shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <Loader2 className="h-5 w-5 animate-spin text-[#246392]" aria-hidden />
        Loading course details…
      </div>

      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded-lg bg-[#dbeafe]/80" />
          <div className="grid gap-4 rounded-xl bg-white px-4 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:grid-cols-2 sm:px-6 sm:py-6">
            <div className="h-11 animate-pulse rounded-lg bg-slate-100 sm:col-span-2" />
            <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-11 animate-pulse rounded-lg bg-slate-100 sm:col-span-2" />
            {section === 2 ? (
              <div className="h-32 animate-pulse rounded-xl bg-slate-100 sm:col-span-2" />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CourseFormModal({
  open,
  onClose,
  item,
  onSubmit,
  submitting = false,
  detailLoading = false,
}) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(() => ({
    ...buildHierarchyForm(null),
    ...createEmptyAcademicCourseContent(),
    ...buildDemoVideoFields(null),
  }))
  const [errors, setErrors] = useState({})
  const [demoVideoUploading, setDemoVideoUploading] = useState(false)
  const closingRef = useRef(false)
  const itemRef = useRef(item)
  itemRef.current = item
  const editKey = getCourseFormInitKey(item, isEdit, detailLoading)

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
    setDemoVideoUploading(false)
  })

  useEffect(() => {
    if (!open || !item || detailLoading) return
    setForm(buildFullForm(item))
    setErrors({})
    setDemoVideoUploading(false)
  }, [open, item, detailLoading])

  const formBusy = submitting || detailLoading || demoVideoUploading

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

  const selectedCenterLabel = useMemo(
    () =>
      centreSelectOptions.find((c) => String(c.value) === String(form.centerId))?.label ||
      item?.centerName ||
      '',
    [centreSelectOptions, form.centerId, item?.centerName],
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
    if (errors.centerId) setErrors((err) => ({ ...err, centerId: undefined }))
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
    if (detailLoading) return
    if (demoVideoUploading) {
      toast.error('Please wait for the demo video upload to finish')
      return
    }
    const hierarchyOk = validateHierarchy()
    const hierarchyErrs = validateCreateCourseContent(form)
    if (!hierarchyOk || Object.keys(hierarchyErrs).length) {
      if (Object.keys(hierarchyErrs).length) {
        setErrors((prev) => ({ ...prev, ...hierarchyErrs }))
      }
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
      const serialized = serializeAcademicCourseContent(form, {
        examCategory: category?.label || '',
        courseName: form.name.trim(),
      })

      await onSubmit(
        {
          ...serialized,
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
          demoVideoFile: form.demoVideoFile,
          demoVideoUrl: form.demoVideoUrl,
          demoVideoFileName: form.demoVideoFileName,
          demoVideoFileSize: form.demoVideoFileSize,
          newDelhiUi: form.newDelhiUi,
          hyderabadUi: form.hyderabadUi,
          puneUi: form.puneUi,
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
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={title}
      showCloseButton={false}
      className="flex max-h-[90vh] flex-col overflow-hidden"
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="shrink-0">
          <ModalPanelHeader
            title={title}
            onClose={handleClose}
            closeVariant="icon"
            plainCloseIcon
            icon={BookOpen}
            iconClassName="text-[#246392]"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-6">
          {detailLoading ? (
            <CourseFormLoadingSkeleton />
          ) : (
            <>
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

          <div className="space-y-6">
            <SectionBar title="Demo Video" />
            <div className="grid gap-4 rounded-xl bg-white px-4 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:grid-cols-2 sm:px-6 sm:py-6">
              <CourseFormField label="Add Your Demo Video" className="sm:col-span-2">
                <DemoVideoUpload
                  videoUrl={form.demoVideoUrl}
                  fileName={form.demoVideoFileName}
                  fileSize={form.demoVideoFileSize}
                  error={errors.demoVideoUrl}
                  onUploadingChange={setDemoVideoUploading}
                  onChange={({ file, videoUrl, fileName, fileSize }) => {
                    setForm((f) => {
                      if (f.demoVideoUrl?.startsWith('blob:') && f.demoVideoUrl !== videoUrl) {
                        URL.revokeObjectURL(f.demoVideoUrl)
                      }
                      return {
                        ...f,
                        demoVideoFile: file || null,
                        demoVideoUrl: videoUrl,
                        demoVideoFileName: fileName,
                        demoVideoFileSize: fileSize,
                      }
                    })
                    if (errors.demoVideoUrl) {
                      setErrors((err) => ({ ...err, demoVideoUrl: undefined }))
                    }
                  }}
                />
              </CourseFormField>
            </div>
          </div>

          {form.centerId ? (
            <CourseMarketingSections
              form={form}
              setForm={setForm}
              courseName={form.name}
              centerLabel={selectedCenterLabel}
              formResetKey={editKey}
            />
          ) : null}
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-20 shrink-0 border-t border-[#e5eaf2] bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:px-8">
          <FormModalSubmitBar
            isEditMode={isEdit}
            onReset={handleReset}
            isSubmitting={formBusy}
            disableSubmit={formBusy}
            disableReset={formBusy}
            createLabel="Create"
            updateLabel="Update"
            loadingLabel={
              detailLoading ? 'Loading course…' : isEdit ? 'Updating…' : 'Creating…'
            }
            className="border-t-0 pt-2"
          />
        </div>
      </form>
    </Modal>
  )
}

