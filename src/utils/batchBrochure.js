export function formatBrochureFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return ''
  const size = Number(bytes)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read brochure file'))
    reader.readAsDataURL(file)
  })
}

export function resolveBrochureUrl(item) {
  if (!item) return ''
  const form = item.formData || {}
  return item.brochureUrl || form.brochureUrl || ''
}

export function resolveBrochureFileName(item) {
  if (!item) return ''
  const form = item.formData || {}
  return item.brochureFileName || form.brochureFileName || 'batch-brochure.pdf'
}

export function resolveBrochureFileSize(item) {
  if (!item) return null
  const form = item.formData || {}
  return item.brochureFileSize ?? form.brochureFileSize ?? null
}

export function viewBrochurePdf(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function downloadBrochurePdf(url, fileName = 'batch-brochure.pdf') {
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
