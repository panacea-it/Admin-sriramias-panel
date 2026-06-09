/** UI-only helpers for Hyderabad center course form customization */

export const DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_HYDERABAD = 'Key Highlights Of Course'
export const DEFAULT_SECTION_TITLE_HOW_HELPS_HYDERABAD = 'How Will This Course Help You'

export function isHyderabadCenter(centerLabel = '') {
  const normalized = String(centerLabel || '').trim().toLowerCase()
  return normalized === 'hyderabad' || normalized === 'hyderabad center'
}

export function createEmptyMediaSlot() {
  return { fileName: '', preview: '', file: null }
}

export function createEmptyHowHelpsPoint(index = 0) {
  return { id: `hp-hyd-${Date.now()}-${index}`, text: '' }
}

export function createEmptyHyderabadUi() {
  return {
    whyChooseMedia: {
      image1: createEmptyMediaSlot(),
      image2: createEmptyMediaSlot(),
      video: createEmptyMediaSlot(),
    },
    howHelpsPoints: [createEmptyHowHelpsPoint(0)],
    howHelpsMedia: {
      video: createEmptyMediaSlot(),
      image: createEmptyMediaSlot(),
    },
  }
}

export function resolveHyderabadUi(form = {}) {
  const stored = form.hyderabadUi || form.courseFormData?.hyderabadUi
  if (stored && typeof stored === 'object') {
    const empty = createEmptyHyderabadUi()
    return {
      ...empty,
      ...stored,
      whyChooseMedia: {
        image1: { ...empty.whyChooseMedia.image1, ...(stored.whyChooseMedia?.image1 || {}) },
        image2: { ...empty.whyChooseMedia.image2, ...(stored.whyChooseMedia?.image2 || {}) },
        video: { ...empty.whyChooseMedia.video, ...(stored.whyChooseMedia?.video || {}) },
      },
      howHelpsPoints: (stored.howHelpsPoints || []).length
        ? stored.howHelpsPoints.map((point, index) => ({
            id: point.id || `hp-hyd-${index}`,
            text: point.text || '',
          }))
        : [createEmptyHowHelpsPoint(0)],
      howHelpsMedia: {
        video: { ...empty.howHelpsMedia.video, ...(stored.howHelpsMedia?.video || {}) },
        image: { ...empty.howHelpsMedia.image, ...(stored.howHelpsMedia?.image || {}) },
      },
    }
  }
  return createEmptyHyderabadUi()
}
