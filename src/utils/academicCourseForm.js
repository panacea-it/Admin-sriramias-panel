/** Categories → Courses form state (course-level marketing content from legacy batch dialog) */

import {
  emptyWhyChooseFeature,
  mapWhyChooseFeaturesForWebsite,
  normalizeWhyChooseFeatures,
} from './whyChooseFeatures'
import {
  fileNameFromMediaUrl,
  normalizeCourseMediaList,
  resolveCourseMediaUrl,
  resolveUiMediaSlot,
} from './courseMediaPrefill'
import { createEmptyNewDelhiUi, resolveNewDelhiUi } from './newDelhiCourseUi'
import { createEmptyHyderabadUi, resolveHyderabadUi } from './hyderabadCourseUi'
import { createEmptyPuneUi, resolvePuneUi } from './puneCourseUi'

const makeSlots = (count, factory) => Array.from({ length: count }, (_, i) => factory(i))

export function emptySubjectRow() {
  return { subjectName: '', facultyName: '' }
}

export function createDefaultKeyFeatureSlots() {
  return makeSlots(6, (i) => ({ id: `kf-${i}`, fileName: '', text: '' }))
}

export function createDefaultHowWillSlots() {
  return makeSlots(6, (i) => ({
    id: `hw-${i}`,
    kind: i === 0 || i === 3 ? 'video' : 'image',
    fileName: '',
    placeholder:
      i === 0 || i === 3
        ? 'Video to be played for motion effect'
        : 'Image to be displayed',
  }))
}

/** @deprecated Use createDefaultKeyFeatureSlots */
export const createEmptyKeyFeatureSlots = createDefaultKeyFeatureSlots

/** @deprecated Use createDefaultHowWillSlots */
export const createEmptyHowWillSlots = createDefaultHowWillSlots

export const DEFAULT_SECTION_TITLE_OVERVIEW = 'Course Overview'
export const DEFAULT_SECTION_TITLE_KEY_FEATURES = 'Key Features Of Course'
export const DEFAULT_WHY_CHOOSE_TITLE = 'Why Choose This Course?'
export const DEFAULT_WHY_CHOOSE_SUBTITLE =
  'Discover how this course can help you achieve your goals.'

/** @deprecated Legacy auto-generated titles; only used when migrating stored values */
export function buildWhyChooseTitle({ examCategory, courseName }) {
  const cat = examCategory?.trim() || 'Category'
  const name = courseName?.trim() || 'Course Name'
  return `Why Choose ${cat} ${name} Course Help You?`
}

export function resolveWhyChooseTitle(row = {}) {
  const explicit = row.whyChooseTitle?.trim()
  if (explicit) return explicit
  const legacy = row.sectionTitleWhyChoose?.trim()
  if (legacy) return legacy
  return DEFAULT_WHY_CHOOSE_TITLE
}

export function resolveWhyChooseSubtitle(row = {}) {
  const explicit = row.whyChooseSubtitle?.trim()
  if (explicit) return explicit
  return DEFAULT_WHY_CHOOSE_SUBTITLE
}

export function buildHowHelpsTitle(courseName) {
  const name = courseName?.trim() || 'Course Name'
  return `How Will the ${name} Helps You ?`
}

export function buildDefaultSectionTitles({ courseName = '' } = {}) {
  return {
    sectionTitleOverview: DEFAULT_SECTION_TITLE_OVERVIEW,
    sectionTitleKeyFeatures: DEFAULT_SECTION_TITLE_KEY_FEATURES,
    sectionTitleWhyChoose: DEFAULT_WHY_CHOOSE_TITLE,
    sectionTitleHowHelps: buildHowHelpsTitle(courseName),
  }
}

export function createEmptyAcademicCourseContent(meta = {}) {
  return {
    subjects: [],
    overview: '',
    keyFeatures: createDefaultKeyFeatureSlots(),
    whyChooseFeatures: [emptyWhyChooseFeature(1)],
    howWill: createDefaultHowWillSlots(),
    whyChooseTitle: '',
    whyChooseSubtitle: '',
    ...buildDefaultSectionTitles(meta),
  }
}

export function normalizeSubjects(list) {
  const rows = (list || []).map((s) => ({
    subjectName: String(s?.subjectName || '').trim(),
    facultyName: String(s?.facultyName || '').trim(),
  }))
  return rows.length ? rows : [emptySubjectRow()]
}

function normalizeKeyFeatureSlots(list) {
  if (!list?.length) return createDefaultKeyFeatureSlots()
  if (
    typeof list[0] === 'object' &&
    (list[0].id != null || list[0].text != null || list[0].fileName != null)
  ) {
    return list.map((slot, i) =>
      resolveUiMediaSlot({
        id: slot.id || `kf-${i}`,
        fileName: slot.fileName || '',
        text: slot.text || '',
        preview: slot.preview || slot.existingUrl || '',
        existingUrl: slot.existingUrl || slot.preview || '',
        file: slot.file || null,
      }),
    )
  }
  const slots = createDefaultKeyFeatureSlots()
  list.forEach((entry, i) => {
    const text = String(entry || '').trim()
    if (!text) return
    const targetIndex = i + 1
    if (targetIndex < slots.length) {
      slots[targetIndex] = { ...slots[targetIndex], text }
    } else {
      slots.push({
        id: `kf-mig-${targetIndex}`,
        fileName: '',
        text,
      })
    }
  })
  return slots
}

function hasUsableList(value) {
  return Array.isArray(value) && value.length > 0
}

function pickStoredList(primary, stored) {
  return hasUsableList(primary) ? primary : stored
}

function mergeItemWithCourseFormData(item) {
  const stored = item?.courseFormData || {}
  if (!stored || typeof stored !== 'object') return item

  return {
    ...item,
    overview: item.overview ?? item.courseOverview ?? stored.overview ?? '',
    keyFeatures: pickStoredList(item.keyFeatures, stored.keyFeatures),
    whyChooseFeatures: pickStoredList(item.whyChooseFeatures, stored.whyChooseFeatures),
    howWill: pickStoredList(item.howWill, stored.howWill),
    sectionTitleOverview: item.sectionTitleOverview ?? stored.sectionTitleOverview,
    sectionTitleKeyFeatures: item.sectionTitleKeyFeatures ?? stored.sectionTitleKeyFeatures,
    sectionTitleWhyChoose: item.sectionTitleWhyChoose ?? stored.sectionTitleWhyChoose,
    sectionTitleHowHelps: item.sectionTitleHowHelps ?? stored.sectionTitleHowHelps,
    whyChooseTitle: item.whyChooseTitle ?? stored.whyChooseTitle ?? '',
    whyChooseSubtitle: item.whyChooseSubtitle ?? stored.whyChooseSubtitle ?? '',
    newDelhiUi: item.newDelhiUi ?? stored.newDelhiUi,
    hyderabadUi: item.hyderabadUi ?? stored.hyderabadUi,
    puneUi: item.puneUi ?? stored.puneUi,
  }
}

function fillMediaSlot(slot = {}, url = '') {
  const preview = resolveCourseMediaUrl(url)
  if (!preview) return resolveUiMediaSlot(slot)
  if (resolveCourseMediaUrl(slot.preview || slot.existingUrl)) {
    return resolveUiMediaSlot(slot)
  }
  return resolveUiMediaSlot({
    ...slot,
    preview,
    existingUrl: preview,
    fileName: slot.fileName || fileNameFromMediaUrl(preview) || 'uploaded-file',
  })
}

function applyApiMediaToFormContent(content, row = {}) {
  const keyFeatureImage = resolveCourseMediaUrl(row.keyFeatureImage)
  const whyChooseImages = normalizeCourseMediaList(row.whyChooseImages)
  const whyChooseVideo = resolveCourseMediaUrl(row.whyChooseVideo)
  const helpSectionImages = normalizeCourseMediaList(row.helpSectionImages)
  const helpSectionVideo = resolveCourseMediaUrl(row.helpSectionVideo)

  const keyFeatures = [...(content.keyFeatures || [])]
  if (keyFeatureImage) {
    const current = keyFeatures[0] || { id: 'kf-0', fileName: '', text: '' }
    keyFeatures[0] = fillMediaSlot(current, keyFeatureImage)
  }

  const howWill = (() => {
    let imageSlotIndex = 0
    let videoAssigned = false
    return (content.howWill || []).map((slot) => {
      const resolved = resolveUiMediaSlot(slot)
      if (resolved.kind === 'video') {
        if (!videoAssigned && helpSectionVideo) {
          videoAssigned = true
          return fillMediaSlot(resolved, helpSectionVideo)
        }
        return resolved
      }
      const imageUrl = helpSectionImages[imageSlotIndex]
      imageSlotIndex += 1
      return imageUrl ? fillMediaSlot(resolved, imageUrl) : resolved
    })
  })()

  const hyderabadUi = content.hyderabadUi || createEmptyHyderabadUi()
  const newDelhiUi = content.newDelhiUi || createEmptyNewDelhiUi()
  const puneUi = content.puneUi || createEmptyPuneUi()

  return {
    ...content,
    keyFeatures,
    howWill,
    hyderabadUi: {
      ...hyderabadUi,
      whyChooseMedia: {
        image1: fillMediaSlot(hyderabadUi.whyChooseMedia?.image1, whyChooseImages[0]),
        image2: fillMediaSlot(hyderabadUi.whyChooseMedia?.image2, whyChooseImages[1]),
        video: fillMediaSlot(hyderabadUi.whyChooseMedia?.video, whyChooseVideo),
      },
      howHelpsMedia: {
        video: fillMediaSlot(hyderabadUi.howHelpsMedia?.video, helpSectionVideo),
        image: fillMediaSlot(hyderabadUi.howHelpsMedia?.image, helpSectionImages[0]),
      },
    },
    newDelhiUi: {
      ...newDelhiUi,
      whyChooseImage: fillMediaSlot(newDelhiUi.whyChooseImage, whyChooseImages[0]),
    },
    puneUi: {
      ...puneUi,
      whyChooseImage: fillMediaSlot(puneUi.whyChooseImage, whyChooseImages[0]),
      howHelpsImage: fillMediaSlot(puneUi.howHelpsImage, helpSectionImages[0]),
    },
  }
}

export function academicCourseItemToContent(item) {
  if (!item) return createEmptyAcademicCourseContent()

  const row = mergeItemWithCourseFormData(item)
  const overview = row.overview ?? row.courseOverview ?? ''
  const keyFeatures = normalizeKeyFeatureSlots(row.keyFeatures)
  const whyChooseFeatures = normalizeWhyChooseFeatures({
    whyChooseFeatures: row.whyChooseFeatures,
    whyChoose: row.whyChoose,
    whyChooseCourse: row.whyChooseCourse,
  })

  if (row.whyChooseCourse && !whyChooseFeatures.some((f) => f.description?.trim())) {
    whyChooseFeatures[0] = {
      ...whyChooseFeatures[0],
      description: row.whyChooseCourse,
    }
  }

  let howWill = row.howWill
  if (!howWill?.length && row.howCourseHelps) {
    howWill = createDefaultHowWillSlots()
    howWill[0] = {
      ...howWill[0],
      fileName: row.howCourseHelps,
      placeholder: 'Image to be displayed',
    }
  } else if (!howWill?.length) {
    howWill = createDefaultHowWillSlots()
  } else {
    howWill = howWill.map((slot, i) => {
      const kind = slot.kind || (i === 0 || i === 3 ? 'video' : 'image')
      return resolveUiMediaSlot({
        id: slot.id || `hw-${i}`,
        kind,
        fileName: slot.fileName || '',
        placeholder:
          slot.placeholder ||
          (kind === 'video'
            ? 'Video to be played for motion effect'
            : 'Image to be displayed'),
        preview: slot.preview || slot.existingUrl || '',
        existingUrl: slot.existingUrl || slot.preview || '',
        file: slot.file || null,
      })
    })
  }

  const defaults = buildDefaultSectionTitles({
    courseName: row.name,
  })

  const newDelhiUi = resolveNewDelhiUi(row)
  const hyderabadUi = resolveHyderabadUi(row)
  const puneUi = resolvePuneUi(row)

  return applyApiMediaToFormContent(
    {
      subjects: normalizeSubjects(row.subjects),
      overview,
      keyFeatures,
      whyChooseFeatures,
      howWill,
      whyChooseTitle: row.whyChooseTitle?.trim() || row.sectionTitleWhyChoose?.trim() || '',
      whyChooseSubtitle: row.whyChooseSubtitle?.trim() || '',
      sectionTitleOverview:
        row.sectionTitleOverview?.trim() || defaults.sectionTitleOverview,
      sectionTitleKeyFeatures:
        row.sectionTitleKeyFeatures?.trim() || defaults.sectionTitleKeyFeatures,
      sectionTitleWhyChoose:
        row.sectionTitleWhyChoose?.trim() || defaults.sectionTitleWhyChoose,
      sectionTitleHowHelps:
        row.sectionTitleHowHelps?.trim() || defaults.sectionTitleHowHelps,
      newDelhiUi: {
        ...newDelhiUi,
        whyChooseImage: resolveUiMediaSlot(newDelhiUi.whyChooseImage),
        helpSectionExtraImages: (newDelhiUi.helpSectionExtraImages || []).map(resolveUiMediaSlot),
      },
      hyderabadUi: {
        ...hyderabadUi,
        whyChooseMedia: {
          image1: resolveUiMediaSlot(hyderabadUi.whyChooseMedia?.image1),
          image2: resolveUiMediaSlot(hyderabadUi.whyChooseMedia?.image2),
          video: resolveUiMediaSlot(hyderabadUi.whyChooseMedia?.video),
        },
        howHelpsMedia: {
          video: resolveUiMediaSlot(hyderabadUi.howHelpsMedia?.video),
          image: resolveUiMediaSlot(hyderabadUi.howHelpsMedia?.image),
        },
      },
      puneUi: {
        ...puneUi,
        whyChooseImage: resolveUiMediaSlot(puneUi.whyChooseImage),
        howHelpsImage: resolveUiMediaSlot(puneUi.howHelpsImage),
      },
    },
    row,
  )
}

export function getCourseMarketingSectionTitles(course = {}, meta = {}) {
  const courseName = meta.courseName ?? course.name ?? course.courseName ?? ''
  const defaults = buildDefaultSectionTitles({ courseName })

  return {
    overview:
      course.sectionTitleOverview?.trim() || defaults.sectionTitleOverview,
    keyFeatures:
      course.sectionTitleKeyFeatures?.trim() || defaults.sectionTitleKeyFeatures,
    whyChoose: resolveWhyChooseTitle(course),
    whyChooseSubtitle: resolveWhyChooseSubtitle(course),
    howHelps:
      course.sectionTitleHowHelps?.trim() || defaults.sectionTitleHowHelps,
  }
}

/** Student website course detail sections */
export function mapCourseMarketingForWebsite(course = {}) {
  const content = academicCourseItemToContent(course)
  const sectionTitles = getCourseMarketingSectionTitles(course)

  return {
    sectionTitles,
    overview: content.overview,
    courseOverview: content.overview,
    keyFeatures: content.keyFeatures,
    whyChooseTitle: sectionTitles.whyChoose,
    whyChooseSubtitle: sectionTitles.whyChooseSubtitle,
    whyChooseFeatures: mapWhyChooseFeaturesForWebsite({
      whyChooseFeatures: content.whyChooseFeatures,
      whyChooseCourse: course.whyChooseCourse,
    }),
    howWill: content.howWill,
    howCourseHelps: course.howCourseHelps || legacyHowCourseHelpsSummary(content.howWill),
  }
}

/** Alias for website consumers */
export const mapAcademicCourseForWebsite = mapCourseMarketingForWebsite

export function validateAcademicCourseContent() {
  return {}
}

function legacyKeyFeatureStrings(slots) {
  return (slots || [])
    .slice(1)
    .map((s) => String(s?.text || '').trim())
    .filter(Boolean)
}

function legacyWhyChooseSummary(features) {
  return normalizeWhyChooseFeatures({ whyChooseFeatures: features })
    .map((f) => [f.title, f.description].filter(Boolean).join(': '))
    .filter(Boolean)
    .join('\n\n')
}

function serializeWhyChooseForApi(features) {
  const normalized = normalizeWhyChooseFeatures({ whyChooseFeatures: features })
  const hasRich = normalized.some(
    (f) =>
      f.title ||
      f.description ||
      f.icon ||
      f.iconPreview ||
      f.isHighlighted,
  )
  if (hasRich) return JSON.stringify(normalized)
  return legacyWhyChooseSummary(normalized)
}

function legacyHowCourseHelpsSummary(slots) {
  return (slots || [])
    .map((s) => s.fileName || s.preview)
    .filter(Boolean)
    .join(', ')
}

export function serializeAcademicCourseContent(form, meta = {}) {
  const overview = String(form.overview ?? form.courseOverview ?? '').trim()
  const keyFeatures = normalizeKeyFeatureSlots(form.keyFeatures)
  const whyChooseFeatures = normalizeWhyChooseFeatures(form)
  const howWill = (form.howWill || createDefaultHowWillSlots()).map((slot, i) => ({
    id: slot.id || `hw-${i}`,
    kind: slot.kind || 'image',
    fileName: slot.fileName || '',
    placeholder: slot.placeholder || 'Image to be displayed',
    preview: slot.preview || '',
    file: slot.file instanceof File ? slot.file : null,
  }))

  const titles = getCourseMarketingSectionTitles(form, {
    examCategory: meta.examCategory ?? form.examCategory,
    courseName: meta.courseName ?? form.name ?? form.courseName,
  })

  const sectionTitleOverview = String(
    form.sectionTitleOverview ?? titles.overview,
  ).trim()
  const sectionTitleKeyFeatures = String(
    form.sectionTitleKeyFeatures ?? titles.keyFeatures,
  ).trim()
  const whyChooseTitle = resolveWhyChooseTitle(form)
  const whyChooseSubtitle = resolveWhyChooseSubtitle(form)
  const sectionTitleWhyChoose = whyChooseTitle
  const sectionTitleHowHelps = String(
    form.sectionTitleHowHelps ?? titles.howHelps,
  ).trim()
  const newDelhiUi = form.newDelhiUi || createEmptyNewDelhiUi()
  const hyderabadUi = form.hyderabadUi || createEmptyHyderabadUi()
  const puneUi = form.puneUi || createEmptyPuneUi()

  return {
    subjects: normalizeSubjects(form.subjects).filter((s) => s.subjectName),
    overview,
    keyFeatures,
    whyChooseFeatures,
    howWill,
    whyChooseTitle,
    whyChooseSubtitle,
    sectionTitleOverview,
    sectionTitleKeyFeatures,
    sectionTitleWhyChoose,
    sectionTitleHowHelps,
    courseOverview: overview,
    keyFeaturesText: legacyKeyFeatureStrings(keyFeatures),
    whyChooseCourse: serializeWhyChooseForApi(whyChooseFeatures),
    howCourseHelps: legacyHowCourseHelpsSummary(howWill),
    sectionTitles: titles,
    courseFormData: {
      overview,
      keyFeatures,
      whyChooseFeatures,
      howWill,
      whyChooseTitle,
      whyChooseSubtitle,
      sectionTitleOverview,
      sectionTitleKeyFeatures,
      sectionTitleWhyChoose,
      sectionTitleHowHelps,
      newDelhiUi,
      hyderabadUi,
      puneUi,
    },
  }
}
