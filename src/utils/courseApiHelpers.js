import { resolveWhyChooseTitle } from './academicCourseForm'
import { keyFeaturePointsFromSlots } from './newDelhiCourseUi'
import { resolveHyderabadUi } from './hyderabadCourseUi'
import { resolveNewDelhiUi } from './newDelhiCourseUi'
import { resolvePuneUi } from './puneCourseUi'
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

function collectWhyChooseImageFiles(form) {
  const files = []
  const newDelhiUi = resolveNewDelhiUi(form)
  const hyderabadUi = resolveHyderabadUi(form)
  const puneUi = resolvePuneUi(form)

  if (newDelhiUi.whyChooseImage?.file instanceof File) {
    files.push(newDelhiUi.whyChooseImage.file)
  }
  if (hyderabadUi.whyChooseMedia?.image1?.file instanceof File) {
    files.push(hyderabadUi.whyChooseMedia.image1.file)
  }
  if (hyderabadUi.whyChooseMedia?.image2?.file instanceof File) {
    files.push(hyderabadUi.whyChooseMedia.image2.file)
  }
  if (puneUi.whyChooseImage?.file instanceof File) {
    files.push(puneUi.whyChooseImage.file)
  }

  return files
}

function collectWhyChooseVideoFile(form) {
  const hyderabadUi = resolveHyderabadUi(form)
  const video = hyderabadUi.whyChooseMedia?.video
  return video?.file instanceof File ? video.file : null
}

function extractHelpSectionPoints(form) {
  const newDelhiUi = resolveNewDelhiUi(form)
  const hyderabadUi = resolveHyderabadUi(form)
  const puneUi = resolvePuneUi(form)

  const points =
    newDelhiUi.howHelpsPoints?.length
      ? newDelhiUi.howHelpsPoints
      : hyderabadUi.howHelpsPoints?.length
        ? hyderabadUi.howHelpsPoints
        : puneUi.howHelpsPoints || []

  return points.map((point) => String(point.text || '').trim()).filter(Boolean)
}

function collectHelpSectionImageFiles(form) {
  const files = []
  const howWill = form.howWill || []
  const newDelhiUi = resolveNewDelhiUi(form)
  const hyderabadUi = resolveHyderabadUi(form)
  const puneUi = resolvePuneUi(form)

  for (const slot of howWill) {
    if (slot?.kind !== 'video' && slot?.file instanceof File) {
      files.push(slot.file)
    }
  }

  for (const extra of newDelhiUi.helpSectionExtraImages || []) {
    if (extra?.file instanceof File) files.push(extra.file)
  }

  if (hyderabadUi.howHelpsMedia?.image?.file instanceof File) {
    files.push(hyderabadUi.howHelpsMedia.image.file)
  }
  if (puneUi.howHelpsImage?.file instanceof File) {
    files.push(puneUi.howHelpsImage.file)
  }

  return files
}

function collectHelpSectionVideoFile(form) {
  const howWill = form.howWill || []
  const hyderabadUi = resolveHyderabadUi(form)

  const howWillVideo = howWill.find((slot) => slot?.kind === 'video' && slot?.file instanceof File)
  if (howWillVideo?.file) return howWillVideo.file

  const hydVideo = hyderabadUi.howHelpsMedia?.video
  return hydVideo?.file instanceof File ? hydVideo.file : null
}

function collectWhyChooseKeepUrls(form) {
  const urls = []
  const newDelhiUi = resolveNewDelhiUi(form)
  const hyderabadUi = resolveHyderabadUi(form)
  const puneUi = resolvePuneUi(form)

  const candidates = [
    newDelhiUi.whyChooseImage?.preview,
    hyderabadUi.whyChooseMedia?.image1?.preview,
    hyderabadUi.whyChooseMedia?.image2?.preview,
    puneUi.whyChooseImage?.preview,
  ]

  for (const url of candidates) {
    if (isExistingMediaUrl(url)) urls.push(url.trim())
  }

  return urls
}

function collectHelpSectionKeepUrls(form) {
  const urls = []
  const howWill = form.howWill || []
  const newDelhiUi = resolveNewDelhiUi(form)
  const hyderabadUi = resolveHyderabadUi(form)
  const puneUi = resolvePuneUi(form)

  for (const slot of howWill) {
    if (slot?.kind !== 'video' && isExistingMediaUrl(slot?.preview)) {
      urls.push(slot.preview.trim())
    }
  }

  for (const extra of newDelhiUi.helpSectionExtraImages || []) {
    if (isExistingMediaUrl(extra?.preview)) urls.push(extra.preview.trim())
  }

  if (isExistingMediaUrl(hyderabadUi.howHelpsMedia?.image?.preview)) {
    urls.push(hyderabadUi.howHelpsMedia.image.preview.trim())
  }
  if (isExistingMediaUrl(puneUi.howHelpsImage?.preview)) {
    urls.push(puneUi.howHelpsImage.preview.trim())
  }

  return urls
}

async function buildFeatureCardsPayload(features = []) {
  const normalized = normalizeWhyChooseFeatures({ whyChooseFeatures: features })
  const cards = []

  for (const card of normalized) {
    const payload = {
      title: String(card.title || '').trim(),
      description: String(card.description || '').trim(),
      displayOrder: Number(card.order) || cards.length + 1,
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

  const whyChooseVideo = collectWhyChooseVideoFile(form)
  if (whyChooseVideo) formData.append('whyChooseVideo', whyChooseVideo)
  else if (
    isEdit &&
    originalCourse?.whyChooseVideo &&
    !isExistingMediaUrl(resolveHyderabadUi(form).whyChooseMedia?.video?.preview)
  ) {
    formData.append('whyChooseRemoveVideo', 'true')
  }

  for (const file of collectHelpSectionImageFiles(form)) {
    formData.append('helpSectionImages', file)
  }

  const helpVideo = collectHelpSectionVideoFile(form)
  if (helpVideo) formData.append('helpSectionVideo', helpVideo)
  else if (isEdit && originalCourse?.helpSectionVideo) {
    const hasVideoPreview = (form.howWill || []).some(
      (slot) => slot?.kind === 'video' && isExistingMediaUrl(slot?.preview),
    )
    const hydPreview = resolveHyderabadUi(form).howHelpsMedia?.video?.preview
    if (!hasVideoPreview && !isExistingMediaUrl(hydPreview)) {
      formData.append('helpSectionRemoveVideo', 'true')
    }
  }

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

  const keyFeatureImageUrl = resolveCourseMediaUrl(row.keyFeatureImage)
  const whyChooseImages = normalizeCourseMediaList(row.whyChooseImages)
  const whyChooseVideoUrl = resolveCourseMediaUrl(row.whyChooseVideo)
  const helpSectionImages = normalizeCourseMediaList(row.helpSectionImages)
  const helpSectionVideoUrl = resolveCourseMediaUrl(row.helpSectionVideo)
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
