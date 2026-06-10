import { useCallback, useState } from 'react'
import { Upload, Sparkles, History, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import { BannerButton } from '../academics/AcademicsUi'
import {
  CONTENT_TYPES,
  DIFFICULTY_LEVELS,
  VISIBILITY_MODES,
  detectContentTypeFromFile,
  formatBytes,
} from '../../utils/contentLibraryTypes'
import {
  CONTENT_LIBRARY_BATCH_OPTIONS,
  CONTENT_LIBRARY_COURSE_OPTIONS,
} from '../../data/contentLibrarySeed'
import { mapUploadedFiles } from '../../utils/contentLibraryMappers'
import {
  suggestAcademicMapping,
  suggestTagsFromFilename,
  generateSeoSlug,
} from '../../utils/contentLibraryAiTagging'
import VersionHistoryDrawer from './VersionHistoryDrawer'
import { cn } from '../../utils/cn'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile, validateUploadFiles } from '../../utils/uploadValidation'

const inputClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20'
const labelClass = 'text-sm font-medium text-slate-700'

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-[#1a3a5c]">{title}</h3>
      {children}
    </section>
  )
}

function MultiSelect({ options, value = [], onChange, label }) {
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id]
    onChange(next)
  }
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              value.includes(opt.id)
                ? 'bg-[#55ace7] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ContentUploadForm({
  form,
  setForm,
  subjects,
  topics,
  categories,
  existing,
  onSaveDraft,
  onPublish,
  onSchedule,
  onArchive,
  saving,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)
  const [aiHint, setAiHint] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const filteredTopics = topics.filter(
    (t) => !form.subjectIds?.length || form.subjectIds.includes(t.subjectId),
  )

  const handleFiles = useCallback(
    async (fileList) => {
      const result = await validateUploadFiles(fileList, 'CONTENT_LIBRARY_FILES', {
        checkDimensions: false,
      })
      if (!result.valid) {
        setUploadError(result.message)
        return
      }
      setUploadError(null)
      const mapped = mapUploadedFiles(fileList)
      if (!mapped.length) return
      const first = mapped[0]
      const tags = suggestTagsFromFilename(first.name)
      const mapping = suggestAcademicMapping(first.name, form.title)
      setAiHint(mapping)
      setForm((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...mapped],
        contentType: prev.contentType || first.contentType || detectContentTypeFromFile(first.file),
        tags: prev.tags || tags.join(', '),
        subjectIds: prev.subjectIds?.length ? prev.subjectIds : mapping.subjectIds,
        topicIds: prev.topicIds?.length ? prev.topicIds : mapping.topicIds,
        seoSlug: prev.seoSlug || generateSeoSlug(prev.title || first.name),
      }))
      toast.message('AI suggestions applied from filename')
    },
    [form.title, setForm],
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-5">
      <Section title="A. Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Content title *</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  title: e.target.value,
                  seoSlug: p.seoSlug || generateSeoSlug(e.target.value),
                }))
              }
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea
              className={cn(inputClass, 'min-h-[88px] py-2')}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </label>
          <label>
            <span className={labelClass}>Content type</span>
            <select
              className={inputClass}
              value={form.contentType}
              onChange={(e) => setForm((p) => ({ ...p, contentType: e.target.value }))}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Category</span>
            <select
              className={inputClass}
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Thumbnail</span>
            <input
              type="file"
              accept="image/*"
              className={inputClass}
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const result = await validateUploadFile(f, 'IMAGE_THUMBNAIL')
                if (!result.valid) {
                  setUploadError(result.message)
                  e.target.value = ''
                  return
                }
                setUploadError(null)
                setForm((p) => ({
                  ...p,
                  thumbnailPreview: URL.createObjectURL(f),
                  thumbnailFile: f,
                }))
              }}
            />
            <UploadFieldHint profile="IMAGE_THUMBNAIL" />
          </label>
          <label>
            <span className={labelClass}>Estimated duration</span>
            <input
              className={inputClass}
              value={form.estimatedDuration}
              onChange={(e) => setForm((p) => ({ ...p, estimatedDuration: e.target.value }))}
              placeholder="e.g. 45 min"
            />
          </label>
          <label>
            <span className={labelClass}>Difficulty</span>
            <select
              className={inputClass}
              value={form.difficulty}
              onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
            >
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Tags (comma-separated)</span>
            <input
              className={inputClass}
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>Keywords</span>
            <input
              className={inputClass}
              value={form.keywords}
              onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>SEO slug</span>
            <input
              className={inputClass}
              value={form.seoSlug}
              onChange={(e) => setForm((p) => ({ ...p, seoSlug: e.target.value }))}
            />
          </label>
          {['YouTube', 'Vimeo', 'External Link', 'Google Drive'].includes(form.contentType) && (
            <label className="sm:col-span-2">
              <span className={labelClass}>External URL</span>
              <input
                className={inputClass}
                value={form.externalUrl}
                onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
                placeholder="https://"
              />
            </label>
          )}
        </div>
        {aiHint?.confidence > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#cbeeff]/50 px-3 py-2 text-xs text-[#246392]">
            <Sparkles className="h-4 w-4 shrink-0" />
            AI mapped to {aiHint.subjectName}
            {aiHint.topicName ? ` → ${aiHint.topicName}` : ''} ({Math.round(aiHint.confidence * 100)}% confidence)
          </p>
        )}
      </Section>

      <Section title="B. Academic tagging">
        <div className="grid gap-4">
          <MultiSelect
            label="Subjects"
            options={subjects.map((s) => ({ id: s.id, name: s.name }))}
            value={form.subjectIds}
            onChange={(subjectIds) => setForm((p) => ({ ...p, subjectIds }))}
          />
          <MultiSelect
            label="Topics"
            options={filteredTopics.map((t) => ({ id: t.id, name: t.name }))}
            value={form.topicIds}
            onChange={(topicIds) => setForm((p) => ({ ...p, topicIds }))}
          />
          <MultiSelect
            label="Courses"
            options={CONTENT_LIBRARY_COURSE_OPTIONS}
            value={form.courseIds}
            onChange={(courseIds) => setForm((p) => ({ ...p, courseIds }))}
          />
          <MultiSelect
            label="Batches"
            options={CONTENT_LIBRARY_BATCH_OPTIONS}
            value={form.batchIds}
            onChange={(batchIds) => setForm((p) => ({ ...p, batchIds }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Chapter</span>
              <input
                className={inputClass}
                value={form.chapter}
                onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
              />
            </label>
            <label>
              <span className={labelClass}>Subtopic</span>
              <input
                className={inputClass}
                value={form.subtopic}
                onChange={(e) => setForm((p) => ({ ...p, subtopic: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </Section>

      <Section title="C. File management">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition',
            dragOver ? 'border-[#55ace7] bg-[#cbeeff]/30' : 'border-slate-200 bg-slate-50/50',
          )}
        >
          <Upload className="h-10 w-10 text-[#55ace7]" />
          <p className="mt-2 text-sm font-medium text-slate-600">Drag & drop files here</p>
          <UploadFieldHint profile="CONTENT_LIBRARY_FILES" className="text-xs text-slate-400" />
          <label className="mt-4 cursor-pointer rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white">
            Browse files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
        <UploadValidationMessage message={uploadError} className="mt-2 text-center" />
        {form.files?.length > 0 && (
          <ul className="mt-4 space-y-2">
            {form.files.map((f, idx) => (
              <li
                key={f.id || idx}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">{f.name}</span>
                <span className="text-xs text-slate-500">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-500"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      files: p.files.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {existing && (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#55ace7]"
            onClick={() => setVersionOpen(true)}
          >
            <History className="h-4 w-4" /> Version history
          </button>
        )}
      </Section>

      <Section title="D. Access configuration">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Visibility</span>
            <select
              className={inputClass}
              value={form.visibility}
              onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}
            >
              {VISIBILITY_MODES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Expiry date</span>
            <input
              type="date"
              className={inputClass}
              value={form.access?.expiryDate?.slice(0, 10) || ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  access: { ...p.access, expiryDate: e.target.value },
                }))
              }
            />
          </label>
          {[
            ['batchSpecific', 'Batch-specific access'],
            ['courseSpecific', 'Course-specific access'],
            ['paidOnly', 'Paid students only'],
            ['trialUsers', 'Trial users'],
            ['downloadEnabled', 'Download enabled'],
            ['streamingOnly', 'Streaming only'],
            ['watermark', 'Watermark protection'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.access?.[key]}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    access: { ...p.access, [key]: e.target.checked },
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              {label}
            </label>
          ))}
          <label>
            <span className={labelClass}>Max downloads (0 = unlimited)</span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.access?.maxDownloads ?? 0}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  access: { ...p.access, maxDownloads: Number(e.target.value) },
                }))
              }
            />
          </label>
        </div>
      </Section>

      <Section title="E. Publishing">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.notifyOnPublish}
            onChange={(e) => setForm((p) => ({ ...p, notifyOnPublish: e.target.checked }))}
          />
          Notify students when published
        </label>
        <label className="mt-3 block">
          <span className={labelClass}>Schedule publish</span>
          <input
            type="datetime-local"
            className={inputClass}
            value={form.scheduledAt?.slice(0, 16) || ''}
            onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <BannerButton onClick={onSaveDraft} disabled={saving}>
            Save draft
          </BannerButton>
          <button
            type="button"
            onClick={onPublish}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-lg bg-[#69df66] px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            Publish now
          </button>
          <button
            type="button"
            onClick={onSchedule}
            disabled={saving || !form.scheduledAt}
            className="inline-flex h-10 items-center rounded-lg bg-[#55ace7] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Schedule publish
          </button>
          {existing && (
            <button
              type="button"
              onClick={onArchive}
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Archive
            </button>
          )}
        </div>
      </Section>

      <VersionHistoryDrawer
        contentId={existing?.id}
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
      />
    </div>
  )
}
