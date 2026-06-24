import BookstoreModal from './modal/BookstoreModal'
import BookstoreStatusBadge from './BookstoreStatusBadge'
import { formatINR } from '../../utils/financeFilters'
import { getProductExamCategory } from '../../utils/bookstoreProductForm'

export default function ProductPreviewModal({ open, onClose, product }) {
  if (!product) return null

  const keywords = product.keywords || []
  const samples = product.sampleImages || product.previewImages || []
  const examCategory = getProductExamCategory(product)

  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title={product.name}
      subtitle={`Product preview · ${product.id}`}
      size="lg"
    >
      <div className="space-y-5">
        {product.thumbnailUrl && (
          <div className="overflow-hidden rounded-xl border border-[#e8ecf2] bg-[#f4f5f8]">
            <img src={product.thumbnailUrl} alt="" className="mx-auto max-h-48 object-contain" />
          </div>
        )}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-[#686868]">Exam Category</dt>
            <dd className="mt-0.5">{examCategory || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#686868]">Status</dt>
            <dd className="mt-0.5"><BookstoreStatusBadge status={product.status} /></dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#686868]">Author Name</dt>
            <dd className="mt-0.5">{product.authorName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#686868]">ISBN</dt>
            <dd className="mt-0.5">{product.isbn || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#686868]">Language</dt>
            <dd className="mt-0.5">{product.language || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#686868]">Stock</dt>
            <dd className="mt-0.5 font-semibold">{product.stockQuantity}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#686868]">Price</dt>
            <dd className="mt-0.5">
              <span className="font-bold text-[#7c5cbf]">{formatINR(product.discountPrice)}</span>
              {product.originalPrice > product.discountPrice && (
                <span className="ml-2 text-[#9ca0a8] line-through">{formatINR(product.originalPrice)}</span>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-[#686868]">Book Summary</dt>
            <dd className="mt-1 leading-relaxed text-[#444]">{product.description || 'No book summary.'}</dd>
          </div>
        </dl>
        {keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#686868]">Keywords</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span key={kw} className="rounded-full bg-[#f3f0fa] px-3 py-1 text-xs font-medium text-[#5a4a8a]">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
        {samples.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#686868]">Sample images</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {samples.map((s, i) => {
                const url = typeof s === 'string' ? s : s.url
                return url ? (
                  <img key={url || i} src={url} alt="" className="aspect-square rounded-lg border border-[#e8ecf2] object-cover" />
                ) : null
              })}
            </div>
          </div>
        )}
      </div>
    </BookstoreModal>
  )
}
