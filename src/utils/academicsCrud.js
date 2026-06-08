/** Apply create or update to a local list (optimistic UI until API is wired). */
export function upsertListItem(list, payload, { isEdit, id }) {
  if (isEdit && id != null) {
    return list.map((row) => (row.id === id ? { ...row, ...payload } : row))
  }
  return [...list, { id: payload.id ?? Date.now(), ...payload }]
}
