import { normalizeTestSeriesBlock, resolveTestSeriesDurationMinutes } from './batchTestSeriesForm'
import { parseDateForDisplay } from './academicsSubjectsStorage'
import { contentTypeFromCategoryType } from './facultySubjectHierarchy'

function formatTime12(startTime) {
  if (!startTime) return '—'
  const [h, m] = String(startTime).split(':').map((x) => parseInt(x, 10) || 0)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export function resolveItemPayload(subject, item, categoryType) {
  const contentType = contentTypeFromCategoryType(categoryType)
  const linkedId = item?.linkedExistingFormId

  if (contentType === 'live') {
    return (
      subject?.liveClasses?.find((lc) => lc.id === linkedId) ||
      item?.data ||
      null
    )
  }
  if (contentType === 'recording') {
    return (
      subject?.recordings?.find((r) => r.id === linkedId) ||
      item?.data ||
      null
    )
  }
  if (contentType === 'pdf') {
    return subject?.pdfs?.find((p) => p.id === linkedId) || item?.data || null
  }
  if (contentType === 'test' || contentType === 'mainsAnswerWriting') {
    return item?.testSeries ? normalizeTestSeriesBlock(item.testSeries) : null
  }
  return item?.data || null
}

export function enrichFolderItems(subject, items = [], categoryType) {
  const contentType = contentTypeFromCategoryType(categoryType)

  return items.map((item) => {
    const payload = resolveItemPayload(subject, item, categoryType)
    const base = {
      item,
      id: item.id,
      title: item.title,
      status: item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : item.status || 'Draft',
      rawStatus: item.status,
    }

    if (contentType === 'live' && payload) {
      return {
        ...base,
        classTitle: payload.classTitle || item.title,
        date: parseDateForDisplay(payload.date),
        time: formatTime12(payload.startTime || payload.scheduledTime),
        faculty: subject?.teacher || payload.teacher || '—',
        batch: payload.batchId || subject?.batch || '—',
        center: payload.center || '—',
        classroom: payload.classroom || payload.classRoom || '—',
        liveStatus: payload.status || 'Active',
        payload,
      }
    }

    if (contentType === 'recording' && payload) {
      return {
        ...base,
        videoTitle: payload.lessonName || item.title,
        duration: payload.videoDuration || '—',
        views: payload.views ?? 0,
        visibility: payload.visibility || payload.status || '—',
        payload,
      }
    }

    if (contentType === 'test' && payload) {
      const ts = normalizeTestSeriesBlock(payload)
      return {
        ...base,
        testName: ts.details?.testName || item.title,
        questions: ts.questions?.length ?? ts.questionCount ?? 0,
        duration: resolveTestSeriesDurationMinutes(ts)
          ? `${resolveTestSeriesDurationMinutes(ts)} mins`
          : '—',
        marks: ts.details?.totalMarks || '—',
        payload: ts,
      }
    }

    if (contentType === 'mainsAnswerWriting' && payload) {
      const ts = normalizeTestSeriesBlock(payload)
      return {
        ...base,
        assignmentTitle: ts.details?.testName || item.title,
        dueDate: parseDateForDisplay(ts.schedule?.date),
        marks: ts.details?.totalMarks || '—',
        payload: ts,
      }
    }

    if (contentType === 'pdf' && payload) {
      return {
        ...base,
        pdfName: payload.title || payload.fileName || item.title,
        fileSize: payload.fileSize ? `${(payload.fileSize / 1024 / 1024).toFixed(1)} MB` : '—',
        uploaded: parseDateForDisplay(payload.createdAt),
        fileName: payload.fileName || '',
        payload,
      }
    }

    return { ...base, payload }
  })
}
