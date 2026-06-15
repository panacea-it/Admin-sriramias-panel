import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

const CONTROL_HEIGHT = 'h-12 min-h-[48px]'
const CONTROL_RADIUS = 'rounded-xl'

function FilterSelect({ label, value, onChange, options, disabled }) {
  return (
    <div className="relative w-full sm:w-[170px] sm:min-w-[160px] sm:max-w-[180px]">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        className={cn(
          CONTROL_HEIGHT,
          CONTROL_RADIUS,
          'w-full appearance-none border-0 bg-[#55ace7] pl-4 pr-10 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

export default function QuestionFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by Question ID, Subject, or Question Preview...',
  type,
  onTypeChange,
  subject,
  onSubjectChange,
  topic,
  onTopicChange,
  difficulty,
  onDifficultyChange,
  status,
  onStatusChange,
  typeOptions = [],
  subjects = [],
  topics = [],
  difficultyOptions = [],
  tag,
  onTagChange,
  tagOptions = [],
  statusOptions = [],
  disabled = false,
  className,
}) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
        {/* Search — first element, fixed width on desktop */}
        <div className="relative w-full shrink-0 lg:w-[420px] lg:min-w-[380px] lg:max-w-[450px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className={cn(
              CONTROL_HEIGHT,
              CONTROL_RADIUS,
              'w-full border-0 bg-[#eef2fc] pl-11 pr-4 text-sm text-[#222] shadow-[0_2px_8px_rgba(15,23,42,0.04)] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:cursor-not-allowed disabled:opacity-60',
            )}
          />
        </div>

        {/* Filter dropdowns — single row on desktop, wrap on tablet/mobile */}
        <div className="flex w-full flex-wrap items-center gap-4 lg:flex-1 lg:min-w-0">
          <FilterSelect
            label="Type"
            value={type}
            onChange={onTypeChange}
            options={typeOptions}
            disabled={disabled}
          />
          <FilterSelect
            label="Subject"
            value={subject}
            onChange={onSubjectChange}
            options={[{ value: 'all', label: 'Subject' }, ...subjects.map((s) => ({ value: s, label: s }))]}
            disabled={disabled}
          />
          <FilterSelect
            label="Topic"
            value={topic}
            onChange={onTopicChange}
            options={[{ value: 'all', label: 'Topic' }, ...topics.map((t) => ({ value: t, label: t }))]}
            disabled={disabled}
          />
          <FilterSelect
            label="Difficulty"
            value={difficulty}
            onChange={onDifficultyChange}
            options={difficultyOptions}
            disabled={disabled}
          />
          <FilterSelect
            label="Tags"
            value={tag}
            onChange={onTagChange}
            options={tagOptions}
            disabled={disabled}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={statusOptions}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
