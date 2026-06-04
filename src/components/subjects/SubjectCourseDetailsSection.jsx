import { Controller } from 'react-hook-form'
import {
  CATEGORY_OPTIONS,
  SUBJECT_DROPDOWN_OPTIONS,
  TEACHER_DROPDOWN_OPTIONS,
  TOPIC_DROPDOWN_OPTIONS,
} from '../../data/academicsSubjectsSeed'
import SubjectChipMultiSelect from './SubjectChipMultiSelect'
import { FieldLabel, FormInput, FormSelect, SectionTitle } from './subjectFormUi'

/** Course Details — matches original Faculty Subjects layout (5 fields, 2 rows). */
export default function SubjectCourseDetailsSection({ register, control, errors }) {
  return (
    <section className="space-y-4">
      <SectionTitle>Course Details</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <FieldLabel required>Subject Name</FieldLabel>
          <FormInput
            register={register}
            name="subjectName"
            error={errors.subjectName}
            placeholder="Enter subject name"
          />
          {errors.subjectName && (
            <p className="mt-1 text-xs text-red-500">{errors.subjectName.message}</p>
          )}
        </div>
        <div>
          <FieldLabel required>Subject</FieldLabel>
          <FormSelect
            register={register}
            name="subject"
            error={errors.subject}
            options={SUBJECT_DROPDOWN_OPTIONS}
            placeholder="Choose Subject"
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
          )}
        </div>
        <div>
          <FieldLabel>Topic</FieldLabel>
          <Controller
            control={control}
            name="topics"
            render={({ field }) => (
              <SubjectChipMultiSelect
                options={TOPIC_DROPDOWN_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose Topic"
              />
            )}
          />
        </div>
        <div>
          <FieldLabel required>Teacher</FieldLabel>
          <FormSelect
            register={register}
            name="teacher"
            error={errors.teacher}
            options={TEACHER_DROPDOWN_OPTIONS}
            placeholder="Choose Teacher"
          />
          {errors.teacher && (
            <p className="mt-1 text-xs text-red-500">{errors.teacher.message}</p>
          )}
        </div>
        <div>
          <FieldLabel required>Category</FieldLabel>
          <Controller
            control={control}
            name="categories"
            render={({ field }) => (
              <SubjectChipMultiSelect
                options={CATEGORY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose Category"
                error={errors.categories?.message}
              />
            )}
          />
          {errors.categories && (
            <p className="mt-1 text-xs text-red-500">{errors.categories.message}</p>
          )}
        </div>
      </div>
    </section>
  )
}
