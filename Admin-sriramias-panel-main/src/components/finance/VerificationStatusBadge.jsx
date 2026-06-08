import FinanceStatusBadge from './FinanceStatusBadge'
import { FINANCE_VERIFICATION_STATUS_META } from '../../constants/financeVerification'

export default function VerificationStatusBadge({ status }) {
  const label = status || 'Pending Verification'
  const meta = FINANCE_VERIFICATION_STATUS_META[label]
  const title = meta
    ? `${label}: ${meta.description}${meta.sample ? ` — e.g. ${meta.sample}` : ''}`
    : label

  return (
    <FinanceStatusBadge
      status={label}
      className="max-w-none"
      title={title}
    />
  )
}
