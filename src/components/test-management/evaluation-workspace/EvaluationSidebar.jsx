import EvaluationCriteriaCard from './EvaluationCriteriaCard'
import PaperEvaluationStatusBadge from '../evaluation-oversight/PaperEvaluationStatusBadge'

function computeTotal(rubric) {
  return rubric.reduce((s, r) => s + (Number(r.score) || 0), 0)
}

function computeMax(rubric) {
  return rubric.reduce((s, r) => s + (Number(r.max) || 0), 0)
}

export default function EvaluationSidebar({
  paper,
  rubric,
  locked,
  saving,
  onRubricScore,
  onRubricFeedback,
  onSaveDraft,
  onPublish,
}) {
  const total = computeTotal(rubric)
  const max = computeMax(rubric) || paper?.scoreMax || 20

  return (
    <aside className="flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#f8fafc] shadow-[var(--card-shadow)]">
        <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55ace7]">
                Evaluating Candidate
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#1a3a5c]">{paper?.studentName}</h2>
            </div>
            <PaperEvaluationStatusBadge status={paper?.status === 'Evaluated' ? 'Evaluated' : 'In Progress'} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#eef2fc] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">Roll No</p>
              <p className="text-sm font-semibold text-[#333]">{paper?.rollNumber}</p>
            </div>
            <div className="rounded-lg bg-[#eef2fc] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">Batch</p>
              <p className="truncate text-sm font-semibold text-[#333]">{paper?.batchName}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {rubric.map((r, idx) => (
            <EvaluationCriteriaCard
              key={r.key}
              label={r.label}
              score={r.score}
              max={r.max}
              remarksLabel={r.remarksLabel || 'Remarks'}
              placeholder={r.placeholder}
              feedback={r.feedback}
              disabled={locked}
              onScoreChange={(v) => onRubricScore(idx, v)}
              onFeedbackChange={(v) => onRubricFeedback(idx, v)}
            />
          ))}
        </div>

        <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between">
            <span className="text-sm font-semibold text-slate-600">Total Score</span>
            <span className="text-2xl font-black text-[#1a3a5c]">
              {Math.round(total * 10) / 10} / {max}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={locked || saving}
              onClick={onSaveDraft}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-[#1a3a5c] hover:bg-slate-50 disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={locked || saving}
              onClick={onPublish}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#55ace7] text-sm font-semibold text-white shadow-sm hover:bg-[#4699d4] disabled:opacity-60"
            >
              Publish Result
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
