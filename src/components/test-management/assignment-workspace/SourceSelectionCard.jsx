import { Layers } from 'lucide-react'
import SearchableSelect from '../../categories/SearchableSelect'

const TRIGGER =
  'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-[#333] shadow-sm'

export default function SourceSelectionCard({
  batches,
  subjects,
  topics,
  tests,
  batchId,
  subjectId,
  topicId,
  testId,
  onBatchChange,
  onSubjectChange,
  onTopicChange,
  onTestChange,
  loading,
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2fc] text-[#55ace7]">
          <Layers className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <h3 className="text-sm font-bold text-[#1a3a5c]">Source Selection</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Batch
          </label>
          <SearchableSelect
            options={batches}
            value={batchId}
            onChange={onBatchChange}
            disabled={loading}
            placeholder="Select batch"
            triggerClassName={TRIGGER}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Faculty Subject
          </label>
          <SearchableSelect
            options={subjects}
            value={subjectId}
            onChange={onSubjectChange}
            disabled={loading || !batchId}
            placeholder="Select faculty subject"
            triggerClassName={TRIGGER}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Topic
          </label>
          <SearchableSelect
            options={topics}
            value={topicId}
            onChange={onTopicChange}
            disabled={loading || !subjectId}
            placeholder="Select topic"
            triggerClassName={TRIGGER}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Test Name
          </label>
          <SearchableSelect
            options={tests}
            value={testId}
            onChange={onTestChange}
            disabled={loading || !topicId}
            placeholder="Select test name"
            triggerClassName={TRIGGER}
          />
        </div>
      </div>
    </article>
  )
}
