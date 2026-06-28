/**
 * @deprecated Import from `omrExamService` instead.
 * Kept for backward compatibility during migration.
 */
export {
  createOmrExam,
  listOmrExams as getOmrExams,
  getOmrExamById,
  updateOmrExam,
  deleteOmrExam,
  uploadResultSheet as uploadOmrResultSheet,
  replaceResultSheet as replaceOmrResultSheet,
  deleteResultSheet as deleteOmrResultSheet,
  downloadOmrResultSheet,
  downloadResultSheetBlob,
  downloadResultSheetUrl,
} from './omrExamService'

export {
  mapApiOmrExamToLocal,
  normalizeOmrExamsListResponse,
} from '../utils/omrApiHelpers'

export function clearOmrExamsListCache() {}
export function clearOmrExamDetailCache() {}
