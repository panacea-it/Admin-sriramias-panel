import { useCallback, useEffect, useMemo, useState } from 'react'
import { Package } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import ProductsTable from '../../components/bookstore/ProductsTable'
import ProductRowActions from '../../components/bookstore/ProductRowActions'
import ProductFormModal from '../../components/bookstore/ProductFormModal'
import ProductPreviewModal from '../../components/bookstore/ProductPreviewModal'
import BookstoreConfirmDialog from '../../components/bookstore/modal/BookstoreConfirmDialog'
import { BannerButton } from '../../components/academics/AcademicsUi'
import {
  fetchBookstoreProducts,
  createBookstoreProduct,
  updateBookstoreProduct,
  deleteBookstoreProduct,
} from '../../api/bookstoreAPI'
import { toast } from '../../utils/toast'

const PRODUCT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export default function BookstoreProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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
    return products.filter((p) => {
      const matchQ =
        !q ||
        [p.name, p.examCategory, p.subject, p.id, p.authorName].some((v) =>
          String(v || '').toLowerCase().includes(q),
        )
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchQ && matchStatus
    })
  }, [products, search, statusFilter])

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

  const toggleStatus = useCallback(async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active'
    await updateBookstoreProduct(row.id, { status: next })
    toast.success('Status updated')
    load()
  }, [load])

  const renderRowActions = useCallback(
    (row) => (
      <ProductRowActions
        name={row.name}
        status={row.status}
        loading={saving}
        onView={() => setPreview(row)}
        onEdit={() => {
          setEditing(row)
          setModalOpen(true)
        }}
        onStatusToggle={() => toggleStatus(row)}
        onDelete={() => setDeleteTarget(row.id)}
      />
    ),
    [saving, toggleStatus],
  )

  return (
    <BookstorePageShell
      icon={Package}
      title="Products"
      actions={
        <BannerButton
          onClick={() => {
            setEditing(null)
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
          disabled={loading && products.length === 0}
        />

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <ProductsTable
            products={filtered}
            loading={loading}
            resetDeps={[search, statusFilter]}
            renderActions={renderRowActions}
          />
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        initial={editing}
        onSubmit={handleSave}
        loading={saving}
      />
      <ProductPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        product={preview}
      />
      <BookstoreConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete product"
        message="This product will be removed from the bookstore catalog. This action cannot be undone."
        confirmLabel="Delete"
      />
    </BookstorePageShell>
  )
}
