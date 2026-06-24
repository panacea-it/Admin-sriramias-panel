import { motion } from 'framer-motion'
import { BookOpen, ChevronRight } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { formatINR } from '../../../utils/financeFilters'
import { CART_RECOMMENDATION_TITLE } from '../../../constants/bookstoreRecommendations'

function BookThumb({ name, thumbnailUrl }) {
  if (thumbnailUrl) {
    return (
      <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
    )
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#ede8f8] to-[#e8f0fa] text-[#7c5cbf]">
      <BookOpen className="h-6 w-6 opacity-80" strokeWidth={1.6} />
      <span className="mt-1 max-w-[72px] truncate px-1 text-[9px] font-semibold">{name?.slice(0, 12)}</span>
    </div>
  )
}

function RecommendationCard({ product, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex w-[168px] shrink-0 gap-2.5 rounded-xl border border-[#ece8f4] bg-white p-2.5 shadow-sm"
    >
      <div className="h-[72px] w-[56px] shrink-0 overflow-hidden rounded-lg ring-1 ring-[#e8ecf2]">
        <BookThumb name={product.name} thumbnailUrl={product.thumbnailUrl} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          {product.isBestseller && (
            <span className="mb-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
              Bestseller
            </span>
          )}
          <h4 className="line-clamp-2 text-[11px] font-semibold leading-snug text-[#1a1a1a]">
            {product.name}
          </h4>
        </div>
        <div className="mt-1">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-sm font-bold text-[#7c5cbf]">{formatINR(product.discountPrice)}</span>
            {product.discountPercent > 0 && (
              <span className="rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-bold text-emerald-700">
                {product.discountPercent}% off
              </span>
            )}
          </div>
          {product.originalPrice > product.discountPrice && (
            <span className="text-[10px] text-[#9ca0a8] line-through">{formatINR(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function CartRecommendationPreview({
  sourceProduct,
  recommendedProducts = [],
  className,
  emptyMessage = 'Select a source book and recommended titles to preview the cart drawer.',
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="border-b border-[#e8ecf2] bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Cart preview simulator</p>
        <p className="mt-0.5 text-sm text-[#444]">
          {sourceProduct
            ? `When “${sourceProduct.name}” is in cart`
            : 'Student portal cart drawer preview'}
        </p>
      </div>

      <div className="mx-3 my-4 max-w-full overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-[#f0f0f4] px-4 py-3">
          <span className="text-sm font-bold text-[#111]">Your Cart</span>
          <span className="text-xs text-[#686868]">Preview</span>
        </div>

        {sourceProduct && (
          <div className="flex gap-3 border-b border-[#f0f0f4] px-4 py-3">
            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md ring-1 ring-[#eee]">
              <BookThumb name={sourceProduct.name} thumbnailUrl={sourceProduct.thumbnailUrl} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#111]">{sourceProduct.name}</p>
              <p className="text-sm font-bold text-[#7c5cbf]">{formatINR(sourceProduct.discountPrice)}</p>
            </div>
          </div>
        )}

        <div className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111]">{CART_RECOMMENDATION_TITLE}</h3>
            <ChevronRight className="h-4 w-4 text-[#9ca0a8]" />
          </div>

          {recommendedProducts.length > 0 ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-thin overscroll-x-contain px-1">
              {recommendedProducts.map((p, i) => (
                <RecommendationCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-[#f4f6f9] px-3 py-6 text-center text-xs text-[#686868]">
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
