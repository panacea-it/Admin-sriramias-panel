import { useCallback, useEffect, useState } from 'react'
import { Eye, Layers } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EditButton from '../../components/common/EditButton'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { fetchBookstoreCombos, saveBookstoreCombo, fetchBookstoreProducts } from '../../api/bookstoreAPI'
import { BOOKSTORE_COMBO_TYPES } from '../../data/bookstoreMockData'
import { formatINR } from '../../utils/financeFilters'
import { toast } from '../../utils/toast'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

const emptyForm = () => ({
  name: '',
  comboType: BOOKSTORE_COMBO_TYPES[0],
  productIds: [],
  comboPrice: '',
})

export default function BookstoreCombosPage() {
  const [combos, setCombos] = useState([])
  const [products, setProducts] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([fetchBookstoreCombos(), fetchBookstoreProducts()])
    setCombos(c?.items || [])
    setProducts(p?.items || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const originalTotal = form.productIds.reduce((sum, id) => {
    const p = products.find((x) => x.id === id)
    return sum + (p?.discountPrice || 0)
  }, 0)
  const comboPrice = Number(form.comboPrice) || 0
  const discountPercent = originalTotal ? Math.round((1 - comboPrice / originalTotal) * 100) : 0

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name,
      comboType: row.comboType,
      productIds: row.productIds || [],
      comboPrice: String(row.comboPrice),
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    await saveBookstoreCombo(
      { ...form, comboPrice, originalTotal, discountPercent, productIds: form.productIds },
      editingId,
    )
    toast.success(editingId ? 'Combo updated' : 'Combo created')
    setFormOpen(false)
    load()
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Combo' },
    { key: 'comboType', label: 'Type' },
    { key: 'comboPrice', label: 'Price', render: (r) => formatINR(r.comboPrice) },
    { key: 'discountPercent', label: 'Discount', render: (r) => `${r.discountPercent}%` },
    { key: 'status', label: 'Status', render: (r) => <BookstoreStatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreview(row)} aria-label="Preview combo"><Eye className="h-4 w-4 text-[#7c5cbf]" /></button>
          <EditButton onClick={() => openEdit(row)} />
        </div>
      ),
    },
  ]

  return (
    <BookstorePageShell icon={Layers} title="Combo Management" actions={<BannerButton onClick={openCreate}>Add Combo</BannerButton>}>
      <PaginatedFigmaTable columns={columns} data={combos} itemLabel="combos" />

      <BookstoreModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit Combo' : 'Create Combo'}
        subtitle="Bundle products with dynamic pricing"
        size="lg"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Save changes' : 'Create combo'}</Button>
          </BookstoreModalFooter>
        }
      >
        <div className="space-y-4">
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Combo name</span>
            <input className={BOOKSTORE_INPUT_CLASS} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Combo type</span>
            <select className={BOOKSTORE_INPUT_CLASS} value={form.comboType} onChange={(e) => setForm((f) => ({ ...f, comboType: e.target.value }))}>
              {BOOKSTORE_COMBO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Products (multi-select)</span>
            <select
              multiple
              className={`${BOOKSTORE_INPUT_CLASS} min-h-[120px]`}
              value={form.productIds}
              onChange={(e) => setForm((f) => ({ ...f, productIds: [...e.target.selectedOptions].map((o) => o.value) }))}
            >
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Combo price (₹)</span>
            <input type="number" className={BOOKSTORE_INPUT_CLASS} value={form.comboPrice} onChange={(e) => setForm((f) => ({ ...f, comboPrice: e.target.value }))} />
          </label>
          <p className="rounded-lg bg-[#f5f3fa] px-3 py-2 text-sm text-[#444]">
            Original total: <strong>{formatINR(originalTotal)}</strong> · Discount: <strong>{discountPercent}%</strong>
          </p>
        </div>
      </BookstoreModal>

      <BookstoreModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name}
        subtitle="Combo preview"
        size="md"
      >
        {preview && (
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs font-semibold text-[#686868]">Type</dt><dd>{preview.comboType}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">Price</dt><dd className="font-bold text-[#7c5cbf]">{formatINR(preview.comboPrice)}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">Products</dt><dd>{preview.productIds?.join(', ') || '—'}</dd></div>
          </dl>
        )}
      </BookstoreModal>
    </BookstorePageShell>
  )
}
