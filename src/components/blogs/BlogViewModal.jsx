import { FileText, Loader2, X } from 'lucide-react'
import BlogStatusBadge from './BlogStatusBadge'
import { blogStatusLabel } from '../../constants/blogManagementConstants'
import { formatBlogDate, formatBlogTime } from '../../data/blogsData'

function MainBlogBadge() {
  return (
    <span className="inline-flex min-w-[88px] shrink-0 items-center justify-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900 ring-1 ring-inset ring-violet-500/25">
      Main Blog
    </span>
  )
}

function ChipList({ items }) {
  if (!items?.length) return <span className="text-sm text-[#686868]">—</span>

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-[#eef6fc] px-3 py-1 text-xs font-semibold text-[#246392]"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function HtmlPreview({ html }) {
  if (!html?.trim()) {
    return <p className="text-sm text-[#686868]">—</p>
  }

  return (
    <div
      className="prose prose-sm max-w-none text-[#111] [&_p]:mb-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function BlogViewModal({ open, blog, loading, onClose }) {
  if (!open) return null

  const preview = blog?.searchPreview || {}

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <article
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex min-h-[56px] shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-[#55ace7] via-[#4a9fd8] to-[#1a4d73] px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <FileText className="h-5 w-5 text-[#246392]" strokeWidth={2.4} />
            </span>
            <h2 className="text-lg font-bold leading-none text-white sm:text-xl">View Blog</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm font-medium text-[#246392]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading blog details…
            </div>
          ) : !blog ? (
            <p className="text-sm font-medium text-[#686868]">Unable to load blog details.</p>
          ) : (
            <div className="space-y-6">
              {blog.backgroundImage ? (
                <div className="overflow-hidden rounded-xl border border-[#e8ecf2] bg-[#f4f8fc] p-4">
                  <img
                    src={blog.backgroundImage}
                    alt={blog.title || 'Blog background'}
                    className="mx-auto max-h-64 w-full object-contain"
                  />
                </div>
              ) : null}

              <div>
                <h3 className="text-lg font-bold text-[#111]">{blog.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <BlogStatusBadge status={blog.status} />
                  {blog.isMainBlog ? <MainBlogBadge /> : null}
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Blog ID', blog.blogId || '—'],
                  ['Language', blog.language || '—'],
                  ['Category', blog.category || '—'],
                  ['Read Time', blog.readTime || '—'],
                  ['Status', blog.listStatus || blogStatusLabel(blog.status)],
                  ['Main Blog', blog.mainBlogLabel || (blog.isMainBlog ? 'Yes' : 'No')],
                  ['Date', blog.listDate || formatBlogDate(blog.publishedAt)],
                  ['Time', blog.listTime || formatBlogTime(blog.publishedAt)],
                  ['Slug', blog.slug || '—'],
                  ['Meta Title', blog.metaTitle || '—'],
                  ['YouTube URL', blog.youtubeVideoUrl || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#f4f8fc] px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#111]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-lg bg-[#f4f8fc] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                  Meta Description
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#111]">
                  {blog.metaDescription || '—'}
                </dd>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#f4f8fc] px-4 py-3">
                  <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                    Focus Keywords
                  </dt>
                  <ChipList items={blog.focusKeywords} />
                </div>
                <div className="rounded-lg bg-[#f4f8fc] px-4 py-3">
                  <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                    Tags
                  </dt>
                  <ChipList items={blog.tags} />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Search preview
                </p>
                <div className="space-y-1 font-[Arial,sans-serif]">
                  <p className="text-lg text-[#1a0dab]">{preview.title || blog.metaTitle || '—'}</p>
                  <p className="text-sm text-[#006621]">{preview.url || '—'}</p>
                  <p className="text-sm text-[#545454]">{preview.description || blog.metaDescription || '—'}</p>
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wide text-[#246392]">
                  Table Of Contents
                </h4>
                {(blog.sections || []).length === 0 ? (
                  <p className="text-sm text-[#686868]">No sections available.</p>
                ) : (
                  blog.sections.map((section, index) => (
                    <div
                      key={section.id || `${section.order}-${index}`}
                      className="rounded-xl border border-[#e8ecf2] bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                        {section.order ?? index + 1}. {section.topic || `Section ${index + 1}`}
                      </p>
                      {section.image ? (
                        <div className="mt-3 overflow-hidden rounded-lg bg-[#f4f8fc] p-3">
                          <img
                            src={section.image}
                            alt={section.topic || 'Section image'}
                            className="mx-auto max-h-48 w-full object-contain"
                          />
                        </div>
                      ) : null}
                      <div className="mt-3">
                        <HtmlPreview html={section.content} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
