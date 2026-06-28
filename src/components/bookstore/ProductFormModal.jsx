import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Button from '../ui/Button'
import BookstoreModal, { BookstoreModalFooter } from './modal/BookstoreModal'
import { BOOKSTORE_HELPER_CLASS, BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from './modal/bookstoreFormStyles'
import ProductFormSection from './product-form/ProductFormSection'
import CoverImageUpload from './product-form/CoverImageUpload'
import SampleImagesSortable from './product-form/SampleImagesSortable'
import KeywordsSortable from './product-form/KeywordsSortable'
import { cn } from '../../utils/cn'
import {
  BOOKSTORE_DESCRIPTION_MAX,
  createCoverAsset,
  mapKeywordsFromProduct,
  mapSampleImagesFromProduct,
  revokeAssetUrls,
  runCoverUploadProgress,
  runListUploadProgress,
  validateProductForm,
} from '../../utils/bookstoreProductForm'

const EMPTY = {
  name: '',
  description: '',
  examCategory: '',
  authorName: '',
  isbn: '',
  language: 'English',
  originalPrice: '',
  discountPrice: '',
  stockQuantity: '',
  status: 'active',
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

export default function ProductFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: EMPTY })
  const description = watch('description') || ''

  const [cover, setCover] = useState(null)
  const [samples, setSamples] = useState([])
  const [keywords, setKeywords] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const progressCleanup = useRef(null)

  const clearProgress = useCallback(() => {
    progressCleanup.current?.()
    progressCleanup.current = null
  }, [])

  const startCoverProgress = useCallback((ids) => {
    clearProgress()
    const id = ids?.[0]
    if (id) progressCleanup.current = runCoverUploadProgress(setCover, id)
  }, [clearProgress])

  const startSamplesProgress = useCallback((ids) => {
    clearProgress()
    progressCleanup.current = runListUploadProgress(setSamples, ids)
  }, [clearProgress])

  useEffect(() => {
    if (!open) return undefined
    if (initial) {
      reset({
        ...EMPTY,
        name: initial.name || '',
        description: initial.description || '',
        examCategory: initial.examCategoryId || '',
        authorName: initial.authorName || '',
        isbn: initial.isbn || '',
        language: initial.language || 'English',
        originalPrice: String(initial.originalPrice ?? ''),
        discountPrice: String(initial.discountPrice ?? ''),
        stockQuantity: String(initial.stockQuantity ?? ''),
        status: initial.status || 'active',
      })
      setCover(initial.thumbnailUrl ? createCoverAsset(null, initial.thumbnailUrl) : null)
      setSamples(mapSampleImagesFromProduct(initial))
      setKeywords(mapKeywordsFromProduct(initial))
    } else {
      reset(EMPTY)
      setCover(null)
      setSamples([])
      setKeywords([])
    }
    setFieldErrors({})
    return () => clearProgress()
  }, [open, initial?.mongoId, initial?.id, reset, clearProgress])

  useEffect(() => {
    if (!open) {
      clearProgress()
    }
  }, [open, clearProgress])

  const handleCoverChange = (next) => {
    if (cover?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(cover.previewUrl)
    }
    setCover(next)
    setFieldErrors((prev) => ({ ...prev, cover: undefined }))
  }

  const submit = (values, { isDraft }) => {
    const errors = validateProductForm(values, {
      cover,
      keywords,
      isDraft,
      isEdit,
    })
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    onSubmit({ values, cover, samples, keywords, isDraft })
  }

  const onDraft = handleSubmit((values) => submit(values, { isDraft: true }))
  const onPublish = handleSubmit((values) => submit(values, { isDraft: false }))

  const isEdit = Boolean(initial)

  const inputClass = (field) =>
    cn(BOOKSTORE_INPUT_CLASS, fieldErrors[field] && 'border-red-400 ring-1 ring-red-200')

  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      subtitle={
        isEdit
          ? `SKU ${initial.id} · Update listing, media, and SEO`
          : 'Professional product creation — details, cover, samples & keywords'
      }
      size="7xl"
      loading={loading}
      bodyClassName="bg-[#f4f6f9]"
      footer={
        <BookstoreModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {!isEdit ? (
            <Button type="button" variant="secondary" onClick={onDraft} disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                'Save Draft'
              )}
            </Button>
          ) : null}
          <Button type="button" onClick={onPublish} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? 'Updating…' : 'Creating…'}
              </span>
            ) : (
              isEdit ? 'Update' : 'Create Product'
            )}
          </Button>
        </BookstoreModalFooter>
      }
    >
      <form
        id="bookstore-product-form"
        onSubmit={(e) => e.preventDefault()}
        className="space-y-5 pb-2"
      >
        <ProductFormSection
          title="Basic product information"
          description="Core listing details shown on the storefront and admin catalog."
          delay={0}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {isEdit && initial?.id ? (
              <label className="sm:col-span-2">
                <span className={BOOKSTORE_LABEL_CLASS}>Product ID</span>
                <input
                  className={cn(BOOKSTORE_INPUT_CLASS, 'cursor-not-allowed bg-[#f4f5f8] text-[#686868]')}
                  value={initial.id}
                  readOnly
                  disabled
                />
              </label>
            ) : null}
            <label className="sm:col-span-2">
              <span className={BOOKSTORE_LABEL_CLASS}>Product Name *</span>
              <input
                className={inputClass('name')}
                {...register('name')}
                placeholder="e.g. UPSC Prelims GS Manual 2026"
              />
              <FieldError message={fieldErrors.name} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Author Name *</span>
              <input
                className={inputClass('authorName')}
                {...register('authorName')}
                placeholder="Author or editorial team"
              />
              <FieldError message={fieldErrors.authorName} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>ISBN *</span>
              <input
                className={inputClass('isbn')}
                {...register('isbn')}
                placeholder="978-93-81234-00-0"
              />
              <FieldError message={fieldErrors.isbn} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Language *</span>
              <select className={inputClass('language')} {...register('language')} disabled>
                <option value="English">English</option>
              </select>
              <FieldError message={fieldErrors.language} />
            </label>
            <label className="sm:col-span-2">
              <span className={BOOKSTORE_LABEL_CLASS}>Book Summary *</span>
              <textarea
                rows={6}
                style={{ minHeight: 140 }}
                maxLength={BOOKSTORE_DESCRIPTION_MAX}
                placeholder="Enter detailed book summary"
                className={cn(inputClass('description'), 'min-h-[140px] resize-y leading-relaxed')}
                {...register('description')}
              />
              <FieldError message={fieldErrors.description} />
              <div className="mt-1.5 flex items-center justify-between">
                <p className={BOOKSTORE_HELPER_CLASS}>Rich product summary for catalog and SEO.</p>
                <span className="text-xs font-medium text-[#686868]">
                  {description.length}/{BOOKSTORE_DESCRIPTION_MAX}
                </span>
              </div>
            </label>
          </div>
        </ProductFormSection>

        <ProductFormSection
          title="Book cover thumbnail"
          description="Upload the main cover image for the product. Only one image is allowed."
          delay={0.04}
        >
          <CoverImageUpload
            value={cover}
            onChange={handleCoverChange}
            onUploadStart={(ids) => startCoverProgress(ids)}
            error={fieldErrors.cover}
          />
        </ProductFormSection>

        <ProductFormSection
          title="Sample pages / preview images"
          description="Optional inside pages or product previews. Upload up to 10 images."
          delay={0.08}
        >
          <SampleImagesSortable
            items={samples}
            onChange={(next) => {
              setSamples(next)
              setFieldErrors((prev) => ({ ...prev, samples: undefined }))
            }}
            onUploadStart={startSamplesProgress}
            error={fieldErrors.samples}
          />
        </ProductFormSection>

        <ProductFormSection
          title="SEO keywords / search keywords"
          description="Tags that power search and recommendations. Order sets priority."
          delay={0.12}
        >
          <KeywordsSortable
            items={keywords}
            onChange={(next) => {
              setKeywords(next)
              setFieldErrors((prev) => ({ ...prev, keywords: undefined }))
            }}
            error={fieldErrors.keywords}
          />
        </ProductFormSection>

        <ProductFormSection
          title="Pricing & inventory"
          description="Commercial details and fulfillment metadata."
          delay={0.16}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Original Price (₹) *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass('originalPrice')}
                {...register('originalPrice')}
              />
              <FieldError message={fieldErrors.originalPrice} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Discount Price (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass('discountPrice')}
                {...register('discountPrice')}
              />
              <FieldError message={fieldErrors.discountPrice} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Stock Quantity *</span>
              <input
                type="number"
                min="0"
                step="1"
                className={inputClass('stockQuantity')}
                {...register('stockQuantity')}
              />
              <FieldError message={fieldErrors.stockQuantity} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Status *</span>
              <select className={inputClass('status')} {...register('status')}>
                <option value="active">ACTIVE</option>
                <option value="inactive">DEACTIVATED</option>
              </select>
              <FieldError message={fieldErrors.status} />
            </label>
          </div>
        </ProductFormSection>
      </form>
    </BookstoreModal>
  )
}
