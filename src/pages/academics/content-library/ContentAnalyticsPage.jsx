import { Eye, Clock, Percent } from 'lucide-react'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentStatCard from '../../../components/content-library/ContentStatCard'
import { EngagementBarChart, TopContentList } from '../../../components/content-library/ContentAnalyticsCharts'

export default function ContentAnalyticsPage() {
  const { analytics, loading } = useContentLibrary()

  if (loading || !analytics) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ContentStatCard label="Total uploads" value={analytics.totalUploads} icon={Eye} />
        <ContentStatCard label="Watch time (hrs)" value={analytics.watchTimeHours} icon={Clock} accent="#246392" />
        <ContentStatCard label="Avg completion" value={`${analytics.avgCompletion}%`} icon={Percent} accent="#69df66" />
        <ContentStatCard label="Active subjects" value={analytics.activeSubjects} sub={`${analytics.activeTopics} topics`} />
      </div>
      <EngagementBarChart data={analytics.engagementTrend || []} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TopContentList title="Most viewed" rows={analytics.topViewed} metricKey="views" />
        <TopContentList title="Most downloaded" rows={analytics.topDownloaded} metricKey="downloads" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-[#1a3a5c]">Download trends</h3>
        <p className="mt-2 text-sm text-slate-500">
          Total downloads: <strong>{analytics.totalDownloads?.toLocaleString?.() ?? analytics.totalDownloads}</strong>
          {' '}— student engagement tracked per view event.
        </p>
      </div>
    </div>
  )
}
