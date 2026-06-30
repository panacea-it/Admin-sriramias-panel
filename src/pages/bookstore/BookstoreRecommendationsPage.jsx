import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreConfirmDialog from '../../components/bookstore/modal/BookstoreConfirmDialog'
import RecommendationRuleModal from '../../components/bookstore/recommendations/RecommendationRuleModal'
import RecommendationViewModal from '../../components/bookstore/recommendations/RecommendationViewModal'
import RecommendationsTable from '../../components/bookstore/recommendations/RecommendationsTable'
import RecommendationRowActions from '../../components/bookstore/recommendations/RecommendationRowActions'
import CartRecommendationPreview from '../../components/bookstore/recommendations/CartRecommendationPreview'
import { BannerButton } from '../../components/academics/AcademicsUi'
import {
  fetchBookstoreProducts,
  createBookstoreRecommendation,
  updateBookstoreRecommendation,
  deleteBookstoreRecommendation,
  changeBookstoreRecommendationStatus,
} from '../../api/bookstoreAPI'
import { useBookstoreRecommendationsList } from '../../hooks/bookstore/useBookstoreRecommendations'
import {
  emptyRecommendationRule,
  mapProductsToRecommendationCards,
  normalizeRuleFromApi,
  productById,
  productDisplayName,
} from '../../utils/bookstoreRecommendationUtils'
import { toast } from '../../utils/toast'
import { getApiErrorMessage } from '../../utils/apiError'

export default function BookstoreRecommendationsPage() {
  const [rules, setRules] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyRecommendationRule())
  const [editingId, setEditingId] = useState(null)
  const [viewRule, setViewRule] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewRuleId, setPreviewRuleId] = useState(null)

  const { data: recommendationsData, isLoading: recommendationsLoading, refetch } =
    useBookstoreRecommendationsList({ limit: 100 })

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoading(true)
      try {
        const prodRes = await fetchBookstoreProducts()
        if (cancelled) return

        const items = (recommendationsData?.items || []).map(normalizeRuleFromApi)
        setRules(items)
        setProducts(prodRes?.items || prodRes || [])
        setPreviewRuleId((prev) => prev ?? items[0]?.id ?? null)
      } finally {
        if (!cancelled) {
          setLoading(recommendationsLoading)
        }
      }
    }

    if (!recommendationsLoading) {
      loadProducts()
    } else {
      setLoading(true)
    }

    return () => {
      cancelled = true
    }
  }, [recommendationsData?.items, recommendationsLoading])

  const load = useCallback(async () => {
    const result = await refetch()
    const prodRes = await fetchBookstoreProducts()
    const items = (result.data?.items || []).map(normalizeRuleFromApi)
    setRules(items)
    setProducts(prodRes?.items || prodRes || [])
    setPreviewRuleId((prev) => prev ?? items[0]?.id ?? null)
  }, [refetch])

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
      recommendedProductIds: [...(row.recommendedProductIds || [])],
      status: row.status || 'active',
      bestsellerProductIds: [...(row.bestsellerProductIds || [])],
    })
    setModalOpen(true)
  }

  const openView = (row) => {
    setViewRule(row)
    setPreviewRuleId(row.id)
  }

  const toggleRuleStatus = async (row) => {
    const nextStatus = row.status === 'active' ? 'disabled' : 'active'

    try {
      const updated = await changeBookstoreRecommendationStatus(row.id, nextStatus)
      const resolvedStatus = updated?.status || nextStatus
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === row.id ? { ...rule, ...(updated || {}), status: resolvedStatus } : rule,
        ),
      )
      setViewRule((prev) =>
        prev?.id === row.id ? { ...prev, ...(updated || {}), status: resolvedStatus } : prev,
      )
      toast.success(nextStatus === 'active' ? 'Rule enabled' : 'Rule disabled')
      refetch()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update rule status.'))
    }
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
        recommendedProductIds: form.recommendedProductIds,
        targetProductIds: form.recommendedProductIds,
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
    if (viewRule?.id === deleteTarget) setViewRule(null)
    setDeleteTarget(null)
    load()
  }

  const renderRowActions = useCallback(
    (row) => (
      <RecommendationRowActions
        label={productDisplayName(products, row.sourceProductId)}
        status={row.status}
        onView={() => openView(row)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => toggleRuleStatus(row)}
      />
    ),
    [products],
  )

  const handleSourceClick = useCallback((row) => {
    setPreviewRuleId(row.id)
  }, [])

  return (
    <BookstorePageShell
      icon={Sparkles}
      title="Cart & cross-sell recommendations"
      actions={
        <BannerButton onClick={openCreate}>Add Rule</BannerButton>
      }
    >
      <p className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-sm leading-relaxed text-[#555] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        Configure which books appear as <strong className="text-[#111]">“You May Also Like”</strong> in the
        student portal cart drawer. Changes sync via{' '}
        <code className="rounded bg-[#f4f6f9] px-1.5 py-0.5 text-xs">GET /api/bookstore/recommendations/cart?sourceProductId=…</code>
      </p>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#686868]">
            Recommendation rules
          </h2>
          {rules.length === 0 && !loading && (
            <button
              type="button"
              onClick={openCreate}
              className="text-sm font-semibold text-[#246392] hover:underline"
            >
              Create your first rule
            </button>
          )}
        </div>
        <div className="min-w-0 rounded-xl border border-slate-100">
          <RecommendationsTable
            rules={rules}
            products={products}
            loading={loading}
            resetDeps={[]}
            onSourceClick={handleSourceClick}
            renderActions={renderRowActions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#686868]">
            Cart preview simulator
          </h2>
          <p className="text-xs text-[#686868]">
            Click a source book in the table to preview its rule, or use Add Rule / Edit to configure in the dialog.
          </p>
        </div>
        <CartRecommendationPreview
          sourceProduct={pagePreviewSource}
          recommendedProducts={pagePreviewProducts}
          emptyMessage="No rules yet. Click Add Rule to configure cart recommendations."
        />
      </section>

      <RecommendationViewModal
        open={Boolean(viewRule)}
        rule={viewRule}
        products={products}
        onClose={() => setViewRule(null)}
      />

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
        title="Deactivate"
        message="Students will no longer see these configured recommendations for this source book."
        confirmLabel="Deactivate"
      />
    </BookstorePageShell>
  )
}
