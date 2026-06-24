import FinanceStatusBadge from './FinanceStatusBadge'

export default function FinanceAccessStatusBadge({ status, className, truncate = true }) {
  return (
    <FinanceStatusBadge
      status={status}
      className={className}
      title={status}
      truncate={truncate}
    />
  )
}
