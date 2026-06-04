import { Search } from 'lucide-react'
import { CONTENT_TYPES } from '../../utils/contentLibraryTypes'
import {
  CONTENT_LIBRARY_BATCH_OPTIONS,
  CONTENT_LIBRARY_COURSE_OPTIONS,
} from '../../data/contentLibrarySeed'

const selectClass =
  'h-10 min-w-[120px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] shadow-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20'

export default function ContentFiltersBar({
  filters,
  onChange,
  subjects = [],
  topics = [],
  categories = [],
  showStatus = true,
  uploadedByOptions = [],
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={filters.search || ''}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search content, tags, keywords…"
          className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
        />
      </div>
      <select className={selectClass} value={filters.subjectId || 'all'} onChange={(e) => set('subjectId', e.target.value)}>
        <option value="all">All subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select className={selectClass} value={filters.topicId || 'all'} onChange={(e) => set('topicId', e.target.value)}>
        <option value="all">All topics</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select className={selectClass} value={filters.batchId || 'all'} onChange={(e) => set('batchId', e.target.value)}>
        <option value="all">All batches</option>
        {CONTENT_LIBRARY_BATCH_OPTIONS.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <select className={selectClass} value={filters.courseId || 'all'} onChange={(e) => set('courseId', e.target.value)}>
        <option value="all">All courses</option>
        {CONTENT_LIBRARY_COURSE_OPTIONS.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select className={selectClass} value={filters.contentType || 'all'} onChange={(e) => set('contentType', e.target.value)}>
        <option value="all">All types</option>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      {categories.length > 0 && (
        <select className={selectClass} value={filters.categoryId || 'all'} onChange={(e) => set('categoryId', e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {showStatus && (
        <select className={selectClass} value={filters.status || 'all'} onChange={(e) => set('status', e.target.value)}>
          <option value="all">All status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Archived">Archived</option>
          <option value="Pending Approval">Pending Approval</option>
        </select>
      )}
      {uploadedByOptions.length > 0 && (
        <select className={selectClass} value={filters.uploadedBy || 'all'} onChange={(e) => set('uploadedBy', e.target.value)}>
          <option value="all">Uploaded by</option>
          {uploadedByOptions.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      )}
      <input
        type="date"
        className={selectClass}
        value={filters.dateFrom || ''}
        onChange={(e) => set('dateFrom', e.target.value)}
        aria-label="From date"
      />
      <input
        type="date"
        className={selectClass}
        value={filters.dateTo || ''}
        onChange={(e) => set('dateTo', e.target.value)}
        aria-label="To date"
      />
    </div>
  )
}
