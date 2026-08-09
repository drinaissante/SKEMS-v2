export const LOGOUT_EVENT = "sk:logout-requested"

export function requestLogout() {
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT))
}
