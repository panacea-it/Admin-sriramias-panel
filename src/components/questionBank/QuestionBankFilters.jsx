import { cn } from '../../utils/cn'
import QuestionFilterToolbar from '../test-management/QuestionFilterToolbar'
import { QUESTION_BANK_SORT_OPTIONS } from '../../utils/questionBankApiHelpers'
import { QUESTION_STATUSES } from '../../data/testManagementSeed'

export default function QuestionBankFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  category,
  onCategoryChange,
  subject,
  onSubjectChange,
  topic,
  onTopicChange,
  difficulty,
  onDifficultyChange,
  tag,
  onTagChange,
  status,
  onStatusChange,
  sortPreset,
  onSortPresetChange,
  filterOptions,
  disabled,
}) {
  const typeChoices = filterOptions?.types?.length
    ? filterOptions.types
    : ['MCQ', 'Numerical', 'Match the Following', 'Assertion Reason', 'Descriptive']
  const difficultyChoices = filterOptions?.difficulties?.length
    ? filterOptions.difficulties
    : ['Easy', 'Medium', 'Hard']
  const categoryChoices = filterOptions?.categories?.length
    ? filterOptions.categories
    : ['Prelims', 'Mains']
  const subjects = filterOptions?.subjects ?? []
  const topics = filterOptions?.topics ?? []
  const tags = filterOptions?.tags ?? []

  return (
    <div className="space-y-4">
      <QuestionFilterToolbar
        search={search}
        onSearchChange={onSearchChange}
        type={type}
        onTypeChange={onTypeChange}
        subject={subject}
        onSubjectChange={onSubjectChange}
        topic={topic}
        onTopicChange={onTopicChange}
        difficulty={difficulty}
        onDifficultyChange={onDifficultyChange}
        tag={tag}
        onTagChange={onTagChange}
        status={status}
        onStatusChange={onStatusChange}
        disabled={disabled}
        typeOptions={[{ value: 'all', label: 'Type' }, ...typeChoices.map((t) => ({ value: t, label: t }))]}
        subjects={subjects}
        topics={topics}
        difficultyOptions={[
          { value: 'all', label: 'Difficulty' },
          ...difficultyChoices.map((d) => ({ value: d, label: d })),
        ]}
        tagOptions={[{ value: 'all', label: 'Tags' }, ...tags.map((t) => ({ value: t, label: t }))]}
        statusOptions={[
          { value: 'all', label: 'Status' },
          ...QUESTION_STATUSES.map((s) => ({ value: s, label: s })),
        ]}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <label className="flex w-full flex-col gap-1 sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Category</span>
          <select
            value={category}
            onChange={onCategoryChange}
            disabled={disabled}
            className={cn(
              'h-11 min-w-[160px] rounded-xl border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60',
            )}
          >
            <option value="all" className="bg-white text-[#222]">
              All categories
            </option>
            {categoryChoices.map((item) => (
              <option key={item} value={item} className="bg-white text-[#222]">
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-full flex-col gap-1 sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Sort by</span>
          <select
            value={sortPreset}
            onChange={onSortPresetChange}
            disabled={disabled}
            className={cn(
              'h-11 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60',
            )}
          >
            {QUESTION_BANK_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
