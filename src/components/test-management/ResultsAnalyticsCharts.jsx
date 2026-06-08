import { cn } from '../../utils/cn'

function ChartCard({ title, subtitle, children, className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-white sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

export function ScoreDistributionBars({ buckets = [] }) {
  const max = Math.max(...buckets.map((b) => b.count || 0), 1)
  return (
    <ChartCard title="Score Distribution" subtitle="Attempts by score bucket">
      <div className="flex h-52 items-end gap-2 sm:gap-3">
        {buckets.map((b) => (
          <div key={b.label} className="group flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-[#246392] to-[#55ace7] transition group-hover:from-[#1a4d6d] group-hover:to-[#6ec0f5]"
              style={{ height: `${Math.max(8, ((b.count || 0) / max) * 100)}%` }}
              title={`${b.count} attempts`}
            />
            <span className="text-center text-[10px] font-semibold text-[#686868] sm:text-xs">{b.label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

export function SubjectWiseBars({ rows = [] }) {
  const max = Math.max(...rows.map((r) => r.avg || 0), 1)
  return (
    <ChartCard title="Subject-wise Analytics" subtitle="Average score by subject">
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.subject}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium text-[#222]" title={r.subject}>
                {r.subject}
              </span>
              <span className="shrink-0 font-extrabold text-[#1a3a5c]">{r.avg}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2fc]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392]"
                style={{ width: `${((r.avg || 0) / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}

export function PerformanceTrend({ points = [] }) {
  const max = Math.max(...points.map((p) => p.value || 0), 1)
  const w = 320
  const h = 120
  const pad = 10
  const pts = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((p.value || 0) / max) * (h - pad * 2)
    return { ...p, x, y }
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${line} L ${pts[pts.length - 1]?.x ?? pad} ${h - pad} L ${pts[0]?.x ?? pad} ${h - pad} Z`

  return (
    <ChartCard title="Student Performance Trend" subtitle="Average score trend">
      <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto w-full max-w-md" aria-hidden>
        <defs>
          <linearGradient id="tmTrendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55ace7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#55ace7" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tmTrendArea)" />
        <path d={line} fill="none" stroke="#246392" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="4" fill="#55ace7" stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs font-semibold text-[#686868]">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </ChartCard>
  )
}

export function PassFailSplit({ passPct = 0, failPct = 0 }) {
  const total = Math.max(passPct + failPct, 1)
  const pass = (passPct / total) * 100
  const fail = 100 - pass
  const gradient = `conic-gradient(#39bf2e 0% ${pass}%, #c96565 ${pass}% 100%)`
  return (
    <ChartCard title="Pass vs Fail" subtitle="Attempt split">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <div className="relative h-36 w-36 shrink-0 rounded-full shadow-inner sm:h-40 sm:w-40" style={{ background: gradient }}>
          <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white text-center">
            <span className="text-lg font-black text-[#1a3a5c]">{Math.round(pass)}%</span>
          </div>
        </div>
        <ul className="flex w-full flex-col gap-2 sm:max-w-[220px]">
          <li className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-[#222]">
              <span className="h-3 w-3 shrink-0 rounded-full bg-[#39bf2e]" /> Pass
            </span>
            <span className="font-extrabold text-[#246392]">{passPct}%</span>
          </li>
          <li className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-[#222]">
              <span className="h-3 w-3 shrink-0 rounded-full bg-[#c96565]" /> Fail
            </span>
            <span className="font-extrabold text-[#246392]">{failPct}%</span>
          </li>
        </ul>
      </div>
    </ChartCard>
  )
}

