/** Legacy Free Resources — preserved so /free-resources route is unchanged */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, Trash2 } from 'lucide-react'
import EditButton from '../../components/common/EditButton'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddFreeResourceModal from '../../components/content-library/AddFreeResourceModal'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'
import { useEditModal } from '../../hooks/useEditModal'
import { useMockTestsData } from '../../hooks/useMockTestsData'
import { useNcertBooksData } from '../../hooks/useNcertBooksData'
import { usePreviousYearPapersData } from '../../hooks/usePreviousYearPapersData'
import { useStudyMaterialsData } from '../../hooks/useStudyMaterialsData'
import {
  deleteMockTest,
  deleteNcertBook,
  deletePreviousYearPaper,
  deleteStudyMaterial,
} from '../../api/freeResourcesAPI'
import { freeResourceFormToRow } from '../../utils/academicsFormMappers'
import { upsertListItem } from '../../utils/academicsCrud'
import { FREE_RESOURCE_CATEGORY } from '../../utils/freeResourceFormConstants'
import {
  getMockTestApiErrorMessage,
  getNcertBookApiErrorMessage,
  getPreviousYearPaperApiErrorMessage,
  getStudyMaterialApiErrorMessage,
  isNcertBooksCategory,
  isPreviousYearPapersCategory,
  isStudyMaterialCategory,
  isMockTestsCategory,
} from '../../utils/freeResourceApiHelpers'
import {
  loadFreeResourceCategories,
  loadFreeResources,
  saveFreeResources,
} from '../../utils/freeResourcesStorage'
import { cn } from '../../utils/cn'

const API_MANAGED_CATEGORIES = new Set([
  FREE_RESOURCE_CATEGORY.NCERT,
  FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
  FREE_RESOURCE_CATEGORY.MOCK_TEST,
  FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
])

export default function FreeResourcesPage() {
  const [resources, setResources] = useState(() => loadFreeResources())
  const categories = useMemo(() => loadFreeResourceCategories(), [])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const modal = useEditModal()
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const ncertBooksEnabled =
    categoryFilter === 'all' || categoryFilter === FREE_RESOURCE_CATEGORY.NCERT
  const previousYearPapersEnabled =
    categoryFilter === 'all' || categoryFilter === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR
  const mockTestsEnabled =
    categoryFilter === 'all' || categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST
  const studyMaterialsEnabled =
    categoryFilter === 'all' || categoryFilter === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL

  const {
    items: ncertBookItems,
    loading: ncertBooksLoading,
    refresh: refreshNcertBooks,
  } = useNcertBooksData({
    enabled: ncertBooksEnabled,
    search,
    limit: 100,
  })

  const {
    items: previousYearPaperItems,
    loading: previousYearPapersLoading,
    refresh: refreshPreviousYearPapers,
  } = usePreviousYearPapersData({
    enabled: previousYearPapersEnabled,
    search,
    limit: 100,
  })

  const {
    items: mockTestItems,
    loading: mockTestsLoading,
    refresh: refreshMockTests,
  } = useMockTestsData({
    enabled: mockTestsEnabled,
    search,
    limit: 100,
  })

  const {
    items: studyMaterialItems,
    loading: studyMaterialsLoading,
    refresh: refreshStudyMaterials,
  } = useStudyMaterialsData({
    enabled: studyMaterialsEnabled,
    search,
    limit: 100,
  })

  useEffect(() => {
    saveFreeResources(resources)
  }, [resources])

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...categories.map((c) => ({ value: c.name, label: c.name })),
    ],
    [categories],
  )

  const localResources = useMemo(
    () => resources.filter((row) => !API_MANAGED_CATEGORIES.has(row.category)),
    [resources],
  )

  const combinedResources = useMemo(() => {
    if (categoryFilter === FREE_RESOURCE_CATEGORY.NCERT) return ncertBookItems
    if (categoryFilter === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR) return previousYearPaperItems
    if (categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST) return mockTestItems
    if (categoryFilter === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL) return studyMaterialItems
    if (categoryFilter === 'all') {
      return [
        ...localResources,
        ...ncertBookItems,
        ...previousYearPaperItems,
        ...mockTestItems,
        ...studyMaterialItems,
      ]
    }
    return localResources
  }, [
    categoryFilter,
    localResources,
    ncertBookItems,
    previousYearPaperItems,
    mockTestItems,
    studyMaterialItems,
  ])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return combinedResources.filter((row) => {
      const matchSearch =
        !q || row.name.toLowerCase().includes(q) || row.category.toLowerCase().includes(q)
      const matchCategory = categoryFilter === 'all' || row.category === categoryFilter
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [combinedResources, search, categoryFilter, statusFilter])

  const handleSaveResource = (form, { isEdit, id } = {}) => {
    if (isNcertBooksCategory(form.category)) {
      refreshNcertBooks()
      return
    }
    if (isPreviousYearPapersCategory(form.category)) {
      refreshPreviousYearPapers()
      return
    }
    if (isMockTestsCategory(form.category)) {
      refreshMockTests()
      return
    }
    if (isStudyMaterialCategory(form.category)) {
      refreshStudyMaterials()
      return
    }

    const existing = isEdit ? resources.find((r) => r.id === id) : null
    const row = freeResourceFormToRow(form, existing)
    setResources((prev) => upsertListItem(prev, row, { isEdit, id }))
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const ncertBookIds = deleteTarget.ids.filter((id) =>
        ncertBookItems.some((item) => item.id === id),
      )
      const previousYearPaperIds = deleteTarget.ids.filter((id) =>
        previousYearPaperItems.some((item) => item.id === id),
      )
      const mockTestIds = deleteTarget.ids.filter((id) =>
        mockTestItems.some((item) => item.id === id),
      )
      const studyMaterialIds = deleteTarget.ids.filter((id) =>
        studyMaterialItems.some((item) => item.id === id),
      )
      const apiIds = new Set([
        ...ncertBookIds,
        ...previousYearPaperIds,
        ...mockTestIds,
        ...studyMaterialIds,
      ])
      const localIds = deleteTarget.ids.filter((id) => !apiIds.has(id))

      if (ncertBookIds.length) {
        await Promise.all(ncertBookIds.map((id) => deleteNcertBook(id)))
      }
      if (previousYearPaperIds.length) {
        await Promise.all(previousYearPaperIds.map((id) => deletePreviousYearPaper(id)))
      }
      if (mockTestIds.length) {
        await Promise.all(mockTestIds.map((id) => deleteMockTest(id)))
      }
      if (studyMaterialIds.length) {
        await Promise.all(studyMaterialIds.map((id) => deleteStudyMaterial(id)))
      }

      if (localIds.length) {
        const idSet = new Set(localIds)
        setResources((prev) => prev.filter((r) => !idSet.has(r.id)))
        setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)))
      }

      if (ncertBookIds.length) refreshNcertBooks()
      if (previousYearPaperIds.length) refreshPreviousYearPapers()
      if (mockTestIds.length) refreshMockTests()
      if (studyMaterialIds.length) refreshStudyMaterials()

      toast.success(
        deleteTarget.ids.length > 1
          ? `${deleteTarget.ids.length} resources deleted`
          : 'Resource deleted',
      )
      setDeleteTarget(null)
    } catch (error) {
      const message = deleteTarget.ids.some((id) => ncertBookItems.some((item) => item.id === id))
        ? getNcertBookApiErrorMessage(error, 'Failed to delete resource.')
        : deleteTarget.ids.some((id) => previousYearPaperItems.some((item) => item.id === id))
          ? getPreviousYearPaperApiErrorMessage(error, 'Failed to delete resource.')
          : deleteTarget.ids.some((id) => studyMaterialItems.some((item) => item.id === id))
            ? getStudyMaterialApiErrorMessage(error, 'Failed to delete resource.')
            : getMockTestApiErrorMessage(error, 'Failed to delete resource.')
      toast.error(message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !pageIds.includes(id))
      const merged = new Set([...prev, ...pageIds])
      return [...merged]
    })
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Resource Name',
      headerClassName: 'pl-4 sm:pl-6',
      cellClassName: 'pl-4 sm:pl-6',
      render: (row) => <ResourceNameCell name={row.name} />,
    },
    { key: 'category', label: 'Resource Category' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-3">
          <EditButton onClick={() => modal.openEdit(row)} />
          <button
            type="button"
            onClick={() => setDeleteTarget({ ids: [row.id], name: row.name })}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b]"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      ),
    },
  ]

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected free resources? This cannot be undone.`
      : `Delete "${deleteTarget?.name || 'this resource'}"? This cannot be undone.`

  const tableLoading =
    (ncertBooksEnabled && ncertBooksLoading) ||
    (previousYearPapersEnabled && previousYearPapersLoading) ||
    (mockTestsEnabled && mockTestsLoading) ||
    (studyMaterialsEnabled && studyMaterialsLoading)

  const emptyMessage =
    categoryFilter === FREE_RESOURCE_CATEGORY.NCERT && !ncertBooksLoading
      ? 'No NCERT books found.'
      : categoryFilter === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR && !previousYearPapersLoading
        ? 'No previous year papers found.'
        : categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST && !mockTestsLoading
          ? 'No mock tests found.'
          : categoryFilter === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL && !studyMaterialsLoading
            ? 'No study materials found.'
            : 'No free resources match your filters.'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5">
        <PageBanner icon={Layers} iconClassName="text-[#dc2626]" title="Free Resources" className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]">
          <BannerButton onClick={modal.openCreate}>Add Free Resource</BannerButton>
        </PageBanner>
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search Free Resources"
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          categoryOptions={categoryOptions}
        />

        {selectedIds.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-xl border border-[#55ace7]/20 bg-white px-4 py-3',
              'shadow-[0_2px_8px_rgba(15,23,42,0.06)]',
            )}
          >
            <span className="text-sm font-semibold text-[#246392]">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-sm font-medium text-[#686868] underline-offset-2 hover:underline"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b91c1c]"
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </button>
          </div>
        )}

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          itemLabel="resources"
          resetDeps={[search, categoryFilter, statusFilter]}
          loading={tableLoading}
          selection={{
            selectedIds,
            onToggle: toggleSelect,
            onTogglePage: toggleSelectPage,
          }}
        />
      </section>

      <AddFreeResourceModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        categories={categories}
        onSubmit={handleSaveResource}
        onMockTestSaved={refreshMockTests}
        onStudyMaterialSaved={refreshStudyMaterials}
        onNcertBookSaved={refreshNcertBooks}
        onPreviousYearPaperSaved={refreshPreviousYearPapers}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.ids?.length > 1 ? 'Delete selected resources?' : 'Delete resource?'}
        message={deleteMessage}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        loading={deleteLoading}
      />
    </div>
  )
}
