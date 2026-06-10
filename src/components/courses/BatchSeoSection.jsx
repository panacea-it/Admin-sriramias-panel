import { useMemo } from 'react'
import { Globe, Search } from 'lucide-react'
import {
  CourseFormField,
  CourseInput,
  CourseTextarea,
} from './CourseFormField'
import BlogRichEditor from '../blogs/BlogRichEditor'
import TagInput from '../blogs/TagInput'
import { cn } from '../../utils/cn'
import {
  BATCH_KEYWORD_SUGGESTIONS,
  BATCH_TAG_SUGGESTIONS,
  buildBatchSearchPreview,
} from '../../utils/batchSeoForm'
import {
  META_DESCRIPTION_LIMIT,
  META_TITLE_LIMIT,
  isOverLimit,
  seoCharCount,
  seoLimitTone,
} from '../../utils/blogSeo'

function CharCounter({ text, limit }) {
  const count = seoCharCount(text)
  const over = isOverLimit(text, limit)
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <span className={cn('text-xs font-medium', seoLimitTone(count, limit))}>
        {count} / {limit}
      </span>
      {over ? (
        <span className="text-xs font-semibold text-amber-600">
          Recommended limit exceeded
        </span>
      ) : null}
    </div>
  )
}

function FieldHint({ children, className }) {
  return (
    <p className={cn('text-xs leading-relaxed text-[#686868]', className)}>{children}</p>
  )
}

function SubsectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#eef2fc] pb-3">
      {Icon ? <Icon className="h-4 w-4 text-[#246392]" strokeWidth={2.2} /> : null}
      <h4 className="text-sm font-bold text-[#1a3a5c]">{children}</h4>
    </div>
  )
}

function ContextChip({ label, value }) {
  if (!value) return null
  return (
    <span className="inline-flex max-w-full flex-col rounded-xl border border-[#eef2fc] bg-white px-3 py-2 text-left shadow-sm transition hover:border-[#cfe8f7]">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-[#111]">{value}</span>
    </span>
  )
}

function GoogleSearchPreview({ preview }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe1e5] bg-white shadow-[0_1px_6px_rgba(32,33,36,0.12)]">
      <div className="border-b border-[#f1f3f4] bg-[#f8f9fa] px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-[#70757a]">
          <Search className="h-3.5 w-3.5" />
          <span>Search preview</span>
        </div>
      </div>
      <div className="space-y-1 px-4 py-4 font-[Arial,Helvetica,sans-serif]">
        <p
          className={cn(
            'cursor-default text-xl leading-snug text-[#1a0dab] hover:underline',
            preview.titleFromBatch && 'italic text-[#70757a] no-underline',
          )}
        >
          {preview.title}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-sm leading-tight">
          <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[9px] font-bold text-[#5f6368]">
            S
          </span>
          <span className="text-[#202124]">sriramias.com</span>
          <span className="text-[#70757a]"> › batches › batch</span>
        </div>
        <p
          className={cn(
            'max-w-2xl text-sm leading-relaxed text-[#4d5156]',
            preview.descriptionFromBatch && 'italic text-[#70757a]',
          )}
        >
          {preview.description}
        </p>
      </div>
    </div>
  )
}

/** SEO & content for this batch only — preview uses Batch Details title, course, subjects. */
export default function BatchSeoSection({ form, setForm, errors = {} }) {
  const seo = form.seo || {}

  const updateSeo = (key, value) => {
    setForm((f) => ({
      ...f,
      seo: { ...(f.seo || {}), [key]: value },
    }))
  }

  const preview = useMemo(() => buildBatchSearchPreview(form, seo), [form, seo])

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#d9ebf9] bg-gradient-to-br from-[#f8fbff] to-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-[#246392]" />
          <p className="text-sm leading-relaxed text-[#686868]">
            SEO and page content apply to <strong className="font-semibold text-[#333]">this batch only</strong>.
            Search preview uses the batch name, course, and subjects from{' '}
            <strong className="font-semibold text-[#333]">Batch Details</strong> when meta fields are
            left empty — not a separate course category.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
        <SubsectionTitle>Based on this batch (Batch Details)</SubsectionTitle>
        <div className="flex flex-wrap gap-2">
          <ContextChip label="Batch title" value={preview.context.batchName} />
          <ContextChip label="Course" value={preview.context.courseName} />
          <ContextChip label="Duration" value={preview.context.durationLabel} />
          <ContextChip
            label="Subjects"
            value={
              preview.context.subjectNames.length
                ? preview.context.subjectNames.join(', ')
                : ''
            }
          />
        </div>
        {!preview.context.batchName && !preview.context.courseName ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200/60">
            Fill batch name and course in Batch Details above to drive the search preview.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <FieldHint className="font-medium text-[#246392]">
          {preview.titleFromBatch || preview.descriptionFromBatch
            ? 'Italic lines use Batch Details until you enter meta fields below.'
            : 'Showing your custom meta title and description.'}
        </FieldHint>
        <GoogleSearchPreview preview={preview} />
      </div>

      <div className="space-y-6 rounded-xl border border-[#eef2fc] bg-white p-4 shadow-sm sm:p-6">
        <SubsectionTitle icon={Search}>SEO for search engines</SubsectionTitle>

        <div className="space-y-5">
          <CourseFormField label="Meta Title">
            <FieldHint>SEO title for search engines</FieldHint>
            <CourseInput
              value={seo.metaTitle || ''}
              onChange={(e) => updateSeo('metaTitle', e.target.value)}
              placeholder={
                preview.context.batchName
                  ? `e.g. ${[preview.context.batchName, preview.context.courseName].filter(Boolean).join(' | ')}`
                  : 'SEO title for search engines'
              }
              className="mt-2"
            />
            <CharCounter text={seo.metaTitle} limit={META_TITLE_LIMIT} />
            {preview.titleFromBatch ? (
              <FieldHint className="mt-1">
                Empty → uses batch title and course from Batch Details.
              </FieldHint>
            ) : null}
          </CourseFormField>

          <CourseFormField label="Meta Description">
            <FieldHint>
              Brief summary for search results (recommended 150–160 characters)
            </FieldHint>
            <CourseTextarea
              rows={4}
              value={seo.metaDescription || ''}
              onChange={(e) => updateSeo('metaDescription', e.target.value)}
              placeholder="Brief summary for search results (recommended 150–160 characters)"
              className="mt-2 min-h-[6rem] leading-relaxed"
            />
            <CharCounter text={seo.metaDescription} limit={META_DESCRIPTION_LIMIT} />
            {preview.descriptionFromBatch ? (
              <FieldHint className="mt-1">
                Empty → built from batch name, course, duration, and subjects.
              </FieldHint>
            ) : null}
          </CourseFormField>
        </div>

        <div className="grid gap-6 border-t border-[#eef2fc] pt-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4">
            <CourseFormField label="Focus Keywords">
              <FieldHint>Type keyword and press Enter</FieldHint>
              <div className="mt-2">
                <TagInput
                  value={seo.focusKeywords || []}
                  onChange={(keywords) => updateSeo('focusKeywords', keywords)}
                  suggestions={BATCH_KEYWORD_SUGGESTIONS}
                  placeholder="Type keyword and press Enter"
                  allowCustom
                />
              </div>
              <FieldHint className="mt-2">Pick from suggestions or add your own keywords.</FieldHint>
            </CourseFormField>
          </div>

          <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4">
            <CourseFormField label="Tags">
              <FieldHint>Search or add tags</FieldHint>
              <div className="mt-2">
                <TagInput
                  value={seo.tags || []}
                  onChange={(tags) => updateSeo('tags', tags)}
                  suggestions={BATCH_TAG_SUGGESTIONS}
                  placeholder="Search or add tags"
                  allowCustom
                />
              </div>
              <FieldHint className="mt-2">
                Tags appear as chips — click a suggestion or press Enter to add.
              </FieldHint>
            </CourseFormField>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[#eef2fc] bg-white p-4 shadow-sm sm:p-6">
        <SubsectionTitle>Content</SubsectionTitle>
        <FieldHint>
          Structured content for this batch page with H1, H2, and H3 heading support.
        </FieldHint>

        <CourseFormField label="Formatted Content">
          <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-[#eef2fc] transition focus-within:ring-2 focus-within:ring-[#55ace7]/30">
            <BlogRichEditor
              value={seo.formattedContent || ''}
              onChange={(html) => updateSeo('formattedContent', html)}
              placeholder="Write batch description with headings, lists, and links…"
              minHeight={220}
            />
          </div>
          <FieldHint className="mt-2">
            Use the toolbar for H1, H2, H3, bold, lists, links, and images.
          </FieldHint>
        </CourseFormField>
      </div>
    </div>
  )
}
