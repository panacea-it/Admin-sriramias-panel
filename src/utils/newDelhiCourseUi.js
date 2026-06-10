/** UI-only helpers for New Delhi center course form customization */

export function isNewDelhiCenter(centerLabel = '') {
  const normalized = String(centerLabel || '').trim().toLowerCase()
  return normalized === 'new delhi' || normalized === 'delhi center'
}

export function createEmptyWhyChooseImageSlot() {
  return { fileName: '', preview: '', file: null }
}

export function createEmptyHowHelpsPoint(index = 0) {
  return { id: `hp-${Date.now()}-${index}`, text: '' }
}

export function createEmptyHelpSectionExtraImage() {
  return {
    id: `hx-${Date.now()}`,
    fileName: '',
    preview: '',
    file: null,
  }
}

export function createEmptyNewDelhiUi() {
  return {
    whyChooseImage: createEmptyWhyChooseImageSlot(),
    howHelpsPoints: [createEmptyHowHelpsPoint(0)],
    helpSectionExtraImages: [],
  }
}

export function resolveNewDelhiUi(form = {}) {
  const stored = form.newDelhiUi || form.courseFormData?.newDelhiUi
  if (stored && typeof stored === 'object') {
    return {
      ...createEmptyNewDelhiUi(),
      ...stored,
      whyChooseImage: {
        ...createEmptyWhyChooseImageSlot(),
        ...(stored.whyChooseImage || {}),
      },
      howHelpsPoints: (stored.howHelpsPoints || []).length
        ? stored.howHelpsPoints.map((point, index) => ({
            id: point.id || `hp-${index}`,
            text: point.text || '',
          }))
        : [createEmptyHowHelpsPoint(0)],
      helpSectionExtraImages: Array.isArray(stored.helpSectionExtraImages)
        ? stored.helpSectionExtraImages
        : [],
    }
  }
  return createEmptyNewDelhiUi()
}

export function keyFeaturePointsFromSlots(keyFeatures = []) {
  const slots = keyFeatures?.length ? keyFeatures : []
  const points = slots.slice(1).map((slot, index) => ({
    id: slot.id || `kf-p-${index}`,
    text: slot.text || '',
  }))
  return points.length ? points : [{ id: 'kf-p-0', text: '' }]
}

export function syncKeyFeatureSlots(keyFeatures = [], points = []) {
  const imageSlot = keyFeatures[0] || {
    id: 'kf-0',
    fileName: '',
    text: '',
    preview: '',
    file: null,
  }
  return [
    imageSlot,
    ...points.map((point, index) => ({
      id: point.id || `kf-p-${index}`,
      fileName: '',
      text: point.text || '',
    })),
  ]
}
