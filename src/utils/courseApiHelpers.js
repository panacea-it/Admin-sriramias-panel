import { resolveWhyChooseTitle } from './academicCourseForm'
import { keyFeaturePointsFromSlots } from './newDelhiCourseUi'
import {
  createEmptyHyderabadUi,
  isHyderabadCenter,
  resolveHyderabadUi,
} from './hyderabadCourseUi'
import { isNewDelhiCenter, resolveNewDelhiUi } from './newDelhiCourseUi'
import { isPuneCenter, resolvePuneUi } from './puneCourseUi'
import {
  fileNameFromMediaUrl,
  mapDemoVideoFromCourse,
  normalizeCourseMediaList,
  resolveCourseMediaUrl,
} from './courseMediaPrefill'
import { normalizeWhyChooseFeatures } from './whyChooseFeatures'

export function mapCourseStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  if (statusFilter === 'all') return undefined
  const raw = String(statusFilter || '').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'ACTIVE') return 'ACTIVE'
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE') return 'INACTIVE'
  return undefined
}

export function mapApiCourseStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'In Active'
  return 'Active'
}

export function mapUiCourseStatusToApi(status) {
  return mapCourseStatusFilterToApi(status) || 'ACTIVE'
}

export function buildCourseListParams({
  page = 1,
  limit = 10,
  search = '',
  statusFilter = 'all',
  centerFilter = 'all',
  programFilter = 'all',
  categoryId,
  subCategoryId,
} = {}) {
  const params = { page, limit }

  const trimmedSearch = String(search || '').trim()
  if (trimmedSearch) params.search = trimmedSearch

  const apiStatus = mapCourseStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus

  if (centerFilter && centerFilter !== 'all') params.centerId = centerFilter
  if (programFilter && programFilter !== 'all') params.programId = programFilter
  if (categoryId) params.categoryId = categoryId
  if (subCategoryId) params.subCategoryId = subCategoryId

  return params
}

function isExistingMediaUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim())
}

function hasStoredDemoVideo(course = {}) {
  const raw =
    course.demoVideo ??
    course.demoVideoUrl ??
    course.introVideo ??
    course.videoUrl ??
    ''
  return Boolean(String(raw || '').trim())
}

function resolveDemoVideoPayloadUrl(form = {}) {
  const raw = String(form.demoVideoUrl ?? form.demoVideo ?? '').trim()
  if (!raw || raw.startsWith('blob:')) return ''
  const resolved = resolveCourseMediaUrl(raw)
  return resolved || raw
}

function appendDemoVideoFields(formData, form, { isEdit = false, originalCourse = null } = {}) {
  const demoVideoFile = form.demoVideoFile instanceof File ? form.demoVideoFile : null
  const demoVideoUrl = resolveDemoVideoPayloadUrl(form)

  if (demoVideoFile) {
    formData.append('demoVideo', demoVideoFile)
    return
  }

  if (isExistingMediaUrl(demoVideoUrl)) {
    formData.append('demoVideo', demoVideoUrl)
    return
  }

  if (isEdit && hasStoredDemoVideo(originalCourse) && !demoVideoUrl) {
    formData.append('demoVideoRemoveVideo', 'true')
  }
}

function resolveActiveCourseCenterKey(form = {}) {
  const label = String(form.centerName || form.centerLabel || '').trim().toLowerCase()
  if (!label) return null
  if (isHyderabadCenter(label) || label.startsWith('hyderabad')) return 'hyderabad'
  if (isNewDelhiCenter(label) || label.startsWith('new delhi')) return 'new-delhi'
  if (isPuneCenter(label) || label.startsWith('pune')) return 'pune'
  return null
}

function dedupeMediaUrls(urls = []) {
  const seen = new Set()
  return urls.filter((url) => {
    const key = String(url || '').trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function keepUrlFromSlot(slot) {
  if (!slot || slot.file instanceof File) return null
  const url = slot.preview || slot.existingUrl
  return isExistingMediaUrl(url) ? url.trim() : null
}

function collectWhyChooseImageFiles(form) {
  const centerKey = resolveActiveCourseCenterKey(form)
  const files = []

  if (centerKey === 'hyderabad') {
    const ui = mergeHyderabadUiForSubmit(form) || resolveHyderabadUi(form)
    for (const key of ['image1', 'image2']) {
      const file = ui.whyChooseMedia?.[key]?.file
      if (file instanceof File) files.push(file)
    }
    return files
  }

  if (centerKey === 'new-delhi') {
    const file = resolveNewDelhiUi(form).whyChooseImage?.file
    if (file instanceof File) files.push(file)
    return files
  }

  if (centerKey === 'pune') {
    const file = resolvePuneUi(form).whyChooseImage?.file
    if (file instanceof File) files.push(file)
  }

  return files
}

function hasStoredWhyChooseVideo(course = {}) {
  return Boolean(String(course.whyChooseVideo || '').trim())
}

function hasStoredHelpSectionVideo(course = {}) {
  return Boolean(String(course.helpSectionVideo || '').trim())
}

function hasVideoSlotContent(slot) {
  if (!slot || typeof slot !== 'object') return false
  if (slot.file instanceof File) return true
  const preview = slot.preview || slot.existingUrl
  return isExistingMediaUrl(preview) || (typeof preview === 'string' && preview.startsWith('blob:'))
}

function mergeMediaSlotForSubmit(primary, fallback) {
  if (!primary && !fallback) return null
  if (!primary) return fallback
  if (!fallback) return primary
  if (fallback.file instanceof File) return { ...primary, ...fallback }
  if (primary.file instanceof File) return { ...fallback, ...primary }
  return { ...fallback, ...primary }
}

function mergeHyderabadUiForSubmit(form = {}) {
  const top = form.hyderabadUi
  const nested = form.courseFormData?.hyderabadUi
  if (!top && !nested) return null
  if (!top) return nested
  if (!nested || top === nested) return top

  const empty = createEmptyHyderabadUi()
  return {
    ...empty,
    ...nested,
    ...top,
    whyChooseMedia: {
      ...empty.whyChooseMedia,
      ...nested.whyChooseMedia,
      ...top.whyChooseMedia,
      image1: mergeMediaSlotForSubmit(top.whyChooseMedia?.image1, nested.whyChooseMedia?.image1),
      image2: mergeMediaSlotForSubmit(top.whyChooseMedia?.image2, nested.whyChooseMedia?.image2),
      video: mergeMediaSlotForSubmit(top.whyChooseMedia?.video, nested.whyChooseMedia?.video),
    },
    howHelpsMedia: {
      ...empty.howHelpsMedia,
      ...nested.howHelpsMedia,
      ...top.howHelpsMedia,
      video: mergeMediaSlotForSubmit(top.howHelpsMedia?.video, nested.howHelpsMedia?.video),
      image: mergeMediaSlotForSubmit(top.howHelpsMedia?.image, nested.howHelpsMedia?.image),
    },
    howHelpsPoints: top.howHelpsPoints?.length ? top.howHelpsPoints : nested.howHelpsPoints,
  }
}

function resolveWhyChooseVideoSlot(form = {}) {
  const mergedUi = mergeHyderabadUiForSubmit(form)
  const fromMerged = mergedUi?.whyChooseMedia?.video
  const fromResolver = resolveHyderabadUi({
    ...form,
    hyderabadUi: mergedUi || form.hyderabadUi,
  }).whyChooseMedia?.video

  return mergeMediaSlotForSubmit(fromMerged, fromResolver)
}

function collectWhyChooseVideoFile(form) {
  if (form.whyChooseVideoFile instanceof File) return form.whyChooseVideoFile

  const slot = resolveWhyChooseVideoSlot(form)
  return slot?.file instanceof File ? slot.file : null
}

function collectHelpSectionVideoFile(form) {
  const mergedUi = mergeHyderabadUiForSubmit(form)
  const hydSlot = (mergedUi || resolveHyderabadUi(form)).howHelpsMedia?.video
  if (hydSlot?.file instanceof File) return hydSlot.file

  for (const slot of form.howWill || []) {
    if (!(slot?.file instanceof File)) continue
    const kind = String(slot.kind || '').toLowerCase()
    if (kind === 'video' || slot.file.type?.startsWith('video/')) {
      return slot.file
    }
  }

  return null
}

function hasExistingWhyChooseVideoPreview(form) {
  return hasVideoSlotContent(resolveWhyChooseVideoSlot(form))
}

function hasExistingHelpSectionVideoPreview(form) {
  if (hasVideoSlotContent(resolveHyderabadUi(form).howHelpsMedia?.video)) return true

  return (form.howWill || []).some((slot) => {
    if (String(slot?.kind || '').toLowerCase() !== 'video') return false
    return hasVideoSlotContent(slot)
  })
}

function appendWhyChooseVideoFields(formData, form, { isEdit = false, originalCourse = null } = {}) {
  const videoFile = collectWhyChooseVideoFile(form)

  if (videoFile) {
    formData.append('whyChooseVideo', videoFile)
    return
  }

  if (
    isEdit &&
    hasStoredWhyChooseVideo(originalCourse) &&
    !hasExistingWhyChooseVideoPreview(form)
  ) {
    formData.append('whyChooseRemoveVideo', 'true')
  }
}

function appendHelpSectionVideoFields(formData, form, { isEdit = false, originalCourse = null } = {}) {
  const videoFile = collectHelpSectionVideoFile(form)

  if (videoFile) {
    formData.append('helpSectionVideo', videoFile)
    return
  }

  if (
    isEdit &&
    hasStoredHelpSectionVideo(originalCourse) &&
    !hasExistingHelpSectionVideoPreview(form)
  ) {
    formData.append('helpSectionRemoveVideo', 'true')
  }
}

function extractHelpSectionPoints(form) {
  const centerKey = resolveActiveCourseCenterKey(form)

  const points =
    centerKey === 'hyderabad'
      ? resolveHyderabadUi(form).howHelpsPoints
      : centerKey === 'new-delhi'
        ? resolveNewDelhiUi(form).howHelpsPoints
        : centerKey === 'pune'
          ? resolvePuneUi(form).howHelpsPoints
          : []

  return (points || []).map((point) => String(point.text || '').trim()).filter(Boolean)
}

function collectHelpSectionImageFiles(form) {
  const centerKey = resolveActiveCourseCenterKey(form)
  const files = []

  if (centerKey === 'hyderabad') {
    const file = resolveHyderabadUi(form).howHelpsMedia?.image?.file
    if (file instanceof File) files.push(file)
    return files
  }

  if (centerKey === 'new-delhi') {
    for (const slot of form.howWill || []) {
      if (slot?.kind !== 'video' && slot?.file instanceof File) {
        files.push(slot.file)
      }
    }
    for (const extra of resolveNewDelhiUi(form).helpSectionExtraImages || []) {
      if (extra?.file instanceof File) files.push(extra.file)
    }
    return files
  }

  if (centerKey === 'pune') {
    const file = resolvePuneUi(form).howHelpsImage?.file
    if (file instanceof File) files.push(file)
  }

  return files
}

function collectWhyChooseKeepUrls(form) {
  const centerKey = resolveActiveCourseCenterKey(form)

  if (centerKey === 'hyderabad') {
    const ui = resolveHyderabadUi(form)
    return dedupeMediaUrls(
      ['image1', 'image2']
        .map((key) => keepUrlFromSlot(ui.whyChooseMedia?.[key]))
        .filter(Boolean),
    )
  }

  if (centerKey === 'new-delhi') {
    const url = keepUrlFromSlot(resolveNewDelhiUi(form).whyChooseImage)
    return url ? [url] : []
  }

  if (centerKey === 'pune') {
    const url = keepUrlFromSlot(resolvePuneUi(form).whyChooseImage)
    return url ? [url] : []
  }

  return []
}

function collectHelpSectionKeepUrls(form) {
  const centerKey = resolveActiveCourseCenterKey(form)

  if (centerKey === 'hyderabad') {
    const url = keepUrlFromSlot(resolveHyderabadUi(form).howHelpsMedia?.image)
    return url ? [url] : []
  }

  if (centerKey === 'new-delhi') {
    const urls = []
    for (const slot of form.howWill || []) {
      if (slot?.kind === 'video') continue
      const url = keepUrlFromSlot(slot)
      if (url) urls.push(url)
    }
    for (const extra of resolveNewDelhiUi(form).helpSectionExtraImages || []) {
      const url = keepUrlFromSlot(extra)
      if (url) urls.push(url)
    }
    return dedupeMediaUrls(urls).slice(0, 3)
  }

  if (centerKey === 'pune') {
    const url = keepUrlFromSlot(resolvePuneUi(form).howHelpsImage)
    return url ? [url] : []
  }

  return []
}

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractKeyFeaturePointTexts(form) {
  return keyFeaturePointsFromSlots(form.keyFeatures || [])
    .map((point) => String(point.text || '').trim())
    .filter(Boolean)
}

async function buildFeatureCardsPayload(features = []) {
  const normalized = normalizeWhyChooseFeatures({ whyChooseFeatures: features })
  const cards = []

  for (const [index, card] of normalized.entries()) {
    const payload = {
      title: String(card.title || '').trim(),
      description: String(card.description || '').trim(),
      displayOrder: index + 1,
      highlightOnWebsite: Boolean(card.isHighlighted),
    }

    if (card.iconFile instanceof File) {
      payload.image = await fileToDataUri(card.iconFile)
    } else if (isExistingMediaUrl(card.icon) || isExistingMediaUrl(card.iconPreview)) {
      payload.image = card.icon || card.iconPreview
    }

    if (payload.title || payload.description || payload.image) {
      cards.push(payload)
    }
  }

  return cards
}

export function validateCreateCourseContent(form) {
  const errors = {}
  if (!String(form.name || '').trim()) errors.name = 'Course name is required'
  if (!form.centerId) errors.centerId = 'Centre is required'
  if (!form.programId) errors.programId = 'Program is required'
  if (!form.examCategoryId) errors.examCategoryId = 'Exam category is required'
  if (!form.examSubCategoryId) errors.examSubCategoryId = 'Exam subcategory is required'
  return errors
}

/** Normalize submit payload so nested center UI media survives serialize spread. */
export function normalizeCourseSubmitForm(form = {}) {
  const hyderabadUi = mergeHyderabadUiForSubmit(form) || form.hyderabadUi || form.courseFormData?.hyderabadUi
  const whyChooseVideoSlot = resolveWhyChooseVideoSlot({ ...form, hyderabadUi })

  return {
    ...form,
    hyderabadUi,
    newDelhiUi: form.newDelhiUi || form.courseFormData?.newDelhiUi,
    puneUi: form.puneUi || form.courseFormData?.puneUi,
    howWill: form.howWill || form.courseFormData?.howWill,
    keyFeatures: form.keyFeatures || form.courseFormData?.keyFeatures,
    demoVideoFile: form.demoVideoFile,
    demoVideoUrl: form.demoVideoUrl,
    demoVideoFileName: form.demoVideoFileName,
    demoVideoFileSize: form.demoVideoFileSize,
    whyChooseVideoFile:
      form.whyChooseVideoFile instanceof File
        ? form.whyChooseVideoFile
        : whyChooseVideoSlot?.file instanceof File
          ? whyChooseVideoSlot.file
          : null,
    whyChooseVideoUrl:
      form.whyChooseVideoUrl ||
      (typeof whyChooseVideoSlot?.preview === 'string' ? whyChooseVideoSlot.preview : '') ||
      form.whyChooseVideo ||
      '',
  }
}

export async function buildCourseFormData(form, { isEdit = false, originalCourse = null } = {}) {
  const formData = new FormData()

  const courseName = String(form.name || '').trim()
  if (courseName) formData.append('courseName', courseName)

  if (form.centerId) formData.append('centerId', String(form.centerId))
  if (form.programId) formData.append('programId', String(form.programId))
  if (form.examCategoryId) formData.append('categoryId', String(form.examCategoryId))
  if (form.examSubCategoryId) formData.append('subCategoryId', String(form.examSubCategoryId))

  const overview = String(form.overview ?? form.courseOverview ?? '').trim()
  if (overview || !isEdit) formData.append('courseOverview', overview)

  const overviewTitle = String(form.sectionTitleOverview || '').trim()
  if (overviewTitle) formData.append('courseOverviewSectionTitle', overviewTitle)

  const keyFeaturesTitle = String(form.sectionTitleKeyFeatures || '').trim()
  if (keyFeaturesTitle) formData.append('keyFeaturesSectionTitle', keyFeaturesTitle)

  const helpTitle = String(form.sectionTitleHowHelps || '').trim()
  if (helpTitle) formData.append('helpSectionTitle', helpTitle)

  const whyChooseTitle = resolveWhyChooseTitle(form)
  if (whyChooseTitle) formData.append('whyChooseTitle', whyChooseTitle)

  const keyFeaturePoints = extractKeyFeaturePointTexts(form)
  if (keyFeaturePoints.length) {
    formData.append('keyFeatures', JSON.stringify(keyFeaturePoints))
  }

  const helpPoints = extractHelpSectionPoints(form)
  if (helpPoints.length) {
    formData.append('helpSectionPoints', JSON.stringify(helpPoints))
  }

  const featureCards = await buildFeatureCardsPayload(form.whyChooseFeatures || [])
  if (featureCards.length) {
    formData.append('featureCards', JSON.stringify(featureCards))
  }

  const apiStatus = mapUiCourseStatusToApi(form.status)
  formData.append('status', apiStatus)

  const keyFeatureImage = form.keyFeatures?.[0]
  if (keyFeatureImage?.file instanceof File) {
    formData.append('keyFeatureImage', keyFeatureImage.file)
  } else if (
    isEdit &&
    originalCourse?.keyFeatureImage &&
    !isExistingMediaUrl(keyFeatureImage?.preview)
  ) {
    formData.append('keyFeatureRemoveImage', 'true')
  }

  for (const file of collectWhyChooseImageFiles(form)) {
    formData.append('whyChooseImages', file)
  }

  appendWhyChooseVideoFields(formData, form, { isEdit, originalCourse })

  for (const file of collectHelpSectionImageFiles(form)) {
    formData.append('helpSectionImages', file)
  }

  appendHelpSectionVideoFields(formData, form, { isEdit, originalCourse })

  if (isEdit) {
    const whyChooseKeep = collectWhyChooseKeepUrls(form)
    if (whyChooseKeep.length) {
      formData.append('whyChooseKeepImages', JSON.stringify(whyChooseKeep))
    }

    const helpKeep = collectHelpSectionKeepUrls(form)
    if (helpKeep.length) {
      formData.append('helpSectionKeepImages', JSON.stringify(helpKeep))
    }
  }

  appendDemoVideoFields(formData, form, { isEdit, originalCourse })

  return formData
}

/** @deprecated Use buildCourseFormData */
export async function buildCreateCourseFormData(form) {
  return buildCourseFormData(form, { isEdit: false })
}

function resolveNestedName(value) {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    return String(
      value.centerName ||
        value.programName ||
        value.categoryName ||
        value.subCategoryName ||
        value.name ||
        '',
    ).trim()
  }
  return ''
}

function mapApiKeyFeaturesToSlots(keyFeatures, keyFeatureImage) {
  const points = Array.isArray(keyFeatures)
    ? keyFeatures.map((entry) => String(entry || '').trim()).filter(Boolean)
    : []
  const imageUrl = resolveCourseMediaUrl(keyFeatureImage)
  const imageFileName = imageUrl
    ? fileNameFromMediaUrl(imageUrl) || 'section-image'
    : ''
  const slots = [
    {
      id: 'kf-0',
      fileName: imageFileName,
      text: '',
      preview: imageUrl,
      existingUrl: imageUrl,
    },
  ]

  if (!points.length) {
    slots.push({ id: 'kf-p-0', fileName: '', text: '' })
    return slots
  }

  points.forEach((text, index) => {
    slots.push({ id: `kf-p-${index}`, fileName: '', text })
  })

  return slots
}

function mapApiFeatureCardsToForm(featureCards) {
  if (!Array.isArray(featureCards) || !featureCards.length) {
    return normalizeWhyChooseFeatures({ whyChooseFeatures: [] })
  }

  return featureCards.map((card, index) => {
    const iconUrl = resolveCourseMediaUrl(card.image)
    return {
      id: card._id || `wcf-${index}`,
      icon: iconUrl,
      iconPreview: iconUrl,
      iconFileName: iconUrl ? fileNameFromMediaUrl(iconUrl) : '',
      iconFile: null,
      title: card.title || card.featureTitle || '',
      description: card.description || card.featureDescription || '',
      isHighlighted: Boolean(card.highlightOnWebsite),
      order: Number(card.displayOrder) || index + 1,
    }
  })
}

function mapApiHelpSectionToHowWill(helpImages = [], helpVideo) {
  const videoUrl = resolveCourseMediaUrl(helpVideo)
  const slots = [
    {
      id: 'hw-0',
      kind: 'video',
      fileName: videoUrl ? fileNameFromMediaUrl(videoUrl) : '',
      preview: videoUrl,
      placeholder: 'Video to be played for motion effect',
    },
  ]

  const images = normalizeCourseMediaList(helpImages)
  images.slice(0, 2).forEach((url, index) => {
    slots.push({
      id: `hw-img-${index}`,
      kind: 'image',
      fileName: fileNameFromMediaUrl(url),
      preview: url,
      placeholder: 'Image to be displayed',
    })
  })

  while (slots.length < 3) {
    slots.push({
      id: `hw-empty-${slots.length}`,
      kind: 'image',
      fileName: '',
      preview: '',
      placeholder: 'Image to be displayed',
    })
  }

  return slots
}

function mapApiWhyChooseImagesToUi(formPatch, whyChooseImages = [], whyChooseVideo) {
  const images = normalizeCourseMediaList(whyChooseImages)
  const videoUrl = resolveCourseMediaUrl(whyChooseVideo)
  const newDelhiUi = resolveNewDelhiUi(formPatch)
  const hyderabadUi = resolveHyderabadUi(formPatch)
  const puneUi = resolvePuneUi(formPatch)

  return {
    ...formPatch,
    newDelhiUi: {
      ...newDelhiUi,
      whyChooseImage: {
        ...newDelhiUi.whyChooseImage,
        fileName: images[0]
          ? fileNameFromMediaUrl(images[0])
          : newDelhiUi.whyChooseImage.fileName,
        preview: images[0] || newDelhiUi.whyChooseImage.preview,
      },
    },
    hyderabadUi: {
      ...hyderabadUi,
      whyChooseMedia: {
        ...hyderabadUi.whyChooseMedia,
        image1: {
          ...hyderabadUi.whyChooseMedia.image1,
          fileName: images[0]
            ? fileNameFromMediaUrl(images[0])
            : hyderabadUi.whyChooseMedia.image1.fileName,
          preview: images[0] || hyderabadUi.whyChooseMedia.image1.preview,
        },
        image2: {
          ...hyderabadUi.whyChooseMedia.image2,
          fileName: images[1]
            ? fileNameFromMediaUrl(images[1])
            : hyderabadUi.whyChooseMedia.image2.fileName,
          preview: images[1] || hyderabadUi.whyChooseMedia.image2.preview,
        },
        video: {
          ...hyderabadUi.whyChooseMedia.video,
          fileName: videoUrl
            ? fileNameFromMediaUrl(videoUrl)
            : hyderabadUi.whyChooseMedia.video.fileName,
          preview: videoUrl || hyderabadUi.whyChooseMedia.video.preview,
        },
      },
    },
    puneUi: {
      ...puneUi,
      whyChooseImage: {
        ...puneUi.whyChooseImage,
        fileName: images[0]
          ? fileNameFromMediaUrl(images[0])
          : puneUi.whyChooseImage.fileName,
        preview: images[0] || puneUi.whyChooseImage.preview,
      },
    },
  }
}

function mapApiHelpPointsToUi(formPatch, helpSectionPoints = []) {
  const points = Array.isArray(helpSectionPoints)
    ? helpSectionPoints.map((text, index) => ({
        id: `hp-api-${index}`,
        text: String(text || '').trim(),
      }))
    : []

  const normalized =
    points.length > 0 ? points : [{ id: 'hp-api-0', text: '' }]

  return {
    ...formPatch,
    newDelhiUi: {
      ...resolveNewDelhiUi(formPatch),
      howHelpsPoints: normalized,
    },
    hyderabadUi: {
      ...resolveHyderabadUi(formPatch),
      howHelpsPoints: normalized,
    },
    puneUi: {
      ...resolvePuneUi(formPatch),
      howHelpsPoints: normalized,
    },
  }
}

function mapApiHelpMediaToCenterUi(formPatch, helpSectionImages = [], helpSectionVideo) {
  const images = normalizeCourseMediaList(helpSectionImages)
  const videoUrl = resolveCourseMediaUrl(helpSectionVideo)
  const hyderabadUi = resolveHyderabadUi(formPatch)
  const puneUi = resolvePuneUi(formPatch)

  return {
    ...formPatch,
    hyderabadUi: {
      ...hyderabadUi,
      howHelpsMedia: {
        ...hyderabadUi.howHelpsMedia,
        video: {
          ...hyderabadUi.howHelpsMedia.video,
          fileName: videoUrl
            ? fileNameFromMediaUrl(videoUrl)
            : hyderabadUi.howHelpsMedia.video.fileName,
          preview: videoUrl || hyderabadUi.howHelpsMedia.video.preview,
        },
        image: {
          ...hyderabadUi.howHelpsMedia.image,
          fileName: images[0]
            ? fileNameFromMediaUrl(images[0])
            : hyderabadUi.howHelpsMedia.image.fileName,
          preview: images[0] || hyderabadUi.howHelpsMedia.image.preview,
        },
      },
    },
    puneUi: {
      ...puneUi,
      howHelpsImage: {
        ...puneUi.howHelpsImage,
        fileName: images[0]
          ? fileNameFromMediaUrl(images[0])
          : puneUi.howHelpsImage.fileName,
        preview: images[0] || puneUi.howHelpsImage.preview,
      },
    },
  }
}

export function mapApiCourseToLocal(data) {
  const row =
    data?.data?.course ??
    data?.course ??
    data?.data ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id
  if (!id) return null

  const center = row.center
  const program = row.program
  const category = row.academicCategory ?? row.category
  const subCategory = row.academicSubCategory ?? row.subCategory

  const keyFeatureImageUrl = resolveCourseMediaUrl(
    row.keyFeatureImage ??
      row.featuredImage ??
      row.thumbnail ??
      row.bannerImage ??
      row.courseImage,
  )
  const whyChooseImages = normalizeCourseMediaList(
    row.whyChooseImages ?? row.gallery ?? row.media?.images,
  )
  const whyChooseVideoUrl = resolveCourseMediaUrl(
    row.whyChooseVideo ?? row.media?.whyChooseVideo,
  )
  const helpSectionImages = normalizeCourseMediaList(
    row.helpSectionImages ?? row.media?.helpSectionImages,
  )
  const helpSectionVideoUrl = resolveCourseMediaUrl(
    row.helpSectionVideo ?? row.media?.helpSectionVideo,
  )
  const demoVideoFields = mapDemoVideoFromCourse(row)

  let mapped = {
    id: String(id),
    courseId: String(row.courseId || '').trim(),
    name: String(row.courseName || row.title || row.name || '').trim(),
    centerId: String(center?._id ?? center?.id ?? row.centerId ?? ''),
    centerName: resolveNestedName(center) || String(row.centerName || '').trim(),
    programId: String(program?._id ?? program?.id ?? row.programId ?? ''),
    program:
      resolveNestedName(program) ||
      String(row.programName || (typeof row.program === 'string' ? row.program : '') || '').trim(),
    examCategoryId: String(category?._id ?? category?.id ?? row.categoryId ?? ''),
    examCategory:
      resolveNestedName(category) ||
      String(row.examCategory || row.categoryName || '').trim(),
    examSubCategoryId: String(
      subCategory?._id ?? subCategory?.id ?? row.subCategoryId ?? '',
    ),
    examSubCategory:
      resolveNestedName(subCategory) ||
      String(row.examSubCategory || row.subCategoryName || '').trim(),
    status: mapApiCourseStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
    overview: row.courseOverview || row.overview || '',
    courseOverview: row.courseOverview || row.overview || '',
    sectionTitleOverview: row.courseOverviewSectionTitle || '',
    sectionTitleKeyFeatures: row.keyFeaturesSectionTitle || '',
    sectionTitleHowHelps: row.helpSectionTitle || '',
    whyChooseTitle: row.whyChooseTitle || '',
    keyFeatures: mapApiKeyFeaturesToSlots(row.keyFeatures, keyFeatureImageUrl),
    whyChooseFeatures: mapApiFeatureCardsToForm(row.featureCards),
    howWill: mapApiHelpSectionToHowWill(helpSectionImages, helpSectionVideoUrl),
    keyFeatureImage: keyFeatureImageUrl || null,
    whyChooseImages,
    whyChooseVideo: whyChooseVideoUrl || null,
    helpSectionImages,
    helpSectionVideo: helpSectionVideoUrl || null,
    ...demoVideoFields,
    helpSectionPoints: row.helpSectionPoints || [],
    isFeatured: Boolean(row.isFeatured),
    slug: row.slug || '',
  }

  mapped = mapApiWhyChooseImagesToUi(
    mapped,
    mapped.whyChooseImages,
    mapped.whyChooseVideo,
  )
  mapped = mapApiHelpPointsToUi(mapped, mapped.helpSectionPoints)
  mapped = mapApiHelpMediaToCenterUi(
    mapped,
    mapped.helpSectionImages,
    mapped.helpSectionVideo,
  )

  if (mapped.helpSectionImages[2]) {
    const extraPreview = mapped.helpSectionImages[2]
    mapped.newDelhiUi = {
      ...resolveNewDelhiUi(mapped),
      helpSectionExtraImages: [
        {
          id: 'hx-api-0',
          fileName: fileNameFromMediaUrl(extraPreview),
          preview: extraPreview,
          file: null,
        },
      ],
    }
  }

  return mapped
}

export function normalizeCoursesListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data

  const itemsRaw =
    payload?.courses ??
    payload?.items ??
    payload?.results ??
    data?.courses ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (itemsRaw || []).map(mapApiCourseToLocal).filter(Boolean)
  const total = Number(payload?.total ?? data?.total ?? items.length) || 0
  const totalPages = Math.max(
    1,
    Number(payload?.pages ?? data?.pages ?? (Math.ceil(total / limit) || 1)),
  )
  const safePage = Math.min(Math.max(1, page), totalPages)
  const count = Number(payload?.count ?? items.length)

  return {
    items,
    total,
    totalPages,
    page: safePage,
    count,
    limit: payload?.limit ?? limit,
  }
}

export function normalizeCoursesDropdownResponse(data) {
  const payload = data?.data ?? data
  const itemsRaw = payload?.data ?? payload?.courses ?? payload?.items ?? []
  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => ({
      value: String(row._id ?? row.id ?? ''),
      label: String(row.courseName || row.title || '').trim(),
      courseId: String(row.courseId || '').trim(),
    }))
    .filter((opt) => opt.value && opt.label)

  return {
    items,
    total: Number(payload?.total ?? items.length),
    page: Number(payload?.page ?? 1),
    limit: payload?.limit ?? 100,
    totalPages: Number(payload?.totalPages ?? 1),
    count: Number(payload?.count ?? items.length),
  }
}

export function extractCourseMutationWarnings(response) {
  const warnings = response?.data?.warnings ?? response?.warnings
  return Array.isArray(warnings) ? warnings : []
}

export function formatCourseWarningsToast(warnings = []) {
  if (!warnings.length) return ''
  return warnings.map((w) => w.message || w.field).filter(Boolean).join(' ')
}
