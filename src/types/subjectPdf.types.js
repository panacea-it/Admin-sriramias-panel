/** @typedef {'VISIBILITY' | 'PUBLISHED' | 'DRAFT' | 'PRIVATE'} PdfVisibility */

/**
 * @typedef {Object} SubjectPdfRow
 * @property {string} _id
 * @property {string} subjectPdfId
 * @property {string} facultySubjectId
 * @property {string} folderId
 * @property {string[]} batchIds
 * @property {Array<{ _id: string, batchId: string, batchName: string }>} batches
 * @property {string} batchNamesLabel
 * @property {string} pdfTitle
 * @property {string[]} tags
 * @property {PdfVisibility} visibility
 * @property {{ url: string, publicId?: string, format?: string, bytes?: number }} pdf
 * @property {string} description
 * @property {number} viewCount
 * @property {string} folderName
 * @property {string} facultySubjectName
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} SubjectPdfListParams
 * @property {string=} facultySubjectId
 * @property {string=} folderId
 * @property {string=} batchId
 * @property {PdfVisibility=} visibility
 * @property {string=} search
 * @property {number=} page
 * @property {number=} limit
 * @property {string=} sortBy
 * @property {'asc' | 'desc'=} sortOrder
 */

export {}
