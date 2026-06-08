import { useNavigate } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { cn } from '../../utils/cn'

function ProgressCardSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mb-2 h-3 w-full rounded bg-slate-100" />
      <div className="mb-2 h-3 w-5/6 rounded bg-slate-100" />
      <div className="mt-4 h-2 w-full rounded-full bg-slate-100" />
    </article>
  )
}

function EvaluationProgressCard({ card, onOpen }) {
  const pct = card.evaluationPct ?? 0

  return (
    <article
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] transition',
        onOpen && 'cursor-pointer hover:border-[#55ace7]/40 hover:shadow-md',
      )}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-[#1a3a5c]">{card.testName}</h3>
          {card.facultyLabel && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{card.facultyLabel}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[#55ace7]/10 px-2 py-0.5 text-xs font-bold text-[#55ace7]">
          {pct}%
        </span>
      </div>
      <ul className="space-y-1 text-xs text-slate-600">
        <li>
          <span className="font-semibold text-[#333]">{card.studentsAssigned}</span> Students Assigned
        </li>
        <li>
          <span className="font-semibold text-[#333]">{card.studentsUploaded}</span> Uploaded Answer
          Sheets
        </li>
        <li>
          <span className="font-semibold text-emerald-700">{card.studentsEvaluated}</span> Evaluated ·{' '}
          <span className="font-semibold text-amber-700">{card.pendingEvaluations}</span> Pending
        </li>
      </ul>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-500">
          <span>Evaluation progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#55ace7] transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </article>
  )
}

export default function EvaluationProgressCards({
  cards = [],
  loading = false,
  emptyMessage = 'No evaluations completed yet.',
  onCardClick,
}) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
          <ClipboardCheck className="h-4 w-4 text-[#55ace7]" />
          Latest Evaluation Progress
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ProgressCardSkeleton />
          <ProgressCardSkeleton />
          <ProgressCardSkeleton />
        </div>
      </section>
    )
  }

  if (!cards.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-[var(--card-shadow)]">
        <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
        <ClipboardCheck className="h-4 w-4 text-[#55ace7]" />
        Latest Evaluation Progress
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <EvaluationProgressCard
            key={card.id}
            card={card}
            onOpen={
              onCardClick
                ? () => onCardClick(card, navigate)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}
