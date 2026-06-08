import DashboardProgressBar from './DashboardProgressBar'

export default function ExamSuccessCard({ exam }) {
  return (
    <article className="rounded-xl p-4" style={{ background: exam.bg }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-800 shadow-sm">
            {exam.name[0]}
          </div>
          <h3 className="text-sm font-bold text-gray-800">{exam.name}</h3>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-green-600 shadow-sm">
          {exam.pct}%
        </span>
      </div>
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs font-bold">
        <span className="text-green-600">Passed : {exam.passed}</span>
        <span className="text-[#005b9a]">Appeared : {exam.appeared}</span>
      </div>
      <DashboardProgressBar
        value={exam.pct}
        color="linear-gradient(90deg,#33b8ff,#005b9a)"
        className="h-2.5"
      />
    </article>
  )
}
