import {
  createLiveClass,
  deleteLiveClass,
  updateLiveClass,
} from '../api/liveClassesHttpAPI'
import {
  createRecording,
  deleteRecording,
  updateRecording,
} from '../api/recordingsAPI'
import {
  createMainsAnswerWriting,
  deleteMainsAnswerWriting,
} from '../services/subjectMainsAnswerWritingService'
import {
  createPrelimsTest,
  deletePrelimsTest,
} from '../services/subjectPrelimsTestService'
import {
  createSubjectPdf,
  deleteSubjectPdf,
} from '../services/subjectPdfService'
import { getApiErrorMessage } from './apiError'
import {
  buildLiveClassApiPayload,
  mapApiLiveClassToLocalRow,
  resolveLiveClassApiId,
} from './liveClassHelpers'
import {
  buildRecordingCreateFormData,
  buildRecordingUpdatePayload,
  mapApiRecordingToLocalRow,
  resolveRecordingApiId,
} from './recordingHelpers'

export async function saveLiveContentItemToApi({
  values,
  facultySubjectId,
  folderId,
  liveClassData,
  publish,
}) {
  const payload = buildLiveClassApiPayload(values, {
    facultySubjectId,
    folderId,
    publish,
    recurring: values.recurring,
    recurrence: values.recurrence,
    timezone: values.timezone,
  })

  const existingId = resolveLiveClassApiId(liveClassData)
  const response = existingId
    ? await updateLiveClass(existingId, payload)
    : await createLiveClass(payload)

  const row = mapApiLiveClassToLocalRow(response)
  if (!row) {
    throw new Error(getApiErrorMessage(null, 'Failed to save live class'))
  }
  return row
}

export async function saveRecordingContentItemToApi({
  values,
  facultySubjectId,
  folderId,
  recordingData,
  recordingFormOptions,
}) {
  const meta = {
    facultySubjectId,
    folderId,
    options: recordingFormOptions || {},
  }

  const existingId = resolveRecordingApiId(recordingData)
  let response

  if (existingId) {
    const { payload } = buildRecordingUpdatePayload(values, meta)
    response = await updateRecording(existingId, payload, { multipart: true })
  } else {
    const formData = buildRecordingCreateFormData(values, meta)
    response = await createRecording(formData)
  }

  const row = mapApiRecordingToLocalRow(response)
  if (!row) {
    throw new Error(getApiErrorMessage(null, 'Failed to save recording'))
  }
  return row
}

export async function deleteLiveContentItemFromApi(liveClassData) {
  const id = resolveLiveClassApiId(liveClassData)
  if (!id) return false
  await deleteLiveClass(id)
  return true
}

export async function deleteRecordingContentItemFromApi(recordingData) {
  const id = resolveRecordingApiId(recordingData)
  if (!id) return false
  await deleteRecording(id)
  return true
}

export async function savePrelimsContentItemToApi(formData) {
  const response = await createPrelimsTest(formData)
  return response?.data || response
}

export async function deletePrelimsContentItemFromApi(itemData) {
  const id = String(itemData?._id ?? itemData?.id ?? itemData?.apiId ?? '').trim()
  if (!id) return false
  await deletePrelimsTest(id)
  return true
}

export async function saveMainsContentItemToApi(formData) {
  const response = await createMainsAnswerWriting(formData)
  return response?.data || response
}

export async function deleteMainsContentItemFromApi(itemData) {
  const id = String(itemData?._id ?? itemData?.id ?? itemData?.apiId ?? '').trim()
  if (!id) return false
  await deleteMainsAnswerWriting(id)
  return true
}

export async function savePdfContentItemToApi(formData) {
  const response = await createSubjectPdf(formData)
  return response?.data || response
}

export async function deletePdfContentItemFromApi(itemData) {
  const id = String(itemData?._id ?? itemData?.id ?? itemData?.apiId ?? '').trim()
  if (!id) return false
  await deleteSubjectPdf(id)
  return true
}
