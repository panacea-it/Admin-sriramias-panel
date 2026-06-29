import { useCallback, useMemo, useState } from 'react'
import { Package } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import ProductsTable from '../../components/bookstore/ProductsTable'
import ProductRowActions from '../../components/bookstore/ProductRowActions'
import ProductFormModal from '../../components/bookstore/ProductFormModal'
import ProductPreviewModal from '../../components/bookstore/ProductPreviewModal'
import CategoryEmptyState from '../../components/categories/CategoryEmptyState'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from '../../hooks/useMasterListQuery'
import {
  useBookstoreProduct,
  useBookstoreProductsList,
  useChangeBookstoreProductStatus,
  useCreateBookstoreProduct,
  useUpdateBookstoreProduct,
} from '../../hooks/bookstore/useBookstoreProducts'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'

const PRODUCT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
]

const DEFAULT_PAGE_SIZE = 10

export default function BookstoreProductsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [previewProductId, setPreviewProductId] = useState(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const filterSignature = buildFilterSignature([debouncedSearch, statusFilter, pageSize])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () => ({
      page: effectivePage,
      limit: pageSize,
      search: debouncedSearch.trim(),
      status: statusFilter,
    }),
    [effectivePage, pageSize, debouncedSearch, statusFilter],
  )

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useBookstoreProductsList(listParams)

  const products = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

  const pagination = useMemo(() => {
    const safePage =
      totalPages > 0 ? Math.min(Math.max(1, page), totalPages) : Math.max(1, page)
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: data?.hasNextPage ?? (totalPages > 0 && safePage < totalPages),
      hasPrevPage: data?.hasPrevPage ?? safePage > 1,
    }
  }, [page, pageSize, totalItems, totalPages, data?.hasNextPage, data?.hasPrevPage])

  const controlledPagination = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage,
      onPageChange: setPage,
      onPageSizeChange: (nextSize) => {
        setPageSize(nextSize)
        setPage(1)
      },
    }),
    [pagination],
  )

  const createMutation = useCreateBookstoreProduct()
  const updateMutation = useUpdateBookstoreProduct()
  const statusMutation = useChangeBookstoreProductStatus()

  const formSaving = createMutation.isPending || updateMutation.isPending
  const rowActionLoading = formSaving
  const statusUpdatingMongoId = statusMutation.isPending
    ? statusMutation.variables?.mongoId
    : null

  const editingProductId = editingRow?.id
  const shouldFetchDetail = Boolean(editingProductId) && modalOpen
  const { data: editingDetail, isFetching: isDetailFetching } = useBookstoreProduct(
    editingProductId,
    { enabled: shouldFetchDetail },
  )

  const editingProduct = editingDetail || editingRow

  const handleSave = async ({ values, cover, samples, keywords, isDraft }) => {
    const isUpdate = Boolean(editingRow?.mongoId)

    try {
      if (isUpdate) {
        const result = await updateMutation.mutateAsync({
          mongoId: editingRow.mongoId,
          productId: editingRow.id,
          values,
          cover,
          samples,
          keywords,
          isDraft,
        })

        if (result?.success === true && result?.statusCode === 10000) {
          toast.success(result.message || 'Product updated successfully')
          setModalOpen(false)
          setEditingRow(null)
          return
        }

        toast.error(result?.message || 'Unable to update product. Please try again.')
        return
      }

      const result = await createMutation.mutateAsync({
        values,
        cover,
        samples,
        keywords,
        isDraft,
      })

      if (result?.success === true && result?.statusCode === 10000) {
        toast.success(result.message || 'Product created successfully')
        setModalOpen(false)
        setEditingRow(null)
        return
      }

      toast.error(result?.message || 'Unable to create product. Please try again.')
    } catch (saveError) {
      toast.error(
        getApiErrorMessage(
          saveError,
          isUpdate
            ? 'Unable to update product. Please try again.'
            : 'Unable to create product. Please try again.',
        ),
      )
    }
  }

  const toggleStatus = useCallback(
    async (row) => {
      if (!row?.mongoId || statusMutation.isPending) return
      const isCurrentlyActive =
        row.status === 'active' || String(row.apiStatus || '').toUpperCase() === 'ACTIVE'
      const next = isCurrentlyActive ? 'inactive' : 'active'

      try {
        const result = await statusMutation.mutateAsync({
          mongoId: row.mongoId,
          productId: row.id,
          status: next,
        })

        if (result?.success === true && result?.statusCode === 10000) {
          toast.success(result.message || 'Product status updated successfully')
          return
        }

        toast.error(result?.message || 'Unable to update product status. Please try again.')
      } catch (statusError) {
        toast.error(
          getApiErrorMessage(statusError, 'Unable to update product status. Please try again.'),
        )
      }
    },
    [statusMutation],
  )

  const renderRowActions = useCallback(
    (row) => (
      <ProductRowActions
        name={row.name}
        status={row.status}
        apiStatus={row.apiStatus}
        loading={rowActionLoading}
        statusToggleLoading={statusUpdatingMongoId === row.mongoId}
        onView={() => setPreviewProductId(row.id)}
        onEdit={() => {
          setEditingRow(row)
          setModalOpen(true)
        }}
        onStatusToggle={() => toggleStatus(row)}
      />
    ),
    [rowActionLoading, statusUpdatingMongoId, toggleStatus],
  )

  const isListBusy = isLoading || isFetching
  const listErrorMessage = isError
    ? getApiErrorMessage(error, 'Unable to fetch products. Please try again.')
    : ''
  const showListEmptyState =
    !isListBusy && !isError && (products.length === 0 || totalItems === 0)
  const showListTable = !showListEmptyState

  return (
    <BookstorePageShell
      icon={Package}
      title="Products"
      actions={
        <BannerButton
          onClick={() => {
            setEditingRow(null)
            setModalOpen(true)
          }}
        >
          Add Product
        </BannerButton>
      }
    >
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search products by name, ID, category, or author…"
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={PRODUCT_STATUS_OPTIONS}
          disabled={isListBusy}
        />

        {listErrorMessage ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {listErrorMessage}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          {showListEmptyState ? (
            <CategoryEmptyState
              title="No Products Available"
              description="Create your first bookstore product or adjust your search filters."
              ctaLabel="Add Product"
              onCta={() => {
                setEditingRow(null)
                setModalOpen(true)
              }}
            />
          ) : null}

          {showListTable ? (
            <ProductsTable
              products={products}
              loading={isListBusy}
              resetDeps={[debouncedSearch, statusFilter]}
              renderActions={renderRowActions}
              controlledPagination={controlledPagination}
            />
          ) : null}
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingRow(null)
        }}
        initial={editingProduct}
        onSubmit={handleSave}
        loading={formSaving || isDetailFetching}
      />
      <ProductPreviewModal
        open={Boolean(previewProductId)}
        onClose={() => setPreviewProductId(null)}
        productId={previewProductId}
      />
    </BookstorePageShell>
  )
}
