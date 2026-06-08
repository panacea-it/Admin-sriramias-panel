import { Controller } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import SubjectChipMultiSelect from './SubjectChipMultiSelect'
import { FieldLabel, FormInput, SectionTitle } from './subjectFormUi'
import { cn } from '../../utils/cn'

function ControlledSelect({
  field,
  error,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  onValueChange,
}) {
  return (
    <div className="relative">
      <select
        {...field}
        disabled={disabled}
        onChange={(e) => {
          field.onChange(e.target.value)
          onValueChange?.(e.target.value)
        }}
        className={cn(
          'h-11 w-full appearance-none rounded-xl bg-[#d1e9f6] px-4 pr-10 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
          disabled && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687180]" />
    </div>
  )
}

/** Course Details — matches original Faculty Subjects layout (5 fields, 2 rows). */
export default function SubjectCourseDetailsSection({
  control,
  register,
  errors,
  subjectOptions = [],
  topicOptions = [],
  teacherOptions = [],
  categoryOptions = [],
  loadingSubjects = false,
  loadingFormOptions = false,
  loadingCategories = false,
  onSubjectChange,
  disabledTopicsTeachers = false,
}) {
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
          <Controller
            control={control}
            name="subject"
            render={({ field }) => (
              <ControlledSelect
                field={field}
                error={errors.subject}
                options={subjectOptions}
                placeholder={loadingSubjects ? 'Loading subjects…' : 'Choose Subject'}
                disabled={loadingSubjects}
                onValueChange={onSubjectChange}
              />
            )}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
          )}
        </div>
        <div>
          <FieldLabel required>Topic</FieldLabel>
          <Controller
            control={control}
            name="topics"
            render={({ field }) => (
              <SubjectChipMultiSelect
                options={topicOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={
                  loadingFormOptions
                    ? 'Loading topics…'
                    : disabledTopicsTeachers
                      ? 'Choose Subject first'
                      : 'Choose Topic'
                }
                disabled={disabledTopicsTeachers || loadingFormOptions}
                error={errors.topics?.message}
              />
            )}
          />
          {errors.topics && (
            <p className="mt-1 text-xs text-red-500">{errors.topics.message}</p>
          )}
        </div>
        <div>
          <FieldLabel required>Teacher</FieldLabel>
          <Controller
            control={control}
            name="teacher"
            render={({ field }) => (
              <ControlledSelect
                field={field}
                error={errors.teacher}
                options={teacherOptions}
                placeholder={
                  loadingFormOptions
                    ? 'Loading teachers…'
                    : disabledTopicsTeachers
                      ? 'Choose Subject first'
                      : 'Choose Teacher'
                }
                disabled={disabledTopicsTeachers || loadingFormOptions}
              />
            )}
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
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={loadingCategories ? 'Loading categories…' : 'Choose Category'}
                disabled={loadingCategories}
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
