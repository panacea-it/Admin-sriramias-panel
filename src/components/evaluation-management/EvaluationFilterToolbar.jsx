import { cn } from '../../utils/cn'

export default function EvaluationFilterToolbar({
  students = [],
  tests = [],
  evaluators = [],
  values,
  onChange,
  onReset,
}) {
  const v = values || {}

  return (
    <div
      className={cn(
        'rounded-lg bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4',
      )}
    >
      <div className="grid gap-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <input
            type="search"
            value={v.search || ''}
            onChange={(e) => onChange?.({ ...v, search: e.target.value })}
            placeholder="Search evaluations (ID / student / test / evaluator)"
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
          />
        </div>

        <div className="lg:col-span-2">
          <select
            value={v.studentId || 'all'}
            onChange={(e) => onChange?.({ ...v, studentId: e.target.value })}
            className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:text-base"
          >
            <option value="all" className="bg-white text-[#222]">
              Student
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id} className="bg-white text-[#222]">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={v.testId || 'all'}
            onChange={(e) => onChange?.({ ...v, testId: e.target.value })}
            className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:text-base"
          >
            <option value="all" className="bg-white text-[#222]">
              Test
            </option>
            {tests.map((t) => (
              <option key={t.id} value={t.id} className="bg-white text-[#222]">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={v.evaluatorId || 'all'}
            onChange={(e) => onChange?.({ ...v, evaluatorId: e.target.value })}
            className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:text-base"
          >
            <option value="all" className="bg-white text-[#222]">
              Evaluator
            </option>
            {evaluators.map((e) => (
              <option key={e.id} value={e.id} className="bg-white text-[#222]">
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={v.status || 'all'}
            onChange={(e) => onChange?.({ ...v, status: e.target.value })}
            className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:text-base"
          >
            <option value="all" className="bg-white text-[#222]">
              Status
            </option>
            {['Pending', 'In Review', 'Draft Saved', 'Published', 'Rechecking'].map((s) => (
              <option key={s} value={s} className="bg-white text-[#222]">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <input
            type="date"
            value={v.from || ''}
            onChange={(e) => onChange?.({ ...v, from: e.target.value })}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7] sm:text-base"
          />
        </div>
        <div className="lg:col-span-3">
          <input
            type="date"
            value={v.to || ''}
            onChange={(e) => onChange?.({ ...v, to: e.target.value })}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7] sm:text-base"
          />
        </div>
        <div className="sm:col-span-1 lg:col-span-2 lg:col-start-11">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 w-full min-h-[38px] items-center justify-center rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] sm:text-base"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

