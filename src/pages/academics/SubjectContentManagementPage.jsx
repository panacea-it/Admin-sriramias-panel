import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Menu } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import HierarchyExplorer from '../../components/subject-content/HierarchyExplorer'
import SubjectContentFormPanel, {
  buildItemSavePayload,
} from '../../components/subject-content/SubjectContentFormPanel'
import ContentBulkConfirmDialog from '../../components/subject-content/ContentBulkConfirmDialog'
import { useAuth } from '../../contexts/AuthContext'
import { useAcademicsSubjects } from '../../hooks/useAcademicsSubjects'
import { useFacultySubjectDetail } from '../../hooks/useFacultySubjectDetail'
import { useSubjectContent } from '../../hooks/useSubjectContent'
import { mergeSeedIntoSubject } from '../../data/facultySubjectContentSeed'
import {
  findCategoryById,
  findFolderInCategory,
  findItemInHierarchy,
  contentTypeFromCategoryType,
} from '../../utils/facultySubjectHierarchy'
import {
  generateContentId,
  saveSubjectContent,
} from '../../utils/facultySubjectContentStorage'
import { nextLiveClassId } from '../../utils/academicsSubjectsStorage'
import { normalizeCategories } from '../../utils/subjectCategoryHelpers'
import { toast } from '../../utils/toast'

export default function SubjectContentManagementPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { upsertSubject } = useAcademicsSubjects()
  const {
    subject,
    loading: subjectLoading,
    error: subjectError,
  } = useFacultySubjectDetail(subjectId, {
    enabled: Boolean(subjectId),
    syncLocal: true,
  })

  const facultyName = user?.name || user?.email || subject?.teacher || 'Faculty'
  const teacherShort = subject?.teacher?.split(' ')[0] || facultyName.split(' ')[0]

  const {
    content,
    loading,
    saving,
    persist,
    updateFolderItems,
  } = useSubjectContent(subjectId, {
    subjectMeta: subject,
  })

  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [panelMode, setPanelMode] = useState('list')
  const [previewRow, setPreviewRow] = useState(null)
  const [addingNewItem, setAddingNewItem] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null)
  const [deleteItemTarget, setDeleteItemTarget] = useState(null)
  const [folderListLoading, setFolderListLoading] = useState(false)
  const [selectedRowIds, setSelectedRowIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const initialSelectionAppliedRef = useRef(false)
  const seedMergedRef = useRef('')

  const persistContent = useCallback(
    async (updater) => {
      const next = typeof updater === 'function' ? updater(content) : updater
      if (!next) return null
      await persist(next)
      saveSubjectContent(next, subject)
      return next
    },
    [content, persist, subject],
  )

  const categories = useMemo(() => content?.categories ?? [], [content?.categories])
  const categoryChips = useMemo(
    () =>
      normalizeCategories(
        content?.categoryIds?.length ? content.categoryIds : subject?.categories,
      ),
    [content?.categoryIds, subject?.categories],
  )

  const activeCategory = findCategoryById(categories, selectedCategoryId)
  const activeFolder = activeCategory
    ? findFolderInCategory(activeCategory, selectedFolderId)
    : null
  const { item: activeItem } = findItemInHierarchy(categories, selectedItemId)
  const folderItems = activeFolder?.items || []
  const isRecordingCategory = activeCategory?.categoryType === 'RECORDED_CLASS'
  const recordingCount = isRecordingCategory ? folderItems.length : undefined

  const mergedSubject = useMemo(() => {
    if (!subject || !content) return subject
    return mergeSeedIntoSubject(subject, content)
  }, [subject, content])

  useEffect(() => {
    if (loading || !subject || !content?.categories?.length) return
    const mergeKey = `${subject.id}:${content?.seedVersion ?? 0}`
    if (seedMergedRef.current === mergeKey) return
    const merged = mergeSeedIntoSubject(subject, content)
    const seedLiveCount = merged.liveClasses?.length || 0
    const currentLiveCount = subject.liveClasses?.length || 0
    if (seedLiveCount > currentLiveCount) {
      seedMergedRef.current = mergeKey
      upsertSubject(merged)
    }
  }, [loading, subject, content?.seedVersion, content?.categories?.length, upsertSubject])

  useEffect(() => {
    initialSelectionAppliedRef.current = false
    seedMergedRef.current = ''
    setSelectedCategoryId(null)
    setSelectedFolderId(null)
    setSelectedItemId(null)
  }, [subjectId])

  useEffect(() => {
    if (loading || !categories.length || initialSelectionAppliedRef.current) return

    const preferred =
      categories.find((c) => c.categoryType === 'LIVE_CLASS') ||
      categories.find((c) => c.categoryType === 'RECORDED_CLASS') ||
      categories[0]
    if (!preferred) return

    const firstFolder = preferred.folders?.[0]
    setSelectedCategoryId(preferred.id)
    setSelectedFolderId(firstFolder?.id ?? null)
    setSelectedItemId(null)
    setPanelMode('list')
    initialSelectionAppliedRef.current = true
  }, [loading, categories.length, subjectId])

  useEffect(() => {
    if (loading || !categories.length || !initialSelectionAppliedRef.current) return
    if (!selectedCategoryId) return

    const current = findCategoryById(categories, selectedCategoryId)
    if (!current) {
      const fallback =
        categories.find((c) => c.categoryType === 'LIVE_CLASS') ||
        categories.find((c) => c.categoryType === 'RECORDED_CLASS') ||
        categories[0]
      if (fallback && fallback.id !== selectedCategoryId) {
        setSelectedCategoryId(fallback.id)
        setSelectedFolderId(fallback.folders?.[0]?.id ?? null)
        setSelectedItemId(null)
      }
      return
    }

    if (selectedFolderId && !findFolderInCategory(current, selectedFolderId)) {
      setSelectedFolderId(current.folders?.[0]?.id ?? null)
      setSelectedItemId(null)
    }
  }, [loading, categories, selectedCategoryId, selectedFolderId])

  const mutateFolderItems = useCallback(
    (categoryId, folderId, updater) => {
      updateFolderItems(categoryId, folderId, updater)
      if (content) {
        const next = {
          ...content,
          categories: content.categories.map((cat) => {
            if (cat.id !== categoryId) return cat
            return {
              ...cat,
              folders: (cat.folders || []).map((f) => {
                if (f.id !== folderId) return f
                const items = typeof updater === 'function' ? updater(f.items || []) : updater
                return { ...f, items, updatedAt: new Date().toISOString() }
              }),
            }
          }),
        }
        saveSubjectContent(next, subject)
      }
    },
    [updateFolderItems, content, subject],
  )

  useEffect(() => {
    setSelectedRowIds([])
  }, [selectedFolderId, selectedCategoryId])

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !selectedCategoryId || !activeCategory || !content) {
      toast.error('Folder name and category are required')
      return
    }
    const folder = {
      id: generateContentId('folder'),
      folderName: newFolderName.trim(),
      description: newFolderDescription.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await persistContent({
      ...content,
      categories: content.categories.map((c) =>
        c.id === selectedCategoryId ? { ...c, folders: [...(c.folders || []), folder] } : c,
      ),
    })
    setAddingFolder(false)
    setNewFolderName('')
    setNewFolderDescription('')
    setSelectedFolderId(folder.id)
    setSelectedItemId(null)
    setPanelMode('list')
    setAddingNewItem(false)
    toast.success('Folder created')
  }

  const handleRenameFolder = async (folderId, name) => {
    if (!name.trim() || !selectedCategoryId || !content) return
    const folder = activeCategory?.folders?.find((f) => f.id === folderId)
    await persistContent({
      ...content,
      categories: content.categories.map((cat) => ({
        ...cat,
        folders: (cat.folders || []).map((f) =>
          f.id === folderId
            ? {
                ...f,
                folderName: name.trim(),
                description: folder?.description || '',
                updatedAt: new Date().toISOString(),
              }
            : f,
        ),
      })),
    })
    toast.success('Folder renamed')
  }

  const handleDeleteFolder = (folderId) => setDeleteFolderTarget(folderId)

  const confirmDeleteFolder = async () => {
    if (!selectedCategoryId || !deleteFolderTarget || !content) return
    await persistContent({
      ...content,
      categories: content.categories.map((cat) => ({
        ...cat,
        folders: (cat.folders || []).filter((f) => f.id !== deleteFolderTarget),
      })),
    })
    if (selectedFolderId === deleteFolderTarget) {
      setSelectedFolderId(null)
      setSelectedItemId(null)
      setPanelMode('list')
    }
    setDeleteFolderTarget(null)
    toast.success('Folder deleted')
  }

  const removeItemFromSubject = (item, contentType) => {
    const linked = item?.linkedExistingFormId
    if (!linked || !subject) return { ...subject }
    if (contentType === 'live') {
      return {
        ...subject,
        liveClasses: (subject.liveClasses || []).filter((lc) => lc.id !== linked),
      }
    }
    if (contentType === 'recording') {
      return {
        ...subject,
        recordings: (subject.recordings || []).filter((r) => r.id !== linked),
      }
    }
    if (contentType === 'pdf') {
      return { ...subject, pdfs: (subject.pdfs || []).filter((p) => p.id !== linked) }
    }
    return subject
  }

  const handleDeleteItem = (item) => setDeleteItemTarget(item)

  const confirmDeleteItem = async () => {
    if (!deleteItemTarget || !selectedCategoryId || !activeFolder) return
    const contentType = contentTypeFromCategoryType(activeCategory.categoryType)

    mutateFolderItems(selectedCategoryId, activeFolder.id, (items) =>
      items.filter((i) => i.id !== deleteItemTarget.id),
    )
    upsertSubject(removeItemFromSubject(deleteItemTarget, contentType))
    if (selectedItemId === deleteItemTarget.id) {
      setSelectedItemId(null)
      setPanelMode('list')
    }
    setDeleteItemTarget(null)
    if (contentType === 'live') {
      toast.success('Live Class Deleted Successfully')
    } else if (contentType === 'recording') {
      toast.success('Recording deleted successfully')
    } else {
      toast.success('Entry deleted')
    }
  }

  const handlePublishItemQuick = async (item, { silent = false } = {}) => {
    if (!selectedCategoryId || !activeFolder) return
    const contentType = contentTypeFromCategoryType(activeCategory.categoryType)

    mutateFolderItems(selectedCategoryId, activeFolder.id, (items) =>
      items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'published',
              data: i.data
                ? { ...i.data, visibility: 'Published', status: 'Active' }
                : i.data,
            }
          : i,
      ),
    )
    if (!silent) {
      if (contentType === 'recording') toast.success('Recording published successfully')
      else toast.success('Live Class Published Successfully')
    }
  }

  const handleDuplicateItem = async (row) => {
    if (!activeCategory || !activeFolder) return
    const contentType = contentTypeFromCategoryType(activeCategory.categoryType)
    if (contentType !== 'live') {
      toast.info('Duplicate is available for live classes')
      return
    }
    const src = row?.payload
    if (!src) return

    const newId = nextLiveClassId(mergedSubject?.liveClasses || [])
    const copy = {
      ...src,
      id: newId,
      classTitle: `${src.classTitle} (Copy)`,
      folderId: activeFolder.id,
      categoryId: activeCategory.id,
    }

    const newItem = {
      id: generateContentId('item'),
      itemType: activeCategory.categoryType,
      title: copy.classTitle,
      linkedExistingFormId: copy.id,
      status: 'draft',
      lastUpdated: new Date().toISOString(),
      data: copy,
    }
    mutateFolderItems(selectedCategoryId, activeFolder.id, (items) => [...items, newItem])
    upsertSubject({
      ...mergedSubject,
      liveClasses: [...(mergedSubject?.liveClasses || []), copy],
    })
    toast.success('Live Class Duplicated Successfully')
  }

  const handleDisableItemQuick = async (item, { silent = false } = {}) => {
    if (!selectedCategoryId || !activeFolder) return

    mutateFolderItems(selectedCategoryId, activeFolder.id, (items) =>
      items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'draft',
              data: i.data ? { ...i.data, visibility: 'Draft', status: 'Draft' } : i.data,
            }
          : i,
      ),
    )
    if (!silent) toast.success('Item disabled')
  }

  const getItemsBySelectedIds = () => {
    const idSet = new Set(selectedRowIds.map(String))
    return folderItems.filter((i) => idSet.has(String(i.id)))
  }

  const handleToggleRowSelect = (id) => {
    const sid = String(id)
    setSelectedRowIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }

  const handleToggleSelectAllRows = () => {
    const allIds = folderItems.map((i) => String(i.id))
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedRowIds.includes(id))
    setSelectedRowIds(allSelected ? [] : allIds)
  }

  const handleBulkDeleteRequest = () => {
    if (!selectedRowIds.length) return
    setBulkConfirm({ type: 'deactivate', count: selectedRowIds.length })
  }

  const handleBulkDisableRequest = () => {
    if (!selectedRowIds.length) return
    setBulkConfirm({ type: 'disable', count: selectedRowIds.length })
  }

  const handleBulkEnableRequest = async () => {
    const items = getItemsBySelectedIds()
    if (!items.length) return
    setBulkActionLoading(true)
    try {
      for (const item of items) {
        await handlePublishItemQuick(item, { silent: true })
      }
      setSelectedRowIds([])
      toast.success(`${items.length} item(s) enabled`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const confirmBulkAction = async () => {
    if (!bulkConfirm || !selectedCategoryId || !activeFolder) return
    const items = getItemsBySelectedIds()
    if (!items.length) {
      setBulkConfirm(null)
      return
    }

    setBulkActionLoading(true)
    try {
      if (bulkConfirm.type === 'delete' || bulkConfirm.type === 'deactivate') {
        const contentType = contentTypeFromCategoryType(activeCategory.categoryType)
        const idsToDelete = new Set(items.map((i) => i.id))

        for (const item of items) {
          upsertSubject(removeItemFromSubject(item, contentType))
        }

        mutateFolderItems(selectedCategoryId, activeFolder.id, (list) =>
          list.filter((i) => !idsToDelete.has(i.id)),
        )
        setSelectedRowIds([])
        setSelectedItemId(null)
        setPanelMode('list')
        toast.success(`${items.length} item(s) deleted`)
      } else if (bulkConfirm.type === 'disable') {
        for (const item of items) {
          await handleDisableItemQuick(item, { silent: true })
        }
        setSelectedRowIds([])
        toast.success(`${items.length} item(s) disabled`)
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(error?.message || 'Bulk action failed')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSelectCategory = useCallback(
    (id) => {
      const cat = categories.find((c) => c.id === id)
      const firstFolder = cat?.folders?.[0]
      setSelectedCategoryId(id)
      setSelectedFolderId(firstFolder?.id ?? null)
      setSelectedItemId(null)
      setPanelMode('list')
      setAddingNewItem(false)
      setPreviewRow(null)
      setMobileSidebarOpen(false)
    },
    [categories],
  )

  const handleSelectFolder = useCallback((folderId) => {
    setSelectedFolderId(folderId)
    setSelectedItemId(null)
    setPanelMode('list')
    setAddingNewItem(false)
    setPreviewRow(null)
    setMobileSidebarOpen(false)
  }, [])

  const handleSelectItem = useCallback((folderId, itemId) => {
    setSelectedFolderId(folderId)
    setSelectedItemId(itemId)
    setPanelMode('list')
    setAddingNewItem(false)
    setPreviewRow(null)
    setMobileSidebarOpen(false)
  }, [])

  const handlePanelModeChange = useCallback((mode) => {
    setPanelMode(mode)
    if (mode === 'list') setAddingNewItem(false)
  }, [])

  const handleSaveItem = async ({
    values,
    contentType,
    publish,
    existingItem,
    liveClassData,
    recordingData,
  }) => {
    if (!content || !activeCategory || !activeFolder) return

    const { item, subjectPatch } = buildItemSavePayload({
      values,
      contentType,
      subject: mergedSubject || subject,
      existingItem: existingItem || null,
      liveClassData,
      recordingData,
      folder: activeFolder,
      category: activeCategory,
      publish,
    })

    mutateFolderItems(selectedCategoryId, activeFolder.id, (items) => {
      const next = [...items]
      const idx = next.findIndex((i) => i.id === item.id)
      if (idx >= 0) next[idx] = { ...item, data: item.data }
      else next.push(item)
      return next
    })

    upsertSubject(subjectPatch)

    setSelectedItemId(item.id)
    setAddingNewItem(false)
    setPanelMode('list')
  }

  const showPageLoading = (subjectLoading || loading) && !categories.length

  if (!subject && !subjectLoading && !loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-semibold text-[#1a3a5c]">
          {subjectError || 'Faculty subject not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/academics/subjects')}
          className="text-sm text-[#246392] hover:underline"
        >
          Back to Faculty Subjects
        </button>
      </div>
    )
  }

  const bannerTitle = `${subject?.subjectName || 'Subject'}${teacherShort ? ` – ${teacherShort}` : ''}`

  return (
    <div className="figma-admin-section flex min-h-screen flex-col bg-[#f7f7f7]">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f7f7]/95 px-4 py-4 backdrop-blur sm:px-5 lg:px-6">
        <PageBanner icon={Layers} title={`${bannerTitle} — Content`} iconClassName="text-[#246392]">
          <button
            type="button"
            onClick={() => navigate('/academics/subjects')}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </PageBanner>
      </div>

      {showPageLoading ? (
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row">
          <div className="hidden w-[300px] shrink-0 animate-pulse rounded-2xl bg-white shadow-sm lg:block">
            <div className="border-b border-slate-100 p-4">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 flex gap-2">
                <div className="h-5 w-16 rounded-full bg-slate-200" />
                <div className="h-5 w-16 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-white shadow-sm" />
            <div className="h-64 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          {mobileSidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            />
          )}

          <HierarchyExplorer
            subjectName={subject?.subjectName || ''}
            facultyLabel={subject?.teacher || facultyName}
            categoryChips={categoryChips}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedFolderId={selectedFolderId}
            selectedItemId={selectedItemId}
            onSelectCategory={handleSelectCategory}
            onSelectFolder={handleSelectFolder}
            onSelectItem={handleSelectItem}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            addingFolder={addingFolder}
            setAddingFolder={setAddingFolder}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            newFolderDescription={newFolderDescription}
            setNewFolderDescription={setNewFolderDescription}
            onConfirmAddFolder={handleAddFolder}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg p-2 text-[#1a3a5c] hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-slate-600">Content explorer</span>
            </div>

            <SubjectContentFormPanel
              subject={mergedSubject || subject}
              facultySubjectId=""
              listLoading={folderListLoading}
              itemCount={isRecordingCategory ? recordingCount : undefined}
              subjects={subject ? [subject] : []}
              category={activeCategory}
              folder={activeFolder}
              item={activeItem}
              items={folderItems}
              facultyName={facultyName}
              saving={saving}
              panelMode={panelMode}
              onPanelModeChange={handlePanelModeChange}
              previewRow={previewRow}
              onPreviewRow={setPreviewRow}
              addingNew={addingNewItem}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              onDuplicateItem={handleDuplicateItem}
              onPublishItemQuick={handlePublishItemQuick}
              onSelectItem={(id) => {
                setSelectedItemId(id)
                setAddingNewItem(false)
              }}
              onStartAddItem={() => {
                setSelectedItemId(null)
                setAddingNewItem(true)
              }}
            />
          </main>
        </div>
      )}

      

      
      <ContentBulkConfirmDialog
        open={Boolean(bulkConfirm)}
        type={bulkConfirm?.type}
        count={bulkConfirm?.count || 0}
        loading={bulkActionLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirm(null)}
      />
    </div>
  )
}
