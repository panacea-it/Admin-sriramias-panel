import { Filter, Search } from 'lucide-react'
import SearchableSelect from '../../categories/SearchableSelect'
import { cn } from '../../../utils/cn'

function FilterField({ label, children, className }) {
  return (
    <div className={cn('min-w-0 flex-1 basis-[140px]', className)}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  )
}

const SELECT_TRIGGER =
  'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-[#333] shadow-sm'

export default function EvaluationOversightFilters({
  options,
  values,
  onChange,
  onClear,
  loading,
}) {
  const set = (key, value) => onChange((prev) => ({ ...prev, [key]: value }))

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#55ace7]" strokeWidth={2.2} />
          <h3 className="text-sm font-bold text-[#1a3a5c]">Advanced Filtering</h3>
          <span className="rounded-full bg-[#eef2fc] px-2 py-0.5 text-[10px] font-bold text-[#55ace7]">
            13 filters
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-[#55ace7] hover:underline"
        >
          Clear all filters
        </button>
      </div>

      <div className={cn('space-y-3', loading && 'pointer-events-none opacity-60')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <FilterField label="Batch">
            <SearchableSelect
              options={options.batches}
              value={values.batchId}
              onChange={(v) => set('batchId', v)}
              placeholder="Select batch"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Program">
            <SearchableSelect
              options={options.programs}
              value={values.programId}
              onChange={(v) => set('programId', v)}
              placeholder="All Programs"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Subject">
            <SearchableSelect
              options={options.subjects}
              value={values.subjectId}
              onChange={(v) => set('subjectId', v)}
              placeholder="Select subject"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Sub-topic">
            <SearchableSelect
              options={options.subTopics}
              value={values.subTopicId}
              onChange={(v) => set('subTopicId', v)}
              placeholder="All Sub-topics"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Test Name">
            <SearchableSelect
              options={options.tests}
              value={values.testId}
              onChange={(v) => set('testId', v)}
              placeholder="All tests"
              triggerClassName={cn(SELECT_TRIGGER, 'ring-1 ring-[#55ace7]/25')}
            />
          </FilterField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <FilterField label="Faculty / Mentor">
            <SearchableSelect
              options={options.mentors}
              value={values.mentorId}
              onChange={(v) => set('mentorId', v)}
              placeholder="All Mentors"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Evaluation Status">
            <SearchableSelect
              options={options.statuses}
              value={values.status}
              onChange={(v) => set('status', v)}
              placeholder="All Statuses"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Priority">
            <SearchableSelect
              options={options.priorities}
              value={values.priority}
              onChange={(v) => set('priority', v)}
              placeholder="All Priorities"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Exam Type">
            <SearchableSelect
              options={options.examTypes}
              value={values.examType}
              onChange={(v) => set('examType', v)}
              placeholder="All Types"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
          <FilterField label="Study Center">
            <SearchableSelect
              options={options.centers}
              value={values.centerId}
              onChange={(v) => set('centerId', v)}
              placeholder="All Centers"
              triggerClassName={SELECT_TRIGGER}
            />
          </FilterField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Submitted From" className="lg:max-w-[220px]">
            <input
              type="date"
              value={values.submittedFrom || ''}
              onChange={(e) => set('submittedFrom', e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#333] shadow-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
            />
          </FilterField>
          <FilterField label="Submitted To" className="lg:max-w-[220px]">
            <input
              type="date"
              value={values.submittedTo || ''}
              onChange={(e) => set('submittedTo', e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#333] shadow-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
            />
          </FilterField>
          <FilterField label="Search" className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={values.search || ''}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Student name, roll no., mentor…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-[#333] shadow-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
              />
            </div>
          </FilterField>
        </div>
      </div>
    </article>
  )
}
