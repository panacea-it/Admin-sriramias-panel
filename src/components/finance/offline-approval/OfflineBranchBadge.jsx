import { Building2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { OFFLINE_BRANCH_LABELS, OFFLINE_BRANCH_ACCESS } from '../../../constants/offlinePaymentApproval'
import { cn } from '../../../utils/cn'

const ACCESS_STYLES = {
  [OFFLINE_BRANCH_ACCESS.ALLOWED]: 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
  [OFFLINE_BRANCH_ACCESS.RESTRICTED]: 'bg-[#df8284]/10 text-[#b94b4b] ring-[#df8284]/30',
  [OFFLINE_BRANCH_ACCESS.OVERRIDE]: 'bg-amber-50 text-amber-800 ring-amber-200',
}

const ACCESS_ICONS = {
  [OFFLINE_BRANCH_ACCESS.ALLOWED]: ShieldCheck,
  [OFFLINE_BRANCH_ACCESS.RESTRICTED]: ShieldAlert,
  [OFFLINE_BRANCH_ACCESS.OVERRIDE]: ShieldCheck,
}

export default function OfflineBranchBadge({ branchCode, accessStatus, showAccess = false, className }) {
  const label = OFFLINE_BRANCH_LABELS[branchCode] || branchCode
  const AccessIcon = showAccess && accessStatus ? ACCESS_ICONS[accessStatus] : Building2

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1',
        showAccess && accessStatus ? ACCESS_STYLES[accessStatus] : 'bg-slate-100 text-slate-700 ring-slate-200',
        className,
      )}
      title={showAccess && accessStatus ? accessStatus : label}
    >
      <AccessIcon className="h-3 w-3" aria-hidden />
      {branchCode}
    </span>
  )
}
