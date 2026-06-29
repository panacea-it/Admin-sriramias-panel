import { resolveCourseMediaUrl, fileNameFromMediaUrl } from './courseMediaPrefill'

function stableFeatureId(seed, index) {
  if (seed) return String(seed)
  return `wcf-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`
}

function mapFeatureFields(f, index) {
  const iconPreview = resolveCourseMediaUrl(f.iconPreview || f.icon || '')
  return {
    id: stableFeatureId(f.id, index),
    icon: iconPreview,
    iconPreview,
    iconFileName: f.iconFileName || (iconPreview ? fileNameFromMediaUrl(iconPreview) : ''),
    iconFile: f.iconFile || null,
    title: f.title || '',
    description: f.description || '',
    isHighlighted: Boolean(f.isHighlighted),
    order: Number(f.order) || index + 1,
  }
}

/** Default empty feature card for admin repeater */
export function emptyWhyChooseFeature(order = 1) {
  return {
    id: stableFeatureId(null, order),
    icon: '',
    iconPreview: '',
    iconFileName: '',
    iconFile: null,
    title: '',
    description: '',
    isHighlighted: false,
    order,
  }
}

function tryParseWhyChooseJson(raw) {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* plain text */
  }
  return null
}

/** Migrate legacy whyChoose slots → whyChooseFeatures */
export function normalizeWhyChooseFeatures(form) {
  if (form?.whyChooseFeatures?.length) {
    return form.whyChooseFeatures.map(mapFeatureFields)
  }
  const parsed = tryParseWhyChooseJson(form?.whyChooseCourse)
  if (parsed?.length) {
    return parsed.map(mapFeatureFields)
  }
  if (form?.whyChoose?.length) {
    return form.whyChoose.map((slot, i) => ({
      id: stableFeatureId(slot.id, i),
      icon: '',
      iconPreview: '',
      iconFileName: slot.fileName || '',
      iconFile: null,
      title: '',
      description: '',
      isHighlighted: i === 0,
      order: i + 1,
    }))
  }
  return [emptyWhyChooseFeature(1)]
}

/** Keep display order aligned with repeater array position after move/remove. */
export function syncWhyChooseFeatureOrders(features = []) {
  return features.map((feature, index) => ({
    ...feature,
    order: index + 1,
  }))
}

/** Sorted cards for student website rendering */
export function mapWhyChooseFeaturesForWebsite(formData) {
  const features = normalizeWhyChooseFeatures(formData || {})
  return [...features]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((f) => ({
      icon: f.icon || f.iconPreview,
      title: f.title,
      description: f.description,
      isHighlighted: f.isHighlighted,
      order: f.order,
    }))
}
