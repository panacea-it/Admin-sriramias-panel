import { contentLibraryTw } from '../../constants/contentLibraryTheme'

export function EngagementBarChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.views), 1)
  return (
    <div className={contentLibraryTw.card + ' p-5'}>
      <h3 className="mb-4 text-base font-bold text-[#1a3a5c]">Weekly engagement</h3>
      <div className="flex h-48 items-end justify-between gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[#246392] to-[#55ace7] transition-all"
              style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 8 : 4 }}
              title={`${d.views} views`}
            />
            <span className="text-[10px] font-medium text-slate-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopContentList({ title, rows = [], metricKey = 'views' }) {
  return (
    <div className={contentLibraryTw.card + ' p-5'}>
      <h3 className="mb-3 text-base font-bold text-[#1a3a5c]">{title}</h3>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-slate-500">No data yet</li>
        ) : (
          rows.map((row, i) => (
            <li key={row.id || i} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-700">{row.title}</span>
              <span className="shrink-0 font-semibold text-[#55ace7]">{row[metricKey]}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
