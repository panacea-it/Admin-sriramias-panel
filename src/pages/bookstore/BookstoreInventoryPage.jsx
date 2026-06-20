import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Warehouse } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import { fetchBookstoreInventory, restockBookstoreProduct } from '../../api/bookstoreAPI'
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

function InventoryFormField({ label, children }) {
  return (
    <div className="flex flex-col">
      <span className={BOOKSTORE_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  )
}

function matchesInventorySearch(row, query, productNameById) {
  if (!query) return true
  const haystack = [
    row.id,
    row.name,
    row.productId,
    productNameById.get(row.productId),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

export default function BookstoreInventoryPage() {
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stockUpdateOpen, setStockUpdateOpen] = useState(false)
  const [stockProductId, setStockProductId] = useState('')
  const [newStock, setNewStock] = useState('')
  const stockQtyRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchBookstoreInventory()
    setProducts(data?.products || [])
    setLogs(data?.logs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!stockUpdateOpen) return undefined
    const timer = window.setTimeout(() => stockQtyRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [stockUpdateOpen, stockProductId])

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => matchesInventorySearch(product, query, productNameById))
  }, [products, search, productNameById])

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return logs
    return logs.filter((log) => matchesInventorySearch(log, query, productNameById))
  }, [logs, search, productNameById])

  const openAdjustModal = (product) => {
    setStockProductId(product.id)
    setNewStock(String(product.stockQuantity))
    setStockUpdateOpen(true)
  }

  const closeStockModal = () => {
    setStockUpdateOpen(false)
  }

  const handleStockSet = async () => {
    const product = products.find((p) => p.id === stockProductId)
    if (!product || newStock === '') return
    const delta = Number(newStock) - product.stockQuantity
    if (delta !== 0) {
      await restockBookstoreProduct(stockProductId, delta, { reason: 'Stock Adjustment' })
    }
    toast.success('Stock level updated')
    closeStockModal()
    load()
  }

  const lockedProductName = products.find((p) => p.id === stockProductId)?.name ?? ''

  const productColumns = [
    { key: 'id', label: 'SKU' },
    { key: 'name', label: 'Product' },
    {
      key: 'stockQuantity',
      label: 'Stock',
      render: (r) => (
        <span className={r.stockQuantity === 0 ? 'font-bold text-red-600' : r.stockQuantity <= 20 ? 'font-semibold text-amber-600' : ''}>
          {r.stockQuantity}
        </span>
      ),
    },
    {
      key: 'alert',
      label: 'Alert',
      render: (r) => {
        if (r.stockQuantity === 0) return <BookstoreStatusBadge status="Out of stock" />
        if (r.stockQuantity <= 20) return <BookstoreStatusBadge status="Low stock" />
        return <span className="text-xs text-[#686868]">OK</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          type="button"
          className="text-sm font-semibold text-[#7c5cbf]"
          onClick={() => openAdjustModal(r)}
        >
          Adjust
        </button>
      ),
    },
  ]

  const logColumns = [
    { key: 'productId', label: 'Product' },
    { key: 'change', label: 'Change', render: (r) => (r.change > 0 ? `+${r.change}` : r.change) },
    { key: 'reason', label: 'Reason' },
    { key: 'stockAfter', label: 'Stock after' },
    { key: 'createdAt', label: 'When', render: (r) => formatCategoryDateTime(r.createdAt) },
  ]

  return (
    <BookstorePageShell icon={Warehouse} title="Inventory Management">
      {loading ? <div className="h-48 animate-pulse rounded-xl bg-white" /> : (
        <>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
            <CourseFilterToolbar
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              searchPlaceholder="Search by SKU, product name, or log entry…"
              showStatusFilter={false}
              disabled={loading && products.length === 0}
            />

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
              <PaginatedFigmaTable
                columns={productColumns}
                data={filteredProducts}
                itemLabel="products"
                resetDeps={[search]}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
            <h3 className="mb-4 text-sm font-bold text-[#111]">Inventory logs</h3>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <PaginatedFigmaTable
                columns={logColumns}
                data={filteredLogs}
                itemLabel="logs"
                resetDeps={[search]}
              />
            </div>
          </div>
        </>
      )}

      <BookstoreModal
        open={stockUpdateOpen}
        onClose={closeStockModal}
        title="Adjust stock"
        subtitle="Update quantity for the selected product"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={closeStockModal}>Cancel</Button>
            <Button onClick={handleStockSet}>Update stock</Button>
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
          <InventoryFormField label="Quantity">
            <PositiveIntegerInput
              ref={stockQtyRef}
              value={newStock}
              onChange={setNewStock}
              placeholder="Enter quantity"
            />
          </InventoryFormField>
        </div>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
