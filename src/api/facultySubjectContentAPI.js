import axiosInstance from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import { throwApiError } from '../utils/apiError'
import {
  ensureMongoFolderIds,
  loadSubjectContent,
  saveSubjectContent,
  deleteSubjectContentStorage,
} from '../utils/facultySubjectContentStorage'

const BASE = '/faculty-subject-content'

function useLocal() {
  return isFrontendOnly
}

function unwrapContentResponse(data) {
  return data?.data ?? data
}

export async function fetchSubjectContent(subjectId, subjectMeta) {
  if (useLocal()) return loadSubjectContent(subjectId, subjectMeta)
  try {
    const response = await axiosInstance.get(`${BASE}/${encodeURIComponent(subjectId)}`)
    const doc = unwrapContentResponse(response.data)
    const { doc: normalized, changed } = ensureMongoFolderIds(doc)
    if (changed) {
      try {
        const saved = await persistSubjectContent(normalized, subjectMeta)
        return saved
      } catch {
        return normalized
      }
    }
    return normalized
  } catch (error) {
    if (error?.response?.status === 404) {
      const local = loadSubjectContent(subjectId, subjectMeta)
      const { doc: normalized } = ensureMongoFolderIds(local)
      try {
        return await persistSubjectContent(normalized, subjectMeta)
      } catch {
        return normalized
      }
    }
    if (error?.response) throw error
    return loadSubjectContent(subjectId, subjectMeta)
  }
}

export async function persistSubjectContent(doc, subjectMeta) {
  if (useLocal()) return saveSubjectContent(doc, subjectMeta)
  try {
    const { doc: normalized } = ensureMongoFolderIds(doc)
    const response = await axiosInstance.put(
      `${BASE}/${encodeURIComponent(normalized.subjectId)}`,
      normalized,
    )
    return unwrapContentResponse(response.data)
  } catch (error) {
    if (error?.response) throw error
    return saveSubjectContent(doc, subjectMeta)
  }
}

export async function removeSubjectContent(subjectId) {
  if (useLocal()) return deleteSubjectContentStorage(subjectId)
  try {
    await axiosInstance.delete(`${BASE}/${encodeURIComponent(subjectId)}`)
  } catch (error) {
    if (error?.response) throw error
    deleteSubjectContentStorage(subjectId)
  }
}
