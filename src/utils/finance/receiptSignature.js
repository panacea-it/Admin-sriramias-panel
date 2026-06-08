/** Simple tamper-indication hash for receipt verification (client-side mock) */

export async function generateReceiptVerificationHash(payload) {
  const str = JSON.stringify(payload)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = new TextEncoder().encode(str)
    const hash = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16)
      .toUpperCase()
  }
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h).toString(16).toUpperCase().padStart(16, '0').slice(0, 16)
}

export function buildSignatureBlock(settings = {}, signedAt) {
  return {
    signatoryName: settings.signatoryName || 'Finance Manager',
    signatoryDesignation: settings.signatoryDesignation || 'Authorized Signatory',
    signatureUrl: settings.signatureUrl || '',
    signedAt: signedAt || new Date().toISOString(),
  }
}
