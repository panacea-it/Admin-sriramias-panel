import { CourseFormField, CourseInput, CourseSelect, CourseTextarea } from '../../courses/CourseFormField'
import {
  EXAM_CATEGORY_OPTIONS,
  FREE_RESOURCE_CATEGORY,
  MAINS_CATEGORY_OPTIONS,
  PAPER_TYPE_OPTIONS,
  YEAR_OPTIONS,
} from '../../../utils/freeResourceFormConstants'
import FormFieldError from './FormFieldError'
import UploadField from './UploadField'
import { parseQuestionCount, resizeFreeResourceQuestions } from '../../../utils/freeResourceFormUtils'

function Grid({ children, className = '' }) {
  return <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>
}

function NumberOfQuestionsField({ register, watch, setValue, error }) {
  const { onChange, ...field } = register('numberOfQuestions')
  return (
    <CourseFormField label="Number of Questions" required>
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

export default function ResourceCategoryRenderer({ category, register, errors, setValue, watch }) {
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
            required
            profile="DOCUMENT_BOOK"
            accept=".pdf,.epub,.doc,.docx"
            icon="book"
            fileName={watch('bookFileName')}
            className="sm:col-span-2 lg:col-span-2"
            error={errors.bookFileName?.message}
            onFileNameChange={(name) => setValue('bookFileName', name, { shouldDirty: true })}
          />
        </Grid>
      )

    case FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR:
      return (
        <Grid>
          <CourseFormField label="Exam Category" required>
            <CourseSelect {...register('examCategory')}>
              <option value="">Choose exam</option>
              {EXAM_CATEGORY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </CourseSelect>
            <FormFieldError message={errors.examCategory?.message} />
          </CourseFormField>
          <CourseFormField label="Paper Type" required>
            <CourseSelect {...register('paperType')}>
              <option value="">Choose type</option>
              {PAPER_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </CourseSelect>
            <FormFieldError message={errors.paperType?.message} />
          </CourseFormField>
          <CourseFormField label="Year" required>
            <CourseSelect {...register('year')}>
              <option value="">Choose year</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </CourseSelect>
            <FormFieldError message={errors.year?.message} />
          </CourseFormField>
          <CourseFormField label="Paper Name" required className="sm:col-span-2">
            <CourseInput {...register('paperName')} placeholder="Paper name" />
            <FormFieldError message={errors.paperName?.message} />
          </CourseFormField>
          <UploadField
            label="Upload Question Paper PDF"
            required
            profile="PDF_STANDARD"
            fileName={watch('questionPaperFileName')}
            className="sm:col-span-2 lg:col-span-2"
            error={errors.questionPaperFileName?.message}
            onFileNameChange={(name) => setValue('questionPaperFileName', name, { shouldDirty: true })}
          />
        </Grid>
      )

    case FREE_RESOURCE_CATEGORY.MOCK_TEST:
      return (
        <Grid>
          <CourseFormField label="Exam Category" required>
            <CourseSelect {...register('examCategory')}>
              <option value="">Choose exam</option>
              {EXAM_CATEGORY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </CourseSelect>
            <FormFieldError message={errors.examCategory?.message} />
          </CourseFormField>
          <CourseFormField label="Mock Test Title" required>
            <CourseInput {...register('mockTestTitle')} placeholder="Mock test title" />
            <FormFieldError message={errors.mockTestTitle?.message} />
          </CourseFormField>
          <CourseFormField label="Paper Type" required>
            <CourseSelect {...register('paperType')}>
              <option value="">Choose type</option>
              {PAPER_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </CourseSelect>
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
        </Grid>
      )

    case FREE_RESOURCE_CATEGORY.STUDY_MATERIAL:
      return (
        <Grid>
          <CourseFormField label="Mains Category" required>
            <CourseSelect {...register('mainsCategory')}>
              <option value="">Choose category</option>
              {MAINS_CATEGORY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
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
            required
            profile="PDF_STANDARD"
            fileName={watch('studyMaterialFileName')}
            className="sm:col-span-2 lg:col-span-3"
            error={errors.studyMaterialFileName?.message}
            onFileNameChange={(name) =>
              setValue('studyMaterialFileName', name, { shouldDirty: true })
            }
          />
        </Grid>
      )

    default:
      return (
        <p className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-8 text-center text-sm text-[#246392]">
          This category is no longer available. Choose one of the categories from the list above.
        </p>
      )
  }
}
