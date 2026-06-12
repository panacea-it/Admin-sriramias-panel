import { Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { CourseFormField, CourseInput, CourseSelect, CourseTextarea } from '../../courses/CourseFormField'
import {
  FREE_RESOURCE_CATEGORY,
  BULK_QUESTION_ACCEPT,
  MAINS_CATEGORY_OPTIONS,
} from '../../../utils/freeResourceFormConstants'
import {
  validateNcertBookPdf,
  validatePreviousYearPaperPdf,
  validateStudyMaterialFile,
  validateMockTestBulkFile,
} from '../../../utils/freeResourceApiHelpers'
import FormFieldError from './FormFieldError'
import UploadField from './UploadField'
import { parseQuestionCount, resizeFreeResourceQuestions } from '../../../utils/freeResourceFormUtils'

function Grid({ children, className = '' }) {
  return <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>
}

function NumberOfQuestionsField({ register, watch, setValue, error }) {
  const { onChange, ...field } = register('numberOfQuestions')
  return (
    <CourseFormField label="Number of Questions">
      <CourseInput
        {...field}
        inputMode="numeric"
        placeholder="e.g. 10"
        onChange={(e) => {
          onChange(e)
          const count = parseQuestionCount(e.target.value)
          const current = watch('questions') || []
          setValue('questions', resizeFreeResourceQuestions(current, count), {
            shouldDirty: true,
          })
        }}
      />
      <FormFieldError message={error} />
    </CourseFormField>
  )
}

export default function ResourceCategoryRenderer({
  category,
  register,
  errors,
  setValue,
  clearErrors,
  watch,
  previousYearDropdowns = null,
  mockTestDropdowns: mockTestDropdownsProp = null,
  studyMaterialDropdowns = null,
  studyMaterialFileRequired = true,
  ncertBookFileRequired = true,
  previousYearFileRequired = true,
  mockTestBulkFileRequired = false,
  mockTestBulkFileOptional = false,
}) {
  if (!category) {
    return (
      <p className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-10 text-center text-sm text-[#246392]">
        Select a free resource category to see the form fields.
      </p>
    )
  }

  switch (category) {
    case FREE_RESOURCE_CATEGORY.NCERT:
      return (
        <Grid>
          <CourseFormField label="Subject" required>
            <CourseInput {...register('subject')} placeholder="Subject" />
            <FormFieldError message={errors.subject?.message} />
          </CourseFormField>
          <CourseFormField label="Class" required>
            <CourseInput {...register('className')} placeholder="Class" />
            <FormFieldError message={errors.className?.message} />
          </CourseFormField>
          <CourseFormField label="Book Name" required className="sm:col-span-2 lg:col-span-1">
            <CourseInput {...register('bookName')} placeholder="Book name" />
            <FormFieldError message={errors.bookName?.message} />
          </CourseFormField>
          <UploadField
            label="Upload Book PDF"
            required={ncertBookFileRequired}
            profile="PDF_STANDARD"
            accept=".pdf,application/pdf"
            icon="book"
            bypassValidation
            fileName={watch('bookFileName')}
            className="sm:col-span-2 lg:col-span-2"
            error={errors.bookFileName?.message}
            onFileNameChange={(name, file) => {
              const result = validateNcertBookPdf(file)
              if (!result.valid) {
                toast.error(result.message)
                setValue('bookFileName', '', { shouldDirty: true })
                setValue('bookFile', null, { shouldDirty: true })
                return
              }
              setValue('bookFileName', name, { shouldDirty: true, shouldValidate: true })
              setValue('bookFile', file, { shouldDirty: true, shouldValidate: true })
              clearErrors?.('bookFileName')
            }}
          />
        </Grid>
      )

    case FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR: {
      const dropdowns = previousYearDropdowns ?? {
        paperTypeOptions: [],
        yearOptions: [],
        loading: false,
        error: null,
        retry: () => {},
      }
      const paperOptions = dropdowns.paperTypeOptions
      const yearOpts = dropdowns.yearOptions
      const dropdownsLoading = dropdowns.loading

      return (
        <Grid>
          <CourseFormField label="Paper Type" required>
            <div className="relative">
              <CourseSelect
                {...register('paperType')}
                disabled={dropdownsLoading}
                className={dropdownsLoading ? 'opacity-70' : undefined}
              >
                <option value="">
                  {dropdownsLoading ? 'Loading paper types…' : 'Choose type'}
                </option>
                {paperOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CourseSelect>
              {dropdownsLoading ? (
                <Loader2
                  className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#246392]"
                  aria-hidden
                />
              ) : null}
            </div>
            <FormFieldError message={errors.paperType?.message} />
          </CourseFormField>
          <CourseFormField label="Year" required>
            <div className="relative">
              <CourseSelect
                {...register('year')}
                disabled={dropdownsLoading}
                className={dropdownsLoading ? 'opacity-70' : undefined}
              >
                <option value="">
                  {dropdownsLoading ? 'Loading years…' : 'Choose year'}
                </option>
                {yearOpts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CourseSelect>
              {dropdownsLoading ? (
                <Loader2
                  className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#246392]"
                  aria-hidden
                />
              ) : null}
            </div>
            <FormFieldError message={errors.year?.message} />
          </CourseFormField>
          <CourseFormField label="Paper Name" required className="sm:col-span-2">
            <CourseInput {...register('paperName')} placeholder="Paper name" />
            <FormFieldError message={errors.paperName?.message} />
          </CourseFormField>
          <UploadField
            label="Upload Question Paper PDF"
            required={previousYearFileRequired}
            profile="PDF_STANDARD"
            accept=".pdf,application/pdf"
            bypassValidation={Boolean(previousYearDropdowns)}
            fileName={watch('questionPaperFileName')}
            className="sm:col-span-2 lg:col-span-2"
            error={errors.questionPaperFileName?.message}
            onFileNameChange={(name, file) => {
              if (previousYearDropdowns) {
                const result = validatePreviousYearPaperPdf(file)
                if (!result.valid) {
                  toast.error(result.message)
                  setValue('questionPaperFileName', '', { shouldDirty: true })
                  setValue('questionPaperFile', null, { shouldDirty: true })
                  return
                }
                setValue('questionPaperFileName', name, { shouldDirty: true, shouldValidate: true })
                setValue('questionPaperFile', file, { shouldDirty: true, shouldValidate: true })
                clearErrors?.('questionPaperFileName')
                return
              }
              setValue('questionPaperFileName', name, { shouldDirty: true, shouldValidate: true })
              setValue('questionPaperFile', file, { shouldDirty: true, shouldValidate: true })
              clearErrors?.('questionPaperFileName')
            }}
          />
        </Grid>
      )
    }

    case FREE_RESOURCE_CATEGORY.MOCK_TEST: {
      const dropdowns = mockTestDropdownsProp ?? {
        examCategoryOptions: [],
        paperTypeOptions: [],
        loading: false,
        error: null,
        retry: () => {},
      }
      const examOptions = dropdowns.examCategoryOptions
      const paperOptions = dropdowns.paperTypeOptions
      const dropdownsLoading = dropdowns.loading

      return (
        <Grid>
          <CourseFormField label="Exam Category" required>
            <div className="relative">
              <CourseSelect
                {...register('examCategory')}
                disabled={dropdownsLoading}
                className={dropdownsLoading ? 'opacity-70' : undefined}
              >
                <option value="">
                  {dropdownsLoading ? 'Loading exam categories…' : 'Choose exam'}
                </option>
                {examOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CourseSelect>
              {dropdownsLoading ? (
                <Loader2
                  className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#246392]"
                  aria-hidden
                />
              ) : null}
            </div>
            {dropdowns.error && !dropdownsLoading && examOptions.length === 0 ? (
              <button
                type="button"
                onClick={dropdowns.retry}
                className="text-left text-xs font-medium text-[#246392] underline-offset-2 hover:underline"
              >
                Retry loading options
              </button>
            ) : null}
            <FormFieldError message={errors.examCategory?.message} />
          </CourseFormField>
          <CourseFormField label="Mock Test Title" required>
            <CourseInput {...register('mockTestTitle')} placeholder="Mock test title" />
            <FormFieldError message={errors.mockTestTitle?.message} />
          </CourseFormField>
          <CourseFormField label="Paper Type" required>
            <div className="relative">
              <CourseSelect
                {...register('paperType')}
                disabled={dropdownsLoading}
                className={dropdownsLoading ? 'opacity-70' : undefined}
              >
                <option value="">
                  {dropdownsLoading ? 'Loading paper types…' : 'Choose type'}
                </option>
                {paperOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CourseSelect>
              {dropdownsLoading ? (
                <Loader2
                  className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#246392]"
                  aria-hidden
                />
              ) : null}
            </div>
            <FormFieldError message={errors.paperType?.message} />
          </CourseFormField>
          <CourseFormField label="Subject" required>
            <CourseInput {...register('subject')} placeholder="Subject" />
            <FormFieldError message={errors.subject?.message} />
          </CourseFormField>
          <CourseFormField label="Topic" required>
            <CourseInput {...register('topic')} placeholder="Topic" />
            <FormFieldError message={errors.topic?.message} />
          </CourseFormField>
          <CourseFormField label="Duration" required>
            <CourseInput {...register('duration')} placeholder="e.g. 120 mins" />
            <FormFieldError message={errors.duration?.message} />
          </CourseFormField>
          <CourseFormField label="Total Marks" required>
            <CourseInput {...register('totalMarks')} inputMode="numeric" placeholder="Total marks" />
            <FormFieldError message={errors.totalMarks?.message} />
          </CourseFormField>
          <CourseFormField label="Negative Marking">
            <CourseInput {...register('negativeMarking')} placeholder="e.g. 0.33" />
          </CourseFormField>
          <CourseFormField label="Instructions" className="sm:col-span-2 lg:col-span-3">
            <CourseTextarea {...register('instructions')} rows={4} placeholder="Instructions" />
          </CourseFormField>
          <NumberOfQuestionsField
            register={register}
            watch={watch}
            setValue={setValue}
            error={errors.numberOfQuestions?.message}
          />
          {(mockTestBulkFileRequired || mockTestBulkFileOptional) && (
            <UploadField
              label={
                mockTestBulkFileRequired
                  ? 'Upload Questions File (CSV/XLSX)'
                  : 'Replace Questions File (optional)'
              }
              required={mockTestBulkFileRequired}
              accept={BULK_QUESTION_ACCEPT}
              bypassValidation
              fileName={watch('bulkFileName')}
              className="sm:col-span-2 lg:col-span-3"
              error={errors.bulkFileName?.message}
              onFileNameChange={(name, file) => {
                const result = validateMockTestBulkFile(file)
                if (!result.valid) {
                  toast.error(result.message)
                  setValue('bulkFileName', '', { shouldDirty: true })
                  setValue('bulkFile', null, { shouldDirty: true })
                  return
                }
                setValue('bulkFileName', name, { shouldDirty: true, shouldValidate: true })
                setValue('bulkFile', file, { shouldDirty: true, shouldValidate: true })
                clearErrors?.('bulkFileName')
              }}
            />
          )}
        </Grid>
      )
    }

    case FREE_RESOURCE_CATEGORY.STUDY_MATERIAL: {
      const categoryOpts = MAINS_CATEGORY_OPTIONS.map((option) => ({
        value: option,
        label: option,
      }))

      return (
        <Grid>
          <CourseFormField label="Main Category" required>
            <CourseSelect {...register('mainsCategory')}>
              <option value="">Choose category</option>
              {categoryOpts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CourseSelect>
            <FormFieldError message={errors.mainsCategory?.message} />
          </CourseFormField>
          <CourseFormField label="Study Material Name" required className="sm:col-span-2">
            <CourseInput {...register('studyMaterialName')} placeholder="Study material name" />
            <FormFieldError message={errors.studyMaterialName?.message} />
          </CourseFormField>
          <UploadField
            label="Upload Study Material"
            required={studyMaterialFileRequired}
            profile="PDF_STANDARD"
            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            bypassValidation
            fileName={watch('studyMaterialFileName')}
            className="sm:col-span-2 lg:col-span-3"
            error={errors.studyMaterialFileName?.message}
            onFileNameChange={(name, file) => {
              const result = validateStudyMaterialFile(file)
              if (!result.valid) {
                toast.error(result.message)
                setValue('studyMaterialFileName', '', { shouldDirty: true })
                setValue('studyMaterialFile', null, { shouldDirty: true })
                return
              }
              setValue('studyMaterialFileName', name, { shouldDirty: true, shouldValidate: true })
              setValue('studyMaterialFile', file, { shouldDirty: true, shouldValidate: true })
              clearErrors?.('studyMaterialFileName')
            }}
          />
        </Grid>
      )
    }

    default:
      return (
        <p className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-8 text-center text-sm text-[#246392]">
          This category is no longer available. Choose one of the categories from the list above.
        </p>
      )
  }
}
