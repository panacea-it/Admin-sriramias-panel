import { cn } from '../../../../utils/cn'
import CbtProgressBar from './CbtProgressBar'

export default function CbtProgressCard({
  card,
  onOpen,
  showUploadedSheets = false,
  resultsLineLabel = 'evaluation',
  progressLabel,
  className,
}) {
  const pct = card.evaluationPct ?? 0
  const isPublished = resultsLineLabel === 'published'
  const resolvedProgressLabel =
    progressLabel ||
    (isPublished ? 'Evaluation progress' : 'Evaluation progress')
  const doneLabel = isPublished ? 'Published' : 'Evaluated'
  const pendingLabel = isPublished ? 'Unpublished' : 'Pending'

  return (
    <article
      className={cn(
        'relative flex h-full min-h-[200px] flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition sm:min-h-[210px] sm:p-6',
        onOpen &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-[#55ace7]/35 hover:shadow-[0_16px_40px_rgba(85,172,231,0.15)]',
        className,
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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1a3a5c]">
            {card.testName}
          </h3>
          {card.facultyLabel ? (
            <p className="mt-1 truncate text-sm text-[#55ace7]">{card.facultyLabel}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-[#55ace7]/15 px-2.5 py-1 text-xs font-bold tabular-nums text-[#55ace7]">
          {pct}%
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-slate-600">
        <p>
          <span className="font-semibold tabular-nums text-[#1a3a5c]">{card.studentsAssigned}</span>{' '}
          Students Assigned
        </p>
        {showUploadedSheets ? (
          <p>
            <span className="font-semibold tabular-nums text-[#1a3a5c]">{card.studentsUploaded}</span>{' '}
            Uploaded Answer Sheets
          </p>
        ) : null}
        <p>
          <span className="font-semibold tabular-nums text-emerald-700">{card.studentsEvaluated}</span>{' '}
          {doneLabel}
          <span className="mx-1.5 text-slate-400">·</span>
          <span className="font-semibold tabular-nums text-amber-700">{card.pendingEvaluations}</span>{' '}
          {pendingLabel}
        </p>
      </div>

      <CbtProgressBar label={resolvedProgressLabel} value={pct} className="mt-auto pt-4" />
    </article>
  )
}
