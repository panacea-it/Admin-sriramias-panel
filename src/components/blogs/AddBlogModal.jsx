import { useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import {
  CourseAddMoreLink,
  CourseFormField,
  CourseInput,
  CourseSelect,
} from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import { slugifyTitle } from '../../utils/blogSlug'
import {
  buildBlogLanguageLookup,
  resolveBlogLanguageId,
  resolveBlogLanguageName,
} from '../../utils/blogApiHelpers'
import { useBlogDropdowns } from '../../hooks/blogs/useBlogDropdowns'
import { isBlogActive } from '../../constants/blogManagementConstants'
import {
  createEmptyBlog,
  createEmptySection,
  FOCUS_KEYWORD_SUGGESTIONS,
  collectTagSuggestions,
  loadBlogs,
} from '../../data/blogsData'
import BlogRichEditor from './BlogRichEditor'
import BlogSeoPanel from './BlogSeoPanel'
import BlogBackgroundImageUpload from './BlogBackgroundImageUpload'

function cloneBlog(blog) {
  return {
    ...blog,
    focusKeywords: [...(blog.focusKeywords || [])],
    tags: [...(blog.tags || [])],
    searchPreview: { ...(blog.searchPreview || {}) },
    sections: (blog.sections || []).map((s) => ({ ...s })),
  }
}

function emptySection(blogId) {
  return createEmptySection(blogId)
}

function getSelectPlaceholder(isLoading, hasOptions, defaultText) {
  if (isLoading) return `Loading ${defaultText.toLowerCase()}...`
  if (!hasOptions) return 'No data available'
  return defaultText
}

export default function AddBlogModal({ open, onClose, blog, onSave, detailsLoading = false }) {
  const isEdit = Boolean(blog?.blogId)
  const [form, setForm] = useState(createEmptyBlog)
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const blogRef = useRef(blog)
  useEffect(() => {
    blogRef.current = blog
  }, [blog])
  const formInitKey = isEdit
    ? `${getModalEditKey(blog)}:${detailsLoading ? 'loading' : `ready-${blog?.sections?.length ?? 0}`}`
    : getModalEditKey(blog)

  const {
    data: dropdownData,
    isLoading: dropdownsLoading,
    isError: dropdownsError,
    error: dropdownsQueryError,
  } = useBlogDropdowns({ enabled: open })

  const languages = dropdownData?.languages ?? []
  const categories = dropdownData?.categories ?? []
  const readTimes = dropdownData?.readTimes ?? []
  const languageLookup = useMemo(() => buildBlogLanguageLookup(languages), [languages])

  const tagSuggestions = useMemo(
    () => (open ? collectTagSuggestions(loadBlogs()) : []),
    [open],
  )

  useInitOnModalOpen(open, formInitKey, () => {
    if (isEdit && detailsLoading) return

    const next = blogRef.current ? cloneBlog(blogRef.current) : createEmptyBlog()
    if (!next.sections?.length) {
      next.sections = [emptySection(next.id)]
    }
    if (!next.metaTitle && next.title) next.metaTitle = next.title
    setForm(next)
    setInitialSnapshot(cloneBlog(next))
  })

  useEffect(() => {
    if (!open || !languages.length) return

    setForm((current) => {
      const resolvedLanguageId = resolveBlogLanguageId(current, languageLookup)
      if (!resolvedLanguageId || current.languageId === resolvedLanguageId) {
        return current
      }

      return {
        ...current,
        languageId: resolvedLanguageId,
        language: resolveBlogLanguageName(
          { ...current, languageId: resolvedLanguageId },
          languageLookup,
        ),
      }
    })
  }, [open, languages, languageLookup])

  const setField = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'title' && !f.slugManuallyEdited) {
        next.slug = slugifyTitle(value)
        if (!f.metaTitle?.trim() || f.metaTitle === f.title) {
          next.metaTitle = value
        }
      }
      if (key === 'slug') {
        next.slugManuallyEdited = true
        next.slug = String(value)
          .toLowerCase()
          .replace(/[^a-z0-9-\s]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/-+/g, '-')
      }
      return next
    })
  }

  const setSection = (sectionId, key, value) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === sectionId ? { ...s, [key]: value } : s,
      ),
    }))
  }

  const handleSectionFile = (sectionId, file) => {
    if (!file) return
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              imageFile: file,
              image: file.name,
              imageName: file.name,
            }
          : s,
      ),
    }))
  }

  const handleBackgroundFile = (file) => {
    if (!file) return
    setForm((f) => ({
      ...f,
      backgroundImageFile: file,
      backgroundImage: file.name,
      backgroundImageName: file.name,
    }))
  }

  const addSection = () => {
    setForm((f) => ({
      ...f,
      sections: [...f.sections, emptySection(f.id)],
    }))
  }

  const buildPayload = () => {
    const now = new Date().toISOString()
    const status = form.status === 'published' ? 'published' : 'draft'
    return {
      ...form,
      blogId: form.blogId || '',
      mongoId: form.mongoId || '',
      title: form.title.trim(),
      status,
      slug: form.slug?.trim() || slugifyTitle(form.title),
      metaTitle: (form.metaTitle || form.title).trim(),
      metaDescription: (form.metaDescription || '').trim(),
      focusKeywords: form.focusKeywords || [],
      tags: form.tags || [],
      category: form.category || '',
      languageId: form.languageId || '',
      language: resolveBlogLanguageName(form, languageLookup),
      readTime: form.readTime || '',
      isMainBlog: Boolean(form.isMainBlog),
      youtubeVideoUrl: (form.youtubeVideoUrl || '').trim(),
      publishedAt:
        status === 'published'
          ? form.publishedAt && isBlogActive(form.status)
            ? form.publishedAt
            : now
          : form.publishedAt || now,
      lastSavedAt: now,
    }
  }

  const handleClose = () => onClose()

  const handleReset = () => {
    if (initialSnapshot) {
      setForm(cloneBlog(initialSnapshot))
    } else {
      setForm(createEmptyBlog())
    }
    toast.message('Form reset')
  }

  const hasSectionContent = (html) => {
    if (!html?.trim()) return false
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.length > 0
  }

  const validate = () => {
    if (!form.title.trim()) {
      toast.error('Blog title is required')
      return false
    }
    if (!form.category) {
      toast.error('Please select a category')
      return false
    }
    if (!form.languageId) {
      toast.error('Please select a language')
      return false
    }
    if (!resolveBlogLanguageId(form, languageLookup)) {
      toast.error('Please select a valid language from the dropdown')
      return false
    }
    if (!form.readTime) {
      toast.error('Please select read time')
      return false
    }
    if (!form.backgroundImageName && !form.backgroundImage && !form.backgroundImageFile) {
      toast.error('Background image is required')
      return false
    }
    for (let index = 0; index < (form.sections || []).length; index += 1) {
      const section = form.sections[index]
      const topicLabel = section.topic?.trim() || `Section ${index + 1}`
      if (!hasSectionContent(section.content)) {
        toast.error(`Content is required for topic '${topicLabel}'`)
        return false
      }
    }
    return true
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    try {
      const payload = buildPayload()
      const result = await onSave?.(payload, {
        isEdit,
        backgroundFile: form.backgroundImageFile,
        languageLookup,
      })
      toast.success(
        result?.message ||
          (isEdit ? 'Blog updated successfully' : 'Blog created successfully'),
      )
      handleClose()
    } catch (err) {
      toast.error(err?.message || 'Failed to save blog')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={isEdit ? 'Edit Blog' : 'Add Blog'}
      showCloseButton={false}
      className="!flex !max-h-[90dvh] !min-h-0 !flex-col !overflow-hidden"
    >
      <form
        onSubmit={handleSave}
        className="flex min-h-0 max-h-[90dvh] flex-col overflow-hidden rounded-xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="shrink-0">
          <ModalPanelHeader
            title={isEdit ? 'Edit Blog' : 'Add Blog'}
            icon={FileText}
            iconClassName="text-[#246392]"
            onClose={handleClose}
            closeVariant="icon"
          />
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {detailsLoading ? (
            <div className="flex min-h-[320px] items-center justify-center gap-3 px-6 py-12 text-sm font-medium text-[#246392]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading blog details…
            </div>
          ) : (
          <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-5">
            <SectionBar title="Blog Details" />

            {dropdownsError ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {dropdownsQueryError?.message || 'Unable to load blog dropdown options.'}
              </p>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <CourseFormField label="Title" required className="sm:col-span-2">
                <CourseInput
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Enter blog title"
                />
              </CourseFormField>

              <CourseFormField label="Language" required>
                <CourseSelect
                  value={form.languageId || ''}
                  disabled={dropdownsLoading}
                  onChange={(e) => {
                    const languageId = e.target.value
                    setForm((current) => ({
                      ...current,
                      languageId,
                      language: resolveBlogLanguageName({ languageId }, languageLookup),
                    }))
                  }}
                >
                  <option value="">
                    {getSelectPlaceholder(dropdownsLoading, languages.length, 'Select language')}
                  </option>
                  {languages.map((lang) => (
                    <option key={lang.languageId || lang.publicLanguageId} value={lang.languageId}>
                      {lang.languageName}
                    </option>
                  ))}
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Status" required>
                <CourseSelect
                  value={form.status === 'published' ? 'published' : 'draft'}
                  onChange={(e) => setField('status', e.target.value)}
                >
                  <option value="draft">Inactive</option>
                  <option value="published">Active</option>
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Read Time" required>
                <CourseSelect
                  value={form.readTime || ''}
                  disabled={dropdownsLoading}
                  onChange={(e) => setField('readTime', e.target.value)}
                >
                  <option value="">
                    {getSelectPlaceholder(dropdownsLoading, readTimes.length, 'Select read time')}
                  </option>
                  {readTimes.map((time) => (
                    <option key={time.value} value={time.value}>
                      {time.label}
                    </option>
                  ))}
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Category" required>
                <CourseSelect
                  value={form.category || ''}
                  disabled={dropdownsLoading}
                  onChange={(e) => setField('category', e.target.value)}
                >
                  <option value="">
                    {getSelectPlaceholder(dropdownsLoading, categories.length, 'Select category')}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Background Image" required className="sm:col-span-2">
                <BlogBackgroundImageUpload
                  file={form.backgroundImageFile}
                  imageUrl={form.backgroundImageFile ? '' : form.backgroundImage}
                  fileName={form.backgroundImageName || form.backgroundImage}
                  cacheKey={form.lastSavedAt || form.publishedAt}
                  onFileChange={handleBackgroundFile}
                />
              </CourseFormField>

              <div className="sm:col-span-2">
                <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-violet-200/80 bg-violet-50/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isMainBlog)}
                    onChange={(e) => setField('isMainBlog', e.target.checked)}
                    className="h-4 w-4 accent-violet-600"
                  />
                  <span className="text-sm font-semibold text-violet-900">
                    Mark as Main Blog
                  </span>
                  <span className="text-xs text-violet-700/80">
                    Appears at the top of the Blogs page
                  </span>
                </label>
              </div>
            </div>

            <SectionBar title="SEO Settings" />
            <BlogSeoPanel
              form={form}
              onFieldChange={setField}
              onKeywordsChange={(keywords) => setField('focusKeywords', keywords)}
              onTagsChange={(tags) => setField('tags', tags)}
              tagSuggestions={tagSuggestions}
              keywordSuggestions={FOCUS_KEYWORD_SUGGESTIONS}
            />

            <SectionBar title="Table Of Content" />

            <div className="space-y-6">
              {form.sections.map((section, index) => (
                <div key={section.id} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <CourseFormField label={`Topic ${index + 1}`}>
                      <CourseInput
                        value={section.topic}
                        onChange={(e) =>
                          setSection(section.id, 'topic', e.target.value)
                        }
                        placeholder={`Topic ${index + 1}`}
                      />
                    </CourseFormField>
                    <CourseFormField label="Image (optional)">
                      <BlogBackgroundImageUpload
                        file={section.imageFile}
                        imageUrl={section.imageFile ? '' : section.image}
                        fileName={section.imageName || section.image}
                        cacheKey={form.lastSavedAt}
                        onFileChange={(file) => handleSectionFile(section.id, file)}
                      />
                    </CourseFormField>
                  </div>
                  <CourseFormField label="Content">
                    <BlogRichEditor
                      value={section.content}
                      onChange={(html) => setSection(section.id, 'content', html)}
                      placeholder="Write section content…"
                      minHeight={160}
                    />
                  </CourseFormField>
                </div>
              ))}

              <div className="flex justify-end pt-1">
                <CourseAddMoreLink onClick={addSection} />
              </div>
            </div>

            <SectionBar title="Youtube Video" />
            <CourseFormField label="Youtube Video URL" className="pb-0">
              <CourseInput
                type="url"
                value={form.youtubeVideoUrl || ''}
                onChange={(e) => setField('youtubeVideoUrl', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </CourseFormField>
          </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-[#f0f4f8] px-4 py-4 sm:px-6">
          <div
            className={cn(
              'flex flex-col-reverse items-stretch justify-center gap-3',
              'sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4',
            )}
          >
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="min-w-[120px] rounded-full bg-[#e8f4fc] px-6 py-2.5 text-sm font-bold text-[#246392] shadow-sm transition hover:bg-[#d9ebf9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full bg-[#55ace7] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#3d96d4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {isEdit ? 'Updating…' : 'Saving…'}
                </>
              ) : isEdit ? (
                'Update'
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
