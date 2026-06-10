/** UI-only helpers for Pune center course form customization */

export const DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_PUNE = 'Key Highlights Of Course'
export const DEFAULT_SECTION_TITLE_HOW_HELPS_PUNE = 'How Will This Course Help You'

export function isPuneCenter(centerLabel = '') {
  const normalized = String(centerLabel || '').trim().toLowerCase()
  return normalized === 'pune' || normalized === 'pune center'
}

export function createEmptyMediaSlot() {
  return { fileName: '', preview: '', file: null }
}

export function createEmptyHowHelpsPoint(index = 0) {
  return { id: `hp-pune-${Date.now()}-${index}`, text: '' }
}

export function createEmptyPuneUi() {
  return {
    whyChooseImage: createEmptyMediaSlot(),
    howHelpsPoints: [createEmptyHowHelpsPoint(0)],
    howHelpsImage: createEmptyMediaSlot(),
  }
}

export function resolvePuneUi(form = {}) {
  const stored = form.puneUi || form.courseFormData?.puneUi
  if (stored && typeof stored === 'object') {
    const empty = createEmptyPuneUi()
    return {
      ...empty,
      ...stored,
      whyChooseImage: {
        ...empty.whyChooseImage,
        ...(stored.whyChooseImage || {}),
      },
      howHelpsPoints: (stored.howHelpsPoints || []).length
        ? stored.howHelpsPoints.map((point, index) => ({
            id: point.id || `hp-pune-${index}`,
            text: point.text || '',
          }))
        : [createEmptyHowHelpsPoint(0)],
      howHelpsImage: {
        ...empty.howHelpsImage,
        ...(stored.howHelpsImage || {}),
      },
    }
  }
  return createEmptyPuneUi()
}
