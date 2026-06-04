import {
  RECOMMENDATION_PLACEMENTS,
  RECOMMENDATION_STATUSES,
  RECOMMENDATION_TYPES,
} from '../../../constants/bookstoreRecommendations'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../modal/bookstoreFormStyles'
import BookProductPicker from './BookProductPicker'
import SortableRecommendedBooks from './SortableRecommendedBooks'
import ProductFormSection from '../product-form/ProductFormSection'

export default function RecommendationMappingForm({
  form,
  onChange,
  products,
  embedded = false,
}) {
  const patch = (key, value) => onChange({ ...form, [key]: value })

  const handleRecommendedChange = (ids) => {
    const kept = form.recommendedProductIds.filter((id) => ids.includes(id))
    const added = ids.filter((id) => !kept.includes(id))
    patch('recommendedProductIds', [...kept, ...added])
  }

  const content = (
    <>
      <ProductFormSection
        title="Source & rule settings"
        description="When a student adds the source book to cart, these recommendations can appear."
        delay={0}
      >
        <div className="space-y-4">
          <div>
            <span className={BOOKSTORE_LABEL_CLASS}>Source book *</span>
            <select
              className={BOOKSTORE_INPUT_CLASS}
              value={form.sourceProductId}
              onChange={(e) => patch('sourceProductId', e.target.value)}
            >
              <option value="">Select source book…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Recommendation type</span>
              <select
                className={BOOKSTORE_INPUT_CLASS}
                value={form.recommendationType}
                onChange={(e) => patch('recommendationType', e.target.value)}
              >
                {RECOMMENDATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Placement</span>
              <select
                className={BOOKSTORE_INPUT_CLASS}
                value={form.placement}
                onChange={(e) => patch('placement', e.target.value)}
              >
                {RECOMMENDATION_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Priority order</span>
              <input
                type="number"
                min={1}
                className={BOOKSTORE_INPUT_CLASS}
                value={form.priorityOrder}
                onChange={(e) => patch('priorityOrder', Number(e.target.value) || 1)}
              />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Status</span>
              <select
                className={BOOKSTORE_INPUT_CLASS}
                value={form.status}
                onChange={(e) => patch('status', e.target.value)}
              >
                {RECOMMENDATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </ProductFormSection>

      <ProductFormSection
        title="Recommended books"
        description="Select titles and arrange the order shown in the student cart."
        delay={0.04}
      >
        <div className="space-y-5">
          <BookProductPicker
            products={products}
            selectedIds={form.recommendedProductIds}
            onChange={handleRecommendedChange}
            excludeId={form.sourceProductId}
            label="Add recommended books"
          />
          <SortableRecommendedBooks
            products={products}
            orderedIds={form.recommendedProductIds}
            onChange={(ids) => patch('recommendedProductIds', ids)}
            bestsellerIds={form.bestsellerProductIds || []}
            onBestsellerChange={(ids) => patch('bestsellerProductIds', ids)}
          />
        </div>
      </ProductFormSection>
    </>
  )

  if (embedded) {
    return <div className="space-y-5">{content}</div>
  }

  return (
    <div className="rounded-2xl border border-[#e8ecf2] bg-white p-5 shadow-sm sm:p-6">
      {content}
    </div>
  )
}
