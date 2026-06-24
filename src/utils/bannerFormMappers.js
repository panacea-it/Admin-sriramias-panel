import { getBannerImageSrc } from '../data/bannersData'

export function bannerRowToForm(row) {
  const imageUrl = getBannerImageSrc(row) ?? ''
  return {
    course: row.course ?? '',
    category: row.category ?? '',
    center: row.center ?? '',
    status: row.status ?? 'Active',
    imageUrl,
    imageFileName: row.imageFileName ?? '',
    bannerPreview: imageUrl,
    clearImage: false,
  }
}

export function bannerFormToPayload(form) {
  return {
    course: form.course?.trim() ?? '',
    category: form.category,
    center: form.center,
    status: form.status,
    imageUrl: form.clearImage ? '' : form.imageUrl || form.bannerPreview || '',
    imageFileName: form.clearImage ? '' : form.imageFileName || '',
    clearImage: Boolean(form.clearImage),
  }
}
