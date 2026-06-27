import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Warehouse } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import {
  useAdjustBookstoreStock,
  useBookstoreInventoryList,
  useBookstoreInventoryLogs,
} from '../../hooks/bookstore/useBookstoreInventory'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from '../../hooks/useMasterListQuery'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import PositiveIntegerInput from '../../components/bookstore/PositiveIntegerInput'
import {
  BOOKSTORE_FORM_STACK_CLASS,
  BOOKSTORE_INPUT_CLASS,
  BOOKSTORE_INPUT_DISABLED_CLASS,
  BOOKSTORE_LABEL_CLASS,
} from '../../components/bookstore/modal/bookstoreFormStyles'
import { cn } from '../../utils/cn'

const DEFAULT_PAGE_SIZE = 10

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: 'INCREASE', label: 'Restock' },
  { value: 'DECREASE', label: 'Manual Adjustment' },
]

const TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

function InventoryFormField({ label, children }) {
  return (
    <div className="flex flex-col">
      <span className={BOOKSTORE_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  )
}

function renderInventoryStatus(row) {
  if (row.statusLabel === 'Out of stock' || row.alert === 'OUT_OF_STOCK') {
    return <BookstoreStatusBadge status="Out of stock" />
  }
  if (row.statusLabel === 'Low stock' || row.alert === 'LOW_STOCK') {
    return <BookstoreStatusBadge status="Low stock" />
  }
  return <span className="text-xs font-semibold text-[#686868]">OK</span>
}

export default function BookstoreInventoryPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [logsPage, setLogsPage] = useState(1)
  const [logsPageSize, setLogsPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [logsSearch, setLogsSearch] = useState('')
  const [stockUpdateOpen, setStockUpdateOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustmentType, setAdjustmentType] = useState('INCREASE')
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const stockQtyRef = useRef(null)

  const adjustStockMutation = useAdjustBookstoreStock()

  const debouncedSearch = useDebouncedValue(search, 300)
  const debouncedLogsSearch = useDebouncedValue(logsSearch, 300)
  const filterSignature = buildFilterSignature([debouncedSearch, pageSize])
  const logsFilterSignature = buildFilterSignature([debouncedLogsSearch, logsPageSize])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)
  const effectiveLogsPage = useEffectivePage(logsPage, setLogsPage, logsFilterSignature)

  const listParams = useMemo(
    () => ({
      page: effectivePage,
      limit: pageSize,
      search: debouncedSearch.trim(),
    }),
    [effectivePage, pageSize, debouncedSearch],
  )

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useBookstoreInventoryList(listParams)

  const logsParams = useMemo(
    () => ({
      page: effectiveLogsPage,
      limit: logsPageSize,
      productId: debouncedLogsSearch.trim(),
    }),
    [effectiveLogsPage, logsPageSize, debouncedLogsSearch],
  )

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    isError: isLogsError,
    error: logsError,
  } = useBookstoreInventoryLogs(logsParams)

  const inventoryItems = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const logItems = logsData?.items ?? []
  const logsTotalItems = logsData?.total ?? 0
  const logsTotalPages = logsData?.totalPages ?? 0

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

  const logsPagination = useMemo(() => {
    const safePage =
      logsTotalPages > 0
        ? Math.min(Math.max(1, logsPage), logsTotalPages)
        : Math.max(1, logsPage)
    const startIndex = logsTotalItems === 0 ? 0 : (safePage - 1) * logsPageSize
    const endIndex = Math.min(startIndex + logsPageSize, logsTotalItems)

    return {
      page: safePage,
      pageSize: logsPageSize,
      totalItems: logsTotalItems,
      totalPages: logsTotalPages,
      startIndex,
      endIndex,
      hasNextPage:
        logsData?.hasNextPage ?? (logsTotalPages > 0 && safePage < logsTotalPages),
      hasPrevPage: logsData?.hasPrevPage ?? safePage > 1,
    }
  }, [
    logsPage,
    logsPageSize,
    logsTotalItems,
    logsTotalPages,
    logsData?.hasNextPage,
    logsData?.hasPrevPage,
  ])

  const controlledLogsPagination = useMemo(
    () => ({
      page: logsPagination.page,
      pageSize: logsPagination.pageSize,
      totalItems: logsPagination.totalItems,
      totalPages: logsPagination.totalPages,
      startIndex: logsPagination.startIndex,
      endIndex: logsPagination.endIndex,
      hasNextPage: logsPagination.hasNextPage,
      hasPrevPage: logsPagination.hasPrevPage,
      onPageChange: setLogsPage,
      onPageSizeChange: (nextSize) => {
        setLogsPageSize(nextSize)
        setLogsPage(1)
      },
    }),
    [logsPagination],
  )

  useEffect(() => {
    if (!stockUpdateOpen) return undefined
    const timer = window.setTimeout(() => stockQtyRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [stockUpdateOpen, adjustTarget?.id])

  const openAdjustModal = useCallback((product) => {
    setAdjustTarget(product)
    setAdjustmentType('INCREASE')
    setAdjustQuantity('')
    setAdjustReason('')
    setStockUpdateOpen(true)
  }, [])

  const closeStockModal = () => {
    if (adjustStockMutation.isPending) return
    setStockUpdateOpen(false)
    setAdjustTarget(null)
  }

  const handleStockSet = async () => {
    if (!adjustTarget?.id) return

    const quantity = Number(adjustQuantity)
    const reason = adjustReason.trim()

    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error('Quantity must be a whole number greater than 0.')
      return
    }

    if (reason.length < 3) {
      toast.error('Reason must be at least 3 characters.')
      return
    }

    if (
      adjustmentType === 'DECREASE' &&
      Number.isFinite(adjustTarget.stockQuantity) &&
      quantity > adjustTarget.stockQuantity
    ) {
      toast.error('Quantity cannot exceed current stock.')
      return
    }

    try {
      const result = await adjustStockMutation.mutateAsync({
        productId: adjustTarget.id,
        action: adjustmentType,
        quantity,
        reason,
      })

      toast.success(result?.message || 'Stock updated successfully')
      setStockUpdateOpen(false)
      setAdjustTarget(null)
    } catch (stockError) {
      toast.error(getApiErrorMessage(stockError, 'Unable to update stock. Please try again.'))
    }
  }

  const stockSaving = adjustStockMutation.isPending
  const isManualAdjustment = adjustmentType === 'DECREASE'
  const lockedProductName = adjustTarget?.productName ?? adjustTarget?.name ?? ''
  const currentStock = adjustTarget?.stockQuantity ?? '—'
  const quantityPlaceholder = isManualAdjustment
    ? 'Enter quantity to decrease'
    : 'Enter quantity to add'
  const reasonPlaceholder = isManualAdjustment
    ? 'e.g. Damaged books, Lost books, Expired books'
    : 'e.g. Restock, New shipment received'

  const productColumns = useMemo(
    () => [
      {
        key: 'productId',
        label: 'Product ID',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.productId || '—'}</span>
        ),
      },
      {
        key: 'productName',
        label: 'Product Name',
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
        render: (row) => (
          <div className="truncate font-semibold text-slate-900" title={row.productName}>
            {row.productName || '—'}
          </div>
        ),
      },
      {
        key: 'stockQuantity',
        label: 'Current Stock',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span
            className={cn(
              'font-semibold tabular-nums',
              row.stockQuantity === 0
                ? 'text-red-600'
                : row.stockQuantity <= 20
                  ? 'text-amber-700'
                  : 'text-[#111]',
            )}
          >
            {row.stockQuantity?.toLocaleString() ?? '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle',
        render: (row) => renderInventoryStatus(row),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle text-right',
        render: (row) => (
          <button
            type="button"
            className="text-sm font-semibold text-[#7c5cbf]"
            onClick={() => openAdjustModal(row)}
          >
            Adjust
          </button>
        ),
      },
    ],
    [openAdjustModal],
  )

  const logColumns = useMemo(
    () => [
      {
        key: 'productId',
        label: 'Product ID',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.productId || '—'}</span>
        ),
      },
      {
        key: 'productName',
        label: 'Product Name',
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
        render: (row) => (
          <div className="truncate font-semibold text-slate-900" title={row.productName}>
            {row.productName || '—'}
          </div>
        ),
      },
      {
        key: 'stockChange',
        label: 'Stock Change',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span
            className={cn(
              'font-semibold tabular-nums',
              row.stockChange > 0
                ? 'text-emerald-700'
                : row.stockChange < 0
                  ? 'text-red-600'
                  : 'text-[#111]',
            )}
          >
            {row.stockChange ?? '—'}
          </span>
        ),
      },
      {
        key: 'stockAfter',
        label: 'Stock After',
        align: 'center',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">
            {row.stockAfter?.toLocaleString?.() ?? row.stockAfter ?? '—'}
          </span>
        ),
      },
      {
        key: 'reason',
        label: 'Reason',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="truncate text-sm font-medium text-[#444]" title={row.reason}>
            {row.reason || '—'}
          </span>
        ),
      },
      {
        key: 'actionType',
        label: 'Action Type',
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-[#333]">
            {row.actionType || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created Date & Time',
        headerClassName: 'min-w-[170px] whitespace-nowrap',
        cellClassName: 'min-w-[170px] whitespace-nowrap align-middle',
        render: (row) => formatCategoryDateTime(row.createdAt),
      },
    ],
    [],
  )

  const isListBusy = isLoading || isFetching
  const isLogsBusy = isLogsLoading || isLogsFetching
  const listErrorMessage = isError
    ? getApiErrorMessage(error, 'Unable to fetch inventory records. Please try again.')
    : ''
  const logsErrorMessage = isLogsError
    ? getApiErrorMessage(logsError, 'Unable to fetch inventory logs. Please try again.')
    : ''

  return (
    <BookstorePageShell icon={Warehouse} title="Inventory Management">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search by product ID or product name…"
          showStatusFilter={false}
          disabled={isListBusy}
        />

        {listErrorMessage ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {listErrorMessage}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <PaginatedFigmaTable
            columns={productColumns}
            data={inventoryItems}
            itemLabel="records"
            emptyMessage="No inventory records found."
            loading={isListBusy}
            skeletonRowCount={8}
            resetDeps={[debouncedSearch]}
            controlledPagination={controlledPagination}
            density="comfortable"
            rowClassName="hover:bg-[#eef6fc]/70"
            tableClassName="rounded-none border-0 shadow-none"
            tableMinWidth={760}
            paginationClassName={TABLE_PAGINATION_CLASS}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <h3 className="mb-4 text-sm font-bold text-[#111]">Inventory logs</h3>

        <CourseFilterToolbar
          search={logsSearch}
          onSearchChange={(e) => setLogsSearch(e.target.value)}
          searchPlaceholder="Filter logs by product ID…"
          showStatusFilter={false}
          disabled={isLogsBusy}
        />

        {logsErrorMessage ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {logsErrorMessage}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <PaginatedFigmaTable
            columns={logColumns}
            data={logItems}
            itemLabel="logs"
            emptyMessage="No inventory logs found."
            loading={isLogsBusy}
            skeletonRowCount={6}
            resetDeps={[debouncedLogsSearch]}
            controlledPagination={controlledLogsPagination}
            density="comfortable"
            rowClassName="hover:bg-[#eef6fc]/70"
            tableClassName="rounded-none border-0 shadow-none"
            tableMinWidth={980}
            paginationClassName={TABLE_PAGINATION_CLASS}
          />
        </div>
      </div>

      <BookstoreModal
        open={stockUpdateOpen}
        onClose={closeStockModal}
        title="Adjust stock"
        subtitle="Update stock for the selected product"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={closeStockModal} disabled={stockSaving}>
              Cancel
            </Button>
            <Button onClick={handleStockSet} disabled={stockSaving}>
              {stockSaving ? 'Updating…' : 'Update stock'}
            </Button>
          </BookstoreModalFooter>
        }
      >
        <div className={BOOKSTORE_FORM_STACK_CLASS}>
          <InventoryFormField label="Product">
            <input
              type="text"
              className={cn(BOOKSTORE_INPUT_CLASS, BOOKSTORE_INPUT_DISABLED_CLASS)}
              value={lockedProductName}
              disabled
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
          </InventoryFormField>
          <InventoryFormField label="Current Stock">
            <input
              type="text"
              className={cn(BOOKSTORE_INPUT_CLASS, BOOKSTORE_INPUT_DISABLED_CLASS)}
              value={currentStock}
              disabled
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
          </InventoryFormField>
          <InventoryFormField label="Adjustment Type">
            <select
              className={BOOKSTORE_INPUT_CLASS}
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              disabled={stockSaving}
            >
              {ADJUSTMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </InventoryFormField>
          <InventoryFormField label="Quantity">
            <PositiveIntegerInput
              ref={stockQtyRef}
              value={adjustQuantity}
              onChange={setAdjustQuantity}
              placeholder={quantityPlaceholder}
              disabled={stockSaving}
            />
          </InventoryFormField>
          <InventoryFormField label="Reason">
            <textarea
              className={cn(BOOKSTORE_INPUT_CLASS, 'min-h-[88px] resize-y')}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder={reasonPlaceholder}
              maxLength={300}
              disabled={stockSaving}
            />
          </InventoryFormField>
        </div>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
