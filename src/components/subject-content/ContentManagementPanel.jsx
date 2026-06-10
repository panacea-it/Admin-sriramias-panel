import { lazy, Suspense, useState } from 'react'
import { ChevronRight, Save, Upload, Loader2 } from 'lucide-react'
import ResourceTabs from './ResourceTabs'
import { countTopicResources } from '../../utils/facultySubjectContentStorage'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'

const VideosTab = lazy(() => import('./tabs/VideosTab'))
const TestsTab = lazy(() => import('./tabs/TestsTab'))
const PdfsTab = lazy(() => import('./tabs/PdfsTab'))
const NotesTab = lazy(() => import('./tabs/NotesTab'))

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#55ace7]" />
    </div>
  )
}

export default function ContentManagementPanel({
  subjectName,
  folder,
  topic,
  facultyName,
  saving,
  onSaveDraft,
  onPublish,
  onUpdateTopic,
}) {
  const [activeTab, setActiveTab] = useState('videos')
  const [topicDescription, setTopicDescription] = useState(topic?.description || '')

  if (!topic) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold text-[#1a3a5c]">Select a topic</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Choose a folder and topic from the left explorer to manage videos, tests, PDFs, and
          notes.
        </p>
      </div>
    )
  }

  const counts = countTopicResources(topic)
  const tabCounts = {
    videos: counts.videos,
    tests: counts.tests,
    pdfs: counts.pdfs,
    notes: counts.notes,
  }

  const handleDescriptionBlur = () => {
    if (topicDescription !== topic.description) {
      onUpdateTopic({ description: topicDescription })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <span>{subjectName}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{folder?.folderName || 'Folder'}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#1a3a5c]">{topic.topicName}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#1a3a5c] sm:text-2xl">{topic.topicName}</h1>
            <textarea
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={2}
              placeholder="Topic description…"
              className="mt-2 w-full max-w-2xl resize-none rounded-lg border border-transparent bg-transparent text-sm text-slate-600 focus:border-slate-200 focus:bg-white focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Last updated: {parseDateForDisplay(topic.lastUpdated)}</span>
              <span>Faculty: {topic.facultyName || facultyName || '—'}</span>
              <span
                className={
                  topic.status === 'published'
                    ? 'font-semibold text-emerald-600'
                    : 'font-semibold text-amber-600'
                }
              >
                {topic.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onSaveDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onPublish}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152f4a] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Publish Changes
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4 sm:px-6">
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <ResourceTabs activeTab={activeTab} onChange={setActiveTab} counts={tabCounts} />
          <div className="p-4 sm:p-5">
            <Suspense fallback={<TabFallback />}>
              {activeTab === 'videos' && (
                <VideosTab topic={topic} onUpdateTopic={onUpdateTopic} />
              )}
              {activeTab === 'tests' && <TestsTab topic={topic} onUpdateTopic={onUpdateTopic} />}
              {activeTab === 'pdfs' && <PdfsTab topic={topic} onUpdateTopic={onUpdateTopic} />}
              {activeTab === 'notes' && <NotesTab topic={topic} onUpdateTopic={onUpdateTopic} />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
