export const AUTH_LOGOUT_EVENT = 'admin-panel:auth-logout'

export function emitAuthLogout() {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT))
}
