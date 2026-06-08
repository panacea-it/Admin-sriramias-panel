import axiosInstance from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import {
  loadSubjectContent,
  saveSubjectContent,
  deleteSubjectContentStorage,
} from '../utils/facultySubjectContentStorage'

const BASE = '/faculty-subject-content'

function useLocal() {
  return isFrontendOnly
}

export async function fetchSubjectContent(subjectId, subjectMeta) {
  if (useLocal()) return loadSubjectContent(subjectId, subjectMeta)
  try {
    const { data } = await axiosInstance.get(`${BASE}/${encodeURIComponent(subjectId)}`)
    return data.data
  } catch {
    return loadSubjectContent(subjectId, subjectMeta)
  }
}

export async function persistSubjectContent(doc, subjectMeta) {
  if (useLocal()) return saveSubjectContent(doc, subjectMeta)
  try {
    const { data } = await axiosInstance.put(
      `${BASE}/${encodeURIComponent(doc.subjectId)}`,
      doc,
    )
    return data.data
  } catch {
    return saveSubjectContent(doc, subjectMeta)
  }
}

export async function removeSubjectContent(subjectId) {
  if (useLocal()) return deleteSubjectContentStorage(subjectId)
  try {
    await axiosInstance.delete(`${BASE}/${encodeURIComponent(subjectId)}`)
  } catch {
    deleteSubjectContentStorage(subjectId)
  }
}
