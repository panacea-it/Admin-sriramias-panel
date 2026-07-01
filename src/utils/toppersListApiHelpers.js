import {
  buildDownloadFileName,
  buildToppersListTitle,
} from '../constants/toppersListConstants'

export function mapApiToppersListToRow(item) {
  if (!item) return null

  return {
    id: item._id,
    toppersListId: item.toppersListId,
    title: item.title || buildToppersListTitle(item.year),
    year: item.year,
    pdfFile: {
      url: item.pdfFile?.url || '',
      fileName: item.pdfFile?.fileName || buildDownloadFileName(item.year),
    },
    displayOrder: item.displayOrder,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function mapApiToppersListsToRows(items = []) {
  return items.map(mapApiToppersListToRow).filter(Boolean)
}

export function buildToppersListFormData(form, { includePdf = false } = {}) {
  const formData = new FormData()

  formData.append('title', String(form.title || '').trim())
  formData.append('year', String(form.year))
  formData.append('displayOrder', String(form.displayOrder))
  formData.append('status', form.status || 'ACTIVE')

  if (includePdf && form.pdfFile instanceof File) {
    formData.append('pdfFile', form.pdfFile)
  }

  return formData
}

export function formFromApiToppersList(row) {
  return {
    title: row.title || '',
    year: String(row.year || ''),
    displayOrder: String(row.displayOrder || ''),
    status: row.status || 'ACTIVE',
    pdfFileName: row.pdfFile?.fileName || '',
    pdfFileSize: null,
    pdfFile: null,
  }
}
