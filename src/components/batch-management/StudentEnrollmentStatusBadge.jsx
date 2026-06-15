import { cn } from '../../utils/cn'
import { resolveStudentEnrollmentStatus } from './studentStatusDisplay'

export default function StudentEnrollmentStatusBadge({ status }) {
  const { label, isActive } = resolveStudentEnrollmentStatus(status)

  return (
    <span
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200',
      )}
    >
      {label}
    </span>
  )
}
