import { cn } from '../../../utils/cn'
import { EMI_OVERDUE_SEVERITY } from '../../../constants/emiManagement'

export default function EmiOverdueSeverityBadge({ severityId, overdueDays, className }) {
  const severity =
    EMI_OVERDUE_SEVERITY[severityId] ||
    (overdueDays > 0 ? Object.values(EMI_OVERDUE_SEVERITY).find((s) => overdueDays >= s.minDays && overdueDays <= s.maxDays) : null)

  if (!severity || !overdueDays) return <span className="text-xs text-[#686868]">—</span>

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
        severity.className,
        className,
      )}
    >
      {severity.label} · {overdueDays}d
    </span>
  )
}
