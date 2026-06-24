import ProgressBar from '../figma/ProgressBar'

export default function SalesFunnelChart({ stages }) {
  const max = stages[0]?.count || 1
  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <div key={stage.name || stage.stage}>
          <div className="mb-1.5 flex flex-wrap justify-between gap-1 text-xs font-semibold sm:text-sm">
            <span>{stage.name || stage.stage}</span>
            <span className="text-[#686868]">
              {stage.count?.toLocaleString()} · {stage.conversionPct ?? stage.pct}%
              {stage.dropOffPct != null && ` · Drop-off ${stage.dropOffPct}%`}
            </span>
          </div>
          <ProgressBar
            value={((stage.count || 0) / max) * 100}
            color="linear-gradient(90deg, #55ace7, #246392)"
          />
        </div>
      ))}
    </div>
  )
}
