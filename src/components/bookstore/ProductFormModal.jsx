import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '../../utils/toast'
import Button from '../ui/Button'
import { BOOKSTORE_EXAM_CATEGORIES } from '../../data/bookstoreMockData'
import BookstoreModal, { BookstoreModalFooter } from './modal/BookstoreModal'
import { BOOKSTORE_HELPER_CLASS, BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from './modal/bookstoreFormStyles'
import ProductFormSection from './product-form/ProductFormSection'
import CoverImageUpload from './product-form/CoverImageUpload'
import SampleImagesSortable from './product-form/SampleImagesSortable'
import KeywordsSortable from './product-form/KeywordsSortable'
import {
  BOOKSTORE_DESCRIPTION_MAX,
  buildProductPayload,
  createCoverAsset,
  getProductExamCategory,
  mapKeywordsFromProduct,
  mapSampleImagesFromProduct,
  revokeAssetUrls,
  runCoverUploadProgress,
  runListUploadProgress,
  validateProductAssets,
  withLegacyOption,
} from '../../utils/bookstoreProductForm'

const EMPTY = {
  name: '',
  description: '',
  examCategory: '',
  authorName: '',
  isbn: '',
  originalPrice: '',
  discountPrice: '',
  stockQuantity: '',
  status: 'active',
}

export default function ProductFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: EMPTY })
  const description = watch('description') || ''

  const [cover, setCover] = useState(null)
  const [samples, setSamples] = useState([])
  const [keywords, setKeywords] = useState([])
  const [assetErrors, setAssetErrors] = useState({})
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
      const { subject, productType, ...initialRest } = initial
      reset({
        ...EMPTY,
        ...initialRest,
        examCategory: initial.examCategory ?? subject ?? '',
        originalPrice: String(initial.originalPrice ?? ''),
        discountPrice: String(initial.discountPrice ?? ''),
        stockQuantity: String(initial.stockQuantity ?? ''),
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
    setAssetErrors({})
    return () => clearProgress()
  }, [open, initial?.id, reset, clearProgress])

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
    setAssetErrors((e) => ({ ...e, cover: undefined }))
  }

  const submit = (values, { isDraft }) => {
    const errors = validateProductAssets({ cover, samples, keywords }, { isDraft })
    if (!values.name?.trim()) {
      toast.error('Product name is required.')
      return
    }
    if (Object.keys(errors).length) {
      setAssetErrors(errors)
      toast.error(isDraft ? 'Fix validation errors before saving.' : 'Please complete all required fields.')
      return
    }
    setAssetErrors({})
    onSubmit(buildProductPayload(values, { cover, samples, keywords, isDraft }))
  }

  const onDraft = handleSubmit((values) => submit(values, { isDraft: true }))
  const onPublish = handleSubmit((values) => submit(values, { isDraft: false }))

  const isEdit = Boolean(initial)

  const examCategoryOptions = useMemo(
    () => withLegacyOption(BOOKSTORE_EXAM_CATEGORIES, getProductExamCategory(initial)),
    [initial],
  )

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
          <Button type="button" variant="secondary" onClick={onDraft} disabled={loading}>
            Save Draft
          </Button>
          <Button type="button" onClick={onPublish} disabled={loading}>
            {isEdit ? 'Save changes' : 'Create Product'}
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
            <label className="sm:col-span-2">
              <span className={BOOKSTORE_LABEL_CLASS}>Product Name *</span>
              <input className={BOOKSTORE_INPUT_CLASS} {...register('name', { required: true })} placeholder="e.g. UPSC Prelims GS Manual 2026" />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Exam Category</span>
              <select className={BOOKSTORE_INPUT_CLASS} {...register('examCategory')}>
                <option value="">Select exam category</option>
                {examCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Author Name</span>
              <input className={BOOKSTORE_INPUT_CLASS} {...register('authorName')} placeholder="Author or editorial team" />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>ISBN</span>
              <input className={BOOKSTORE_INPUT_CLASS} {...register('isbn')} placeholder="978-93-81234-00-0" />
            </label>
            <label className="sm:col-span-2">
              <span className={BOOKSTORE_LABEL_CLASS}>Book Summary</span>
              <textarea
                rows={6}
                style={{ minHeight: 140 }}
                maxLength={BOOKSTORE_DESCRIPTION_MAX}
                placeholder="Enter detailed book summary"
                className={cnTextarea()}
                {...register('description')}
              />
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
            error={assetErrors.cover}
          />
        </ProductFormSection>

        <ProductFormSection
          title="Sample pages / preview images"
          description="Inside pages, demo screenshots, or product previews. Arrange order for the gallery."
          delay={0.08}
        >
          <SampleImagesSortable
            items={samples}
            onChange={(next) => {
              setSamples(next)
              setAssetErrors((e) => ({ ...e, samples: undefined }))
            }}
            onUploadStart={startSamplesProgress}
            error={assetErrors.samples}
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
              setAssetErrors((e) => ({ ...e, keywords: undefined }))
            }}
            error={assetErrors.keywords}
          />
        </ProductFormSection>

        <ProductFormSection
          title="Pricing & inventory"
          description="Commercial details and fulfillment metadata."
          delay={0.16}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Original Price (₹)</span>
              <input type="number" min="0" className={BOOKSTORE_INPUT_CLASS} {...register('originalPrice')} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Discount Price (₹)</span>
              <input type="number" min="0" className={BOOKSTORE_INPUT_CLASS} {...register('discountPrice')} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Stock Quantity</span>
              <input type="number" min="0" className={BOOKSTORE_INPUT_CLASS} {...register('stockQuantity')} />
            </label>
            <label>
              <span className={BOOKSTORE_LABEL_CLASS}>Status</span>
              <select className={BOOKSTORE_INPUT_CLASS} {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </ProductFormSection>
      </form>
    </BookstoreModal>
  )
}

function cnTextarea() {
  return `${BOOKSTORE_INPUT_CLASS} min-h-[140px] resize-y leading-relaxed`
}
