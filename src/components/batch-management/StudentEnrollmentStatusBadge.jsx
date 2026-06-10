import { cn } from '../../utils/cn'
import { resolveStudentEnrollmentStatus } from './studentStatusDisplay'

export default function StudentEnrollmentStatusBadge({ status }) {
  const { label, isActive } = resolveStudentEnrollmentStatus(status)

  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        isActive ? 'bg-[#69df66]' : 'bg-[#efb36d]',
      )}
    >
      {label}
    </span>
  )
}
