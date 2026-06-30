import { Plus, Trash2 } from 'lucide-react'
import { WebsiteField, websiteInputClass } from './websiteUi'
import OurBooksImageField, { OurBooksImageSpecsBanner } from './OurBooksImageField'
import {
  IMAGE_UPLOAD_SECTION_KEYS,
  SECTION_IMAGE_SPECS,
} from '../../constants/quickLinksConstants'
import { cn } from '../../utils/cn'

function emptyItem(sectionKey) {
  const key = String(sectionKey || '').toUpperCase()
  if (key === 'QUICK_LINKS') {
    return {
      title: '',
      href: '',
      borderColor: '#E29A9A',
      textColor: '#C77878',
      icon: '',
      sortOrder: 1,
      isActive: true,
    }
  }
  if (key === 'COURSES') {
    return {
      title: '',
      imageUrl: '',
      imageFile: null,
      imagePublicId: '',
      sortOrder: 1,
      isActive: true,
    }
  }
  if (key === 'TRENDING_VIDEOS') {
    return { title: '', href: '', sortOrder: 1, isActive: true }
  }
  if (key === 'OUR_BOOKS' || key === 'DAILY_LEARNING') {
    return { imageUrl: '', imageFile: null, imagePublicId: '', sortOrder: 1, isActive: true }
  }
  return { title: '', imageUrl: '', sortOrder: 1, isActive: true }
}

function emptyQuizOption() {
  return { label: '', sortOrder: 1, isActive: true }
}

export default function QuickLinksSectionItemEditor({
  sectionKey,
  items,
  quizOptions,
  onItemsChange,
  onQuizOptionsChange,
  error,
  itemErrors = {},
}) {
  const key = String(sectionKey || '').toUpperCase()

  if (key === 'DAILY_QUIZ') {
    const options = quizOptions || []

    const updateOption = (index, patch) => {
      onQuizOptionsChange(
        options.map((option, idx) => (idx === index ? { ...option, ...patch } : option)),
      )
    }

    const addOption = () => {
      onQuizOptionsChange([
        ...options,
        { ...emptyQuizOption(), sortOrder: options.length + 1 },
      ])
    }

    const removeOption = (index) => {
      onQuizOptionsChange(options.filter((_, idx) => idx !== index))
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#14213D]">Quiz Options</p>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef6fc] px-3 py-2 text-xs font-semibold text-[#246392] transition hover:bg-[#dceefb]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add option
          </button>
        </div>
        {error && <p className="text-xs text-[#dc2626]">{error}</p>}
        {options.map((option, index) => (
          <div
            key={`quiz-option-${index}`}
            className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Option {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#dc2626] hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <WebsiteField label="Label" required>
                <input
                  type="text"
                  value={option.label}
                  onChange={(event) => updateOption(index, { label: event.target.value })}
                  className={websiteInputClass}
                  placeholder="Delhi"
                />
              </WebsiteField>
              <WebsiteField label="Sort Order">
                <input
                  type="number"
                  min={1}
                  value={option.sortOrder}
                  onChange={(event) =>
                    updateOption(index, { sortOrder: Number(event.target.value) || 1 })
                  }
                  className={websiteInputClass}
                />
              </WebsiteField>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#333]">
              <input
                type="checkbox"
                checked={option.isActive !== false}
                onChange={(event) => updateOption(index, { isActive: event.target.checked })}
                className="rounded border-[#cbd5e1]"
              />
              Active
            </label>
          </div>
        ))}
      </div>
    )
  }

  const rows = items || []

  const updateItem = (index, patch) => {
    onItemsChange(rows.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  const addItem = () => {
    onItemsChange([...rows, { ...emptyItem(key), sortOrder: rows.length + 1 }])
  }

  const removeItem = (index) => {
    onItemsChange(rows.filter((_, idx) => idx !== index))
  }

  const showYoutubeUrl = key === 'TRENDING_VIDEOS'
  const showImageUpload = IMAGE_UPLOAD_SECTION_KEYS.includes(key)
  const showTitle = key !== 'OUR_BOOKS' && key !== 'DAILY_LEARNING'
  const showHref = key === 'QUICK_LINKS'
  const showIcon = key === 'QUICK_LINKS'
  const imageSpecs = SECTION_IMAGE_SPECS[key]
  const itemsLabel =
    key === 'OUR_BOOKS'
      ? 'Book Covers'
      : key === 'DAILY_LEARNING'
        ? 'Slides'
        : key === 'COURSES'
          ? 'Courses'
          : 'Items'
  const itemLabelPrefix =
    key === 'OUR_BOOKS'
      ? 'Book Cover'
      : key === 'DAILY_LEARNING'
        ? 'Slide'
        : key === 'COURSES'
          ? 'Course'
          : 'Item'

  const imageFieldCopy = {
    OUR_BOOKS: {
      label: 'Book Cover Image',
      uploadButtonLabel: 'Upload book cover',
      requiredMessage: 'Book cover image is required',
    },
    DAILY_LEARNING: {
      label: 'Slide Image',
      uploadButtonLabel: 'Upload slide image',
      requiredMessage: 'Slide image is required',
    },
    COURSES: {
      label: 'Course Image',
      uploadButtonLabel: 'Upload course image',
      requiredMessage: 'Course image is required',
    },
  }[key]

  return (
    <div className="space-y-4">
      {showImageUpload && imageSpecs && (
        <OurBooksImageSpecsBanner specs={imageSpecs} />
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#14213D]">{itemsLabel}</p>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef6fc] px-3 py-2 text-xs font-semibold text-[#246392] transition hover:bg-[#dceefb]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      </div>
      {error && <p className="text-xs text-[#dc2626]">{error}</p>}
      {rows.map((item, index) => (
        <div
          key={`sidebar-item-${index}`}
          className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              {itemLabelPrefix} {index + 1}
            </p>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#dc2626] hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {showTitle && (
              <WebsiteField label="Title" required>
                <input
                  type="text"
                  value={item.title}
                  onChange={(event) => updateItem(index, { title: event.target.value })}
                  className={websiteInputClass}
                />
                {itemErrors[`itemTitle_${index}`] && (
                  <p className="mt-1 text-xs text-[#dc2626]">{itemErrors[`itemTitle_${index}`]}</p>
                )}
              </WebsiteField>
            )}
            {showHref && (
              <WebsiteField label="Link URL">
                <input
                  type="text"
                  value={item.href}
                  onChange={(event) => updateItem(index, { href: event.target.value })}
                  className={websiteInputClass}
                  placeholder="/current-affairs/..."
                />
              </WebsiteField>
            )}
            {showImageUpload && imageSpecs && imageFieldCopy && (
              <OurBooksImageField
                id={`sidebar-image-item-${key}-${index}`}
                specs={imageSpecs}
                label={imageFieldCopy.label}
                uploadButtonLabel={imageFieldCopy.uploadButtonLabel}
                requiredMessage={imageFieldCopy.requiredMessage}
                value={item.imageUrl}
                file={item.imageFile}
                onFileChange={(imageFile) => updateItem(index, { imageFile, imageUrl: '' })}
                invalid={Boolean(itemErrors[`itemImage_${index}`])}
                errorMessage={itemErrors[`itemImage_${index}`]}
              />
            )}
            {showYoutubeUrl && (
              <WebsiteField label="YouTube URL" className="sm:col-span-2" required>
                <input
                  type="url"
                  value={item.href}
                  onChange={(event) => updateItem(index, { href: event.target.value })}
                  className={websiteInputClass}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {itemErrors[`itemYoutubeUrl_${index}`] && (
                  <p className="mt-1 text-xs text-[#dc2626]">
                    {itemErrors[`itemYoutubeUrl_${index}`]}
                  </p>
                )}
              </WebsiteField>
            )}
            {showIcon && (
              <WebsiteField label="Icon">
                <input
                  type="text"
                  value={item.icon}
                  onChange={(event) => updateItem(index, { icon: event.target.value })}
                  className={websiteInputClass}
                  placeholder="💡"
                />
              </WebsiteField>
            )}
            <WebsiteField label="Sort Order">
              <input
                type="number"
                min={1}
                value={item.sortOrder}
                onChange={(event) =>
                  updateItem(index, { sortOrder: Number(event.target.value) || 1 })
                }
                className={websiteInputClass}
              />
            </WebsiteField>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#333]">
            <input
              type="checkbox"
              checked={item.isActive !== false}
              onChange={(event) => updateItem(index, { isActive: event.target.checked })}
              className="rounded border-[#cbd5e1]"
            />
            Active
          </label>
        </div>
      ))}
    </div>
  )
}

export function QuickLinksToggleField({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#333]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="rounded border-[#cbd5e1]"
      />
      {label}
    </label>
  )
}

export function QuickLinksSaveBar({ saving, onCancel, onSave }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#eef2fc] bg-white px-5 py-4 sm:px-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-[#d0d7e2] px-5 py-2.5 text-sm font-semibold text-[#667085] transition hover:bg-[#f8fafc] disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={cn(
          'rounded-lg bg-[#246392] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5278] disabled:opacity-50',
        )}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
