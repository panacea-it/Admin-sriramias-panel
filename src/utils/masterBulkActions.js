import { TOAST_DURATION } from './toast'

export const MASTER_BULK_TOAST = {
  enabled: 'Selected records activated successfully.',
  disabled: 'Selected records deactivated successfully.',
  activated: 'Selected records activated successfully.',
  deactivated: 'Selected records deactivated successfully.',
}

export const MASTER_BULK_TOAST_DURATION = TOAST_DURATION.short

export function countEnableableSelected(selectedIds, itemsById, activeStatus = 'Active') {
  return selectedIds.filter((id) => itemsById.get(String(id))?.status !== activeStatus).length
}

export function countDisableableSelected(selectedIds, itemsById, activeStatus = 'Active') {
  return selectedIds.filter((id) => itemsById.get(String(id))?.status === activeStatus).length
}

export function filterEnableableIds(selectedIds, itemsById, activeStatus = 'Active') {
  return selectedIds.filter((id) => itemsById.get(String(id))?.status !== activeStatus)
}

export function filterDisableableIds(selectedIds, itemsById, activeStatus = 'Active') {
  return selectedIds.filter((id) => itemsById.get(String(id))?.status === activeStatus)
}
