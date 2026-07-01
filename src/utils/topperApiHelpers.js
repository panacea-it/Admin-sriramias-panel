import { isResolvableRankerImageUrl } from './rankerImageUtils'

const TOPPER_IMAGE_MAX_WIDTH = 1200
const TOPPER_IMAGE_MAX_HEIGHT = 1200
const TOPPER_IMAGE_QUALITY = 0.85
const TOPPER_IMAGE_SKIP_OPTIMIZE_BYTES = 500 * 1024

function resolveImageExtension(mime = 'image/png') {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return mime.split('/')[1] || 'png'
}

function resolveOutputMime(sourceType) {
  if (sourceType === 'image/png') return 'image/png'
  if (sourceType === 'image/webp') return 'image/webp'
  if (sourceType === 'image/jpeg' || sourceType === 'image/jpg') return 'image/jpeg'
  return 'image/png'
}

export function dataUrlToFile(dataUrl, filename = 'topper-image.png') {
  if (!dataUrl?.startsWith('data:')) return null

  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const extension = resolveImageExtension(mime)
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], filename.includes('.') ? filename : `topper-image.${extension}`, {
    type: mime,
  })
}

async function blobUrlToFile(blobUrl, fallbackName = 'topper-image.webp') {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  const mime = blob.type || 'image/webp'
  const extension = resolveImageExtension(mime)
  const baseName = fallbackName.replace(/\.[^.]+$/, '') || 'topper-image'

  return new File([blob], `${baseName}.${extension}`, { type: mime })
}

export async function resolveTopperImageFile(imageValue) {
  if (!imageValue) return null
  if (imageValue.startsWith('data:')) return dataUrlToFile(imageValue)
  if (imageValue.startsWith('blob:')) {
    try {
      return await blobUrlToFile(imageValue)
    } catch {
      return null
    }
  }
  return null
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

async function optimizeTopperImageFile(file) {
  try {
    const img = await loadImageFromFile(file)
    const { width, height } = img

    let targetWidth = width
    let targetHeight = height

    const needsResize =
      width > TOPPER_IMAGE_MAX_WIDTH || height > TOPPER_IMAGE_MAX_HEIGHT
    const needsCompress = file.size > TOPPER_IMAGE_SKIP_OPTIMIZE_BYTES

    if (!needsResize && !needsCompress) {
      return file
    }

    if (needsResize) {
      const ratio = Math.min(TOPPER_IMAGE_MAX_WIDTH / width, TOPPER_IMAGE_MAX_HEIGHT / height)
      targetWidth = Math.round(width * ratio)
      targetHeight = Math.round(height * ratio)
    }

    const outputMime = resolveOutputMime(file.type)
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Image compression failed'))),
        outputMime,
        outputMime === 'image/jpeg' ? TOPPER_IMAGE_QUALITY : undefined,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'topper-image'
    const extension = resolveImageExtension(outputMime)
    return new File([blob], `${baseName}.${extension}`, { type: outputMime })
  } catch {
    return file
  }
}

export async function prepareTopperImageForUpload(imageValue) {
  const file = await resolveTopperImageFile(imageValue)
  if (!file) return null
  // PNG cutouts lose transparency when re-encoded on canvas — upload as-is.
  if (file.type === 'image/png') return file
  return optimizeTopperImageFile(file)
}

export function parseTopperBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
  }
  return Boolean(value)
}

export function buildTopperFormData(form, { imageFile, includeImage = true } = {}) {
  const formData = new FormData()
  const isDisplayed = form.status === 'Active'

  formData.append('studentId', form.studentId.trim())
  formData.append('courseOrProgram', form.course.trim())
  formData.append('rank', form.rank.trim())
  formData.append('year', form.year)
  formData.append('isTop10', form.isTop10 ? 'true' : 'false')
  formData.append('isDisplayed', isDisplayed ? 'true' : 'false')
  formData.append('showOnHomepage', form.showOnHomepage ? 'true' : 'false')

  if (form.showOnHomepage && form.homepageOrder !== '') {
    formData.append('homepageOrder', String(form.homepageOrder))
  }

  if (isDisplayed && form.toppersPageOrder !== '') {
    formData.append('toppersPageOrder', String(form.toppersPageOrder))
  }

  if (form.studentName?.trim()) {
    formData.append('studentName', form.studentName.trim())
  }

  if (includeImage && imageFile) {
    formData.append('image', imageFile)
  }

  return formData
}

export function mapApiTopperToRankerRow(topper, index = 0) {
  const createdAt = topper.createdAt || new Date(Date.now() - index * 86400000).toISOString()
  const created = new Date(createdAt)

  return {
    id: topper._id,
    studentId: topper.studentId || '',
    name: topper.studentName || '',
    program: '',
    course: topper.courseOrProgram || '',
    year: topper.year ?? '',
    rank: topper.rank || '',
    imageUrl: topper.image?.url || '',
    isTop10Enabled: parseTopperBoolean(topper.isTop10, false),
    status: parseTopperBoolean(topper.isDisplayed, true) ? 'Active' : 'Deactivated',
    isTop10: parseTopperBoolean(topper.isTop10, false) && parseTopperBoolean(topper.isDisplayed, true),
    showOnHomepage:
      parseTopperBoolean(topper.showOnHomepage, false) &&
      parseTopperBoolean(topper.isDisplayed, true),
    homepageOrder: topper.homepageOrder ?? null,
    toppersPageOrder: topper.toppersPageOrder ?? null,
    displayOrder: null,
    createdAt,
    time: created.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    date: created.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

export function mapApiToppersToRankerRows(toppers = []) {
  const rows = toppers.map((topper, index) => mapApiTopperToRankerRow(topper, index))
  return enrichRankersWithDisplayOrder(rows)
}

export function enrichRankersWithDisplayOrder(rows = []) {
  const top10Active = rows
    .filter((row) => row.status === 'Active' && row.isTop10)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const orderMap = new Map(top10Active.map((row, index) => [row.id, index + 1]))

  return rows.map((row) => ({
    ...row,
    displayOrder: orderMap.get(row.id) ?? null,
  }))
}

export function formFromApiTopper(topper) {
  const isDisplayed = parseTopperBoolean(topper.isDisplayed, true)

  return {
    course: topper.courseOrProgram || '',
    year: topper.year ? String(topper.year) : String(new Date().getFullYear()),
    studentId: topper.studentId || '',
    studentName: topper.studentName || '',
    rank: topper.rank || '',
    image: topper.image?.deliveryUrl || topper.image?.url || '',
    status: isDisplayed ? 'Active' : 'Deactivated',
    isTop10: parseTopperBoolean(topper.isTop10, false) && isDisplayed,
    showOnHomepage: parseTopperBoolean(topper.showOnHomepage, false) && isDisplayed,
    homepageOrder:
      topper.homepageOrder != null && topper.homepageOrder !== ''
        ? String(topper.homepageOrder)
        : '',
    toppersPageOrder:
      topper.toppersPageOrder != null && topper.toppersPageOrder !== ''
        ? String(topper.toppersPageOrder)
        : '',
    displayOrder: '',
  }
}

export function suggestNextHomepageOrder(rankers = []) {
  const orders = rankers
    .filter((row) => row.showOnHomepage)
    .map((row) => Number(row.homepageOrder))
    .filter((value) => Number.isInteger(value) && value > 0)

  if (!orders.length) return '1'
  return String(Math.max(...orders) + 1)
}

export function suggestNextToppersPageOrder(rankers = []) {
  const orders = rankers
    .filter((row) => row.status === 'Active')
    .map((row) => Number(row.toppersPageOrder))
    .filter((value) => Number.isInteger(value) && value > 0)

  if (!orders.length) return '1'
  return String(Math.max(...orders) + 1)
}

export function hasTopperImageForSubmit(imageValue) {
  return isResolvableRankerImageUrl(imageValue)
}
