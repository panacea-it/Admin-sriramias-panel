import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import { filterItems } from '../../../utils/contentLibraryStorage'
import ContentFiltersBar from '../../../components/content-library/ContentFiltersBar'
import ContentItemsTable from '../../../components/content-library/ContentItemsTable'
import { BannerButton } from '../../../components/academics/AcademicsUi'
import { CONTENT_LIBRARY_BASE } from '../../../constants/contentLibraryNav'
import {
  CONTENT_LIBRARY_BATCH_OPTIONS,
  CONTENT_LIBRARY_COURSE_OPTIONS,
} from '../../../data/contentLibrarySeed'
import { contentItemToForm } from '../../../utils/contentLibraryMappers'

export default function ContentListPageShell({
  title,
  statusFilter,
  emptyMessage,
  showAdd = true,
  fixedStatus,
}) {
  const navigate = useNavigate()
  const { items, subjects, topics, categories, loading, duplicateItem, togglePublish, deleteItem, saveItem } =
    useContentLibrary()

  const [filters, setFilters] = useState({
    search: '',
    subjectId: 'all',
    topicId: 'all',
    batchId: 'all',
    courseId: 'all',
    contentType: 'all',
    categoryId: 'all',
    status: fixedStatus || statusFilter || 'all',
    uploadedBy: 'all',
    dateFrom: '',
    dateTo: '',
  })

  const uploadedByOptions = useMemo(
    () => [...new Set(items.map((i) => i.uploadedBy).filter(Boolean))],
    [items],
  )

  const filtered = useMemo(() => {
    const f = { ...filters }
    if (fixedStatus) f.status = fixedStatus
    return filterItems(items, { ...f, excludeDeleted: true })
  }, [items, filters, fixedStatus])

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-bold text-[#1a3a5c]">{title}</h2>}
      {showAdd && (
        <div className="flex justify-end">
          <BannerButton onClick={() => navigate(`${CONTENT_LIBRARY_BASE}/upload`)}>
            Upload content
          </BannerButton>
        </div>
      )}
      <ContentFiltersBar
        filters={filters}
        onChange={setFilters}
        subjects={subjects}
        topics={topics}
        categories={categories}
        uploadedByOptions={uploadedByOptions}
        showStatus={!fixedStatus}
      />
      <ContentItemsTable
        items={filtered}
        subjects={subjects}
        topics={topics}
        categories={categories}
        batches={CONTENT_LIBRARY_BATCH_OPTIONS}
        courses={CONTENT_LIBRARY_COURSE_OPTIONS}
        onDuplicate={duplicateItem}
        onPublishToggle={togglePublish}
        onDelete={(row) => deleteItem(row.id)}
        onArchive={async (row) => {
          await saveItem(contentItemToForm(row), row, { status: 'Archived' })
          toast.success('Archived')
        }}
        emptyMessage={emptyMessage}
        resetDeps={[filters, fixedStatus]}
      />
    </div>
  )
}
