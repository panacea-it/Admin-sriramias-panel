import { useCallback, useEffect, useState } from 'react'
import { Warehouse, PackagePlus, SlidersHorizontal } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchBookstoreInventory, restockBookstoreProduct } from '../../api/bookstoreAPI'
import { toast } from '../../utils/toast'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

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

  const handleRestock = async () => {
    if (!restockId || !restockQty) return
    await restockBookstoreProduct(restockId, Number(restockQty))
    toast.success('Stock restocked')
    setRestockOpen(false)
    setRestockQty('')
    load()
  }

  const handleStockSet = async () => {
    const product = products.find((p) => p.id === stockProductId)
    if (!product || newStock === '') return
    const delta = Number(newStock) - product.stockQuantity
    if (delta !== 0) await restockBookstoreProduct(stockProductId, delta)
    toast.success('Stock level updated')
    setStockUpdateOpen(false)
    load()
  }

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
          onClick={() => {
            setStockProductId(r.id)
            setNewStock(String(r.stockQuantity))
            setStockUpdateOpen(true)
          }}
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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setRestockOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <PackagePlus className="h-3.5 w-3.5" /> Restock
          </button>
          <button type="button" onClick={() => setStockUpdateOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Set stock
          </button>
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
        <div className="space-y-4">
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Product</span>
            <select className={BOOKSTORE_INPUT_CLASS} value={restockId} onChange={(e) => setRestockId(e.target.value)}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (current: {p.stockQuantity})</option>
              ))}
            </select>
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Quantity to add</span>
            <input type="number" min="1" className={BOOKSTORE_INPUT_CLASS} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
          </label>
        </div>
      </BookstoreModal>

      <BookstoreModal
        open={stockUpdateOpen}
        onClose={() => setStockUpdateOpen(false)}
        title="Update stock level"
        subtitle="Set absolute stock count"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setStockUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleStockSet}>Update stock</Button>
          </BookstoreModalFooter>
        }
      >
        <div className="space-y-4">
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Product</span>
            <select className={BOOKSTORE_INPUT_CLASS} value={stockProductId} onChange={(e) => {
              setStockProductId(e.target.value)
              const p = products.find((x) => x.id === e.target.value)
              if (p) setNewStock(String(p.stockQuantity))
            }}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>New stock quantity</span>
            <input type="number" min="0" className={BOOKSTORE_INPUT_CLASS} value={newStock} onChange={(e) => setNewStock(e.target.value)} />
          </label>
        </div>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
