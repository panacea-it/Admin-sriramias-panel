import {
  CourseDateInput,
  CourseFormField,
  CourseInput,
  CourseSelect,
} from './CourseFormField'
import { batchFormGrid } from './batch-form/BatchFormCard'
import BrochurePdfUpload from './BrochurePdfUpload'
import BannerImageUpload from './BannerImageUpload'
import CourseCatalogSelect from './CourseCatalogSelect'
import BatchMentorSelect from './BatchMentorSelect'
import { BATCH_STATUSES } from '../../data/batchManagementData'
import { cn } from '../../utils/cn'

export default function BatchDetailsSection({
  form,
  setForm,
  errors,
  setErrors,
  excludeCourseIds = [],
  onBrochureUploadingChange,
  isEditMode = false,
}) {
  const clearError = (key) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validateDates = (start, end) => {
    if (start && end && end < start) {
      setErrors((e) => ({ ...e, batchEndTo: 'End date cannot be before start date' }))
      return false
    }
    if (errors.batchEndTo?.includes('before')) {
      setErrors((e) => ({ ...e, batchEndTo: undefined }))
    }
    return true
  }

  const fieldError = (key) =>
    errors[key] ? (
      <p className="text-xs font-medium text-red-600">{errors[key]}</p>
    ) : null

  return (
    <div className={cn(batchFormGrid)}>
      <CourseFormField label="Batch Name" required className="sm:col-span-1 lg:col-span-1">
        <CourseInput
          value={form.batchName}
          onChange={(e) => {
            setForm((f) => ({ ...f, batchName: e.target.value }))
            clearError('batchName')
          }}
          placeholder="e.g. UPSC Batch 1"
        />
        {fieldError('batchName')}
      </CourseFormField>

      <CourseFormField label="Batch Code" required className="sm:col-span-1 lg:col-span-1">
        <CourseInput
          value={form.batchCode}
          onChange={(e) => {
            setForm((f) => ({ ...f, batchCode: e.target.value }))
            clearError('batchCode')
          }}
          placeholder="e.g. UPSC-B01"
          disabled={isEditMode}
        />
        {fieldError('batchCode')}
        {isEditMode && (
          <p className="mt-1 text-[11px] text-gray-500">Batch code cannot be changed after creation.</p>
        )}
      </CourseFormField>

      <BatchMentorSelect
        form={form}
        setForm={setForm}
        error={errors.mentorEmail}
        onClearError={() => clearError('mentorEmail')}
        className="sm:col-span-1 lg:col-span-1"
      />

      <CourseFormField label="Course" required className="sm:col-span-2">
        <CourseCatalogSelect
          value={form.academicCourseId || ''}
          fallbackCourseId={form.courseId}
          excludeCourseIds={excludeCourseIds}
          error={errors.courseId}
          required
          onChange={({ academicCourseId, courseId, courseName }) => {
            setForm((f) => ({
              ...f,
              academicCourseId,
              courseId,
              courseName,
            }))
            clearError('courseId')
          }}
        />
      </CourseFormField>

      <CourseFormField label="Date of Commencement" required>
        <CourseDateInput
          value={form.commencement}
          onChange={(e) => {
            setForm((f) => ({ ...f, commencement: e.target.value }))
            clearError('commencement')
          }}
        />
        {fieldError('commencement')}
      </CourseFormField>

      <CourseFormField label="Duration" required className="sm:col-span-2 lg:col-span-1">
        <CourseInput
          value={form.durationLabel}
          onChange={(e) => {
            setForm((f) => ({ ...f, durationLabel: e.target.value }))
            clearError('durationLabel')
          }}
          placeholder="e.g. 6 Months, 1 Year"
        />
        {fieldError('durationLabel')}
      </CourseFormField>

      <CourseFormField label="Batch Start Date" required>
        <CourseDateInput
          value={form.batchStartFrom}
          onChange={(e) => {
            const batchStartFrom = e.target.value
            setForm((f) => ({ ...f, batchStartFrom }))
            clearError('batchStartFrom')
            validateDates(batchStartFrom, form.batchEndTo)
          }}
        />
        {fieldError('batchStartFrom')}
      </CourseFormField>

      <CourseFormField label="Batch End Date" required>
        <CourseDateInput
          value={form.batchEndTo}
          onChange={(e) => {
            const batchEndTo = e.target.value
            setForm((f) => ({ ...f, batchEndTo }))
            clearError('batchEndTo')
            validateDates(form.batchStartFrom, batchEndTo)
          }}
        />
        {fieldError('batchEndTo')}
      </CourseFormField>

      <CourseFormField label="Status" required>
        <CourseSelect
          value={form.status || 'Active'}
          onChange={(e) => {
            setForm((f) => ({ ...f, status: e.target.value }))
            clearError('status')
          }}
        >
          {BATCH_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </CourseSelect>
        {fieldError('status')}
      </CourseFormField>

      <CourseFormField label="Banner Image" required className="sm:col-span-2 lg:col-span-3">
        <BannerImageUpload
          previewUrl={form.bannerPreview}
          fileName={form.bannerFileName}
          error={errors.bannerPreview}
          onChange={({ file, previewUrl, fileName }) => {
            setForm((f) => ({
              ...f,
              bannerFile: file || null,
              bannerPreview: previewUrl,
              bannerFileName: fileName,
              bannerUrl: previewUrl,
            }))
            clearError('bannerPreview')
          }}
        />
      </CourseFormField>

      <CourseFormField
        label="Batch Brochure"
        required
        className="sm:col-span-2 lg:col-span-3"
      >
        <BrochurePdfUpload
          brochureUrl={form.brochureUrl}
          fileName={form.brochureFileName}
          fileSize={form.brochureFileSize}
          error={errors.brochureUrl}
          onUploadingChange={onBrochureUploadingChange}
          onChange={({ file, brochureUrl, fileName, fileSize }) => {
            setForm((f) => ({
              ...f,
              brochureFile: file || null,
              brochureUrl,
              brochureFileName: fileName,
              brochureFileSize: fileSize,
            }))
            clearError('brochureUrl')
          }}
        />
      </CourseFormField>
    </div>
  )
}
