import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Menu, Loader2 } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import HierarchyExplorer from '../../components/subject-content/HierarchyExplorer'
import SubjectContentFormPanel, {
  buildItemSavePayload,
} from '../../components/subject-content/SubjectContentFormPanel'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { useAuth } from '../../contexts/AuthContext'
import { useAcademicsSubjects } from '../../hooks/useAcademicsSubjects'
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
  updateCategoryFolders,
} from '../../utils/facultySubjectContentStorage'
import { nextLiveClassId } from '../../utils/academicsSubjectsStorage'
import { normalizeCategories } from '../../utils/subjectCategoryHelpers'
import {
  createLiveClass,
  deleteLiveClass,
  duplicateLiveClass,
  updateLiveClass,
  updateLiveClassPublishStatus,
} from '../../api/liveClassesHttpAPI'
import { useFacultySubjectDetail } from '../../hooks/useFacultySubjectDetail'
import {
  buildLiveClassApiPayload,
  mapApiLiveClassToLocalRow,
  resolveFacultySubjectApiId,
  resolveLiveClassApiId,
  validateLiveClassApiPayload,
} from '../../utils/liveClassHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'

export default function SubjectContentManagementPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { subjects, upsertSubject } = useAcademicsSubjects()
  const {
    subject: apiSubject,
    loading: subjectDetailLoading,
  } = useFacultySubjectDetail(subjectId)
  const localSubject = useMemo(
    () => subjects.find((s) => String(s.id) === String(subjectId)),
    [subjects, subjectId],
  )
  const subject = apiSubject || localSubject
  const facultySubjectApiId = resolveFacultySubjectApiId(subject, subjectId)

  const facultyName = user?.name || user?.email || subject?.teacher || 'Faculty'
  const teacherShort = subject?.teacher?.split(' ')[0] || facultyName.split(' ')[0]

  const { content, loading, saving, persist } = useSubjectContent(subjectId, {
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
  const [initialSelectionDone, setInitialSelectionDone] = useState(false)

  const categories = content?.categories || []
  const categoryChips = normalizeCategories(
    content?.categoryIds?.length ? content.categoryIds : subject?.categories,
  )

  const activeCategory = findCategoryById(categories, selectedCategoryId)
  const activeFolder = activeCategory
    ? findFolderInCategory(activeCategory, selectedFolderId)
    : null
  const { item: activeItem } = findItemInHierarchy(categories, selectedItemId)
  const folderItems = activeFolder?.items || []

  const mergedSubject = useMemo(() => {
    if (!subject || !content) return subject
    return mergeSeedIntoSubject(subject, content)
  }, [subject, content])

  useEffect(() => {
    if (loading || !subject || !content?.categories?.length) return
    const merged = mergeSeedIntoSubject(subject, content)
    const seedLiveCount = merged.liveClasses?.length || 0
    const currentLiveCount = subject.liveClasses?.length || 0
    if (seedLiveCount > currentLiveCount) {
      upsertSubject(merged)
    }
  }, [loading, subject?.id, content?.seedVersion])

  useEffect(() => {
    if (loading || initialSelectionDone || !categories.length) return
    const liveCat = categories.find((c) => c.categoryType === 'LIVE_CLASS') || categories[0]
    const firstFolder = liveCat?.folders?.[0]
    const firstItem = firstFolder?.items?.[0]
    setSelectedCategoryId(liveCat.id)
    if (firstFolder) {
      setSelectedFolderId(firstFolder.id)
      if (firstItem) setSelectedItemId(firstItem.id)
    }
    setPanelMode('list')
    setInitialSelectionDone(true)
  }, [loading, categories, initialSelectionDone])

  const mutateCategoryFolders = useCallback(
    async (categoryId, updater) => {
      if (!content) return
      const next = updateCategoryFolders(content, categoryId, updater)
      await persist({
        ...next,
        subjectName: subject?.subjectName || content.subjectName,
        categoryIds: categoryChips,
        facultyName,
      })
      return next
    },
    [content, persist, subject, categoryChips, facultyName],
  )

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !selectedCategoryId) {
      toast.error('Folder name and category are required')
      return
    }
    const folder = {
      id: generateContentId('fld'),
      parentFolderId: null,
      folderName: newFolderName.trim(),
      description: newFolderDescription.trim(),
      orderIndex: activeCategory?.folders?.length || 0,
      items: [],
      updatedAt: new Date().toISOString(),
    }
    await mutateCategoryFolders(selectedCategoryId, (list) => [...list, folder])
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
    if (!name.trim() || !selectedCategoryId) return
    await mutateCategoryFolders(selectedCategoryId, (list) =>
      list.map((f) => (f.id === folderId ? { ...f, folderName: name.trim() } : f)),
    )
    toast.success('Folder renamed')
  }

  const handleDeleteFolder = (folderId) => setDeleteFolderTarget(folderId)

  const confirmDeleteFolder = async () => {
    if (!selectedCategoryId || !deleteFolderTarget) return
    await mutateCategoryFolders(selectedCategoryId, (list) =>
      list.filter((f) => f.id !== deleteFolderTarget),
    )
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
    const linkedId = deleteItemTarget?.linkedExistingFormId
    const apiId = resolveLiveClassApiId({
      id: linkedId,
      apiId: deleteItemTarget?.data?.apiId,
    })

    if (contentType === 'live' && apiId) {
      try {
        await deleteLiveClass(apiId)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to delete live class'))
        return
      }
    }

    await mutateCategoryFolders(selectedCategoryId, (list) =>
      list.map((f) =>
        f.id === activeFolder.id
          ? { ...f, items: f.items.filter((i) => i.id !== deleteItemTarget.id) }
          : f,
      ),
    )
    upsertSubject(removeItemFromSubject(deleteItemTarget, contentType))
    if (selectedItemId === deleteItemTarget.id) {
      setSelectedItemId(null)
      setPanelMode('list')
    }
    setDeleteItemTarget(null)
    toast.success('Entry deleted')
  }

  const handlePublishItemQuick = async (item) => {
    if (!selectedCategoryId || !activeFolder) return
    const contentType = contentTypeFromCategoryType(activeCategory.categoryType)
    const apiId = resolveLiveClassApiId({ id: item?.linkedExistingFormId, apiId: item?.data?.apiId })

    if (contentType === 'live' && apiId) {
      try {
        await updateLiveClassPublishStatus(apiId, 'PUBLISHED')
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to publish live class'))
        return
      }
    }

    await mutateCategoryFolders(selectedCategoryId, (list) =>
      list.map((f) =>
        f.id === activeFolder.id
          ? {
              ...f,
              items: f.items.map((i) =>
                i.id === item.id ? { ...i, status: 'published' } : i,
              ),
            }
          : f,
      ),
    )
    toast.success('Published')
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

    const apiId = resolveLiveClassApiId(src)
    let copy = null

    if (apiId) {
      try {
        const result = await duplicateLiveClass(apiId)
        copy = mapApiLiveClassToLocalRow(result)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to duplicate live class'))
        return
      }
    }

    if (!copy) {
      const newId = nextLiveClassId(mergedSubject?.liveClasses || [])
      copy = {
        ...src,
        id: newId,
        apiId: newId,
        classTitle: `${src.classTitle} (Copy)`,
        folderId: activeFolder.id,
        categoryId: activeCategory.id,
      }
    } else {
      copy = {
        ...copy,
        folderId: activeFolder.id,
        categoryId: activeCategory.id,
      }
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
    await mutateCategoryFolders(selectedCategoryId, (list) =>
      list.map((f) =>
        f.id === activeFolder.id ? { ...f, items: [...f.items, newItem] } : f,
      ),
    )
    upsertSubject({
      ...mergedSubject,
      liveClasses: [...(mergedSubject?.liveClasses || []), copy],
    })
    toast.success('Class duplicated')
  }

  const handleSaveItem = async ({
    values,
    contentType,
    publish,
    existingItem,
    liveClassData,
    recordingData,
  }) => {
    if (!content || !activeCategory || !activeFolder) return

    let resolvedLiveClassData = liveClassData

    if (contentType === 'live') {
      try {
        const isRecurring = Boolean(values.recurring && values.recurrence?.enabled)
        const apiPayload = buildLiveClassApiPayload(values, {
          facultySubjectId: facultySubjectApiId,
          folderId: activeFolder.id,
          publish,
          recurring: isRecurring,
          recurrence: isRecurring ? values.recurrence : null,
          timezone: values.timezone || 'Asia/Kolkata',
        })
        const payloadErrors = validateLiveClassApiPayload(apiPayload)
        if (payloadErrors.length) {
          throw new Error(payloadErrors[0])
        }
        const existingApiId = resolveLiveClassApiId(liveClassData)
        const apiResult = existingApiId
          ? await updateLiveClass(existingApiId, apiPayload)
          : await createLiveClass(apiPayload)
        resolvedLiveClassData = mapApiLiveClassToLocalRow(apiResult)
        if (!resolvedLiveClassData) {
          throw new Error('Invalid live class response from server')
        }
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to save live class'))
      }
    }

    const { item, subjectPatch } = buildItemSavePayload({
      values,
      contentType,
      subject: mergedSubject || subject,
      existingItem: existingItem || null,
      liveClassData: resolvedLiveClassData,
      recordingData,
      folder: activeFolder,
      category: activeCategory,
      publish,
    })

    if (contentType === 'live' && resolvedLiveClassData) {
      item.linkedExistingFormId = resolvedLiveClassData.id
      item.data = resolvedLiveClassData
    }

    await mutateCategoryFolders(selectedCategoryId, (list) =>
      list.map((f) => {
        if (f.id !== activeFolder.id) return f
        const items = [...(f.items || [])]
        const idx = items.findIndex((i) => i.id === item.id)
        if (idx >= 0) items[idx] = { ...item, data: item.data }
        else items.push(item)
        return { ...f, items, updatedAt: new Date().toISOString() }
      }),
    )

    upsertSubject(subjectPatch)

    setSelectedItemId(item.id)
    setAddingNewItem(false)
    setPanelMode('list')
  }

  if (!subject && !loading && !subjectDetailLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-semibold text-[#1a3a5c]">Subject not found</p>
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

      {loading || subjectDetailLoading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" />
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
            onSelectCategory={(id) => {
              setSelectedCategoryId(id)
              setSelectedFolderId(null)
              setSelectedItemId(null)
              setPanelMode('list')
              setAddingNewItem(false)
              setPreviewRow(null)
              setMobileSidebarOpen(false)
            }}
            onSelectFolder={(folderId) => {
              setSelectedFolderId(folderId)
              setSelectedItemId(null)
              setPanelMode('list')
              setAddingNewItem(false)
              setPreviewRow(null)
              setMobileSidebarOpen(false)
            }}
            onSelectItem={(folderId, itemId) => {
              setSelectedFolderId(folderId)
              setSelectedItemId(itemId)
              setPanelMode('list')
              setAddingNewItem(false)
              setMobileSidebarOpen(false)
            }}
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
              facultySubjectId={facultySubjectApiId}
              subjects={subjects}
              category={activeCategory}
              folder={activeFolder}
              item={activeItem}
              items={folderItems}
              facultyName={facultyName}
              saving={saving}
              panelMode={panelMode}
              onPanelModeChange={setPanelMode}
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

      <ConfirmDeleteDialog
        open={Boolean(deleteFolderTarget)}
        title="Delete folder?"
        message="All entries in this folder will be removed."
        onConfirm={confirmDeleteFolder}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteItemTarget)}
        title="Delete entry?"
        message="This will permanently remove this content entry."
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteItemTarget(null)}
      />
    </div>
  )
}
