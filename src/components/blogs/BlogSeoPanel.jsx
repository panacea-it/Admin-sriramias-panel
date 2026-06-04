import {
  CourseFormField,
  CourseInput,
  CourseTextarea,
} from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import {
  META_DESCRIPTION_LIMIT,
  META_TITLE_LIMIT,
  buildSeoPreviewUrl,
  isOverLimit,
  seoCharCount,
  seoLimitTone,
} from '../../utils/blogSeo'
import TagInput from './TagInput'

function CharCounter({ text, limit }) {
  const count = seoCharCount(text)
  const over = isOverLimit(text, limit)
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn('text-xs font-medium', seoLimitTone(count, limit))}>
        {count} / {limit}
      </span>
      {over && (
        <span className="text-xs font-semibold text-amber-600">
          Recommended limit exceeded
        </span>
      )}
    </div>
  )
}

export default function BlogSeoPanel({
  form,
  onFieldChange,
  onKeywordsChange,
  onTagsChange,
  tagSuggestions = [],
  keywordSuggestions = [],
}) {
  const previewTitle = form.metaTitle?.trim() || form.title?.trim() || 'Meta Title'
  const previewDesc =
    form.metaDescription?.trim() ||
    'Add a meta description to preview how this post may appear in search results.'
  const previewUrl = buildSeoPreviewUrl(form.slug)

  return (
    <div className="space-y-5">
      <CourseFormField label="Meta Title">
        <CourseInput
          value={form.metaTitle}
          onChange={(e) => onFieldChange('metaTitle', e.target.value)}
          placeholder="SEO title for search engines"
        />
        <CharCounter text={form.metaTitle} limit={META_TITLE_LIMIT} />
      </CourseFormField>

      <CourseFormField label="Meta Description">
        <CourseTextarea
          rows={4}
          value={form.metaDescription}
          onChange={(e) => onFieldChange('metaDescription', e.target.value)}
          placeholder="Brief summary for search results (recommended 150–160 characters)"
        />
        <CharCounter text={form.metaDescription} limit={META_DESCRIPTION_LIMIT} />
      </CourseFormField>

      <CourseFormField label="Focus Keywords">
        <TagInput
          value={form.focusKeywords}
          onChange={onKeywordsChange}
          suggestions={keywordSuggestions}
          placeholder="Type keyword and press Enter"
        />
      </CourseFormField>

      <CourseFormField label="Tags">
        <TagInput
          value={form.tags}
          onChange={onTagsChange}
          suggestions={tagSuggestions}
          placeholder="Search or add tags"
          allowCustom
        />
      </CourseFormField>

      <CourseFormField label="URL Slug">
        <CourseInput
          value={form.slug}
          onChange={(e) => onFieldChange('slug', e.target.value)}
          placeholder="how-to-prepare-for-upsc"
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          Lowercase letters, numbers, and hyphens only. Auto-generated from title when empty.
        </p>
      </CourseFormField>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
          Search preview
        </p>
        <div className="space-y-1 font-[Arial,sans-serif]">
          <p className="text-xl text-[#1a0dab] leading-snug hover:underline">{previewTitle}</p>
          <p className="text-sm text-[#006621]">{previewUrl}</p>
          <p className="line-clamp-2 text-sm leading-relaxed text-[#545454]">{previewDesc}</p>
        </div>
      </div>
    </div>
  )
}
