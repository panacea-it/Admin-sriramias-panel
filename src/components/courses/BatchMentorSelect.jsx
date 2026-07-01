import { useEffect, useMemo } from 'react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from './CourseFormField'
import { useMentorEmployees } from '../../hooks/useMentorEmployees'
import { resolveBatchCourseId } from '../../utils/batchApiHelpers'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'

const mentorTriggerClass = cn(
  'flex h-12 min-h-[48px] w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-left text-sm text-gray-800 shadow-sm outline-none transition duration-150',
  'hover:border-[#93c5fd] hover:bg-[#fafcff]',
  'focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-blue-400/35',
)

export default function BatchMentorSelect({
  open = false,
  form,
  setForm,
  error,
  onClearError,
  className,
}) {
  const selectedCourseId = resolveBatchCourseId(form)
  const { options, loading, error: fetchError } = useMentorEmployees({
    enabled: open,
    courseId: selectedCourseId,
  })

  useEffect(() => {
    if (fetchError) toast.error(fetchError || 'Unable to load mentors')
  }, [fetchError])

  const selectedValue = String(form.mentorId || '').trim()

  const optionsWithSaved = useMemo(() => {
    if (!selectedValue || options.some((opt) => String(opt.value) === selectedValue)) {
      return options
    }
    const savedLabel = String(form.mentorName || form.trainerName || 'Saved mentor').trim()
    return [
      ...options,
      {
        value: selectedValue,
        label: savedLabel || 'Saved mentor',
        searchText: `${savedLabel} ${selectedValue}`.trim().toLowerCase(),
      },
    ]
  }, [options, selectedValue, form.mentorName, form.trainerName])

  const emptyMessage = useMemo(() => {
    if (!selectedCourseId) return 'Select a course first'
    if (loading) return 'Loading mentors…'
    if (optionsWithSaved.length === 0) return 'No mentors available for this course'
    return 'No mentors match your search'
  }, [loading, optionsWithSaved.length, selectedCourseId])

  const handleChange = (mentorId) => {
    setForm((f) => ({ ...f, mentorId: String(mentorId || '').trim() }))
    onClearError?.()
  }

  const mentorDisabled =
    !selectedCourseId ||
    loading ||
    Boolean(fetchError) ||
    (!loading && selectedCourseId && optionsWithSaved.length === 0)

  return (
    <CourseFormField label="Mentor" required className={className}>
      <SearchableSelect
        key={selectedCourseId || 'no-course'}
        options={optionsWithSaved}
        value={selectedValue}
        onChange={handleChange}
        placeholder={
          !selectedCourseId
            ? 'Select mentor'
            : loading
              ? 'Loading mentors…'
              : 'Select mentor'
        }
        emptyMessage={emptyMessage}
        disabled={mentorDisabled}
        loading={loading}
        error={error}
        triggerClassName={mentorTriggerClass}
        filterOption={(opt, query) => {
          const q = query.trim().toLowerCase()
          if (!q) return true
          const haystack = String(opt.searchText || opt.label || '').toLowerCase()
          return haystack.includes(q)
        }}
      />
    </CourseFormField>
  )
}
