import { getCentersDropdown as getCentersDropdownApi } from '../api/liveClassesHttpAPI'
import { postBatchesDropdown } from '../api/batchesAPI'

export async function getCentersDropdown({ signal } = {}) {
  return getCentersDropdownApi({ signal })
}

export async function getBatchDropdown({ facultySubjectId, centerId, signal } = {}) {
  return postBatchesDropdown({ facultySubjectId, centerId, signal })
}
