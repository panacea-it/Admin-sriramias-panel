/**
 * Receipt Management API — POST/PUT backend integration.
 * Contract: docs/RECEIPT_MANAGEMENT_FRONTEND_API_GUIDE.md
 */

import api from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildReceiptListBody,
  buildUpdateReceiptPayload,
  mapReceiptListRowToUi,
  mapReceiptViewToUi,
  mapUiReceiptStatusToApi,
  normalizeReceiptListResponse,
} from '../utils/receiptManagementHelpers'

const BASE = '/finance/receipt-management'
const BATCHES_BASE = '/finance/payment-verification'

function toApiError(error, fallback = 'Request failed') {
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(message)
  if (error?.response?.status) err.status = error.response.status
  if (error?.response?.data) err.data = error.response.data
  return err
}

function unwrap(payload) {
  if (payload == null) return payload
  if (
    typeof payload === 'object' &&
    payload.data !== undefined &&
    ('success' in payload || 'statusCode' in payload)
  ) {
    return payload.data
  }
  return payload
}

function assertSuccess(body, fallback) {
  if (body && body.success === false) {
    throw toApiError(body, body.message || fallback)
  }
}

async function post(path, body = {}, config = {}) {
  const response = await api.post(`${BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

async function put(path, body = {}, config = {}) {
  const response = await api.put(`${BASE}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

async function postExternal(base, path, body = {}, config = {}) {
  const response = await api.post(`${base}${path}`, body, config)
  const bodyData = response?.data ?? {}
  assertSuccess(bodyData, 'Request failed')
  return unwrap(bodyData)
}

export async function fetchReceiptFilterOptions(config = {}) {
  try {
    return (await post('/filter-options', {}, config)) || {}
  } catch (error) {
    throw toApiError(error, 'Failed to load filter options')
  }
}

export async function fetchReceiptList(params = {}, config = {}) {
  try {
    const data = await post('/list', buildReceiptListBody(params), config)
    return normalizeReceiptListResponse(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load receipts')
  }
}

export async function viewReceipt(receiptId, config = {}) {
  try {
    const data = await post('/view', { receiptId }, config)
    return mapReceiptViewToUi(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load receipt')
  }
}

export async function previewReceipt(receiptId, config = {}) {
  try {
    const data = await post('/preview', { receiptId }, config)
    return mapReceiptViewToUi(data)
  } catch (error) {
    throw toApiError(error, 'Failed to load receipt preview')
  }
}

export async function downloadReceipt(receiptId, config = {}) {
  try {
    return await post('/download', { receiptId }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to download receipt')
  }
}

export async function printReceipt(receiptId, config = {}) {
  try {
    return await post('/print', { receiptId }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to print receipt')
  }
}

export async function updateReceipt(form, receiptId, config = {}) {
  try {
    const data = await put('/update', buildUpdateReceiptPayload(form, receiptId), config)
    return mapReceiptViewToUi(data)
  } catch (error) {
    throw toApiError(error, 'Failed to update receipt')
  }
}

export async function fetchReceiptEmailPreview(receiptId, config = {}) {
  try {
    return await post('/email-preview', { receiptId }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to load email preview')
  }
}

export async function sendReceiptEmail(payload, config = {}) {
  try {
    return await post(
      '/send-email',
      {
        receiptId: payload.receiptId,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
      },
      config,
    )
  } catch (error) {
    throw toApiError(error, 'Failed to send receipt email')
  }
}

export async function sendReceiptWhatsapp(payload, config = {}) {
  try {
    return await post(
      '/send-whatsapp',
      {
        receiptId: payload.receiptId,
        mobile: payload.mobile,
        message: payload.message,
      },
      config,
    )
  } catch (error) {
    throw toApiError(error, 'Failed to send WhatsApp receipt')
  }
}

export async function sendReceiptSms(payload, config = {}) {
  try {
    return await post(
      '/send-sms',
      {
        receiptId: payload.receiptId,
        mobile: payload.mobile,
        message: payload.message,
      },
      config,
    )
  } catch (error) {
    throw toApiError(error, 'Failed to send SMS receipt')
  }
}

export async function fetchReceiptCoursesList(params = {}, config = {}) {
  try {
    const data = await post(
      '/courses/list',
      {
        search: params.search || '',
        centerId: params.centerId || '',
        page: params.page || 1,
        limit: params.limit || 100,
      },
      config,
    )
    return data?.courses || []
  } catch (error) {
    throw toApiError(error, 'Failed to load courses')
  }
}

export async function fetchReceiptPaymentModesList(params = {}, config = {}) {
  try {
    const data = await post(
      '/payment-modes/list',
      {
        search: params.search || '',
        category: params.category || '',
      },
      config,
    )
    return data?.paymentModes || []
  } catch (error) {
    throw toApiError(error, 'Failed to load payment modes')
  }
}

export async function fetchReceiptStatusesList(config = {}) {
  try {
    const data = await post('/receipt-statuses/list', {}, config)
    return data?.statuses || []
  } catch (error) {
    throw toApiError(error, 'Failed to load receipt statuses')
  }
}

export async function fetchBatchesByCourse(courseId, config = {}) {
  try {
    const data = await postExternal(BATCHES_BASE, '/batches-by-course', { courseId }, config)
    return data?.items || []
  } catch (error) {
    throw toApiError(error, 'Failed to load batches')
  }
}

export async function syncMissingReceipts(syncLimit = 100, config = {}) {
  try {
    return await post('/sync-missing', { syncLimit }, config)
  } catch (error) {
    throw toApiError(error, 'Failed to sync missing receipts')
  }
}

export async function bulkSendReceiptEmails(receiptIds, rowsById = {}) {
  const results = []
  for (const receiptId of receiptIds) {
    const row = rowsById[receiptId]
    try {
      let email = row?.email
      let subject
      let message
      if (row) {
        const preview = await fetchReceiptEmailPreview(receiptId)
        email = preview?.email || email
        subject = preview?.subject
        message = preview?.message
      }
      await sendReceiptEmail({ receiptId, email, subject, message })
      results.push({ id: receiptId, success: true, status: 'Delivered' })
    } catch (error) {
      results.push({
        id: receiptId,
        success: false,
        status: error?.message || 'Failed',
      })
    }
  }
  return {
    results,
    total: results.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  }
}

export function mapUpdatedReceiptToListRow(viewData, existingRow = {}) {
  if (!viewData) return existingRow
  const apiStatus = mapUiReceiptStatusToApi(viewData.receiptLifecycleStatus)
  const mapped = mapReceiptListRowToUi({
    receiptId: viewData.receiptId || viewData.id,
    receiptNumber: viewData.receiptNumber,
    invoiceNumber: viewData.invoiceNumber,
    studentName: viewData.studentName,
    mobile: viewData.mobile,
    email: viewData.email,
    branch: viewData.branch,
    branchCode: viewData.branchCode,
    course: viewData.courseName,
    courseId: viewData.courseId,
    paymentMode: viewData.paymentMode,
    paymentType: viewData.paymentType,
    gst: viewData.gstAmount,
    total: viewData.totalAmount,
    amountPaid: viewData.amountPaid,
    status: apiStatus,
    receiptStatus: apiStatus,
    generatedAt: viewData.receiptGeneratedAt,
    generatedLabel: existingRow.generatedLabel,
    communication: existingRow.communication,
    batchId: viewData.batchId,
    batchName: viewData.batchName,
    transactionReference: viewData.transactionId,
    paymentDate: viewData.paymentDate,
  })
  return { ...existingRow, ...mapped }
}
