import { cn } from '../../utils/cn'

const ROLE_BADGE_STYLES = {
  SUPER_ADMIN: 'bg-violet-500/15 text-violet-800 ring-violet-500/25',
  CONTENT_ADMIN: 'bg-blue-500/15 text-blue-800 ring-blue-500/25',
  MENTOR_ADMIN: 'bg-teal-500/15 text-teal-800 ring-teal-500/25',
  FINANCE_ADMIN: 'bg-orange-500/15 text-orange-800 ring-orange-500/25',
  COUNSELING_ADMIN: 'bg-indigo-500/15 text-indigo-800 ring-indigo-500/25',
  CENTER_ADMIN: 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  EMPLOYEE: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
}

export default function AdminRoleBadge({ roleTitle, roleCode, className }) {
  const code = String(roleCode || '').trim().toUpperCase()
  const title = String(roleTitle || '').trim() || code || '—'

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        ROLE_BADGE_STYLES[code] || 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
        className,
      )}
      title={code || undefined}
    >
      <span className="truncate">{title}</span>
    </span>
  )
}
