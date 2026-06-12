/** Parse multipart or JSON batch payloads into req.body fields. */

function parseFeesJson(value) {
  if (!value) return undefined
  if (typeof value === 'object') return value
  try {
    return JSON.parse(String(value))
  } catch {
    return undefined
  }
}

export function parseBatchBody(req, res, next) {
  const contentType = String(req.headers['content-type'] || '')
  if (!contentType.includes('multipart/form-data')) {
    if (typeof req.body?.feesJson === 'string') {
      req.body.feesJson = parseFeesJson(req.body.feesJson)
    }
    return next()
  }

  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    try {
      const raw = Buffer.concat(chunks).toString('utf8')
      const boundaryMatch = contentType.match(/boundary=(.+)$/i)
      const boundary = boundaryMatch ? boundaryMatch[1].trim() : ''
      const fields = {}

      if (boundary) {
        const parts = raw.split(`--${boundary}`)
        for (const part of parts) {
          if (!part || part === '--\r\n' || part === '--') continue
          const nameMatch = part.match(/name="([^"]+)"/)
          if (!nameMatch) continue
          const name = nameMatch[1]
          const value = part.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n--$/, '').trim()
          if (name === 'feesJson') {
            fields[name] = parseFeesJson(value)
          } else if (!part.includes('filename=')) {
            fields[name] = value
          } else {
            fields[`${name}FileName`] = (part.match(/filename="([^"]+)"/) || [])[1] || ''
          }
        }
      }

      req.body = { ...req.body, ...fields }
      next()
    } catch (err) {
      next(err)
    }
  })
  req.on('error', next)
}
