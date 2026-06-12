import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Menu } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import HierarchyExplorer from '../../components/subject-content/HierarchyExplorer'
import SubjectContentFormPanel, {
  buildItemSavePayload,
} from '../../components/subject-content/SubjectContentFormPanel'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import ContentBulkConfirmDialog from '../../components/subject-content/ContentBulkConfirmDialog'
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
  mapApiLiveClassToFolderItem,
  mapApiLiveClassToLocalRow,
  normalizeLiveClassesListResponse,
  resolveFacultySubjectApiId,
  resolveFolderApiId,
  resolveLiveClassApiId,
  validateLiveClassApiPayload,
} from '../../utils/liveClassHelpers'
import { mapCategoryTypeToApi } from '../../utils/facultySubjectFolderHelpers'
import { fetchFolderContentByCategory } from '../../utils/folderContentApi'
import {
  createRecording,
  deleteRecording,
  updateRecording,
  updateRecordingVisibility,
} from '../../api/recordingsAPI'
import {
  buildRecordingCreateFormData,
  buildRecordingUpdatePayload,
  mapApiRecordingToFolderItem,
  mapApiRecordingToLocalRow,
  normalizeRecordingsListResponse,
  resolveRecordingApiId,
  validateRecordingApiPayload,
} from '../../utils/recordingHelpers'
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

  const {
    content,
    loading,
    saving,
    persist,
    createFolder,
    renameFolder,
    removeFolder,
    updateFolderItems,
  } = useSubjectContent(subjectId, {
    subjectMeta: subject,
    facultySubjectApiId,
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
  const folderSyncKeyRef = useRef('')
  const folderSyncAbortRef = useRef(null)
  const folderSyncInFlightRef = useRef(null)
  const initialSelectionAppliedRef = useRef(false)
  const seedMergedRef = useRef('')

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
  const folderApiId = activeFolder ? resolveFolderApiId(activeFolder) : ''
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
    folderSyncKeyRef.current = ''
    folderSyncAbortRef.current?.abort()
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
    },
    [updateFolderItems],
  )

  const syncFolderContentFromApi = useCallback(
    async (categoryId, folder, { force = false } = {}) => {
      const category = findCategoryById(categories, categoryId)
      if (!categoryId || !folder || !category) return

      const apiCategory = mapCategoryTypeToApi(category.categoryType)
      if (apiCategory !== 'LIVE_CLASS' && apiCategory !== 'RECORDING') return

      const folderApiId = resolveFolderApiId(folder)
      if (!folderApiId || !facultySubjectApiId) return

      const syncKey = `${facultySubjectApiId}:${apiCategory}:${folderApiId}`
      if (force) folderSyncKeyRef.current = ''
      if (!force && folderSyncKeyRef.current === syncKey && folderSyncInFlightRef.current) {
        return folderSyncInFlightRef.current
      }

      folderSyncAbortRef.current?.abort()
      const controller = new AbortController()
      folderSyncAbortRef.current = controller

      const showSkeleton = force ? false : !(folder.items || []).length
      if (showSkeleton) setFolderListLoading(true)

      const run = (async () => {
        try {
          const response = await fetchFolderContentByCategory(
            {
              facultySubjectId: facultySubjectApiId,
              category: apiCategory,
              folderId: folderApiId,
            },
            { signal: controller.signal, bypassCache: force },
          )
          if (controller.signal.aborted) return

          const existingItems = folder.items || []
          const existingByLinkedId = new Map(
            existingItems.map((item) => [String(item.linkedExistingFormId), item]),
          )

          const nextItems =
            apiCategory === 'LIVE_CLASS'
              ? normalizeLiveClassesListResponse(response)
                  .map((row) =>
                    mapApiLiveClassToFolderItem(
                      row,
                      existingByLinkedId.get(String(row.id)),
                    ),
                  )
                  .filter(Boolean)
              : normalizeRecordingsListResponse(response)
                  .map((row) =>
                    mapApiRecordingToFolderItem(
                      row,
                      existingByLinkedId.get(String(row.id)),
                    ),
                  )
                  .filter(Boolean)

          mutateFolderItems(categoryId, folder.id, () => nextItems)
          folderSyncKeyRef.current = syncKey
        } catch (error) {
          if (controller.signal.aborted) return
          const label = apiCategory === 'RECORDING' ? 'recordings' : 'live classes'
          toast.error(getApiErrorMessage(error, `Failed to load ${label}`))
        } finally {
          if (!controller.signal.aborted) setFolderListLoading(false)
        }
      })()

      folderSyncInFlightRef.current = run
      try {
        await run
      } finally {
        if (folderSyncInFlightRef.current === run) {
          folderSyncInFlightRef.current = null
        }
      }
    },
    [categories, facultySubjectApiId, mutateFolderItems],
  )

  useEffect(() => {
    if (!selectedCategoryId || !activeFolder || !facultySubjectApiId) return

    const category = findCategoryById(categories, selectedCategoryId)
    if (!category) return

    const apiCategory = mapCategoryTypeToApi(category.categoryType)
    if (apiCategory !== 'LIVE_CLASS' && apiCategory !== 'RECORDING') return

    const folderApiId = resolveFolderApiId(activeFolder)
    if (!folderApiId) return

    const syncKey = `${facultySubjectApiId}:${apiCategory}:${folderApiId}`
    if (folderSyncKeyRef.current === syncKey) return

    syncFolderContentFromApi(selectedCategoryId, activeFolder)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when folder selection changes
  }, [selectedCategoryId, activeFolder?.id, facultySubjectApiId, activeCategory?.categoryType])

  useEffect(() => {
    setSelectedRowIds([])
  }, [selectedFolderId, selectedCategoryId])

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !selectedCategoryId || !activeCategory) {
      toast.error('Folder name and category are required')
      return
    }
    try {
      const folder = await createFolder({
        categoryId: selectedCategoryId,
        categoryType: activeCategory.categoryType,
        folderName: newFolderName.trim(),
        description: newFolderDescription.trim(),
      })
      setAddingFolder(false)
      setNewFolderName('')
      setNewFolderDescription('')
      if (folder?.id) setSelectedFolderId(folder.id)
      setSelectedItemId(null)
      setPanelMode('list')
      setAddingNewItem(false)
      toast.success('Folder created')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create folder'))
    }
  }

  const handleRenameFolder = async (folderId, name) => {
    if (!name.trim() || !selectedCategoryId) return
    const folder = activeCategory?.folders?.find((f) => f.id === folderId)
    try {
      await renameFolder({
        folderId,
        folderName: name.trim(),
        description: folder?.description || '',
      })
      toast.success('Folder renamed')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to rename folder'))
    }
  }

  const handleDeleteFolder = (folderId) => setDeleteFolderTarget(folderId)

  const confirmDeleteFolder = async () => {
    if (!selectedCategoryId || !deleteFolderTarget) return
    try {
      await removeFolder(deleteFolderTarget)
      if (selectedFolderId === deleteFolderTarget) {
        setSelectedFolderId(null)
        setSelectedItemId(null)
        setPanelMode('list')
      }
      setDeleteFolderTarget(null)
      toast.success('Folder deleted')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete folder'))
    }
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
    const liveApiId = resolveLiveClassApiId({
      id: linkedId,
      apiId: deleteItemTarget?.data?.apiId,
    })
    const recordingApiId = resolveRecordingApiId({
      id: linkedId,
      apiId: deleteItemTarget?.data?.apiId,
    })

    if (contentType === 'live' && liveApiId) {
      try {
        await deleteLiveClass(liveApiId)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to delete live class'))
        return
      }
    }

    if (contentType === 'recording' && recordingApiId) {
      try {
        await deleteRecording(recordingApiId)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to delete recording'))
        return
      }
    }

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
      if (selectedCategoryId && activeFolder) {
        await syncFolderContentFromApi(selectedCategoryId, activeFolder, { force: true })
      }
    } else if (contentType === 'recording') {
      toast.success('Recording deleted successfully')
      if (selectedCategoryId && activeFolder) {
        await syncFolderContentFromApi(selectedCategoryId, activeFolder, { force: true })
      }
    } else {
      toast.success('Entry deleted')
    }
  }

  const handlePublishItemQuick = async (item, { silent = false } = {}) => {
    if (!selectedCategoryId || !activeFolder) return
    const contentType = contentTypeFromCategoryType(activeCategory.categoryType)
    const liveApiId = resolveLiveClassApiId({ id: item?.linkedExistingFormId, apiId: item?.data?.apiId })
    const recordingApiId = resolveRecordingApiId({ id: item?.linkedExistingFormId, apiId: item?.data?.apiId })

    if (contentType === 'live' && liveApiId) {
      try {
        await updateLiveClassPublishStatus(liveApiId, 'PUBLISHED')
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to publish live class'))
        return
      }
    }

    if (contentType === 'recording' && recordingApiId) {
      try {
        await updateRecordingVisibility(recordingApiId, 'PUBLISHED')
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to publish recording'))
        return
      }
    }

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
    mutateFolderItems(selectedCategoryId, activeFolder.id, (items) => [...items, newItem])
    upsertSubject({
      ...mergedSubject,
      liveClasses: [...(mergedSubject?.liveClasses || []), copy],
    })
    toast.success('Live Class Duplicated Successfully')
    await syncFolderContentFromApi(selectedCategoryId, activeFolder, { force: true })
  }

  const handleDisableItemQuick = async (item, { silent = false } = {}) => {
    if (!selectedCategoryId || !activeFolder) return
    const contentType = contentTypeFromCategoryType(activeCategory.categoryType)
    const liveApiId = resolveLiveClassApiId({ id: item?.linkedExistingFormId, apiId: item?.data?.apiId })
    const recordingApiId = resolveRecordingApiId({ id: item?.linkedExistingFormId, apiId: item?.data?.apiId })

    if (contentType === 'live' && liveApiId) {
      try {
        await updateLiveClassPublishStatus(liveApiId, 'DRAFT')
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to disable live class'))
        return
      }
    }

    if (contentType === 'recording' && recordingApiId) {
      try {
        await updateRecordingVisibility(recordingApiId, 'DRAFT')
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to disable recording'))
        return
      }
    }

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
    setBulkConfirm({ type: 'delete', count: selectedRowIds.length })
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
      if (bulkConfirm.type === 'delete') {
        const contentType = contentTypeFromCategoryType(activeCategory.categoryType)
        const idsToDelete = new Set(items.map((i) => i.id))

        for (const item of items) {
          const liveApiId = resolveLiveClassApiId({
            id: item?.linkedExistingFormId,
            apiId: item?.data?.apiId,
          })
          const recordingApiId = resolveRecordingApiId({
            id: item?.linkedExistingFormId,
            apiId: item?.data?.apiId,
          })
          if (contentType === 'live' && liveApiId) {
            await deleteLiveClass(liveApiId)
          }
          if (contentType === 'recording' && recordingApiId) {
            await deleteRecording(recordingApiId)
          }
          upsertSubject(removeItemFromSubject(item, contentType))
        }

        mutateFolderItems(selectedCategoryId, activeFolder.id, (list) =>
          list.filter((i) => !idsToDelete.has(i.id)),
        )
        setSelectedRowIds([])
        setSelectedItemId(null)
        setPanelMode('list')
        toast.success(`${items.length} item(s) deleted`)
        if (
          activeCategory?.categoryType === 'LIVE_CLASS' ||
          activeCategory?.categoryType === 'RECORDED_CLASS'
        ) {
          await syncFolderContentFromApi(selectedCategoryId, activeFolder, { force: true })
        }
      } else if (bulkConfirm.type === 'disable') {
        for (const item of items) {
          await handleDisableItemQuick(item, { silent: true })
        }
        setSelectedRowIds([])
        toast.success(`${items.length} item(s) disabled`)
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Bulk action failed'))
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSelectCategory = useCallback(
    (id) => {
      const cat = categories.find((c) => c.id === id)
      const firstFolder = cat?.folders?.[0]
      folderSyncKeyRef.current = ''
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
    folderSyncKeyRef.current = ''
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
    recordingFormOptions,
  }) => {
    if (!content || !activeCategory || !activeFolder) return

    let resolvedLiveClassData = liveClassData
    let resolvedRecordingData = recordingData

    if (contentType === 'recording') {
      try {
        if (activeCategory.categoryType !== 'RECORDED_CLASS') {
          throw new Error('Recordings must be saved under the Recording category')
        }
        if (!facultySubjectApiId) {
          throw new Error('Faculty subject id is missing — open this page from Faculty Subjects list')
        }

        const folderApiId = resolveFolderApiId(activeFolder)
        if (!folderApiId) {
          throw new Error(
            'Folder id is invalid. Delete this folder, create a new one under Recording, then try again.',
          )
        }

        const existingApiId = resolveRecordingApiId(recordingData)
        const payloadErrors = validateRecordingApiPayload(values, {
          isEdit: Boolean(existingApiId),
          hasExistingFile: Boolean(recordingData?.videoFileName),
          options: recordingFormOptions,
        })
        if (payloadErrors.length) {
          throw new Error(payloadErrors[0])
        }

        let apiResult
        if (existingApiId) {
          const { payload, multipart } = buildRecordingUpdatePayload(values, {
            folderId: folderApiId,
            facultySubjectId: facultySubjectApiId,
            options: recordingFormOptions,
          })
          apiResult = await updateRecording(existingApiId, payload, { multipart })
        } else {
          const formData = buildRecordingCreateFormData(values, {
            folderId: folderApiId,
            facultySubjectId: facultySubjectApiId,
            options: recordingFormOptions,
          })
          apiResult = await createRecording(formData)
        }

        resolvedRecordingData = mapApiRecordingToLocalRow(apiResult)
        if (!resolvedRecordingData) {
          throw new Error('Invalid recording response from server')
        }
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to save recording'))
      }
    }

    if (contentType === 'live') {
      try {
        if (activeCategory.categoryType !== 'LIVE_CLASS') {
          throw new Error('Live classes must be saved under the Live Class category')
        }
        if (!facultySubjectApiId) {
          throw new Error('Faculty subject id is missing — open this page from Faculty Subjects list')
        }

        const folderApiId = resolveFolderApiId(activeFolder)
        if (!folderApiId) {
          throw new Error(
            'Folder id is invalid. Delete this folder, create a new one under Live Class, then try again.',
          )
        }

        await persist({
          ...content,
          subjectName: subject?.subjectName || content.subjectName,
          categoryIds: categoryChips,
          facultyName,
        })

        const isRecurring = Boolean(values.recurring && values.recurrence?.enabled)
        const apiPayload = buildLiveClassApiPayload(values, {
          facultySubjectId: facultySubjectApiId,
          folderId: folderApiId,
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

    if (contentType === 'recording' && resolvedRecordingData) {
      item.linkedExistingFormId = resolvedRecordingData.id
      item.data = resolvedRecordingData
      item.status =
        resolvedRecordingData.visibility === 'Published' ? 'published' : 'draft'
    }

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

    if (contentType === 'live' || contentType === 'recording') {
      await syncFolderContentFromApi(selectedCategoryId, activeFolder, { force: true })
    }
  }

  const showPageLoading = (loading && !categories.length) || (subjectDetailLoading && !subject)

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
              facultySubjectId={facultySubjectApiId}
              listLoading={folderListLoading}
              itemCount={isRecordingCategory ? recordingCount : undefined}
              subjects={subjects}
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

      <ConfirmDeleteDialog
        open={Boolean(deleteFolderTarget)}
        title="Delete folder?"
        message="All entries in this folder will be removed."
        onConfirm={confirmDeleteFolder}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteItemTarget)}
        title={
          activeCategory?.categoryType === 'LIVE_CLASS'
            ? 'Delete live class?'
            : 'Delete entry?'
        }
        message={
          activeCategory?.categoryType === 'LIVE_CLASS'
            ? 'Are you sure you want to delete this Live Class?'
            : 'This will permanently remove this content entry.'
        }
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteItemTarget(null)}
      />
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
