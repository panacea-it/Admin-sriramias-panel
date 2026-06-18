import BookstoreModal, { BookstoreModalFooter } from '../modal/BookstoreModal'
import Button from '../../ui/Button'
import RecommendationMappingForm from './RecommendationMappingForm'
import CartRecommendationPreview from './CartRecommendationPreview'
import { useMemo } from 'react'
import { mapProductsToRecommendationCards, productById } from '../../../utils/bookstoreRecommendationUtils'

export default function RecommendationRuleModal({
  open,
  onClose,
  form,
  onChange,
  products,
  onSave,
  saving,
  editingId,
}) {
  const sourceProduct = productById(products, form.sourceProductId)
  const previewProducts = useMemo(
    () =>
      mapProductsToRecommendationCards(products, form.recommendedProductIds, {
        bestsellerIds: form.bestsellerProductIds || [],
      }),
    [products, form.recommendedProductIds, form.bestsellerProductIds],
  )

  const sourceName = sourceProduct?.name

  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit recommendation rule' : 'Add recommendation rule'}
      subtitle={
        editingId
          ? `Update cross-sell mapping · Rule ${editingId}`
          : 'Configure source book and recommended titles'
      }
      size="7xl"
      loading={saving}
      bodyClassName="bg-[#fafbfc]"
      footer={
        <BookstoreModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {editingId ? 'Save changes' : 'Create rule'}
          </Button>
        </BookstoreModalFooter>
      }
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <RecommendationMappingForm
            form={form}
            onChange={onChange}
            products={products}
            embedded
          />
        </div>
        <div className="lg:col-span-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">
            Live cart preview
          </p>
          <CartRecommendationPreview
            sourceProduct={sourceProduct}
            recommendedProducts={previewProducts}
            emptyMessage={
              sourceName
                ? 'Select recommended books to preview the cart drawer.'
                : 'Choose a source book to start previewing recommendations.'
            }
          />
        </div>
      </div>
    </BookstoreModal>
  )
}
