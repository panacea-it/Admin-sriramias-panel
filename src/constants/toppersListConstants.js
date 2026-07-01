/** Toppers List PDF CMS constants. */

export const TOPPERS_LIST_BASE = '/marketing/toppers-list'

export const TOPPERS_LIST_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}

export const TOPPERS_LIST_STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: TOPPERS_LIST_STATUS.ACTIVE, label: 'Active' },
  { value: TOPPERS_LIST_STATUS.INACTIVE, label: 'Inactive' },
]

export const TOPPER_YEAR_MIN = 2020
export const TOPPER_YEAR_MAX = 2030

export const TOPPER_YEAR_OPTIONS = [
  { value: 'all', label: 'All years' },
  ...Array.from({ length: TOPPER_YEAR_MAX - TOPPER_YEAR_MIN + 1 }, (_, index) => {
    const year = String(TOPPER_YEAR_MAX - index)
    return { value: year, label: year }
  }),
]

export function buildToppersListTitle(year) {
  return `${year} Toppers' List`
}

export function buildDownloadFileName(year) {
  return `toppers-${year}.pdf`
}

export function emptyToppersListForm() {
  return {
    title: '',
    year: '',
    displayOrder: '',
    status: TOPPERS_LIST_STATUS.ACTIVE,
    pdfFileName: '',
    pdfFileSize: null,
    pdfFile: null,
  }
}
