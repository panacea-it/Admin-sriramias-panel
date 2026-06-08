/** Default empty feature card for admin repeater */
export function emptyWhyChooseFeature(order = 1) {
  return {
    id: `wcf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    return form.whyChooseFeatures.map((f, i) => ({
      id: f.id || `wcf-${i}`,
      icon: f.icon || f.iconPreview || '',
      iconPreview: f.iconPreview || f.icon || '',
      iconFileName: f.iconFileName || '',
      iconFile: f.iconFile || null,
      title: f.title || '',
      description: f.description || '',
      isHighlighted: Boolean(f.isHighlighted),
      order: Number(f.order) || i + 1,
    }))
  }
  const parsed = tryParseWhyChooseJson(form?.whyChooseCourse)
  if (parsed?.length) {
    return parsed.map((f, i) => ({
      id: f.id || `wcf-${i}`,
      icon: f.icon || f.iconPreview || '',
      iconPreview: f.iconPreview || f.icon || '',
      iconFileName: f.iconFileName || '',
      title: f.title || '',
      description: f.description || '',
      isHighlighted: Boolean(f.isHighlighted),
      order: Number(f.order) || i + 1,
    }))
  }
  if (form?.whyChoose?.length) {
    return form.whyChoose.map((slot, i) => ({
      id: slot.id || `wcf-${i}`,
      icon: '',
      iconPreview: '',
      iconFileName: slot.fileName || '',
      title: '',
      description: '',
      isHighlighted: i === 0,
      order: i + 1,
    }))
  }
  return [emptyWhyChooseFeature(1)]
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
