import { isMongoObjectId } from './facultySubjectHelpers'
import {
  extractCategoryContentItems,
  extractCategoryContentMeta,
} from './facultySubjectCategoryContentHelpers'

function findSelectOptionId(value, options = []) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (isMongoObjectId(raw)) return raw

  const normalized = (Array.isArray(options) ? options : []).map((row) =>
    typeof row === 'string' ? { value: row, label: row } : row,
  )

  const byValue = normalized.find((o) => String(o?.value || '') === raw)
  if (byValue?.value) return String(byValue.value)

  const byLabel = normalized.find(
    (o) => String(o?.label || '').toLowerCase() === raw.toLowerCase(),
  )
  if (byLabel?.value) return String(byLabel.value)

  return raw
}

function isValidRecordingOptionId(value, options = []) {
  const raw = String(value || '').trim()
  if (!raw) return false
  if (isMongoObjectId(raw)) return true
  const normalized = (Array.isArray(options) ? options : []).map((row) =>
    typeof row === 'string' ? { value: row, label: row } : row,
  )
  return normalized.some(
    (o) => String(o?.value || '') === raw || String(o?.label || '').toLowerCase() === raw.toLowerCase(),
  )
}

export function resolveBatchMongoId(value, batches = []) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const match = (Array.isArray(batches) ? batches : []).find(
    (b) =>
      String(b?.id || '') === raw ||
      String(b?.batchId || '') === raw ||
      String(b?.batchName || '').toLowerCase() === raw.toLowerCase(),
  )
  if (match?.id) return String(match.id)
  return raw
}

function resolveBatchIdForApi(value, batches = []) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const match = (Array.isArray(batches) ? batches : []).find(
    (b) =>
      String(b?.id || '') === raw ||
      String(b?.batchId || '') === raw ||
      String(b?.batchName || '').toLowerCase() === raw.toLowerCase(),
  )

  if (match) {
    const mongoId = String(match.id || '').trim()
    if (isMongoObjectId(mongoId)) return mongoId
    const businessBatchId = String(match.batchId || '').trim()
    return businessBatchId || mongoId || raw
  }

  return raw
}

export function resolveRecordingBatchIdsFromForm(values = {}, batches = []) {
  const rawIds =
    Array.isArray(values.batchIds) && values.batchIds.length
      ? values.batchIds
      : values.batchId
        ? [values.batchId]
        : []

  return [
    ...new Set(
      rawIds
        .map((id) => resolveBatchIdForApi(id, batches))
        .filter(Boolean),
    ),
  ]
}

export function resolveCenterOptionId(value, centers = []) {
  return findSelectOptionId(value, centers)
}

export function resolveRecordingFormIds(
  values,
  { centers = [], topics = [], teachers = [], batches = [] } = {},
) {
  const batchIds = resolveRecordingBatchIdsFromForm(values, batches)
  const centerId = findSelectOptionId(values.recordingCenter || values.centerId, centers)
  const topicId = findSelectOptionId(values.recordingTopic, topics)
  const teacherId = findSelectOptionId(values.recordingTeacher, teachers)

  return {
    batchId: batchIds[0] || '',
    batchIds,
    centerId,
    recordingCenter: centerId,
    recordingTopic: topicId,
    recordingTeacher: teacherId,
  }
}

const UI_TO_API_VISIBILITY = {
  Published: 'PUBLISHED',
  Draft: 'DRAFT',
  Private: 'PRIVATE',
  Visibility: 'VISIBILITY',
}

const API_TO_UI_VISIBILITY = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  PRIVATE: 'Private',
  VISIBILITY: 'Visibility',
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi']
const MAX_RECORDING_BYTES = 100 * 1024 * 1024

export function mapUiVisibilityToApi(value) {
  const raw = String(value || '').trim()
  if (UI_TO_API_VISIBILITY[raw]) return UI_TO_API_VISIBILITY[raw]
  const upper = raw.toUpperCase()
  if (API_TO_UI_VISIBILITY[upper]) return upper
  return 'PUBLISHED'
}

export function mapApiVisibilityToUi(value) {
  const upper = String(value || '').trim().toUpperCase()
  return API_TO_UI_VISIBILITY[upper] || 'Published'
}

export function unwrapRecordingPayload(data) {
  if (data?.data != null && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data
  }
  return data
}

export function normalizeTeachersDropdownResponse(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.teachers)
        ? data.teachers
        : Array.isArray(data)
          ? data
          : []

  return (Array.isArray(list) ? list : [])
    .filter((row) => String(row?.status || 'ACTIVE').trim().toUpperCase() === 'ACTIVE')
    .map((row) => ({
      value: String(row._id ?? row.id ?? row.teacherId ?? row.userId ?? ''),
      label: String(
        row.teacherName ?? row.name ?? row.fullName ?? row.label ?? '',
      ).trim(),
    }))
    .filter((o) => o.value && o.label)
}

export function normalizeTopicsDropdownResponse(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.topics)
        ? data.topics
        : Array.isArray(data)
          ? data
          : []

  return (Array.isArray(list) ? list : [])
    .map((row) => {
      if (typeof row === 'string') {
        const label = row.trim()
        return label ? { value: label, label } : null
      }
      const label = String(
        row.topicName ?? row.name ?? row.label ?? row.title ?? '',
      ).trim()
      const value = String(
        row._id ?? row.id ?? row.topicId ?? row.value ?? '',
      ).trim()
      if (!label && !value) return null
      return {
        value: value || label,
        label: label || value,
      }
    })
    .filter(Boolean)
}

export function normalizeRecordingsCreateFormResponse(data) {
  const row = unwrapRecordingPayload(data)
  if (!row || typeof row !== 'object') return {}

  return {
    lessonName: row.lessonName || '',
    centerId: String(row.centerId || row.defaultCenterId || ''),
    batchId: String(row.batchId || row.defaultBatchId || ''),
    topicId: String(row.topicId || row.defaultTopicId || ''),
    teacherId: String(row.teacherId || row.defaultTeacherId || ''),
    tags: row.tags || '',
    visibility: mapApiVisibilityToUi(row.visibility || 'PUBLISHED'),
    description: row.description || '',
  }
}

export function normalizeRecordingsListMeta(data) {
  return extractCategoryContentMeta(data)
}

export function normalizeRecordingsListResponse(data) {
  const fromContent = extractCategoryContentItems(data)
  const list = fromContent.length
    ? fromContent
    : Array.isArray(data?.recordings)
      ? data.recordings
      : []

  return (Array.isArray(list) ? list : [])
    .map((row) => mapApiRecordingToLocalRow(row))
    .filter(Boolean)
}

export function normalizeRecordingDashboardSummary(data) {
  const row = unwrapRecordingPayload(data)
  if (!row || typeof row !== 'object') {
    return { totalRecordings: 0, folderId: '', facultySubjectId: '' }
  }

  return {
    totalRecordings:
      row.totalRecordings ??
      row.recordingCount ??
      row.count ??
      row.total ??
      0,
    folderId: String(row.folderId || ''),
    facultySubjectId: String(row.facultySubjectId || ''),
  }
}

export function resolveRecordingApiId(row) {
  const id = String(row?.apiId || row?.id || row?.linkedExistingFormId || '')
  return isMongoObjectId(id) ? id : ''
}

export function mapApiRecordingToLocalRow(data) {
  const row = unwrapRecordingPayload(data)
  if (!row || typeof row !== 'object') return null

  const id = String(row._id ?? row.id ?? '')
  if (!id) return null

  const centerLabel =
    typeof row.center === 'object'
      ? row.center.centerName || row.center.name
      : row.centerName || row.center || ''

  const topicLabel =
    typeof row.topic === 'object'
      ? row.topic.topicName || row.topic.name
      : row.topicName || row.topic || ''

  const teacherLabel =
    typeof row.teacher === 'object'
      ? row.teacher.teacherName || row.teacher.name
      : row.teacherName || row.teacher || ''

  const batchIds = Array.isArray(row.batchIds)
    ? row.batchIds.map((id) => String(id)).filter(Boolean)
    : Array.isArray(row.batches)
      ? row.batches
          .map((b) => String(b?._id ?? b?.id ?? b?.batchId ?? '').trim())
          .filter(Boolean)
      : []

  const primaryBatchId =
    batchIds[0] ||
    String(row.batchId || row.batch?._id || row.batch?.id || '')

  const batchName =
    row.batchNamesLabel ||
    (Array.isArray(row.batchDocs) && row.batchDocs.length
      ? row.batchDocs.map((b) => b.batchName).filter(Boolean).join(', ')
      : '') ||
    String(row.batchName || row.batch?.batchName || row.batch?.name || '')

  const tagsValue = Array.isArray(row.tags)
    ? row.tags.join(', ')
    : String(row.tags || '')

  const recordingFile = row.recording && typeof row.recording === 'object' ? row.recording : null

  return {
    id,
    apiId: id,
    lessonName: String(row.lessonName || '').trim(),
    centerId: String(row.centerId || row.center?._id || row.center?.id || ''),
    center: centerLabel,
    batchId: primaryBatchId,
    batchIds: batchIds.length ? batchIds : primaryBatchId ? [primaryBatchId] : [],
    batchName,
    topicId: String(row.topicId || row.topic?._id || row.topic?.id || ''),
    topic: topicLabel,
    teacherId: String(row.teacherId || row.teacher?._id || row.teacher?.id || ''),
    teacher: teacherLabel,
    tags: tagsValue,
    description: row.description || '',
    visibility: mapApiVisibilityToUi(row.visibility),
    videoFileName:
      row.videoFileName ||
      row.recordingFileName ||
      row.fileName ||
      (recordingFile?.publicId ? String(recordingFile.publicId).split('/').pop() : '') ||
      '',
    videoDuration:
      row.durationLabel ||
      row.videoDuration ||
      row.duration ||
      (recordingFile?.durationSeconds != null
        ? `${recordingFile.durationSeconds} sec`
        : ''),
    views: row.views ?? row.viewCount ?? 0,
    status: mapApiVisibilityToUi(row.visibility) === 'Published' ? 'Active' : 'Draft',
    folderId: row.folderId || '',
    facultySubjectId: row.facultySubjectId || '',
    playUrl:
      recordingFile?.url ||
      row.playUrl ||
      row.videoUrl ||
      row.url ||
      '',
    youtubeUrl: row.youtubeUrl || '',
    createdAt: row.createdAt || null,
    modifiedAt: row.updatedAt || row.modifiedAt || null,
  }
}

export function mapApiRecordingToFolderItem(apiRow, existingItem = null) {
  const local =
    apiRow?.id && apiRow?.lessonName != null && !apiRow?._id
      ? apiRow
      : mapApiRecordingToLocalRow(apiRow)
  if (!local) return null

  const visibility = mapUiVisibilityToApi(local.visibility)
  return {
    id: existingItem?.id || `item-${local.id}`,
    itemType: 'RECORDED_CLASS',
    title: local.lessonName || 'Untitled',
    linkedExistingFormId: local.id,
    status: visibility === 'PUBLISHED' ? 'published' : 'draft',
    lastUpdated: local.modifiedAt || local.createdAt || new Date().toISOString(),
    data: local,
    batchId: local.batchId || local.batchIds?.[0] || '',
    batchIds: local.batchIds?.length ? local.batchIds : local.batchId ? [local.batchId] : [],
  }
}

export function mapApiRecordingToFormValues(data, subject = null) {
  const local = mapApiRecordingToLocalRow(data)
  if (!local) return null

  return {
    batchId: local.batchIds?.[0] || local.batchId,
    batchIds: local.batchIds?.length ? local.batchIds : local.batchId ? [local.batchId] : [],
    centerId: local.centerId,
    recordingLessonName: local.lessonName,
    recordingCenter: local.centerId,
    recordingTopic: local.topicId,
    recordingTeacher: local.teacherId,
    recordingTags: local.tags,
    recordingDescription: local.description,
    recordingVisibility: local.visibility,
    recordingVideoFileName: local.videoFileName,
    recordingVideoDuration: local.videoDuration,
    teacher: subject?.teacher || local.teacher || '',
    contentType: 'recording',
  }
}

export function mapCreateFormDefaultsToFormValues(defaults = {}, subject = null) {
  const normalized = normalizeRecordingsCreateFormResponse(defaults)
  return {
    batchId: normalized.batchId,
    batchIds: normalized.batchId ? [normalized.batchId] : [],
    centerId: normalized.centerId,
    recordingLessonName: normalized.lessonName,
    recordingCenter: normalized.centerId,
    recordingTopic: normalized.topicId,
    recordingTeacher: normalized.teacherId,
    recordingTags: normalized.tags,
    recordingDescription: normalized.description,
    recordingVisibility: normalized.visibility,
    teacher: subject?.teacher || '',
    contentType: 'recording',
  }
}

export function validateRecordingFile(file) {
  if (!file || !(file instanceof File)) {
    return { valid: false, message: 'Upload a recording video' }
  }
  if (file.size > MAX_RECORDING_BYTES) {
    return { valid: false, message: 'Recording must be 100 MB or smaller' }
  }
  const name = String(file.name || '').toLowerCase()
  const hasValidExt = VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))
  if (!hasValidExt) {
    return { valid: false, message: 'Allowed formats: MP4, MOV, MKV, AVI' }
  }
  return { valid: true }
}

function appendRecordingFormFields(formData, values, resolved, meta = {}) {
  const folderId = String(meta.folderId || '').trim()
  const centerId = String(resolved.recordingCenter || resolved.centerId || '').trim()
  const topicId = String(resolved.recordingTopic || '').trim()
  const teacherId = String(resolved.recordingTeacher || '').trim()
  const batchIds = Array.isArray(resolved.batchIds) ? resolved.batchIds : []

  if (meta.facultySubjectId) {
    formData.append('facultySubjectId', String(meta.facultySubjectId).trim())
  }
  if (folderId) formData.append('folderId', folderId)

  batchIds.forEach((id) => formData.append('batchId', String(id).trim()))

  formData.append('lessonName', String(values.recordingLessonName || '').trim())
  formData.append('centerId', centerId)
  formData.append('topicId', topicId)
  formData.append('teacherId', teacherId)

  const tags = String(values.recordingTags || '').trim()
  if (tags) formData.append('tags', tags)

  formData.append('visibility', mapUiVisibilityToApi(values.recordingVisibility))

  const description = String(values.recordingDescription || '').trim()
  if (description) formData.append('description', description)
}

export function buildRecordingCreateFormData(values, meta = {}) {
  const resolved = resolveRecordingFormIds(values, meta.options || {})
  const formData = new FormData()

  appendRecordingFormFields(formData, values, resolved, meta)

  const file = values.recordingFile
  if (!(file instanceof File)) {
    throw new Error('Upload a recording video')
  }
  formData.append('recording', file, file.name)

  return formData
}

export function buildRecordingUpdatePayload(values, meta = {}) {
  const resolved = resolveRecordingFormIds(values, meta.options || {})
  const formData = new FormData()

  appendRecordingFormFields(formData, values, resolved, meta)

  const file = values.recordingFile
  if (file instanceof File) {
    formData.append('recording', file, file.name)
  }

  return { payload: formData, multipart: true }
}

export function validateRecordingApiPayload(
  values,
  { isEdit = false, hasExistingFile = false, options = {} } = {},
) {
  const resolved = resolveRecordingFormIds(values, options)
  const errors = []

  const batchIds = Array.isArray(resolved.batchIds) ? resolved.batchIds : []
  if (!batchIds.length) {
    errors.push('Batch is required')
  } else {
    const invalidBatch = batchIds.find(
      (id) => !isMongoObjectId(id) && !/^[A-Za-z0-9_-]+$/.test(id),
    )
    if (invalidBatch) errors.push('Select a valid batch from the list')
  }

  if (!String(values.recordingLessonName || '').trim()) {
    errors.push('Lesson name is required')
  }

  const centerId = String(resolved.recordingCenter || resolved.centerId || '').trim()
  if (!centerId) errors.push('Center is required')
  else if (!isValidRecordingOptionId(centerId, options.centers)) {
    errors.push('Select a valid center from the list')
  }

  const topicId = String(resolved.recordingTopic || '').trim()
  if (!topicId) errors.push('Topic is required')
  else if (!isValidRecordingOptionId(topicId, options.topics)) {
    errors.push('Select a valid topic from the list')
  }

  const teacherId = String(resolved.recordingTeacher || '').trim()
  if (!teacherId) errors.push('Faculty is required')
  else if (!isValidRecordingOptionId(teacherId, options.teachers)) {
    errors.push('Select a valid faculty member from the list')
  }

  const file = values.recordingFile
  if (!isEdit && !(file instanceof File)) {
    errors.push('Upload a recording video')
  } else if (file instanceof File) {
    const check = validateRecordingFile(file)
    if (!check.valid) errors.push(check.message)
  } else if (!isEdit && !hasExistingFile && !String(values.recordingVideoFileName || '').trim()) {
    errors.push('Upload a recording video')
  }

  return errors
}

export function unwrapPlayRecordingResponse(data) {
  const row = unwrapRecordingPayload(data)
  return {
    playUrl:
      row?.playUrl ||
      row?.url ||
      row?.videoUrl ||
      row?.signedUrl ||
      row?.streamUrl ||
      '',
    recording: mapApiRecordingToLocalRow(row?.recording || row),
  }
}
