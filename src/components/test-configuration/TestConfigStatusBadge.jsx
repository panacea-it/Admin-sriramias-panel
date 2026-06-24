import { cn } from '../../utils/cn'
import { displayRecordStatusLabel, isRecordStatusActive } from '../../constants/recordStatus'

/** Soft pill tones — matches CBT Management ScorePill / Center Management status pills */
const PILL_STYLES = {
  active: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  inactive: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
  draft: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
}

function resolveStatusTone(status) {
  const raw = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  if (raw === 'DRAFT') return 'draft'
  if (
    raw === 'IN_ACTIVE' ||
    raw === 'INACTIVE' ||
    raw === 'DISABLED' ||
    raw === 'DEACTIVATED'
  ) {
    return 'inactive'
  }
  if (raw === 'ACTIVE' || isRecordStatusActive(status)) return 'active'
  return 'inactive'
}

export default function TestConfigStatusBadge({ status }) {
  const tone = resolveStatusTone(status)
  const label = displayRecordStatusLabel(status)

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        PILL_STYLES[tone],
      )}
    >
      {label === 'Deactivated' ? 'Inactive' : label || status || '—'}
    </span>
  )
}
