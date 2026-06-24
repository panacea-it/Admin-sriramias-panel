export function emptyImageState() {
  return { url: '', file: null }
}

export function formFromResource(resource) {
  return {
    heading: resource?.heading || '',
    description: resource?.description || '',
    image1: { url: resource?.image1?.url || '', file: null },
    image2: { url: resource?.image2?.url || '', file: null },
    image3: { url: resource?.image3?.url || '', file: null },
  }
}

export function hasImageValue(imageState) {
  return Boolean(imageState?.file || String(imageState?.url || '').trim())
}

export function validateFreeLearningResourceForm(form) {
  const errors = {}
  if (!String(form.heading || '').trim()) errors.heading = 'Heading is required'
  if (!String(form.description || '').trim()) errors.description = 'Description is required'
  if (!hasImageValue(form.image1)) errors.image1 = 'Image 1 is required'
  if (!hasImageValue(form.image2)) errors.image2 = 'Image 2 is required'
  if (!hasImageValue(form.image3)) errors.image3 = 'Image 3 is required'
  return errors
}

export function buildFreeLearningResourceFormData(form) {
  const payload = new FormData()
  payload.append('heading', String(form.heading).trim())
  payload.append('description', String(form.description).trim())

  ;['image1', 'image2', 'image3'].forEach((key) => {
    const imageState = form[key]
    if (imageState.file) {
      payload.append(key, imageState.file)
    } else if (imageState.url) {
      payload.append(`${key}Url`, imageState.url)
    }
  })

  return payload
}
