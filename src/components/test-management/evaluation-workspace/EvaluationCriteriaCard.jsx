export default function EvaluationCriteriaCard({
  label,
  score,
  max,
  remarksLabel,
  placeholder,
  feedback,
  disabled,
  onScoreChange,
  onFeedbackChange,
}) {
  const pct = max > 0 ? Math.round((Number(score) / max) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#1a3a5c]">{label}</p>
        <span className="text-sm font-bold text-[#55ace7]">
          {score ?? 0} / {max}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={0.5}
        disabled={disabled}
        value={Number(score) || 0}
        onChange={(e) => onScoreChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer accent-[#55ace7] disabled:opacity-50"
        style={{ background: `linear-gradient(to right, #55ace7 ${pct}%, #e2e8f0 ${pct}%)` }}
      />
      <label className="mt-3 block text-xs font-semibold text-slate-600">{remarksLabel}</label>
      <textarea
        value={feedback || ''}
        disabled={disabled}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 min-h-[72px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:opacity-60"
      />
    </div>
  )
}
