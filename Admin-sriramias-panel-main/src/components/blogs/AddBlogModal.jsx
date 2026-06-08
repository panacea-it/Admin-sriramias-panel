import { useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { FileText } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import {
  CourseAddMoreLink,
  CourseFormField,
  CourseInput,
  CourseMediaSlot,
  CourseSelect,
} from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import { slugifyTitle } from '../../utils/blogSlug'
import {
  createEmptyBlog,
  createEmptySection,
  FOCUS_KEYWORD_SUGGESTIONS,
  collectTagSuggestions,
  loadBlogs,
} from '../../data/blogsData'
import BlogRichEditor from './BlogRichEditor'
import BlogSeoPanel from './BlogSeoPanel'

function cloneBlog(blog) {
  return {
    ...blog,
    focusKeywords: [...(blog.focusKeywords || [])],
    tags: [...(blog.tags || [])],
    sections: (blog.sections || []).map((s) => ({ ...s })),
  }
}

function emptySection(blogId) {
  return createEmptySection(blogId)
}

export default function AddBlogModal({ open, onClose, blog, onSave }) {
  const isEdit = Boolean(blog?.id)
  const [form, setForm] = useState(createEmptyBlog)
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const blogRef = useRef(blog)
  useEffect(() => {
    blogRef.current = blog
  }, [blog])
  const editKey = getModalEditKey(blog)

  const tagSuggestions = useMemo(
    () => (open ? collectTagSuggestions(loadBlogs()) : []),
    [open],
  )

  useInitOnModalOpen(open, editKey, () => {
    const next = blogRef.current ? cloneBlog(blogRef.current) : createEmptyBlog()
    if (!next.sections?.length) {
      next.sections = [emptySection(next.id)]
    }
    if (!next.metaTitle && next.title) next.metaTitle = next.title
    setForm(next)
    setInitialSnapshot(cloneBlog(next))
  })

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

  const handleSectionFile = (sectionId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === sectionId
          ? { ...s, image: file.name, imageName: file.name }
          : s,
      ),
    }))
  }

  const handleBackgroundFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({
      ...f,
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
      title: form.title.trim(),
      status,
      slug: form.slug?.trim() || slugifyTitle(form.title),
      metaTitle: (form.metaTitle || form.title).trim(),
      metaDescription: (form.metaDescription || '').trim(),
      focusKeywords: form.focusKeywords || [],
      tags: form.tags || [],
      publishedAt:
        status === 'published'
          ? form.publishedAt && form.status === 'published'
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

  const validate = () => {
    if (!form.title.trim()) {
      toast.error('Blog title is required')
      return false
    }
    if (!form.backgroundImageName && !form.backgroundImage) {
      toast.error('Background image is required')
      return false
    }
    return true
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    try {
      const payload = buildPayload()
      await onSave?.(payload, { isEdit })
      toast.success(isEdit ? 'Blog updated successfully' : 'Blog saved successfully')
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
      title={isEdit ? 'Edit Blog' : 'Create Blog'}
      showCloseButton={false}
    >
      <form
        onSubmit={handleUpdate}
        className="flex max-h-[min(92vh,880px)] flex-col overflow-hidden rounded-xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={isEdit ? 'Edit Blog' : 'Create Blog'}
          icon={FileText}
          iconClassName="text-[#246392]"
          onClose={handleClose}
          closeVariant="icon"
        />

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
            <SectionBar title="Blog Details" />

            <div className="space-y-5">
              <CourseFormField label="Title" required>
                <CourseInput
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Enter blog title"
                />
              </CourseFormField>

              <CourseFormField label="Status" required>
                <CourseSelect
                  value={form.status === 'published' ? 'published' : 'draft'}
                  onChange={(e) => setField('status', e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Background Image" required>
                <CourseMediaSlot
                  placeholder="312*214 Kb"
                  fileName={form.backgroundImageName || form.backgroundImage}
                  onFileChange={handleBackgroundFile}
                  accept="image/*"
                />
              </CourseFormField>

              <CourseFormField label="Main Content">
                <BlogRichEditor
                  value={form.bodyHtml}
                  onChange={(html) => setField('bodyHtml', html)}
                  placeholder="Write your article with headings, lists, links, and images…"
                  minHeight={220}
                />
              </CourseFormField>
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

            <div className="space-y-8">
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
                    <CourseFormField label="Image">
                      <CourseMediaSlot
                        placeholder="Upload image"
                        fileName={section.imageName || section.image}
                        onFileChange={(e) => handleSectionFile(section.id, e)}
                        accept="image/*"
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
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-slate-200/80 bg-[#f0f4f8] px-4 py-4 sm:px-6">
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
              className="min-w-[120px] rounded-full bg-[#55ace7] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#3d96d4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Update'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
