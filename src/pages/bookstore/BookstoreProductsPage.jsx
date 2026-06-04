import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Package, Trash2 } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreFilterToolbar from '../../components/bookstore/BookstoreFilterToolbar'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import ProductFormModal from '../../components/bookstore/ProductFormModal'
import ProductPreviewModal from '../../components/bookstore/ProductPreviewModal'
import BookstoreConfirmDialog from '../../components/bookstore/modal/BookstoreConfirmDialog'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EditButton from '../../components/common/EditButton'
import { BannerButton } from '../../components/academics/AcademicsUi'
import {
  fetchBookstoreProducts,
  createBookstoreProduct,
  updateBookstoreProduct,
  deleteBookstoreProduct,
} from '../../api/bookstoreAPI'
import { formatINR } from '../../utils/financeFilters'
import { toast } from '../../utils/toast'

export default function BookstoreProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name')
  const [selected, setSelected] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetchBookstoreProducts()
    setProducts(res?.items || res || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = products.filter((p) => {
      const matchQ = !q || [p.name, p.subject, p.id].some((v) => String(v).toLowerCase().includes(q))
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchQ && matchStatus
    })
    rows = [...rows].sort((a, b) => {
      if (sortKey === 'price') return b.discountPrice - a.discountPrice
      if (sortKey === 'stock') return b.stockQuantity - a.stockQuantity
      return String(a[sortKey]).localeCompare(String(b[sortKey]))
    })
    return rows
  }, [products, search, statusFilter, sortKey])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateBookstoreProduct(editing.id, form)
        toast.success(form.publishState === 'draft' ? 'Draft saved' : 'Product updated')
      } else {
        await createBookstoreProduct(form)
        toast.success(form.publishState === 'draft' ? 'Draft saved' : 'Product created')
      }
      setModalOpen(false)
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteBookstoreProduct(deleteTarget)
    toast.success('Product deleted')
    setDeleteTarget(null)
    load()
  }

  const confirmBulkDelete = async () => {
    await Promise.all(selected.map((id) => deleteBookstoreProduct(id)))
    setSelected([])
    setBulkDeleteOpen(false)
    toast.success('Products deleted')
    load()
  }

  const toggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active'
    await updateBookstoreProduct(row.id, { status: next })
    toast.success('Status updated')
    load()
  }

  const columns = [
    {
      key: 'select',
      label: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.includes(row.id)}
          onChange={(e) => {
            setSelected((prev) =>
              e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
            )
          }}
        />
      ),
    },
    { key: 'id', label: 'Product ID' },
    { key: 'name', label: 'Product Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'subject', label: 'Subject' },
    { key: 'discountPrice', label: 'Price', render: (r) => formatINR(r.discountPrice) },
    { key: 'stockQuantity', label: 'Stock' },
    { key: 'status', label: 'Status', render: (r) => <BookstoreStatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPreview(row)} className="text-[#7c5cbf]" aria-label="Preview product">
            <Eye className="h-4 w-4" />
          </button>
          <EditButton onClick={() => { setEditing(row); setModalOpen(true) }} />
          <button type="button" onClick={() => toggleStatus(row)} className="text-xs font-semibold text-[#7c5cbf]">Toggle</button>
          <button type="button" onClick={() => setDeleteTarget(row.id)} className="text-[#c96565]" aria-label="Delete product">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <BookstorePageShell
      icon={Package}
      title="Products"
      actions={<BannerButton onClick={() => { setEditing(null); setModalOpen(true) }}>Add Product</BannerButton>}
    >
      <BookstoreFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products…"
        filters={
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm">
              <option value="name">Sort: Name</option>
              <option value="price">Sort: Price</option>
              <option value="stock">Sort: Stock</option>
            </select>
          </>
        }
        actions={
          selected.length > 0 && (
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Bulk delete ({selected.length})
            </button>
          )
        }
      />
      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      ) : (
        <PaginatedFigmaTable columns={columns} data={filtered} itemLabel="products" />
      )}
      <ProductFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} initial={editing} onSubmit={handleSave} loading={saving} />
      <ProductPreviewModal open={Boolean(preview)} onClose={() => setPreview(null)} product={preview} />
      <BookstoreConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete product"
        message="This product will be removed from the bookstore catalog. This action cannot be undone."
        confirmLabel="Delete"
      />
      <BookstoreConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete selected products"
        message={`Remove ${selected.length} products from the catalog?`}
        confirmLabel="Delete all"
      />
    </BookstorePageShell>
  )
}
