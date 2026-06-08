/** Legacy Free Resources — preserved so /free-resources route is unchanged */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, Trash2 } from 'lucide-react'
import EditButton from '../../components/common/EditButton'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddFreeResourceModal from '../../components/content-library/AddFreeResourceModal'
import ModifyFreeResourceCategoryModal from '../../components/content-library/ModifyFreeResourceCategoryModal'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'
import { useEditModal } from '../../hooks/useEditModal'
import { freeResourceFormToRow } from '../../utils/academicsFormMappers'
import { upsertListItem } from '../../utils/academicsCrud'
import {
  loadFreeResourceCategories,
  loadFreeResources,
  saveFreeResourceCategories,
  saveFreeResources,
} from '../../utils/freeResourcesStorage'
import { cn } from '../../utils/cn'

export default function FreeResourcesPage() {
  const [resources, setResources] = useState(() => loadFreeResources())
  const [categories, setCategories] = useState(() => loadFreeResourceCategories())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const modal = useEditModal()
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    saveFreeResources(resources)
  }, [resources])

  useEffect(() => {
    saveFreeResourceCategories(categories)
  }, [categories])

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...categories.map((c) => ({ value: c.name, label: c.name })),
    ],
    [categories],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return resources.filter((row) => {
      const matchSearch =
        !q || row.name.toLowerCase().includes(q) || row.category.toLowerCase().includes(q)
      const matchCategory = categoryFilter === 'all' || row.category === categoryFilter
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [resources, search, categoryFilter, statusFilter])

  const handleSaveResource = (form, { isEdit, id }) => {
    const existing = isEdit ? resources.find((r) => r.id === id) : null
    const row = freeResourceFormToRow(form, existing)
    setResources((prev) => upsertListItem(prev, row, { isEdit, id }))
  }

  const handleAddCategory = ({ name }) => {
    setCategories((prev) => [...prev, { id: Date.now(), name, status: 'Active' }])
  }

  const handleUpdateCategory = ({ id, name, status }) => {
    const prevCat = categories.find((c) => c.id === id)
    if (!prevCat) return
    const trimmed = String(name || '').trim()
    if (!trimmed) {
      toast.error('Category name is required')
      return
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed, status: status || c.status } : c)),
    )
    if (prevCat.name !== trimmed) {
      setResources((prev) =>
        prev.map((r) => (r.category === prevCat.name ? { ...r, category: trimmed } : r)),
      )
    }
    toast.success('Category updated')
  }

  const handleDeleteCategory = (id) => {
    const cat = categories.find((c) => c.id === id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    if (cat) {
      setResources((prev) =>
        prev.map((r) => (r.category === cat.name ? { ...r, category: 'Uncategorized' } : r)),
      )
    }
  }

  const performDelete = useCallback((ids) => {
    const idSet = new Set(ids)
    setResources((prev) => prev.filter((r) => !idSet.has(r.id)))
    setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)))
    toast.success(ids.length > 1 ? `${ids.length} resources deleted` : 'Resource deleted')
  }, [])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 0))
      performDelete(deleteTarget.ids)
      setDeleteTarget(null)
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

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5">
        <PageBanner icon={Layers} iconClassName="text-[#dc2626]" title="Free Resources" className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]">
          <BannerButton onClick={modal.openCreate}>Add Free Resource</BannerButton>
          <BannerButton onClick={() => setCategoryOpen(true)}>Modify Category</BannerButton>
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
          emptyMessage="No free resources match your filters."
          itemLabel="resources"
          resetDeps={[search, categoryFilter, statusFilter]}
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
      />
      <ModifyFreeResourceCategoryModal
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
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
