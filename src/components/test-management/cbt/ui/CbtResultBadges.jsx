import { cn } from '../../../../utils/cn'

const PILL_BASE =
  'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold text-white sm:text-sm'

const ATTEMPT_STATUS_STYLES = {
  Completed: 'bg-[#9ca3af]',
  'In Progress': 'bg-[#55ace7]',
  'Not Started': 'bg-[#cbd5e1] text-[#475569]',
  Absent: 'bg-[#94a3b8]',
}

const RESULT_STATUS_STYLES = {
  Published: 'bg-[#10b981]',
  Unpublished: 'bg-[#efb36d]',
}

export function normalizeCbtResultStatusLabel(status) {
  if (status === 'Published') return 'Published'
  return 'Unpublished'
}

export function CbtAttemptStatusBadge({ status, className }) {
  const label = status || '—'
  return (
    <span
      className={cn(
        PILL_BASE,
        ATTEMPT_STATUS_STYLES[label] ?? 'bg-[#cbd5e1] text-[#475569]',
        className,
      )}
    >
      {label}
    </span>
  )
}

export function CbtResultStatusBadge({ status, className }) {
  const label = normalizeCbtResultStatusLabel(status)
  return (
    <span className={cn(PILL_BASE, RESULT_STATUS_STYLES[label], className)}>
      {label}
    </span>
  )
}
