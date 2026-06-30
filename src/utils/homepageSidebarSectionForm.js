export function hasItemImage(item) {
  return Boolean(item?.imageFile || String(item?.imageUrl || '').trim())
}

const IMAGE_UPLOAD_SECTION_KEYS = ['OUR_BOOKS', 'DAILY_LEARNING', 'COURSES']

function buildImageUploadFormData(key, form, payload) {
  const formData = new FormData()
  const stripTitle = ['OUR_BOOKS', 'DAILY_LEARNING'].includes(key)

  formData.append(
    'payload',
    JSON.stringify({
      ...payload,
      items: payload.items.map((item) => ({
        ...item,
        ...(stripTitle ? { title: '' } : {}),
      })),
    }),
  )

  form.items.forEach((item, index) => {
    if (item.imageFile) {
      formData.append(`itemImage_${index}`, item.imageFile)
    }
  })

  return formData
}

export function isYoutubeUrl(value) {
  const url = String(value || '').trim()
  if (!url) return false
  return /(?:youtube\.com|youtu\.be)/i.test(url)
}

export function formFromSection(section, sectionKey) {
  const key = String(sectionKey || section?.sectionKey || '').toUpperCase()
  return {
    heading: section?.heading || '',
    isActive: section?.isActive !== false,
    ctaLabel: section?.ctaLabel || '',
    ctaHref: section?.ctaHref || '',
    viewAllHref: section?.viewAllHref || '',
    quizQuestion: section?.quizQuestion || '',
    quizOptions: (section?.quizOptions || []).map((option, index) => ({
      label: option.label || '',
      sortOrder: option.sortOrder ?? index + 1,
      isActive: option.isActive !== false,
    })),
    items: (section?.items || []).map((item, index) => {
      let href = item.href || ''
      if (key === 'TRENDING_VIDEOS' && !href && isYoutubeUrl(item.imageUrl)) {
        href = item.imageUrl
      }

      return {
        title: item.title || '',
        href,
        slug: item.slug || '',
        imageUrl: item.imageUrl || '',
        imagePublicId: item.imagePublicId || '',
        imageFile: null,
        sortOrder: item.sortOrder ?? index + 1,
        isActive: item.isActive !== false,
        borderColor: item.borderColor || '',
        textColor: item.textColor || '',
        icon: item.icon || '',
      }
    }),
  }
}

export function buildSectionPayload(form) {
  return {
    heading: String(form.heading || '').trim(),
    isActive: Boolean(form.isActive),
    ctaLabel: String(form.ctaLabel || '').trim(),
    ctaHref: String(form.ctaHref || '').trim(),
    viewAllHref: String(form.viewAllHref || '').trim(),
    quizQuestion: String(form.quizQuestion || '').trim(),
    quizOptions: (form.quizOptions || []).map((option, index) => ({
      label: String(option.label || '').trim(),
      sortOrder: Number(option.sortOrder) || index + 1,
      isActive: option.isActive !== false,
    })),
    items: (form.items || []).map((item, index) => ({
      title: String(item.title || '').trim(),
      href: String(item.href || '').trim(),
      slug: String(item.slug || '').trim(),
      imageUrl: String(item.imageUrl || '').trim(),
      imagePublicId: String(item.imagePublicId || '').trim(),
      sortOrder: Number(item.sortOrder) || index + 1,
      isActive: item.isActive !== false,
      borderColor: String(item.borderColor || '').trim(),
      textColor: String(item.textColor || '').trim(),
      icon: String(item.icon || '').trim(),
    })),
  }
}

export function buildSectionFormData(sectionKey, form) {
  const key = String(sectionKey || '').toUpperCase()
  let payload = buildSectionPayload(form)

  if (key === 'TRENDING_VIDEOS') {
    payload = {
      ...payload,
      items: payload.items.map((item) => ({
        ...item,
        imageUrl: '',
        imagePublicId: '',
      })),
    }
  }

  if (IMAGE_UPLOAD_SECTION_KEYS.includes(key)) {
    return buildImageUploadFormData(key, form, payload)
  }

  return payload
}

export function sectionUsesMultipartUpload(sectionKey) {
  return IMAGE_UPLOAD_SECTION_KEYS.includes(String(sectionKey || '').toUpperCase())
}

function validateImageUploadItems(form, errors, itemLabel) {
  const activeItems = (form.items || []).filter((item) => item.isActive !== false)
  if (activeItems.length === 0) {
    errors.items = `Add at least one active ${itemLabel}`
    return errors
  }

  form.items.forEach((item, index) => {
    if (item.isActive !== false && !hasItemImage(item)) {
      errors[`itemImage_${index}`] = `${itemLabel} image is required`
    }
  })

  return errors
}

export function validateSectionForm(sectionKey, form) {
  const errors = {}
  const key = String(sectionKey || '').toUpperCase()

  if (!String(form.heading || '').trim()) {
    errors.heading = 'Heading is required'
  }

  if (key === 'DAILY_QUIZ' && !String(form.quizQuestion || '').trim()) {
    errors.quizQuestion = 'Quiz question is required'
  }

  if (key === 'DAILY_QUIZ') {
    const activeOptions = (form.quizOptions || []).filter(
      (option) => option.isActive !== false && String(option.label || '').trim(),
    )
    if (activeOptions.length < 2) {
      errors.quizOptions = 'Add at least two quiz options'
    }
    return errors
  }

  if (key === 'OUR_BOOKS') {
    return validateImageUploadItems(form, errors, 'Book cover')
  }

  if (key === 'DAILY_LEARNING') {
    return validateImageUploadItems(form, errors, 'Slide')
  }

  if (key === 'COURSES') {
    const activeItems = (form.items || []).filter((item) => item.isActive !== false)
    if (activeItems.length === 0) {
      errors.items = 'Add at least one active course'
      return errors
    }

    form.items.forEach((item, index) => {
      if (item.isActive === false) return
      if (!String(item.title || '').trim()) {
        errors[`itemTitle_${index}`] = 'Course title is required'
      }
      if (!hasItemImage(item)) {
        errors[`itemImage_${index}`] = 'Course image is required'
      }
    })
    return errors
  }

  if (key === 'TRENDING_VIDEOS') {
    const activeItems = (form.items || []).filter((item) => item.isActive !== false)
    if (activeItems.length === 0) {
      errors.items = 'Add at least one active item'
      return errors
    }

    form.items.forEach((item, index) => {
      if (item.isActive === false) return
      if (!String(item.title || '').trim()) {
        errors[`itemTitle_${index}`] = 'Title is required'
      }
      const youtubeUrl = String(item.href || '').trim()
      if (!youtubeUrl) {
        errors[`itemYoutubeUrl_${index}`] = 'YouTube URL is required'
      } else if (!isYoutubeUrl(youtubeUrl)) {
        errors[`itemYoutubeUrl_${index}`] = 'Enter a valid YouTube URL'
      }
    })
    return errors
  }

  if (key !== 'DAILY_QUIZ' && key !== 'COURSES') {
    const activeItems = (form.items || []).filter(
      (item) => item.isActive !== false && String(item.title || '').trim(),
    )
    if (activeItems.length === 0) {
      errors.items = 'Add at least one active item'
    }
  }

  return errors
}
