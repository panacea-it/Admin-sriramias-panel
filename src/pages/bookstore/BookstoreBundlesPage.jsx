import { useCallback, useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EditButton from '../../components/common/EditButton'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { fetchBookstoreBundles, saveBookstoreBundle } from '../../api/bookstoreAPI'
import { toast } from '../../utils/toast'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

const OFFER_TYPES = ['Buy X Get Y', 'Flat Discount', 'Percentage Discount']

export default function BookstoreBundlesPage() {
  const [bundles, setBundles] = useState([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', offerType: OFFER_TYPES[0], buyQty: 2, getQty: 1, discountValue: '', endsAt: '' })

  const load = useCallback(async () => {
    const res = await fetchBookstoreBundles()
    setBundles(res?.items || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name,
      offerType: row.offerType,
      buyQty: row.buyQty,
      getQty: row.getQty,
      discountValue: row.discountValue ?? '',
      endsAt: row.endsAt?.slice(0, 16) || '',
    })
    setOpen(true)
  }

  const columns = [
    { key: 'name', label: 'Offer' },
    { key: 'offerType', label: 'Type' },
    { key: 'startsAt', label: 'Starts', render: (r) => formatCategoryDateTime(r.startsAt) },
    { key: 'endsAt', label: 'Ends', render: (r) => formatCategoryDateTime(r.endsAt) },
    { key: 'status', label: 'Status', render: (r) => <BookstoreStatusBadge status={r.status} /> },
    { key: 'actions', label: 'Actions', render: (row) => <EditButton onClick={() => openEdit(row)} /> },
  ]

  return (
    <BookstorePageShell icon={Gift} title="Bundle Offers" actions={<BannerButton onClick={() => { setEditingId(null); setOpen(true) }}>Add Bundle</BannerButton>}>
      <PaginatedFigmaTable columns={columns} data={bundles} itemLabel="bundles" />
      <BookstoreModal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit Bundle Offer' : 'Create Bundle Offer'}
        subtitle="Schedule promotions and product mapping"
        size="lg"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await saveBookstoreBundle({ ...form, productIds: [], startsAt: new Date().toISOString() }, editingId)
                toast.success(editingId ? 'Bundle updated' : 'Bundle created')
                setOpen(false)
                load()
              }}
            >
              {editingId ? 'Save changes' : 'Create bundle'}
            </Button>
          </BookstoreModalFooter>
        }
      >
        <div className="space-y-4">
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Offer name</span>
            <input className={BOOKSTORE_INPUT_CLASS} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Offer type</span>
            <select className={BOOKSTORE_INPUT_CLASS} value={form.offerType} onChange={(e) => setForm((f) => ({ ...f, offerType: e.target.value }))}>
              {OFFER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>Expiry</span>
            <input type="datetime-local" className={BOOKSTORE_INPUT_CLASS} value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
          </label>
        </div>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
