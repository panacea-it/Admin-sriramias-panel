import BookstoreModal, { BookstoreModalFooter } from '../modal/BookstoreModal'
import Button from '../../ui/Button'
import BookstoreStatusBadge from '../BookstoreStatusBadge'
import { BOOKSTORE_LABEL_CLASS } from '../modal/bookstoreFormStyles'
import { productDisplayName } from '../../../utils/bookstoreRecommendationUtils'

function DetailField({ label, children, className }) {
  return (
    <div className={className}>
      <dt className={BOOKSTORE_LABEL_CLASS}>{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#111]">{children}</dd>
    </div>
  )
}

export default function RecommendationViewModal({ open, rule, products, onClose }) {
  const recommendedIds = rule?.recommendedProductIds || rule?.targetProductIds || []
  const recommendedNames = recommendedIds
    .map((id) => productDisplayName(products, id))
    .join(' · ')

  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title="Recommendation rule"
      subtitle={rule?.id}
      size="lg"
      footer={
        rule && (
          <BookstoreModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </BookstoreModalFooter>
        )
      }
    >
      {rule && (
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailField label="Source Book">
            {productDisplayName(products, rule.sourceProductId)}
          </DetailField>
          <DetailField label="Recommendation Type">
            {rule.recommendationType || rule.type}
          </DetailField>
          <DetailField label="Placement">{rule.placement}</DetailField>
          <DetailField label="Status">
            <BookstoreStatusBadge status={rule.status} />
          </DetailField>
          <DetailField label="Priority">{rule.priorityOrder ?? '—'}</DetailField>
          <DetailField label="Recommended Books" className="sm:col-span-2">
            {recommendedNames || '—'}
          </DetailField>
        </dl>
      )}
    </BookstoreModal>
  )
}
