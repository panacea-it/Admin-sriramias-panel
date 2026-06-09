/** Categories → Courses form state (course-level marketing content from legacy batch dialog) */

import {
  emptyWhyChooseFeature,
  mapWhyChooseFeaturesForWebsite,
  normalizeWhyChooseFeatures,
} from './whyChooseFeatures'
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
    return list.map((slot, i) => ({
      id: slot.id || `kf-${i}`,
      fileName: slot.fileName || '',
      text: slot.text || '',
      preview: slot.preview || '',
    }))
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

function mergeItemWithCourseFormData(item) {
  const stored = item?.courseFormData || {}
  if (!stored || typeof stored !== 'object') return item

  return {
    ...item,
    overview: stored.overview ?? item.overview ?? item.courseOverview,
    keyFeatures: stored.keyFeatures?.length ? stored.keyFeatures : item.keyFeatures,
    whyChooseFeatures: stored.whyChooseFeatures?.length
      ? stored.whyChooseFeatures
      : item.whyChooseFeatures,
    howWill: stored.howWill?.length ? stored.howWill : item.howWill,
    sectionTitleOverview: stored.sectionTitleOverview ?? item.sectionTitleOverview,
    sectionTitleKeyFeatures: stored.sectionTitleKeyFeatures ?? item.sectionTitleKeyFeatures,
    sectionTitleWhyChoose: stored.sectionTitleWhyChoose ?? item.sectionTitleWhyChoose,
    sectionTitleHowHelps: stored.sectionTitleHowHelps ?? item.sectionTitleHowHelps,
    whyChooseTitle: stored.whyChooseTitle ?? item.whyChooseTitle ?? '',
    whyChooseSubtitle: stored.whyChooseSubtitle ?? item.whyChooseSubtitle ?? '',
    newDelhiUi: stored.newDelhiUi ?? item.newDelhiUi,
    hyderabadUi: stored.hyderabadUi ?? item.hyderabadUi,
    puneUi: stored.puneUi ?? item.puneUi,
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
    howWill = howWill.map((slot, i) => ({
      id: slot.id || `hw-${i}`,
      kind: slot.kind || (i === 0 || i === 3 ? 'video' : 'image'),
      fileName: slot.fileName || '',
      placeholder:
        slot.placeholder ||
        (slot.kind === 'video'
          ? 'Video to be played for motion effect'
          : 'Image to be displayed'),
      preview: slot.preview || '',
    }))
  }

  const defaults = buildDefaultSectionTitles({
    courseName: row.name,
  })

  return {
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
    newDelhiUi: resolveNewDelhiUi(row),
    hyderabadUi: resolveHyderabadUi(row),
    puneUi: resolvePuneUi(row),
  }
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
