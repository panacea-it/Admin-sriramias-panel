/** UI-only centre name for dropdowns (keeps value/metadata; strips code, city, state, address from label). */
export function getCentreDropdownDisplayName(opt) {
  const centerName = String(opt?.centerName || opt?.name || '').trim()
  const label = String(opt?.label || '').trim()
  const raw = centerName || label
  if (!raw) return ''

  let name = raw.split(/[(•]/)[0].trim()
  const dashIdx = name.indexOf(' - ')
  if (dashIdx > 0) name = name.slice(0, dashIdx).trim()
  const commaIdx = name.indexOf(',')
  if (commaIdx > 0) name = name.slice(0, commaIdx).trim()

  return name
}

export function mapCentreDropdownDisplayOption(opt) {
  return {
    ...opt,
    label: getCentreDropdownDisplayName(opt),
  }
}

export function mapCentreDropdownDisplayOptions(options = []) {
  return (Array.isArray(options) ? options : []).map(mapCentreDropdownDisplayOption)
}
