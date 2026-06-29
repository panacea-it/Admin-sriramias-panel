import { useEffect, useState } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import BookstoreModal from './modal/BookstoreModal'
import ProductStatusPill from './ProductStatusPill'
import { useBookstoreProduct } from '../../hooks/bookstore/useBookstoreProducts'
import { getApiErrorMessage } from '../../utils/apiError'
import { formatINR } from '../../utils/financeFilters'
import { getProductExamCategory } from '../../utils/bookstoreProductForm'

const PLACEHOLDER_COVER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMTYwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y0ZjVmOCIgc3Ryb2tlPSIjZTBlNGVhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTNhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'

function DetailItem({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[#686868]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#333]">{children}</dd>
    </div>
  )
}

function PdfActionLink({ href, fileName, label, icon: Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName || undefined}
      className="inline-flex items-center gap-2 rounded-lg border border-[#7c5cbf]/30 bg-[#f3f0fa] px-4 py-2 text-sm font-semibold text-[#5a4a8a] transition hover:bg-[#ebe4f8]"
    >
      {label}
      <Icon className="h-4 w-4" />
    </a>
  )
}

export default function ProductPreviewModal({ open, onClose, productId }) {
  const [thumbnailError, setThumbnailError] = useState(false)

  const {
    data: product,
    isLoading,
    isFetching,
    isError,
    error,
  } = useBookstoreProduct(productId, {
    enabled: open && Boolean(productId),
  })

  useEffect(() => {
    setThumbnailError(false)
  }, [productId, product?.thumbnailUrl])

  const isBusy = isLoading || isFetching
  const keywords = product?.keywords || []
  const examCategory = product ? getProductExamCategory(product) : ''
  const statusLabel = product?.apiStatus || product?.status || '—'
  const thumbnailSrc =
    thumbnailError || !product?.thumbnailUrl ? PLACEHOLDER_COVER : product.thumbnailUrl

  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title={product?.name || 'Product details'}
      subtitle={product?.id ? `Product preview · ${product.id}` : 'Loading product…'}
      size="lg"
      loading={isBusy}
    >
      {!isBusy && isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {getApiErrorMessage(error, 'Unable to fetch product details. Please try again.')}
        </div>
      ) : null}

      {!isBusy && !isError && product ? (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-[#e8ecf2] bg-[#f4f5f8] p-4">
            <img
              src={thumbnailSrc}
              alt={product.name || 'Product thumbnail'}
              className="mx-auto max-h-52 object-contain"
              onError={() => setThumbnailError(true)}
            />
          </div>

          {product.previewVideoUrl ? (
            <div>
              <p className="text-xs font-semibold text-[#686868]">Overview Video</p>
              <div className="mt-2 overflow-hidden rounded-xl border border-[#e8ecf2] bg-[#1a3a5c] p-2">
                <video
                  src={product.previewVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="mx-auto max-h-52 w-full rounded-lg object-contain"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            </div>
          ) : null}

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailItem label="Product ID">{product.id || '—'}</DetailItem>
            <DetailItem label="Product Name">{product.name || '—'}</DetailItem>
            <DetailItem label="Exam Category">{examCategory || '—'}</DetailItem>
            <DetailItem label="Author Name">{product.authorName || '—'}</DetailItem>
            <DetailItem label="ISBN">{product.isbn || '—'}</DetailItem>
            <DetailItem label="Language">{product.language || '—'}</DetailItem>
            <DetailItem label="Stock Quantity">
              {product.stockQuantity?.toLocaleString?.() ?? product.stockQuantity ?? '—'}
            </DetailItem>
            <DetailItem label="Sold Quantity">
              {product.soldQuantity?.toLocaleString?.() ?? product.soldQuantity ?? '—'}
            </DetailItem>
            <DetailItem label="Original Price">{formatINR(product.originalPrice)}</DetailItem>
            <DetailItem label="Discount Price">
              <span className="font-bold text-[#7c5cbf]">{formatINR(product.discountPrice)}</span>
            </DetailItem>
            <DetailItem label="Status">
              <ProductStatusPill status={statusLabel} />
            </DetailItem>
            <DetailItem label="Created Date">
              {product.createdDate && product.createdTime
                ? `${product.createdDate} · ${product.createdTime}`
                : product.createdDate || '—'}
            </DetailItem>
            <DetailItem label="Updated Date">
              {product.updatedDate && product.updatedTime
                ? `${product.updatedDate} · ${product.updatedTime}`
                : product.updatedDate || '—'}
            </DetailItem>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-[#686868]">Book Summary</dt>
              <dd className="mt-1 leading-relaxed text-[#444]">
                {product.description || 'No book summary.'}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-xs font-semibold text-[#686868]">SEO Keywords</p>
            {keywords.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-[#f3f0fa] px-3 py-1 text-xs font-medium text-[#5a4a8a]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-[#686868]">—</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-[#686868]">Preview PDF</p>
            {product.previewPdf ? (
              <div className="mt-2 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <PdfActionLink
                    href={product.previewPdf}
                    fileName={product.previewPdfFileName}
                    label="View PDF"
                    icon={ExternalLink}
                  />
                  <PdfActionLink
                    href={product.previewPdf}
                    fileName={product.previewPdfFileName}
                    label="Download PDF"
                    icon={Download}
                  />
                </div>
                {product.previewPdfFileName ? (
                  <p className="text-xs text-[#686868]">{product.previewPdfFileName}</p>
                ) : null}
                <iframe
                  title={product.previewPdfFileName || 'Product preview PDF'}
                  src={product.previewPdf}
                  className="h-80 w-full rounded-xl border border-[#e8ecf2] bg-white"
                />
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium text-[#686868]">Preview PDF Not Available</p>
            )}
          </div>
        </div>
      ) : null}
    </BookstoreModal>
  )
}
