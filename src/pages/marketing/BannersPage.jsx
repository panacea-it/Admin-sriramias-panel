import { useCallback, useMemo, useState } from 'react'
import { Image, RefreshCw } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import BannerFilterToolbar from '../../components/banners/BannerFilterToolbar'
import BannerEditModal from '../../components/banners/BannerEditModal'
import BannerImagePreviewModal from '../../components/banners/BannerImagePreviewModal'
import { buildBannerTableColumns } from '../../components/banners/bannerTableColumns'
import { BANNER_CATEGORIES, BANNER_CENTERS } from '../../data/bannersData'
import { useBanners } from '../../hooks/useBanners'
import { cn } from '../../utils/cn'

export default function BannersPage() {
  const {
    banners,
    loading,
    loadError,
    statusUpdatingIds,
    editBanner,
    previewBanner,
    deleteTarget,
    deleting,
    saving,
    load,
    handleSave,
    handleToggleStatus,
    handleDelete,
    openEdit,
    closeEdit,
    openPreview,
    closePreview,
    requestDelete,
    cancelDelete,
  } = useBanners()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...BANNER_CATEGORIES.map((name) => ({ value: name, label: name })),
    ],
    [],
  )

  const centerOptions = useMemo(
    () => [
      { value: 'all', label: 'Center' },
      ...BANNER_CENTERS.map((name) => ({ value: name, label: name })),
    ],
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return banners.filter((row) => {
      const matchSearch = !q || row.course.toLowerCase().includes(q)
      const matchCategory = categoryFilter === 'all' || row.category === categoryFilter
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchCategory && matchCenter && matchStatus
    })
  }, [banners, search, categoryFilter, centerFilter, statusFilter])

  const onEdit = useCallback((row) => openEdit(row), [openEdit])
  const onDelete = useCallback((row) => requestDelete(row), [requestDelete])
  const onPreview = useCallback((row) => openPreview(row), [openPreview])

  const columns = useMemo(
    () =>
      buildBannerTableColumns({
        onEdit,
        onDelete,
        onPreview,
        onToggleStatus: handleToggleStatus,
        statusUpdatingIds,
      }),
    [onEdit, onDelete, onPreview, handleToggleStatus, statusUpdatingIds],
  )

  const emptyMessage =
    loadError && banners.length === 0
      ? 'Unable to load banners. Try refreshing.'
      : 'No banners match your filters.'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Image}
          iconClassName="text-[#246392]"
          title="Banner"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        />

        <BannerFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          categoryOptions={categoryOptions}
          centerOptions={centerOptions}
        />

        {loadError && banners.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 font-semibold text-[#246392] hover:underline"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : null}

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          rowClassName="hover:bg-slate-50/90"
          itemLabel="banners"
          resetDeps={[search, categoryFilter, centerFilter, statusFilter]}
          loading={loading}
          stickyLastColumn
          tableClassName={cn(loading && 'opacity-60 pointer-events-none')}
        />
      </section>

      <BannerEditModal
        open={Boolean(editBanner)}
        onClose={closeEdit}
        banner={editBanner}
        onSave={handleSave}
        saving={saving}
      />

      <BannerImagePreviewModal
        open={Boolean(previewBanner)}
        onClose={closePreview}
        banner={previewBanner}
      />

      
    </div>
  )
}
