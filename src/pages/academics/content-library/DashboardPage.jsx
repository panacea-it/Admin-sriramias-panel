import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileStack, Eye, Download, Upload, Send } from 'lucide-react'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentStatCard from '../../../components/content-library/ContentStatCard'
import ContentSearchBox from '../../../components/content-library/ContentSearchBox'
import { BannerButton } from '../../../components/academics/AcademicsUi'
import { CONTENT_LIBRARY_BASE } from '../../../constants/contentLibraryNav'
import { contentLibraryTw } from '../../../constants/contentLibraryTheme'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { items, analytics, loading } = useContentLibrary()

  const stats = useMemo(() => {
    const published = items.filter((i) => i.status === 'Published')
    const drafts = items.filter((i) => i.status === 'Draft')
    const pending = items.filter((i) => i.approvalStatus === 'pending')
    return { published: published.length, drafts: drafts.length, pending: pending.length }
  }, [items])

  const recent = useMemo(
    () =>
      [...items]
        .filter((i) => i.status !== 'Deleted')
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5),
    [items],
  )

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ContentSearchBox onSelect={() => navigate(`${CONTENT_LIBRARY_BASE}/all`)} />
        <BannerButton onClick={() => navigate(`${CONTENT_LIBRARY_BASE}/upload`)}>Upload content</BannerButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ContentStatCard label="Total uploads" value={analytics?.totalUploads ?? items.length} icon={FileStack} accent="#55ace7" />
        <ContentStatCard label="Published" value={stats.published} icon={Send} accent="#69df66" />
        <ContentStatCard label="Total views" value={(analytics?.totalViews ?? 0).toLocaleString()} icon={Eye} accent="#246392" />
        <ContentStatCard label="Downloads" value={(analytics?.totalDownloads ?? 0).toLocaleString()} icon={Download} accent="#8b98bb" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={contentLibraryTw.card + ' p-5'}>
          <h3 className="font-bold text-[#1a3a5c]">Quick actions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <BannerButton onClick={() => navigate(`${CONTENT_LIBRARY_BASE}/upload`)}>
              <Upload className="h-4 w-4" /> New upload
            </BannerButton>
            <button type="button" onClick={() => navigate(`${CONTENT_LIBRARY_BASE}/drafts`)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Drafts ({stats.drafts})
            </button>
            <button type="button" onClick={() => navigate(`${CONTENT_LIBRARY_BASE}/bulk-upload`)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Bulk upload
            </button>
          </div>
          {stats.pending > 0 && (
            <p className="mt-4 text-sm text-amber-700">
              {stats.pending} item(s) awaiting approval — review in All Content.
            </p>
          )}
        </div>
        <div className={contentLibraryTw.card + ' p-5'}>
          <h3 className="font-bold text-[#1a3a5c]">Recent uploads</h3>
          <ul className="mt-3 space-y-2">
            {recent.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="truncate font-medium text-slate-700">{item.title}</span>
                <span className="shrink-0 text-slate-400">{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
