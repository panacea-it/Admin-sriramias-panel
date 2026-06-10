import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreConfirmDialog from '../../components/bookstore/modal/BookstoreConfirmDialog'
import RecommendationRuleModal from '../../components/bookstore/recommendations/RecommendationRuleModal'
import CartRecommendationPreview from '../../components/bookstore/recommendations/CartRecommendationPreview'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EditButton from '../../components/common/EditButton'
import { BannerButton } from '../../components/academics/AcademicsUi'
import {
  fetchBookstoreProducts,
  fetchBookstoreRecommendations,
  createBookstoreRecommendation,
  updateBookstoreRecommendation,
  deleteBookstoreRecommendation,
} from '../../api/bookstoreAPI'
import {
  emptyRecommendationRule,
  mapProductsToRecommendationCards,
  normalizeRuleFromApi,
  productById,
  productDisplayName,
} from '../../utils/bookstoreRecommendationUtils'
import { toast } from '../../utils/toast'

export default function BookstoreRecommendationsPage() {
  const [rules, setRules] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyRecommendationRule())
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewRuleId, setPreviewRuleId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [recRes, prodRes] = await Promise.all([
      fetchBookstoreRecommendations(),
      fetchBookstoreProducts(),
    ])
    const items = (recRes?.items || []).map(normalizeRuleFromApi)
    setRules(items)
    setProducts(prodRes?.items || prodRes || [])
    setPreviewRuleId((prev) => prev ?? items[0]?.id ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const previewRule = rules.find((r) => r.id === previewRuleId) || rules[0]
  const pagePreviewSource = productById(products, previewRule?.sourceProductId)
  const pagePreviewProducts = useMemo(() => {
    if (!previewRule) return []
    const ids = previewRule.recommendedProductIds || previewRule.targetProductIds || []
    return mapProductsToRecommendationCards(products, ids, {
      bestsellerIds: previewRule.bestsellerProductIds || [],
    })
  }, [previewRule, products])

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyRecommendationRule())
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyRecommendationRule())
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setPreviewRuleId(row.id)
    setForm({
      sourceProductId: row.sourceProductId,
      recommendationType: row.recommendationType || row.type || 'Cart Recommendations',
      placement: row.placement || 'Cart Drawer',
      recommendedProductIds: [...(row.recommendedProductIds || [])],
      priorityOrder: row.priorityOrder ?? 1,
      status: row.status || 'active',
      bestsellerProductIds: [...(row.bestsellerProductIds || [])],
    })
    setModalOpen(true)
  }

  const validate = () => {
    if (!form.sourceProductId) {
      toast.error('Select a source book.')
      return false
    }
    if (!form.recommendedProductIds.length) {
      toast.error('Select at least one recommended book.')
      return false
    }
    if (form.recommendedProductIds.includes(form.sourceProductId)) {
      toast.error('Source book cannot appear in its own recommendations.')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        sourceProductId: form.sourceProductId,
        recommendationType: form.recommendationType,
        placement: form.placement,
        recommendedProductIds: form.recommendedProductIds,
        targetProductIds: form.recommendedProductIds,
        priorityOrder: form.priorityOrder,
        status: form.status,
        bestsellerProductIds: form.bestsellerProductIds || [],
      }
      if (editingId) {
        await updateBookstoreRecommendation(editingId, payload)
        toast.success('Recommendation rule updated')
      } else {
        const created = await createBookstoreRecommendation(payload)
        setPreviewRuleId(created?.id ?? null)
        toast.success('Recommendation rule created')
      }
      closeModal()
      load()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteBookstoreRecommendation(deleteTarget)
    toast.success('Rule deleted')
    if (editingId === deleteTarget) closeModal()
    if (previewRuleId === deleteTarget) setPreviewRuleId(null)
    setDeleteTarget(null)
    load()
  }

  const columns = [
    {
      key: 'sourceProductId',
      label: 'Source book',
      render: (r) => (
        <button
          type="button"
          onClick={() => setPreviewRuleId(r.id)}
          className="text-left font-medium text-[#111] transition hover:text-[#7c5cbf]"
        >
          {productDisplayName(products, r.sourceProductId)}
        </button>
      ),
    },
    {
      key: 'recommendationType',
      label: 'Type',
      render: (r) => r.recommendationType || r.type,
    },
    {
      key: 'recommendedProductIds',
      label: 'Recommended books',
      render: (r) => {
        const ids = r.recommendedProductIds || r.targetProductIds || []
        return (
          <span className="text-xs text-[#444]">
            {ids.map((id) => productDisplayName(products, id)).join(' · ')}
          </span>
        )
      },
    },
    { key: 'placement', label: 'Placement' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <BookstoreStatusBadge status={r.status} />,
    },
    {
      key: 'priorityOrder',
      label: 'Priority',
      render: (r) => <span className="font-mono text-sm">{r.priorityOrder ?? '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-3">
          <EditButton onClick={() => openEdit(row)} />
          <button
            type="button"
            onClick={() => setDeleteTarget(row.id)}
            className="text-[#c96565]"
            aria-label="Delete rule"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <BookstorePageShell
      icon={Sparkles}
      title="Cart & cross-sell recommendations"
      actions={
        <BannerButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add rule
        </BannerButton>
      }
    >
      <p className="rounded-xl border border-[#e8ecf2] bg-white px-4 py-3 text-sm leading-relaxed text-[#555] shadow-sm">
        Configure which books appear as <strong className="text-[#111]">“You May Also Like”</strong> in the
        student portal cart drawer. Changes sync via{' '}
        <code className="rounded bg-[#f4f6f9] px-1.5 py-0.5 text-xs">GET /api/bookstore/recommendations/cart?sourceProductId=…</code>
      </p>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#686868]">
            Recommendation rules
          </h2>
          {rules.length === 0 && !loading && (
            <button
              type="button"
              onClick={openCreate}
              className="text-sm font-semibold text-[#7c5cbf] hover:underline"
            >
              Create your first rule
            </button>
          )}
        </div>
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-white" />
        ) : (
          <PaginatedFigmaTable columns={columns} data={rules} itemLabel="rules" />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#686868]">
          Cart preview simulator
        </h2>
        <p className="text-xs text-[#686868]">
          Click a source book in the table to preview its rule, or use Add rule / Edit to configure in the dialog.
        </p>
        <CartRecommendationPreview
          sourceProduct={pagePreviewSource}
          recommendedProducts={pagePreviewProducts}
          emptyMessage="No rules yet. Click Add rule to configure cart recommendations."
        />
      </section>

      <RecommendationRuleModal
        open={modalOpen}
        onClose={closeModal}
        form={form}
        onChange={setForm}
        products={products}
        onSave={handleSave}
        saving={saving}
        editingId={editingId}
      />

      <BookstoreConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete recommendation rule"
        message="Students will no longer see these configured recommendations for this source book."
        confirmLabel="Delete"
      />
    </BookstorePageShell>
  )
}
