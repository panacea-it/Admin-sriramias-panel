import { useCallback, useEffect, useRef, useState } from 'react'
import { Warehouse, PackagePlus, SlidersHorizontal } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
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

export default function BookstoreInventoryPage() {
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [restockOpen, setRestockOpen] = useState(false)
  const [stockUpdateOpen, setStockUpdateOpen] = useState(false)
  const [restockId, setRestockId] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [stockProductId, setStockProductId] = useState('')
  const [newStock, setNewStock] = useState('')
  const [stockProductLocked, setStockProductLocked] = useState(false)
  const restockQtyRef = useRef(null)
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
    if (!restockOpen) return undefined
    const timer = window.setTimeout(() => restockQtyRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [restockOpen])

  useEffect(() => {
    if (!stockUpdateOpen) return undefined
    const timer = window.setTimeout(() => stockQtyRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [stockUpdateOpen, stockProductId, stockProductLocked])

  const openRestockModal = () => {
    setRestockId('')
    setRestockQty('')
    setRestockOpen(true)
  }

  const openSetStockModal = () => {
    setStockProductLocked(false)
    setStockProductId('')
    setNewStock('')
    setStockUpdateOpen(true)
  }

  const openAdjustModal = (product) => {
    setStockProductId(product.id)
    setNewStock(String(product.stockQuantity))
    setStockProductLocked(true)
    setStockUpdateOpen(true)
  }

  const closeStockModal = () => {
    setStockUpdateOpen(false)
    setStockProductLocked(false)
  }

  const handleRestock = async () => {
    if (!restockId || !restockQty) return
    await restockBookstoreProduct(restockId, Number(restockQty), { reason: 'Restock' })
    toast.success('Stock restocked')
    setRestockOpen(false)
    setRestockQty('')
    load()
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
    <BookstorePageShell
      icon={Warehouse}
      title="Inventory Management"
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <BannerButton showPlusIcon={false} onClick={openRestockModal}>
            <PackagePlus className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Restock
          </BannerButton>
          <BannerButton showPlusIcon={false} onClick={openSetStockModal}>
            <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Set Stock
          </BannerButton>
        </div>
      }
    >
      {loading ? <div className="h-48 animate-pulse rounded-xl bg-white" /> : (
        <>
          <PaginatedFigmaTable columns={productColumns} data={products} itemLabel="products" />
          <h3 className="mt-6 text-sm font-bold">Inventory logs</h3>
          <PaginatedFigmaTable columns={logColumns} data={logs} itemLabel="logs" />
        </>
      )}

      <BookstoreModal
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
        title="Restock product"
        subtitle="Add units to current inventory"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setRestockOpen(false)}>Cancel</Button>
            <Button onClick={handleRestock}>Apply restock</Button>
          </BookstoreModalFooter>
        }
      >
        <div className={BOOKSTORE_FORM_STACK_CLASS}>
          <InventoryFormField label="Product">
            <select
              className={BOOKSTORE_INPUT_CLASS}
              value={restockId}
              onChange={(e) => setRestockId(e.target.value)}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (current: {p.stockQuantity})
                </option>
              ))}
            </select>
          </InventoryFormField>
          <InventoryFormField label="Quantity">
            <PositiveIntegerInput
              ref={restockQtyRef}
              value={restockQty}
              onChange={setRestockQty}
              placeholder="Enter quantity"
            />
          </InventoryFormField>
        </div>
      </BookstoreModal>

      <BookstoreModal
        open={stockUpdateOpen}
        onClose={closeStockModal}
        title={stockProductLocked ? 'Adjust stock' : 'Set stock'}
        subtitle={stockProductLocked ? 'Update quantity for the selected product' : 'Set absolute stock count'}
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={closeStockModal}>Cancel</Button>
            <Button onClick={handleStockSet}>
              {stockProductLocked ? 'Update stock' : 'Set stock'}
            </Button>
          </BookstoreModalFooter>
        }
      >
        <div className={BOOKSTORE_FORM_STACK_CLASS}>
          <InventoryFormField label="Product">
            {stockProductLocked ? (
              <input
                type="text"
                className={cn(BOOKSTORE_INPUT_CLASS, BOOKSTORE_INPUT_DISABLED_CLASS)}
                value={lockedProductName}
                disabled
                readOnly
                tabIndex={-1}
                aria-readonly="true"
              />
            ) : (
              <select
                className={BOOKSTORE_INPUT_CLASS}
                value={stockProductId}
                onChange={(e) => {
                  setStockProductId(e.target.value)
                  const p = products.find((x) => x.id === e.target.value)
                  if (p) setNewStock(String(p.stockQuantity))
                }}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
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
