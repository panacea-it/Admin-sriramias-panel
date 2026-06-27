import { useEffect, useMemo } from 'react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from './CourseFormField'
import { useMentorEmployees } from '../../hooks/useMentorEmployees'
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
  const { options, loading, error: fetchError } = useMentorEmployees({ enabled: open })

  useEffect(() => {
    if (fetchError) toast.error(fetchError || 'Unable to load mentors')
  }, [fetchError])

  const selectedValue = String(form.mentorId || '').trim()

  const emptyMessage = useMemo(() => {
    if (loading) return 'Loading mentors…'
    if (options.length === 0) return 'No mentors available'
    return 'No mentors match your search'
  }, [loading, options.length])

  const handleChange = (mentorId) => {
    setForm((f) => ({ ...f, mentorId: String(mentorId || '').trim() }))
    onClearError?.()
  }

  return (
    <CourseFormField label="Mentor" required className={className}>
      <SearchableSelect
        options={options}
        value={selectedValue}
        onChange={handleChange}
        placeholder={loading ? 'Loading mentors…' : 'Select mentor'}
        emptyMessage={emptyMessage}
        disabled={loading || options.length === 0}
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
