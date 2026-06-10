/** Legacy Free Resources — preserved so /free-resources route is unchanged */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Layers, Trash2 } from 'lucide-react'

import { toast } from '@/utils/toast'

import PageBanner from '../../components/figma/PageBanner'

import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'

import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'

import AddFreeResourceModal from '../../components/content-library/AddFreeResourceModal'

import ConfirmFreeResourceStatusModal from '../../components/content-library/free-resources/ConfirmFreeResourceStatusModal'

import CategoryTableActions from '../../components/categories/CategoryTableActions'

import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'

import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'

import { useEditModal } from '../../hooks/useEditModal'

import { useFreeResourcesData } from '../../hooks/useFreeResourcesData'

import { useMockTestsData } from '../../hooks/useMockTestsData'

import {

  deleteMockTest,

  deleteNcertBook,

  deletePreviousYearPaper,

  deleteStudyMaterial,

  updateFreeResourceStatus,

} from '../../api/freeResourcesAPI'

import { freeResourceFormToRow } from '../../utils/academicsFormMappers'

import { upsertListItem } from '../../utils/academicsCrud'

import { FREE_RESOURCE_CATEGORY } from '../../utils/freeResourceFormConstants'

import {

  getFreeResourceApiErrorMessage,

  getMockTestApiErrorMessage,

  getNcertBookApiErrorMessage,

  getPreviousYearPaperApiErrorMessage,

  getStudyMaterialApiErrorMessage,

  isMockTestsCategory,

  isNcertBooksCategory,

  isPreviousYearPapersCategory,

  isStudyMaterialCategory,

} from '../../utils/freeResourceApiHelpers'

import {

  loadFreeResourceCategories,

  loadFreeResources,

  saveFreeResources,

} from '../../utils/freeResourcesStorage'

import { mapUiStatusToApi } from '../../utils/programHelpers'

import { cn } from '../../utils/cn'



const API_MANAGED_CATEGORIES = new Set([

  FREE_RESOURCE_CATEGORY.NCERT,

  FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,

  FREE_RESOURCE_CATEGORY.MOCK_TEST,

  FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,

])



function resolveDeleteApi(row) {

  const category = String(row?.resourceCategory || '').toUpperCase()

  if (category === 'NCERT_BOOKS' || row?.isApiNcertBook) {

    return { deleteFn: deleteNcertBook, message: getNcertBookApiErrorMessage }

  }

  if (category === 'PREVIOUS_YEAR_QUESTIONS' || row?.isApiPreviousYearPaper) {

    return { deleteFn: deletePreviousYearPaper, message: getPreviousYearPaperApiErrorMessage }

  }

  if (category === 'STUDY_MATERIAL' || row?.isApiStudyMaterial) {

    return { deleteFn: deleteStudyMaterial, message: getStudyMaterialApiErrorMessage }

  }

  if (category === 'FREE_MOCK_TEST' || row?.isApiMockTest) {

    return { deleteFn: deleteMockTest, message: getMockTestApiErrorMessage }

  }

  return null

}



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

  const [viewItem, setViewItem] = useState(null)

  const [statusTarget, setStatusTarget] = useState(null)

  const [statusLoading, setStatusLoading] = useState(false)



  const mockTestsEnabled =

    categoryFilter === 'all' || categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST



  const { items: apiItems, loading: listLoading, error: listError, refresh: refreshFreeResources } =

    useFreeResourcesData({

      enabled: categoryFilter !== FREE_RESOURCE_CATEGORY.MOCK_TEST,

      search,

      limit: 50,

    })



  const {

    items: mockTestItems,

    loading: mockTestsLoading,

    error: mockTestsError,

    refresh: refreshMockTests,

  } = useMockTestsData({

    enabled: mockTestsEnabled,

    search: categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST ? search : '',

    limit: 50,

  })



  const refreshAllFreeResources = useCallback(() => {

    refreshFreeResources()

    refreshMockTests()

  }, [refreshFreeResources, refreshMockTests])



  useEffect(() => {

    saveFreeResources(resources)

  }, [resources])



  useEffect(() => {

    if (listError) toast.error(listError)

  }, [listError])



  useEffect(() => {

    if (mockTestsError) toast.error(mockTestsError)

  }, [mockTestsError])



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



  const apiItemsById = useMemo(() => {

    const map = new Map()

    for (const row of [...apiItems, ...mockTestItems]) {

      map.set(row.id, row)

    }

    return map

  }, [apiItems, mockTestItems])



  const combinedResources = useMemo(() => {

    if (categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST) return mockTestItems

    if (categoryFilter === 'all') return [...localResources, ...apiItems, ...mockTestItems]

    if (API_MANAGED_CATEGORIES.has(categoryFilter)) {

      return apiItems.filter((row) => row.category === categoryFilter)

    }

    return localResources.filter((row) => row.category === categoryFilter)

  }, [categoryFilter, localResources, apiItems, mockTestItems])



  const filtered = useMemo(() => {

    const q = search.trim().toLowerCase()

    return combinedResources.filter((row) => {

      const matchSearch =

        !q ||

        row.name.toLowerCase().includes(q) ||

        String(row.category || '').toLowerCase().includes(q) ||

        String(row.resourceCategoryLabel || '').toLowerCase().includes(q)

      const matchCategory = categoryFilter === 'all' || row.category === categoryFilter

      const matchStatus = statusFilter === 'all' || row.status === statusFilter

      return matchSearch && matchCategory && matchStatus

    })

  }, [combinedResources, search, categoryFilter, statusFilter])



  const handleSaveResource = (form, { isEdit, id } = {}) => {

    if (

      isNcertBooksCategory(form.category) ||

      isPreviousYearPapersCategory(form.category) ||

      isStudyMaterialCategory(form.category) ||

      isMockTestsCategory(form.category)

    ) {

      refreshAllFreeResources()

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

      const localIds = []

      let refreshedApi = false



      await Promise.all(

        deleteTarget.ids.map(async (id) => {

          const row = apiItemsById.get(id)

          const api = row ? resolveDeleteApi(row) : null

          if (api) {

            await api.deleteFn(id)

            refreshedApi = true

            return

          }

          localIds.push(id)

        }),

      )



      if (localIds.length) {

        const idSet = new Set(localIds)

        setResources((prev) => prev.filter((r) => !idSet.has(r.id)))

        setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)))

      }



      if (refreshedApi) refreshAllFreeResources()



      toast.success(

        deleteTarget.ids.length > 1

          ? `${deleteTarget.ids.length} resources deleted`

          : 'Resource deleted',

      )

      setDeleteTarget(null)

    } catch (error) {

      const firstId = deleteTarget.ids[0]

      const row = apiItemsById.get(firstId)

      const api = row ? resolveDeleteApi(row) : null

      const message = api

        ? api.message(error, 'Failed to delete resource.')

        : getFreeResourceApiErrorMessage(error, 'Failed to delete resource.')

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



  const handleView = useCallback((row) => {

    setViewItem(row)

  }, [])



  const confirmStatusChange = useCallback(async () => {

    if (!statusTarget) return

    const enabling = statusTarget.status !== 'Active'

    const nextUi = enabling ? 'Active' : 'In Active'

    const nextApi = mapUiStatusToApi(nextUi)

    const isApiRow = apiItemsById.has(statusTarget.id)



    setStatusLoading(true)

    try {

      if (isApiRow) {

        await updateFreeResourceStatus(statusTarget.id, nextApi)

        await refreshAllFreeResources()

      } else {

        setResources((prev) =>

          prev.map((row) => (row.id === statusTarget.id ? { ...row, status: nextUi } : row)),

        )

      }

      toast.success(enabling ? 'Resource enabled' : 'Resource disabled')

      setStatusTarget(null)

    } catch (error) {

      toast.error(getFreeResourceApiErrorMessage(error, 'Failed to update status'))

    } finally {

      setStatusLoading(false)

    }

  }, [statusTarget, apiItemsById, refreshAllFreeResources])



  const columns = useMemo(
    () => [

    {

      key: 'name',

      label: 'Resource Name',

      headerClassName: 'pl-4 sm:pl-6',

      cellClassName: 'pl-4 sm:pl-6',

      render: (row) => <ResourceNameCell name={row.name} />,

    },

    {

      key: 'category',

      label: 'Resource Category',

      render: (row) => row.resourceCategoryLabel || row.category,

    },

    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },

    {

      key: 'actions',

      label: 'Actions',

      align: 'right',

      headerClassName: 'min-w-[11rem] text-right',

      cellClassName: 'min-w-[11rem] text-right',

      render: (row) => (

        <CategoryTableActions

          status={row.status}

          onView={() => handleView(row)}

          onEdit={() => modal.openEdit(row)}

          onDelete={() => setDeleteTarget({ ids: [row.id], name: row.name })}

          onToggleStatus={() => setStatusTarget(row)}

        />

      ),

    },

  ],
    [handleView, modal],
  )



  const deleteMessage =

    deleteTarget?.ids?.length > 1

      ? `Delete ${deleteTarget.ids.length} selected free resources? This cannot be undone.`

      : `Delete "${deleteTarget?.name || 'this resource'}"? This cannot be undone.`



  const emptyMessage =

    categoryFilter === FREE_RESOURCE_CATEGORY.MOCK_TEST && !mockTestsLoading

      ? 'No mock tests found.'

      : categoryFilter === FREE_RESOURCE_CATEGORY.NCERT && !listLoading

        ? 'No NCERT books found.'

        : categoryFilter === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR && !listLoading

          ? 'No previous year papers found.'

          : categoryFilter === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL && !listLoading

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

          loading={listLoading || (mockTestsEnabled && mockTestsLoading)}

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

        onMockTestSaved={refreshAllFreeResources}

        onStudyMaterialSaved={refreshAllFreeResources}

        onNcertBookSaved={refreshAllFreeResources}

        onPreviousYearPaperSaved={refreshAllFreeResources}

      />



      <AddFreeResourceModal

        open={Boolean(viewItem)}

        onClose={() => setViewItem(null)}

        item={viewItem}

        categories={categories}

        viewMode

      />



      <ConfirmFreeResourceStatusModal

        open={Boolean(statusTarget)}

        resourceName={statusTarget?.name || 'this resource'}

        enabling={statusTarget?.status !== 'Active'}

        loading={statusLoading}

        onCancel={() => !statusLoading && setStatusTarget(null)}

        onConfirm={confirmStatusChange}

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

